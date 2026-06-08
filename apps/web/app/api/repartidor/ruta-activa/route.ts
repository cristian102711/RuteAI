import { NextRequest, NextResponse } from "next/server";
import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";

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
      return NextResponse.json({ data: null, error: "Usuario no encontrado en base de datos" }, { status: 404 });
    }

    // Buscar ruta activa o pendiente para el repartidor
    const ruta = await prisma.ruta.findFirst({
      where: {
        repartidorId: user.id,
        estado: { in: ["pendiente", "activa"] },
      },
      include: {
        pedidos: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({ data: ruta, email: user.email, error: null }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/repartidor/ruta-activa]", err);
    return NextResponse.json({ data: null, error: "Error interno del servidor" }, { status: 500 });
  }
}
