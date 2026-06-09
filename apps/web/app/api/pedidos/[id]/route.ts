// apps/web/app/api/pedidos/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";
import { notificarPedidoEnRuta, notificarPedidoEntregado } from "@/lib/twilioService";

const ActualizarEstadoSchema = z.object({
  estado: z.enum(["pendiente", "en_ruta", "entregado", "fallido"]),
  motivoFallo: z.string().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Obtener el pedido para verificar asignación y rol
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        repartidor: { select: { id: true } },
      },
    });

    if (!pedido) {
      return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 });
    }

    // Verificar si el usuario es el repartidor asignado o es un encargado
    const usuarioDB = await prisma.usuario.findUnique({
      where: { id: user.id },
      select: { rol: true },
    });

    const esRepartidorAsignado = pedido.repartidorId === user.id;
    const esEncargado = usuarioDB?.rol === "encargado";

    if (!esRepartidorAsignado && !esEncargado) {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para actualizar este pedido" },
        { status: 403 }
      );
    }

    // Validar el body
    const body = await req.json();
    const parsed = ActualizarEstadoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { estado, motivoFallo } = parsed.data;

    // Actualizar el pedido
    const pedidoActualizado = await prisma.pedido.update({
      where: { id },
      data: {
        estado,
        motivoFallo: estado === "fallido" ? motivoFallo : null,
        // Si se entrega, se resetea el score de riesgo
        ...(estado === "entregado" && { scoreRiesgo: 0 }),
      },
    });

    // Enviar notificaciones si corresponde
    if (pedido.clienteTelefono) {
      if (estado === "en_ruta" && pedido.estado !== "en_ruta") {
        void notificarPedidoEnRuta({
          pedidoId: id,
          telefono: pedido.clienteTelefono,
          cliente: pedido.nombreCliente,
          direccion: pedido.direccion,
        }).catch(err => console.error("Error enviando notificación en_ruta:", err));
      } else if (estado === "entregado" && pedido.estado !== "entregado") {
        void notificarPedidoEntregado({
          pedidoId: id,
          telefono: pedido.clienteTelefono,
          cliente: pedido.nombreCliente,
          direccion: pedido.direccion,
        }).catch(err => console.error("Error enviando notificación entregado:", err));
      }
    }

    return NextResponse.json({ success: true, data: pedidoActualizado }, { status: 200 });
  } catch (err) {
    console.error("[PATCH /api/pedidos/[id]]", err);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
