import { NextRequest, NextResponse } from "next/server";
import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";

// Llama al microservicio IA para puntuar cada pedido individualmente
async function scorePedido(pedido: {
  id: string;
  lat: number | null;
  lng: number | null;
  diasRetraso?: number;
}): Promise<{ pedidoId: string; score: number; nivel: string }> {
  const aiServiceUrl = process.env.AI_SERVICE_URL ?? "https://ruteai-ai-service.vercel.app";

  try {
    const response = await fetch(`${aiServiceUrl}/api/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pedidoId: pedido.id,
        lat: pedido.lat ?? -33.45,
        lng: pedido.lng ?? -70.65,
        hora: new Date().getHours(),
        diasRetraso: pedido.diasRetraso ?? 0,
        intentosFallidos: 0,
        zonaRiesgo: false,
      }),
    });

    if (!response.ok) throw new Error(`AI error ${response.status}`);
    const data = await response.json();

    return {
      pedidoId: pedido.id,
      score: data.score ?? data.riesgo ?? 50,
      nivel: data.nivel ?? (data.score > 70 ? "alto" : data.score > 40 ? "medio" : "bajo"),
    };
  } catch {
    // Si falla el microservicio, asignamos score por defecto basado en posicion
    return { pedidoId: pedido.id, score: 50, nivel: "medio" };
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const usuarioDB = await prisma.usuario.findUnique({
      where: { id: user.id },
      include: { empresa: true },
    });
    if (!usuarioDB?.empresa) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });

    // Obtener pedidos pendientes/en ruta de la empresa
    const pedidosPendientes = await prisma.pedido.findMany({
      where: {
        empresaId: usuarioDB.empresa.id,
        estado: { in: ["pendiente", "en_ruta"] },
      },
      select: {
        id: true,
        nombreCliente: true,
        direccion: true,
        lat: true,
        lng: true,
        horarioPreferido: true,
        estado: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (pedidosPendientes.length === 0) {
      return NextResponse.json({
        success: true,
        totalPedidos: 0,
        rutaOptimizada: [],
        mensaje: "No hay pedidos pendientes para optimizar.",
      });
    }

    // Calcular días de retraso por pedido
    const ahora = new Date();
    const pedidosConDias = pedidosPendientes.map((p) => ({
      ...p,
      lat: p.lat ? Number(p.lat) : null,
      lng: p.lng ? Number(p.lng) : null,
      diasRetraso: Math.floor(
        (ahora.getTime() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));

    // Llamar al microservicio IA para cada pedido en paralelo (máx 7 para evitar rate limiting)
    const pedidosAEvaluar = pedidosConDias.slice(0, 7);
    const scores = await Promise.all(pedidosAEvaluar.map(scorePedido));

    // Crear mapa de score por ID
    const scoreMap = new Map<string, { pedidoId: string; score: number; nivel: string }>(
      scores.map((s) => [s.pedidoId, s])
    );

    // Ordenar por score descendente (mayor riesgo = mayor prioridad de atención)
    const rutaOptimizada = pedidosConDias
      .map((p) => {
        const scoreData = scoreMap.get(p.id) ?? { pedidoId: p.id, score: 50, nivel: "medio" };
        return {
          id: p.id,
          nombreCliente: p.nombreCliente,
          direccion: p.direccion,
          estado: p.estado,
          horarioPreferido: p.horarioPreferido,
          lat: p.lat,
          lng: p.lng,
          score: scoreData.score,
          nivel: scoreData.nivel,
          diasRetraso: p.diasRetraso,
        };
      })
      .sort((a, b) => b.score - a.score);

    const ahorroEstimado = Math.round(rutaOptimizada.length * 9); // 9 min por entrega optimizada

    return NextResponse.json({
      success: true,
      totalPedidos: rutaOptimizada.length,
      ahorroEstimadoMin: ahorroEstimado,
      rutaOptimizada,
    });
  } catch (error) {
    console.error("[/api/rutas/optimizar] Error:", error);
    return NextResponse.json({ success: false, error: "Error al optimizar rutas" }, { status: 500 });
  }
}
