"use server";

import prisma from "@ruteai/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import { obtenerScoreRiesgo } from "@/lib/aiServiceClient";
import { notificarPedidoEnRuta, notificarPedidoEntregado } from "@/lib/twilioService";
import { geocodificarDireccion } from "@/lib/geocodingService";
import { callCore, CoreServiceError } from "@/lib/coreServiceClient";

export async function agregarPedidoNuevo(formData: FormData) {
  const cliente  = formData.get("cliente")  as string;
  const direccion = formData.get("direccion") as string;
  const producto  = formData.get("producto")  as string;
  const clienteTelefono = formData.get("clienteTelefono") as string;
  const fechaEntregaLimiteRaw = formData.get("fechaEntregaLimite") as string;
  const repartidorId = (formData.get("repartidorId") as string) || undefined;
  const latRaw = formData.get("lat") as string;
  const lngRaw = formData.get("lng") as string;
  const coordsCliente =
    latRaw && lngRaw && !isNaN(Number(latRaw)) && !isNaN(Number(lngRaw))
      ? { lat: Number(latRaw), lng: Number(lngRaw) }
      : null;

  if (!cliente || !direccion || !producto) return { error: "Faltan datos" };

  // Validar SLA
  let fechaEntregaLimite: Date | undefined;
  if (fechaEntregaLimiteRaw) {
    const d = new Date(fechaEntregaLimiteRaw);
    if (isNaN(d.getTime())) return { error: "Hora límite inválida" };
    if (d.getTime() < Date.now()) return { error: "La hora límite no puede estar en el pasado" };
    fechaEntregaLimite = d;
  }

  // Verificar sesión
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    select: { empresaId: true },
  });
  if (!usuarioDB) return { error: "Usuario no registrado" };

  // Geocodificar si no vienen coords del mapa
  const horaActual = new Date().getHours();
  const coords = coordsCliente ?? (await geocodificarDireccion(direccion));
  const lat = coords?.lat ?? -33.45;
  const lng = coords?.lng ?? -70.66;

  // Score IA
  const resultadoIA = await obtenerScoreRiesgo({
    pedidoId: "new", lat, lng, hora: horaActual,
    diasRetraso: 0, intentosFallidos: 0, zonaRiesgo: false,
  });
  const scoreParaBD = Math.round(resultadoIA.score * 100);

  // Intentar via core-service primero, fallback a Prisma directo
  let createdOk = false;
  if (process.env.CORE_SERVICE_URL) {
    try {
      await callCore("/api/v1/orders", {
        method: "POST",
        body: {
          nombreCliente: cliente, direccion, producto,
          clienteTelefono: clienteTelefono || undefined,
          fechaEntregaLimite: fechaEntregaLimite?.toISOString(),
          lat: coords?.lat ?? undefined, lng: coords?.lng ?? undefined,
          repartidorId, scoreRiesgo: scoreParaBD,
        },
      });
      createdOk = true;
    } catch (err) {
      console.warn("[agregarPedidoNuevo] core-service no disponible, usando Prisma directo:", err);
    }
  }

  // Fallback: Prisma directo (siempre funciona en producción sin core)
  if (!createdOk) {
    try {
      await prisma.pedido.create({
        data: {
          nombreCliente: cliente,
          direccion,
          producto,
          clienteTelefono: clienteTelefono || null,
          fechaEntregaLimite: fechaEntregaLimite ?? null,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          repartidorId: repartidorId || null,
          scoreRiesgo: scoreParaBD,
          estado: "pendiente",
          empresaId: usuarioDB.empresaId,
        },
      });
    } catch (err) {
      console.error("[agregarPedidoNuevo] Error Prisma:", err);
      return { error: "No se pudo crear el pedido" };
    }
  }

  revalidatePath("/dashboard/pedidos");
  revalidatePath("/dashboard");
  redirect("/dashboard/pedidos");
}

/**
 * Asigna (o desasigna con null) un repartidor a un pedido. Solo el encargado de
 * la misma empresa puede hacerlo. Escribe directo a la DB (el web es BFF con
 * acceso a datos), validando pertenencia multi-tenant.
 */
