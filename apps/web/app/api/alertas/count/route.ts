import { NextResponse } from "next/server";
import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ count: 0 }, { status: 200 });

    const usuarioDB = await prisma.usuario.findUnique({
      where: { id: user.id },
      select: { empresaId: true },
    });
    if (!usuarioDB) return NextResponse.json({ count: 0 }, { status: 200 });

    const count = await prisma.alerta.count({
      where: { empresaId: usuarioDB.empresaId, leida: false },
    });

    // Últimas 5 alertas sin leer para el dropdown
    const alertas = await prisma.alerta.findMany({
      where: { empresaId: usuarioDB.empresaId, leida: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, tipo: true, mensaje: true, createdAt: true },
    });

    return NextResponse.json({ count, alertas }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/alertas/count]", err);
    return NextResponse.json({ count: 0, alertas: [] }, { status: 200 });
  }
}
