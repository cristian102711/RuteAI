"use server";

import prisma from "@ruteai/database";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabaseServer";
import { obtenerScoreRiesgo } from "@/lib/aiServiceClient";

export async function agregarPedidoNuevo(formData: FormData, empresaId: string) {
  const cliente = formData.get("cliente") as string;
  const direccion = formData.get("direccion") as string;
  const producto = formData.get("producto") as string;
  
  if (!cliente || !direccion || !producto) return { error: "Faltan datos" };

  // Llamada real al ai-service (con fallback automático si el servicio falla)
  const horaActual = new Date().getHours();
  const resultadoIA = await obtenerScoreRiesgo({
    pedidoId:         "new", // ID temporal — el pedido aún no existe
    lat:              -33.45, // Coordenadas base Santiago (default para pedidos sin GPS)
    lng:              -70.66,
    hora:             horaActual,
    diasRetraso:      0, // Pedido nuevo, sin retraso
    intentosFallidos: 0, // Pedido nuevo, sin intentos
    zonaRiesgo:       false,
  });

  // El ai-service retorna score 0.0-1.0, la BD almacena 0-100
  const scoreParaBD = Math.round(resultadoIA.score * 100);

  await prisma.pedido.create({
    data: {
      nombreCliente: cliente,
      direccion:     direccion,
      producto:      producto,
      scoreRiesgo:   scoreParaBD,
      estado:        "pendiente",
      empresaId:     empresaId,
    }
  });

  revalidatePath("/dashboard/pedidos");
  return { success: true };
}

export async function marcarEnRuta(id: string) {
  if (!id) return;
  await prisma.pedido.update({
    where: { id },
    data: { estado: "en_ruta" } 
  });
  // NOTA: Acá iría la integración real con Twilio:
  // await twilioClient.messages.create({ body: 'Tu pedido va en ruta. Sigue el tracking: ruta.ai/tracking/'+id, to: '+569...' })
  
  revalidatePath("/dashboard");
  return { success: true };
}

export async function marcarComoEntregado(id: string) {
  if (!id) return;
  await prisma.pedido.update({
    where: { id },
    data: { estado: "entregado", scoreRiesgo: 0 } 
  });
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
  const id = formData.get("pedidoId") as string;
  const cliente = formData.get("cliente") as string;
  const direccion = formData.get("direccion") as string;
  const producto = formData.get("producto") as string;

  if (!id || !cliente || !direccion || !producto) return { error: "Faltan datos para editar" };

  await prisma.pedido.update({
    where: { id },
    data: {
      nombreCliente: cliente,
      direccion: direccion,
      producto: producto
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
