"use server";

import prisma from "@ruteai/database";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabaseServer";
import { obtenerScoreRiesgo } from "@/lib/aiServiceClient";
import { notificarPedidoEnRuta, notificarPedidoEntregado } from "@/lib/twilioService";
import { geocodificarDireccion } from "@/lib/geocodingService";

export async function agregarPedidoNuevo(formData: FormData) {
  const cliente  = formData.get("cliente")  as string;
  const direccion = formData.get("direccion") as string;
  const producto  = formData.get("producto")  as string;
  const clienteTelefono = formData.get("clienteTelefono") as string;
  
  if (!cliente || !direccion || !producto) return { error: "Faltan datos" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    select: { empresaId: true }
  });
  if (!usuarioDB) return { error: "Usuario sin empresa asignada" };

  // RF-02: Geocodificar la dirección + RF-03: Score IA — en paralelo para minimizar latencia
  const horaActual = new Date().getHours();
  const [coords] = await Promise.all([
    geocodificarDireccion(direccion),
  ]);

  const lat = coords?.lat ?? -33.45; // Fallback: Santiago centro
  const lng = coords?.lng ?? -70.66;

  const resultadoIA = await obtenerScoreRiesgo({
    pedidoId:         "new",
    lat,              // Ahora usa coordenadas reales de la dirección
    lng,
    hora:             horaActual,
    diasRetraso:      0,
    intentosFallidos: 0,
    zonaRiesgo:       false,
  });

  const scoreParaBD = Math.round(resultadoIA.score * 100);

  await prisma.pedido.create({
    data: {
      nombreCliente: cliente,
      direccion,
      producto,
      clienteTelefono: clienteTelefono || null,
      lat:         coords?.lat ?? null, // Guardar coordenadas reales
      lng:         coords?.lng ?? null,
      scoreRiesgo: scoreParaBD,
      estado:      "pendiente",
      empresaId:   usuarioDB.empresaId,
    }
  });

  revalidatePath("/dashboard/pedidos");
  return { success: true };
}

export async function marcarEnRuta(id: string) {
  if (!id) return;

  // Obtener datos del pedido para la notificación (RF-06)
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    select: { nombreCliente: true, clienteTelefono: true, direccion: true },
  });

  await prisma.pedido.update({
    where: { id },
    data:  { estado: "en_ruta" },
  });

  // Disparar notificación Twilio (async, no bloquea la respuesta)
  if (pedido?.clienteTelefono) {
    void notificarPedidoEnRuta({
      pedidoId:  id,
      telefono:  pedido.clienteTelefono,
      cliente:   pedido.nombreCliente,
      direccion: pedido.direccion,
    });
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function marcarComoEntregado(id: string) {
  if (!id) return;

  const pedido = await prisma.pedido.findUnique({
    where: { id },
    select: { nombreCliente: true, clienteTelefono: true, direccion: true },
  });

  await prisma.pedido.update({
    where: { id },
    data:  { estado: "entregado", scoreRiesgo: 0 },
  });

  // Notificación de entrega confirmada (RF-06)
  if (pedido?.clienteTelefono) {
    void notificarPedidoEntregado({
      pedidoId:  id,
      telefono:  pedido.clienteTelefono,
      cliente:   pedido.nombreCliente,
      direccion: pedido.direccion,
    });
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function eliminarPedido(id: string) {
  if (!id) return;
  await prisma.pedido.delete({
    where: { id }
  });
  revalidatePath("/dashboard");
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

  // Creamos la Empresa y a ti (el Usuario Administrador) de un solo golpe (Transacción)
  await prisma.empresa.create({
    data: {
      nombre: nombreEmpresa,
      email: userEmail,
      usuarios: {
        create: {
          id: userId,
          nombre: "Administrador Principal",
          email: userEmail,
          rol: "encargado"
        }
      }
    }
  });

  revalidatePath("/dashboard");
}
