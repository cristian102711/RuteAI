import { swaggerSpec } from "@/lib/swaggerSpec";
import { NextResponse } from "next/server";

/**
 * GET /api/docs
 * Sirve la especificación OpenAPI 3.0 de RuteAI en formato JSON.
 * Consumida por la página /docs (SwaggerUI via CDN).
 */
export async function GET() {
  return NextResponse.json(swaggerSpec, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}
