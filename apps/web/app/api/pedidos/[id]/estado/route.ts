import { NextRequest, NextResponse } from "next/server";
import { callCore, CoreServiceError } from "@/lib/coreServiceClient";
import prisma from "@ruteai/database";

// PATCH /api/pedidos/[id]/estado
// Usado por el portal del repartidor para marcar entregado/fallido.
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

    // Intentar core-service
    if (process.env.CORE_SERVICE_URL) {
      try {
        const actualizado = await callCore(`/api/v1/orders/${pedidoId}/estado`, {
          method: "PATCH",
          body: {
            estado,
            ...(motivo && { motivo }),
            ...(sinFoto !== undefined && { sinFoto }),
          },
        });
        console.log(`[PATCH /api/pedidos/${pedidoId}/estado] → ${estado} (via core)`);
        return NextResponse.json({ success: true, data: actualizado });
      } catch (err) {
        console.warn("[PATCH estado] core-service no disponible, usando Prisma:", err);
      }
    }

    // Fallback Prisma directo
    const data: Record<string, unknown> = { estado };
    if (estado === "en_ruta") data.despachadoEn = new Date();
    if (estado === "entregado") { data.entregadoEn = new Date(); data.scoreRiesgo = 0; }
    if (estado === "fallido") { data.motivoFallo = motivo || "Sin especificar"; data.intentosEntrega = { increment: 1 }; }
    if (estado === "cancelado") { data.canceladoEn = new Date(); data.motivoCancelacion = motivo || "Sin especificar"; }
    if (sinFoto !== undefined) data.entregaSinFoto = sinFoto;

    const actualizado = await prisma.pedido.update({ where: { id: pedidoId }, data });
    console.log(`[PATCH /api/pedidos/${pedidoId}/estado] → ${estado} (via Prisma)`);

    return NextResponse.json({ success: true, data: actualizado });
  } catch (err) {
    if (err instanceof CoreServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[PATCH /api/pedidos/[id]/estado]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
