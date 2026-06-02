"use server";

import prisma from "@ruteai/database";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabaseServer";
import { notificarPedidoEntregado } from "@/lib/twilioService";

export async function iniciarEntrega(pedidoId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: { repartidorId: true },
  });

  if (!pedido || pedido.repartidorId !== user.id) {
    return { error: "No autorizado" };
  }

  await prisma.pedido.update({
    where: { id: pedidoId },
    data: { estado: "en_ruta" },
  });

  revalidatePath("/repartidor");
  return { success: true };
}

export async function confirmarEntrega(pedidoId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: {
      repartidorId: true,
      nombreCliente: true,
      clienteTelefono: true,
      direccion: true,
    },
  });

  if (!pedido || pedido.repartidorId !== user.id) {
    return { error: "No autorizado" };
  }

  await prisma.pedido.update({
    where: { id: pedidoId },
    data: { estado: "entregado", scoreRiesgo: 0 },
  });

  if (pedido.clienteTelefono) {
    void notificarPedidoEntregado({
      pedidoId,
      telefono: pedido.clienteTelefono,
      cliente: pedido.nombreCliente,
      direccion: pedido.direccion,
    });
  }

  revalidatePath("/repartidor");
  return { success: true };
}
