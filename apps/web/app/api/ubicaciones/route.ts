// app/api/ubicaciones/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";

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

    // Verificar que el usuario autenticado es el repartidor especificado
    // (Un repartidor no puede enviar ubicación de otro)
    if (user.id !== repartidorId) {
      return NextResponse.json(
        { data: null, error: "No puedes registrar ubicación de otro usuario" },
        { status: 403 }
      );
    }

    const usuarioDB = await prisma.usuario.findUnique({
      where: { id: user.id },
      select: { empresaId: true, rol: true },
    });

    if (!usuarioDB) {
      return NextResponse.json({ data: null, error: "Usuario no encontrado" }, { status: 404 });
    }

    // Guardar en DB para historial
    const ubicacion = await prisma.ubicacion.create({
      data: {
        lat,
        lng,
        repartidorId,
        empresaId: usuarioDB.empresaId,
      },
    });

    // También emitir por Supabase Broadcast para el mapa en vivo
    // El dashboard ya está suscrito al canal tracking_{empresaId}
    // Este endpoint sirve como gateway desde la app móvil nativa
    return NextResponse.json({ data: ubicacion, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/ubicaciones]", err);
    return NextResponse.json({ data: null, error: "Error interno del servidor" }, { status: 500 });
  }
}

// GET /api/ubicaciones?repartidorId=xxx — Última ubicación conocida
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ data: null, error: "No autorizado" }, { status: 401 });
    }

    const usuarioDB = await prisma.usuario.findUnique({ where: { id: user.id } });
    if (!usuarioDB) {
      return NextResponse.json({ data: null, error: "Usuario no encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const repartidorId = searchParams.get("repartidorId");

    // Última ubicación por repartidor de la empresa
    const whereClause = {
      empresaId: usuarioDB.empresaId,
      ...(repartidorId && { repartidorId }),
    };

    if (repartidorId) {
      // Una sola última ubicación
      const ultima = await prisma.ubicacion.findFirst({
        where: whereClause,
        orderBy: { timestamp: "desc" },
      });
      return NextResponse.json({ data: ultima, error: null }, { status: 200 });
    }

    // Última ubicación de TODOS los repartidores de la empresa
    const repartidores = await prisma.usuario.findMany({
      where: { empresaId: usuarioDB.empresaId, rol: "repartidor" },
      select: { id: true },
    });

    const ultimasUbicaciones = await Promise.all(
      repartidores.map((r) =>
        prisma.ubicacion.findFirst({
          where: { repartidorId: r.id, empresaId: usuarioDB.empresaId },
          orderBy: { timestamp: "desc" },
        })
      )
    );

    return NextResponse.json({
      data: ultimasUbicaciones.filter(Boolean),
      error: null,
    }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/ubicaciones]", err);
    return NextResponse.json({ data: null, error: "Error interno del servidor" }, { status: 500 });
  }
}
