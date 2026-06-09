import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import prisma from "@ruteai/database";

// POST /api/invitaciones — El encargado crea un token de invitación para un repartidor
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const usuarioDB = await prisma.usuario.findUnique({
      where: { id: user.id },
      include: { empresa: true },
    });

    if (!usuarioDB || usuarioDB.rol !== "encargado" || !usuarioDB.empresa) {
      return NextResponse.json({ error: "Solo los encargados pueden invitar repartidores" }, { status: 403 });
    }

    const body = await req.json() as { email?: string; nombre?: string };
    const email = body.email?.trim() || null;
    const nombre = body.nombre?.trim() || null;

    // Token válido por 7 días
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitacion = await prisma.invitacionRepartidor.create({
      data: {
        email,
        nombre,
        expiresAt,
        empresaId: usuarioDB.empresa.id,
      },
    });

    return NextResponse.json({
      success: true,
      token: invitacion.token,
      expiresAt: invitacion.expiresAt,
    });
  } catch (error) {
    console.error("[API/invitaciones] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
