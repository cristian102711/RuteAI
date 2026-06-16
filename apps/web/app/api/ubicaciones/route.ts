// app/api/ubicaciones/route.ts
// BFF: valida sesión y propiedad, delega persistencia/lectura en core-service.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabaseServer";
import { callCore, CoreServiceError } from "@/lib/coreServiceClient";

const RegistrarUbicacionSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  repartidorId: z.string().min(1),
});

// POST /api/ubicaciones — Registrar ping GPS del repartidor
// Llamado por la app móvil cada 10 segundos cuando está en ruta
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ data: null, error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = RegistrarUbicacionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { lat, lng, repartidorId } = parsed.data;

    // Un repartidor no puede enviar ubicación de otro
    if (user.id !== repartidorId) {
      return NextResponse.json(
        { data: null, error: "No puedes registrar ubicación de otro usuario" },
        { status: 403 }
      );
    }

    // Persistir en core (el empresaId lo deriva core del token)
    const ubicacion = await callCore("/api/v1/locations", {
      method: "POST",
      body: { lat, lng, repartidorId },
    });

    return NextResponse.json({ data: ubicacion, error: null }, { status: 201 });
  } catch (err) {
    if (err instanceof CoreServiceError) {
      return NextResponse.json({ data: null, error: err.message }, { status: err.status });
    }
    console.error("[POST /api/ubicaciones]", err);
    return NextResponse.json({ data: null, error: "Error interno del servidor" }, { status: 500 });
  }
}

// GET /api/ubicaciones?repartidorId=xxx — Última ubicación conocida
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const repartidorId = searchParams.get("repartidorId");

    if (repartidorId) {
      // Una sola última ubicación (404 de core → null, "aún sin ubicación")
      try {
        const ultima = await callCore(`/api/v1/locations/repartidor/${repartidorId}`);
        return NextResponse.json({ data: ultima, error: null }, { status: 200 });
      } catch (err) {
        if (err instanceof CoreServiceError && err.status === 404) {
          return NextResponse.json({ data: null, error: null }, { status: 200 });
        }
        throw err;
      }
    }

    // Última ubicación de TODOS los repartidores de la empresa
    const ultimas = await callCore("/api/v1/locations");
    return NextResponse.json({ data: ultimas, error: null }, { status: 200 });
  } catch (err) {
    if (err instanceof CoreServiceError) {
      return NextResponse.json({ data: null, error: err.message }, { status: err.status });
    }
    console.error("[GET /api/ubicaciones]", err);
    return NextResponse.json({ data: null, error: "Error interno del servidor" }, { status: 500 });
  }
}
