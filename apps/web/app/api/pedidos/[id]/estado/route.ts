import { NextRequest, NextResponse } from "next/server";
import { callCore, CoreServiceError } from "@/lib/coreServiceClient";

// PATCH /api/pedidos/[id]/estado
// Usado por el portal del repartidor para marcar entregado/fallido.
// La validación de propiedad (pedido asignado al repartidor) la aplica core.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pedidoId } = await params;

    const body = (await req.json()) as { estado: string; motivo?: string; sinFoto?: boolean };
    const { estado, motivo, sinFoto } = body;

    if (!["entregado", "fallido", "en_ruta", "cancelado"].includes(estado)) {
      return NextResponse.json(
        { error: "Estado inválido. Usa: entregado | fallido | en_ruta | cancelado" },
        { status: 400 }
      );
    }

    const actualizado = await callCore(`/api/v1/orders/${pedidoId}/estado`, {
      method: "PATCH",
      body: {
        estado,
        ...(motivo && { motivo }),
        ...(sinFoto !== undefined && { sinFoto }),
      },
    });

    console.log(`[PATCH /api/pedidos/${pedidoId}/estado] → ${estado}`);

    return NextResponse.json({ success: true, data: actualizado });
  } catch (err) {
    if (err instanceof CoreServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[PATCH /api/pedidos/[id]/estado]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
