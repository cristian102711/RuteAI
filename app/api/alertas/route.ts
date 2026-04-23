// app/api/alertas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabaseServer";

const MarcarLeidaSchema = z.object({
  alertaId: z.string().uuid("ID de alerta inválido"),
});

const CrearAlertaSchema = z.object({
  tipo: z.enum(["desvio", "retraso", "riesgo_alto"]),
  mensaje: z.string().min(5),
  repartidorId: z.string().optional(),
  pedidoId: z.string().optional(),
});

// GET /api/alertas — Listar alertas de la empresa (no leídas primero)
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ data: null, error: "No autorizado" }, { status: 401 });
    }

    const usuarioDB = await prisma.usuario.findUnique({
      where: { id: user.id },
    });

    if (!usuarioDB) {
      return NextResponse.json({ data: null, error: "Usuario no encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const soloNoLeidas = searchParams.get("noLeidas") === "true";

    const alertas = await prisma.alerta.findMany({
      where: {
        empresaId: usuarioDB.empresaId,
        ...(soloNoLeidas && { leida: false }),
      },
      include: {
        repartidor: { select: { id: true, nombre: true } },
      },
      orderBy: [{ leida: "asc" }, { createdAt: "desc" }],
      take: 50, // Límite para el dashboard
    });

    return NextResponse.json({ data: alertas, error: null }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/alertas]", err);
    return NextResponse.json({ data: null, error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/alertas — Crear una alerta (usado por Edge Functions)
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const parsed = CrearAlertaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const alerta = await prisma.alerta.create({
      data: {
        ...parsed.data,
        empresaId: usuarioDB.empresaId,
      },
    });

    return NextResponse.json({ data: alerta, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/alertas]", err);
    return NextResponse.json({ data: null, error: "Error interno del servidor" }, { status: 500 });
  }
}

// PATCH /api/alertas — Marcar alerta como leída
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ data: null, error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = MarcarLeidaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const usuarioDB = await prisma.usuario.findUnique({ where: { id: user.id } });
    if (!usuarioDB) {
      return NextResponse.json({ data: null, error: "Usuario no encontrado" }, { status: 404 });
    }

    // Verificar que la alerta pertenece a la empresa del usuario
    const alerta = await prisma.alerta.findFirst({
      where: { id: parsed.data.alertaId, empresaId: usuarioDB.empresaId },
    });

    if (!alerta) {
      return NextResponse.json({ data: null, error: "Alerta no encontrada" }, { status: 404 });
    }

    const actualizada = await prisma.alerta.update({
      where: { id: parsed.data.alertaId },
      data: { leida: true },
    });

    return NextResponse.json({ data: actualizada, error: null }, { status: 200 });
  } catch (err) {
    console.error("[PATCH /api/alertas]", err);
    return NextResponse.json({ data: null, error: "Error interno del servidor" }, { status: 500 });
  }
}
