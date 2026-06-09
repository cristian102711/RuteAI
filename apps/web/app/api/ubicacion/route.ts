import { NextRequest, NextResponse } from "next/server";
import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";

// POST /api/ubicacion — El móvil llama este endpoint cada N segundos
// Body: { lat: number, lng: number }
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json() as { lat: unknown; lng: unknown };
    const lat = typeof body.lat === "number" ? body.lat : null;
    const lng = typeof body.lng === "number" ? body.lng : null;

    if (lat === null || lng === null) {
      return NextResponse.json({ success: false, error: "lat y lng son requeridos" }, { status: 400 });
    }

    const usuarioDB = await prisma.usuario.findUnique({
      where: { id: user.id },
      select: { empresaId: true, rol: true },
    });

    if (!usuarioDB) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    // Guardar ping GPS en la tabla Ubicacion
    const ubicacion = await prisma.ubicacion.create({
      data: {
        lat,
        lng,
        repartidorId: user.id,
        empresaId:    usuarioDB.empresaId,
      },
    });

    return NextResponse.json({ success: true, data: ubicacion });
  } catch (error) {
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

    const ultima = await prisma.ubicacion.findFirst({
      where: { repartidorId },
      orderBy: { timestamp: "desc" },
    });

    return NextResponse.json({ success: true, data: ultima });
  } catch (error) {
    console.error("[API/ubicacion] Error:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
