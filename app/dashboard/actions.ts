"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function agregarPedidoNuevo(formData: FormData, empresaId: string) {
  const cliente = formData.get("cliente") as string;
  const direccion = formData.get("direccion") as string;
  const producto = formData.get("producto") as string;
  
  if (!cliente || !direccion || !producto) return { error: "Faltan datos" };

  await prisma.pedido.create({
    data: {
      nombreCliente: cliente,
      direccion: direccion,
      producto: producto,
      scoreRiesgo: Math.floor(Math.random() * 100),
      estado: "pendiente",
      empresaId: empresaId,
    }
  });

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
