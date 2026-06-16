import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { callCore, CoreServiceError } from "@/lib/coreServiceClient";

// POST /api/ubicacion — El móvil llama este endpoint cada N segundos
// Body: { lat: number, lng: number }  (el repartidor es el usuario en sesión)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const body = (await req.json()) as { lat: unknown; lng: unknown };
    const lat = typeof body.lat === "number" ? body.lat : null;
    const lng = typeof body.lng === "number" ? body.lng : null;

    if (lat === null || lng === null) {
      return NextResponse.json({ success: false, error: "lat y lng son requeridos" }, { status: 400 });
    }

    const ubicacion = await callCore("/api/v1/locations", {
      method: "POST",
      body: { lat, lng, repartidorId: user.id },
    });

    return NextResponse.json({ success: true, data: ubicacion });
  } catch (error) {
    if (error instanceof CoreServiceError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error("[API/ubicacion] Error:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

// GET /api/ubicacion?repartidorId=xxx — Última ubicación conocida de un repartidor
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const repartidorId = req.nextUrl.searchParams.get("repartidorId") ?? user.id;

    try {
      const ultima = await callCore(`/api/v1/locations/repartidor/${repartidorId}`);
      return NextResponse.json({ success: true, data: ultima });
    } catch (err) {
      if (err instanceof CoreServiceError && err.status === 404) {
        return NextResponse.json({ success: true, data: null });
      }
      throw err;
    }
  } catch (error) {
    if (error instanceof CoreServiceError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error("[API/ubicacion] Error:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