export async function asignarRepartidor(pedidoId: string, repartidorId: string | null) {
  if (!pedidoId) return { error: "ID de pedido requerido" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    select: { empresaId: true, rol: true },
  });
  if (!usuarioDB || usuarioDB.rol !== "encargado") return { error: "Sin permisos" };

  // El pedido debe pertenecer a la empresa del encargado.
  const pedido = await prisma.pedido.findFirst({
    where: { id: pedidoId, empresaId: usuarioDB.empresaId },
    select: { id: true },
  });
  if (!pedido) return { error: "Pedido no encontrado" };

  // Si se asigna un repartidor, debe ser de la misma empresa.
  if (repartidorId) {
    const rep = await prisma.usuario.findFirst({
      where: { id: repartidorId, empresaId: usuarioDB.empresaId, rol: "repartidor" },
      select: { id: true },
    });
    if (!rep) return { error: "Repartidor inválido" };
  }

  await prisma.pedido.update({
    where: { id: pedidoId },
    data: { repartidorId: repartidorId ?? null },
  });

  revalidatePath("/dashboard/pedidos");
  return { success: true };
}

type PedidoNotif = {
  nombreCliente: string;
  clienteTelefono: string | null;
  direccion: string;
};

// Helper: intenta callCore, si falla usa Prisma directo
async function updateEstadoPedido(id: string, estado: string, extra: Record<string, unknown> = {}) {
  if (process.env.CORE_SERVICE_URL) {
    try {
      await callCore(`/api/v1/orders/${id}/estado`, {
        method: "PATCH",
        body: { estado, ...extra },
      });
      return;
    } catch (err) {
      console.warn(`[updateEstadoPedido] core-service no disponible, usando Prisma:`, err);
    }
  }

  // Fallback Prisma directo
  const data: Record<string, unknown> = { estado };
  if (estado === "en_ruta") data.despachadoEn = new Date();
  if (estado === "entregado") { data.entregadoEn = new Date(); data.scoreRiesgo = 0; }
  if (estado === "fallido") { data.motivoFallo = extra.motivo || "Sin especificar"; data.intentosEntrega = { increment: 1 }; }
  if (estado === "cancelado") { data.canceladoEn = new Date(); data.motivoCancelacion = extra.motivo || "Sin especificar"; }

  await prisma.pedido.update({ where: { id }, data });
}

