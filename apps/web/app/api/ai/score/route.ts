import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ScoreSchema = z.object({
  pedidoId:         z.string(),
  lat:              z.number(),
  lng:              z.number(),
  hora:             z.number().min(0).max(23).optional().default(new Date().getHours()),
  diasRetraso:      z.number().min(0).optional().default(0),
  intentosFallidos: z.number().min(0).optional().default(0),
  zonaRiesgo:       z.boolean().optional().default(false),
});

// BFF: apps/web actúa como intermediario entre el cliente y el AI microservice
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ScoreSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const aiServiceUrl = process.env.AI_SERVICE_URL ?? "https://ruteai-ai-service.vercel.app";
    const aiSecret = process.env.AI_SERVICE_SECRET || "";

    const response = await fetch(`${aiServiceUrl}/api/score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": aiSecret
      },
      body: JSON.stringify(parsed.data),
    });

    if (!response.ok) {
      throw new Error(`AI Service respondió con status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("[BFF /api/ai/score] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al conectar con el servicio de IA" },
      { status: 503 }
    );
  }
}
