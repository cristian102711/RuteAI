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

// GET /api/super-admin/empresas
export async function GET(req: NextRequest) {
  const user = await checkSuperAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  try {
    const empresas = await prisma.empresa.findMany({
      include: {
        _count: {
          select: { usuarios: true, pedidos: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const data = empresas.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      inicial: e.nombre.charAt(0).toUpperCase(),
      plan: e.plan.charAt(0).toUpperCase() + e.plan.slice(1),
      estado: e.activa ? "Activa" : "Inactiva",
      usuarios: e._count.usuarios,
      entregas: e._count.pedidos.toString(),
      pais: (e.configuracion as any)?.pais || "Chile",
      actividad: "Registrada en " + new Date(e.createdAt).toLocaleDateString()
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Error interno" }, { status: 500 });
  }
}

// POST /api/super-admin/empresas
export async function POST(req: NextRequest) {
  const user = await checkSuperAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { nombre, plan, email, pais } = body;

    if (!nombre) {
      return NextResponse.json({ success: false, error: "El nombre es obligatorio" }, { status: 400 });
    }

    const emailStr = email && email.trim().length > 0 
      ? email 
      : nombre.toLowerCase().replace(/[^a-z0-9]/g, "") + "@empresa.com";

    const empresa = await prisma.empresa.create({
      data: {
        nombre,
        email: emailStr,
        plan: plan || "starter",
        planActivo: true,
        activa: true,
        configuracion: { pais: pais || "Chile" }
      }
    });

    return NextResponse.json({ success: true, data: empresa });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Error interno" }, { status: 500 });
  }
}

// PUT /api/super-admin/empresas (Toggle activa)
export async function PUT(req: NextRequest) {
  const user = await checkSuperAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "El ID es obligatorio" }, { status: 400 });
    }

    const empresa = await prisma.empresa.findUnique({ where: { id } });
    if (!empresa) {
      return NextResponse.json({ success: false, error: "Empresa no encontrada" }, { status: 404 });
    }

    const updated = await prisma.empresa.update({
      where: { id },
      data: { activa: !empresa.activa }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Error interno" }, { status: 500 });
  }
}
