import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import prisma from "@/lib/prisma";

// Middleware local para validar Super Admin
async function checkSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.rol !== "super_admin") {
    return null;
  }
  return user;
}

// GET /api/super-admin/logs
export async function GET(req: NextRequest) {
  const user = await checkSuperAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  try {
    const logs = await prisma.logAcceso.findMany({
      orderBy: { timestamp: "desc" },
      take: 100 // Limitar a los últimos 100 logs
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Error interno" }, { status: 500 });
  }
}
