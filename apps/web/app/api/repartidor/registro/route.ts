import { NextRequest, NextResponse } from "next/server";
import prisma from "@ruteai/database";
import { createAdminClient } from "@/lib/supabaseAdmin";

// POST /api/repartidor/registro — Registra un repartidor usando un token de invitación
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      token: string;
      nombre: string;
      email: string;
      password: string;
      telefono?: string;
      vehiculo?: string;
    };

    const { token, nombre, email, password, telefono, vehiculo } = body;

    if (!token || !nombre || !email || !password) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: token, nombre, email, password" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    // 1. Validar el token de invitación
    const invitacion = await prisma.invitacionRepartidor.findUnique({
      where: { token },
      include: { empresa: true },
    });

    if (!invitacion) {
      return NextResponse.json({ error: "Invitación no válida" }, { status: 404 });
    }
    if (invitacion.usada) {
      return NextResponse.json({ error: "Esta invitación ya fue utilizada" }, { status: 410 });
    }
    if (new Date() > invitacion.expiresAt) {
      return NextResponse.json({ error: "Esta invitación ha expirado" }, { status: 410 });
    }

    const admin = createAdminClient();

    // 2. Crear usuario en Supabase Auth (email confirmado automáticamente)
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre,
        rol: "repartidor",
        empresaId: invitacion.empresaId,
      },
    });

    if (authError || !authData.user) {
      const msg = authError?.message ?? "Error al crear usuario en Supabase";
      if (msg.toLowerCase().includes("already registered")) {
        return NextResponse.json({ error: "Este email ya está registrado" }, { status: 409 });
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const supabaseUserId = authData.user.id;

    // 3. Crear registro en Prisma — si falla, eliminamos el usuario de Supabase
    // para evitar cuentas huérfanas que bloquearían futuros intentos con el mismo email.
    try {
      await prisma.usuario.create({
        data: {
          id: supabaseUserId,
          nombre,
          email,
          rol: "repartidor",
          telefono: telefono || null,
          vehiculo: vehiculo || null,
          empresaId: invitacion.empresaId,
        },
      });
    } catch (prismaError) {
      console.error("[API/repartidor/registro] Prisma falló, haciendo rollback de Supabase:", prismaError);
      await admin.auth.admin.deleteUser(supabaseUserId).catch((e) =>
        console.error("[API/repartidor/registro] Rollback Supabase falló:", e)
      );
      return NextResponse.json({ error: "Error al guardar el usuario. Intenta de nuevo." }, { status: 500 });
    }

    // 4. Marcar la invitación como usada
    await prisma.invitacionRepartidor.update({
      where: { id: invitacion.id },
      data: { usada: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/repartidor/registro] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
