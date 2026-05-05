"use server";

import prisma from "@ruteai/database";
import { revalidatePath } from "next/cache";

// Lógica Mock Deterministica para el Riesgo (Simulando API IA Externa)
function calcularRiesgoIA(cliente: string, direccion: string, producto: string): number {
  let riesgo = 15; // Riesgo base por tráfico
  
  const textToLower = (cliente + direccion + producto).toLowerCase();
  
  // Factores que incrementan la complejidad de entrega
  if (textToLower.includes("departamento") || textToLower.includes("dpto")) riesgo += 20;
  if (textToLower.includes("condominio") || textToLower.includes("torre")) riesgo += 15;
  if (textToLower.includes("sin numero") || textToLower.includes("s/n")) riesgo += 30;
  if (producto.toLowerCase().includes("frágil") || producto.toLowerCase().includes("tv") || producto.toLowerCase().includes("monitor")) riesgo += 25;
  
  // Limitar al 99%
  return Math.min(riesgo, 99);
}

export async function agregarPedidoNuevo(formData: FormData, empresaId: string) {
  const cliente = formData.get("cliente") as string;
  const direccion = formData.get("direccion") as string;
  const producto = formData.get("producto") as string;
  
  if (!cliente || !direccion || !producto) return { error: "Faltan datos" };

  const riesgoCalculado = calcularRiesgoIA(cliente, direccion, producto);

  await prisma.pedido.create({
    data: {
      nombreCliente: cliente,
      direccion: direccion,
      producto: producto,
      scoreRiesgo: riesgoCalculado,
      estado: "pendiente",
      empresaId: empresaId,
    }
  });

  revalidatePath("/dashboard");
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
