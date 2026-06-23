// BFF: /api/ai/reorganize
// Autentica al usuario, obtiene sus pedidos activos y llama al
// ai-service (vía aiServiceClient) para reorganizarlos por prioridad
// logística usando Open Router.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import prisma from "@ruteai/database";
import { reorganizarPedidos } from "@/lib/aiServiceClient";

export async function POST() {
  try {
    // 1. Autenticación
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const usuarioDB = await prisma.usuario.findUnique({
      where: { id: user.id },
      select: { empresaId: true },
    });
    if (!usuarioDB) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // 2. Pedidos activos de la empresa
    const pedidos = await prisma.pedido.findMany({
      where: {
        empresaId: usuarioDB.empresaId,
        estado: { in: ["pendiente", "en_ruta"] },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        producto: true,
        direccion: true,
        estado: true,
        scoreRiesgo: true,
        fechaEntregaLimite: true,
      },
    });

    if (pedidos.length === 0) {
      return NextResponse.json(
        { error: "No hay pedidos activos para reorganizar" },
        { status: 400 },
      );
    }

    // 3. Marcar como urgentes los pedidos con menos de 2 horas para su límite
    const ahora = Date.now();
    const dosHorasMs = 2 * 60 * 60 * 1000;

    const pedidosPayload = pedidos.map((p) => ({
      id: p.id,
      producto: p.producto,
      direccion: p.direccion,
      estado: p.estado,
      scoreRiesgo: p.scoreRiesgo ?? 0,
      fechaEntregaLimite: p.fechaEntregaLimite?.toISOString() ?? null,
      urgencia: p.fechaEntregaLimite
        ? new Date(p.fechaEntregaLimite).getTime() - ahora < dosHorasMs
        : false,
    }));

    // 4. Llamar al ai-service vía el client BFF (centraliza fetch + fallback)
    const resultado = await reorganizarPedidos(pedidosPayload);
    return NextResponse.json({ success: true, data: resultado });
  } catch (error) {
    console.error("[BFF /api/ai/reorganize]", error);
    return NextResponse.json(
      { error: "Error al reorganizar pedidos con IA" },
      { status: 503 },
    );
  }
}