export async function marcarEnRuta(id: string) {
  if (!id) return;

  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      select: { nombreCliente: true, clienteTelefono: true, direccion: true },
    });

    await updateEstadoPedido(id, "en_ruta");

    if (pedido?.clienteTelefono) {
      void notificarPedidoEnRuta({
        pedidoId: id,
        telefono: pedido.clienteTelefono,
        cliente: pedido.nombreCliente,
        direccion: pedido.direccion,
      });
    }
  } catch (err) {
    console.error("[marcarEnRuta]", err);
    return { error: "No se pudo actualizar el pedido" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/pedidos");
  return { success: true };
}

export async function marcarComoEntregado(id: string) {
  if (!id) return;

  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      select: { nombreCliente: true, clienteTelefono: true, direccion: true },
    });

    await updateEstadoPedido(id, "entregado");

    if (pedido?.clienteTelefono) {
      void notificarPedidoEntregado({
        pedidoId: id,
        telefono: pedido.clienteTelefono,
        cliente: pedido.nombreCliente,
        direccion: pedido.direccion,
      });
    }
  } catch (err) {
    console.error("[marcarComoEntregado]", err);
    return { error: "No se pudo actualizar el pedido" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/pedidos");
  return { success: true };
}

export async function eliminarPedido(id: string) {
  if (!id) return;
  try {
    if (process.env.CORE_SERVICE_URL) {
      try {
        await callCore(`/api/v1/orders/${id}`, { method: "DELETE" });
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/pedidos");
        return { success: true };
      } catch (err) {
        console.warn("[eliminarPedido] core no disponible, usando Prisma:", err);
      }
    }
    await prisma.pedido.delete({ where: { id } });
  } catch (err) {
    console.error("[eliminarPedido]", err);
    return { error: "No se pudo eliminar el pedido" };
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/pedidos");
  return { success: true };
}

// Cancelar un pedido (estado terminal). Distinto de eliminar:
// el pedido queda en la base con su historial para trazabilidad.
export async function cancelarPedido(id: string, motivo?: string) {
  if (!id) return { error: "ID no provisto" };
  try {
    await updateEstadoPedido(id, "cancelado", motivo ? { motivo } : {});
  } catch (err) {
    console.error("[cancelarPedido]", err);
    return { error: "No se pudo cancelar el pedido" };
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/pedidos");
  return { success: true };
}

// Marcar un intento de entrega como fallido (re-agendable), con motivo.
export async function marcarComoFallido(id: string, motivo?: string) {
  if (!id) return { error: "ID no provisto" };
  try {
    await updateEstadoPedido(id, "fallido", motivo ? { motivo } : {});
  } catch (err) {
    console.error("[marcarComoFallido]", err);
    return { error: "No se pudo actualizar el pedido" };
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/pedidos");
  return { success: true };
}

export async function editarPedido(formData: FormData) {
  const id              = formData.get("pedidoId")        as string;
  const cliente         = formData.get("cliente")         as string;
  const direccion       = formData.get("direccion")       as string;
  const producto        = formData.get("producto")        as string;
  const clienteTelefono = formData.get("clienteTelefono") as string;

  if (!id || !cliente || !direccion || !producto) return { error: "Faltan datos para editar" };

  // RF-02: Re-geocodificar si cambia la dirección
  const coords = await geocodificarDireccion(direccion);

  await prisma.pedido.update({
    where: { id },
    data: {
      nombreCliente: cliente,
      direccion,
      producto,
      clienteTelefono: clienteTelefono || null,
      lat: coords?.lat ?? undefined,
      lng: coords?.lng ?? undefined,
    }
  });

  revalidatePath("/dashboard");
  return { success: true };
}

// NUEVA FUNCIÓN PARA EL ONBOARDING
export async function crearEmpresaYUsuario(formData: FormData) {
  const nombreEmpresa = formData.get("nombreEmpresa") as string;
  const userId = formData.get("userId") as string;
  const userEmail = formData.get("userEmail") as string;

  if (!nombreEmpresa || !userId || !userEmail) {
    throw new Error("Faltan datos vitales");
  }

  try {
    // 1. Verificar si ya existe el usuario
    const existingUser = await prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      // 2. Buscar si ya existe una empresa con este email
      let empresa = await prisma.empresa.findUnique({
        where: { email: userEmail }
      });

      // 3. Si no existe, crear la empresa
      if (!empresa) {
        empresa = await prisma.empresa.create({
          data: {
            nombre: nombreEmpresa,
            email: userEmail,
          }
        });
      }

      // 4. Crear el usuario asociado a esa empresa
      await prisma.usuario.create({
        data: {
          id: userId,
          nombre: "Administrador Principal",
          email: userEmail,
          rol: "encargado",
          empresaId: empresa.id
        }
      });
    }

  } catch (error: any) {
    console.error("Error en crearEmpresaYUsuario:", error);
    // Si hay P2002, asumimos que se creó concurrentemente — igualmente redirigir
    if (error?.code !== "P2002") {
      throw error;
    }
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}


export async function obtenerUbicacionRepartidorPublico(pedidoId: string) {
  if (!pedidoId) return { error: "ID de pedido no provisto" };

  // Buscar el pedido y su repartidor
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: {
      estado: true,
      repartidorId: true,
      lat: true,
      lng: true,
    }
  });

  if (!pedido) {
    return { error: "Pedido no encontrado" };
  }

  // Solo exponer si el estado es "en_ruta"
  if (pedido.estado !== "en_ruta") {
    return { error: "El pedido no está en ruta" };
  }

  if (!pedido.repartidorId) {
    return { error: "No hay repartidor asignado a este pedido" };
  }

  // Buscar la última ubicación conocida del repartidor
  const ultimaUbicacion = await prisma.ubicacion.findFirst({
    where: { repartidorId: pedido.repartidorId },
    orderBy: { timestamp: "desc" },
    select: {
      lat: true,
      lng: true,
    }
  });

  return {
    success: true,
    lat: ultimaUbicacion?.lat ?? null,
    lng: ultimaUbicacion?.lng ?? null,
    pedidoLat: pedido.lat,
    pedidoLng: pedido.lng,
  };
}

export async function actualizarEmpresa(nombre: string, email: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    select: { empresaId: true }
  });
  if (!usuarioDB) return { error: "Usuario sin empresa" };

  await prisma.empresa.update({
    where: { id: usuarioDB.empresaId },
    data: { nombre, email }
  });

  revalidatePath("/dashboard/configuracion");
  return { success: true };
}

export async function actualizarPerfil(nombre: string, telefono: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  await prisma.usuario.update({
    where: { id: user.id },
    data: { nombre, telefono }
  });

  revalidatePath("/dashboard/configuracion");
  return { success: true };
}

