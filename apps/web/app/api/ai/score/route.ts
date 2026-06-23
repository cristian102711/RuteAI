import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ── Esquemas de validación ────────────────────────────────────

// Modo IA: producto + dirección → Open Router
const ScoreIASchema = z.object({
  pedidoId:     z.string().optional().default("new"),
  producto:     z.string().min(1),
  direccion:    z.string().min(1),
  fechaEntrega: z.string().nullable().optional(),
});

// Modo heurístico legacy: lat/lng
const ScoreLegacySchema = z.object({
  pedidoId:         z.string(),
  lat:              z.number(),
  lng:              z.number(),
  hora:             z.number().min(0).max(23).optional().default(new Date().getHours()),
  diasRetraso:      z.number().min(0).optional().default(0),
  intentosFallidos: z.number().min(0).optional().default(0),
  zonaRiesgo:       z.boolean().optional().default(false),
});

// BFF: apps/web actúa como intermediario autenticado entre el cliente y el AI microservice.
// Detecta el modo (IA vs heurístico) según el payload, igual que el ai-service.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const aiServiceUrl =
      process.env.AI_SERVICE_URL ?? "https://ruteai-ai-service.vercel.app";

    let payload: Record<string, unknown>;

    // Si viene producto+direccion → modo IA
    if (typeof body.producto === "string" && typeof body.direccion === "string") {
      const parsed = ScoreIASchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: "Datos inválidos", details: parsed.error.flatten() },
          { status: 400 }
        );
      }
      payload = parsed.data;
    } else {
      // Modo heurístico legacy
      const parsed = ScoreLegacySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: "Datos inválidos", details: parsed.error.flatten() },
          { status: 400 }
        );
      }
      payload = parsed.data;
    }

    const response = await fetch(`${aiServiceUrl}/api/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
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
