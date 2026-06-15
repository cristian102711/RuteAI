import { NextResponse } from "next/server";
import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const usuarioDB = await prisma.usuario.findUnique({
      where: { id: user.id },
      select: { empresaId: true },
    });
    if (!usuarioDB) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    // Marcar todas las alertas de la empresa como leídas
    await prisma.alerta.updateMany({
      where: { empresaId: usuarioDB.empresaId, leida: false },
      data: { leida: true },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[PATCH /api/alertas]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