// ──────────────────────────────────────────────────────────────
// Guardar configuración extendida de la empresa (RUT, país, etc.)
// ──────────────────────────────────────────────────────────────
export async function actualizarConfiguracionEmpresa(data: {
  nombre: string;
  email: string;
  rut: string;
  pais: string;
  zonaHoraria: string;
  direccion: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    select: { empresaId: true, empresa: { select: { configuracion: true } } }
  });
  if (!usuarioDB) return { error: "Usuario sin empresa" };

  // Merge con la configuración existente para no perder otros campos
  const configActual = (usuarioDB.empresa?.configuracion as Record<string, unknown>) ?? {};

  await prisma.empresa.update({
    where: { id: usuarioDB.empresaId },
    data: {
      nombre: data.nombre,
      email: data.email,
      configuracion: {
        ...configActual,
        rut: data.rut,
        pais: data.pais,
        zonaHoraria: data.zonaHoraria,
        direccion: data.direccion,
      }
    }
  });

  revalidatePath("/dashboard/configuracion");
  return { success: true };
}

// ──────────────────────────────────────────────────────────────
// Guardar preferencias de Notificaciones en el campo JSON
// ──────────────────────────────────────────────────────────────
export async function actualizarConfiguracionNotificaciones(data: {
  notifFallo: boolean;
  notifRiesgo: boolean;
  notifDesconexion: boolean;
  notifDiario: boolean;
  notifSemanal: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    select: { empresaId: true, empresa: { select: { configuracion: true } } }
  });
  if (!usuarioDB) return { error: "Usuario sin empresa" };

  const configActual = (usuarioDB.empresa?.configuracion as Record<string, unknown>) ?? {};

  await prisma.empresa.update({
    where: { id: usuarioDB.empresaId },
    data: {
      configuracion: {
        ...configActual,
        notificaciones: data,
      }
    }
  });

  revalidatePath("/dashboard/configuracion");
  return { success: true };
}

// ──────────────────────────────────────────────────────────────
// Guardar ajustes de IA & Optimización en el campo JSON
// ──────────────────────────────────────────────────────────────
export async function actualizarConfiguracionIA(data: {
  agresividad: number;
  modeloActivo: string;
  recalcularTiempo: string;
  prediccionFallo: boolean;
  reasignacionAuto: boolean;
  validacionDireccion: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    select: { empresaId: true, empresa: { select: { configuracion: true } } }
  });
  if (!usuarioDB) return { error: "Usuario sin empresa" };

  const configActual = (usuarioDB.empresa?.configuracion as Record<string, unknown>) ?? {};

  await prisma.empresa.update({
    where: { id: usuarioDB.empresaId },
    data: {
      configuracion: {
        ...configActual,
        ia: data,
      }
    }
  });

  revalidatePath("/dashboard/configuracion");
  return { success: true };
}

export async function actualizarPlanEmpresa(planId: string) {
  if (!["starter", "pro", "business"].includes(planId)) {
    return { error: "Plan inválido" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    select: { empresaId: true }
  });
  if (!usuarioDB) return { error: "Usuario sin empresa" };

  await prisma.empresa.update({
    where: { id: usuarioDB.empresaId },
    data: { plan: planId }
  });

  revalidatePath("/dashboard/planes");
  return { success: true };
}

export async function procesarPagoSimulado(planId: string, cardNumber: string, expiry: string, cvc: string) {
  if (!["starter", "pro", "business"].includes(planId)) {
    return { error: "Plan inválido" };
  }

  // Simular un pequeño retraso de red
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Validaciones súper básicas para la simulación
  if (cardNumber.replace(/\s/g, '').length < 15) return { error: "Número de tarjeta inválido" };
  if (!expiry) return { error: "Fecha de expiración requerida" };
  if (!cvc) return { error: "CVC requerido" };

  // Tarjeta rechazada de prueba (ej. empieza con 4000 0000 0000 0000)
  if (cardNumber.startsWith("4000 0000")) {
    return { error: "Tarjeta rechazada por el banco" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    select: { empresaId: true }
  });
  if (!usuarioDB) return { error: "Usuario sin empresa" };

  // Guardar solo los últimos 4 dígitos y tipo de tarjeta para seguridad
  const ultimos4 = cardNumber.slice(-4);
  const tipo = cardNumber.startsWith("4") ? "visa" : cardNumber.startsWith("5") ? "mastercard" : "other";

  const metodoPagoOfuscado = {
    ultimos4,
    tipo,
    expiracion: expiry,
  };

  await prisma.empresa.update({
    where: { id: usuarioDB.empresaId },
    data: {
      plan: planId,
      metodoPago: metodoPagoOfuscado,
    },
  });

  revalidatePath("/dashboard/planes");
  return { success: true };
}

