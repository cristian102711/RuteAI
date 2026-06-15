import { NextRequest, NextResponse } from "next/server";
import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";

// PATCH /api/pedidos/[id]/estado
// Usado por el portal del repartidor para marcar entregado/fallido
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pedidoId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json() as { estado: string };
    const { estado } = body;

    if (!["entregado", "fallido", "en_ruta"].includes(estado)) {
      return NextResponse.json(
        { error: "Estado inválido. Usa: entregado | fallido | en_ruta" },
        { status: 400 }
      );
    }

    // Verificar que el pedido pertenece a la empresa del repartidor
    const repartidor = await prisma.usuario.findUnique({
      where: { id: user.id },
      select: { empresaId: true, id: true },
    });

    if (!repartidor) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const pedido = await prisma.pedido.findFirst({
      where: {
        id:          pedidoId,
        empresaId:   repartidor.empresaId,
        repartidorId: repartidor.id,
      },
    });

    if (!pedido) {
      return NextResponse.json({ error: "Pedido no encontrado o no asignado a ti" }, { status: 404 });
    }

    const actualizado = await prisma.pedido.update({
      where: { id: pedidoId },
      data:  { estado, updatedAt: new Date() },
    });

    console.log(`[PATCH /api/pedidos/${pedidoId}/estado] ${user.id} → ${estado}`);

    return NextResponse.json({ success: true, data: actualizado });
  } catch (err) {
    console.error("[PATCH /api/pedidos/[id]/estado]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
