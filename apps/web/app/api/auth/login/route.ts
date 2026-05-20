import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import prisma from "@ruteai/database";

interface LoginResult {
  usuario: {
    id: string;
    email: string;
    nombre: string;
    rol: string;
    empresaId: string | null;
  };
}

export async function POST(req: NextRequest) {
  let email = "";

  try {
    const body = await req.json() as { email?: string; password?: string };
    email = body.email ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email y contraseña son requeridos." },
        { status: 400 }
      );
    }

    // ── 1. Intentar login directo con Supabase Auth (server-side) ────────────
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData?.user || !authData?.session) {
      const msg = authError?.message ?? "Credenciales inválidas.";

      // Log de error en BD (best-effort, no bloqueante)
      await prisma.logAcceso.create({
        data: { email, estado: "error", detalles: msg },
      }).catch((e: Error) => console.error("[Login] Error al guardar log de fallo:", e));

      return NextResponse.json(
        { success: false, error: "Credenciales incorrectas. Intenta de nuevo." },
        { status: 401 }
      );
    }

    const user = authData.user;
    const meta = user.user_metadata ?? {};
    const rol: string = typeof meta.rol === "string" ? meta.rol : "repartidor";
    const nombre: string =
      typeof meta.nombre === "string"
        ? meta.nombre
        : (user.email?.split("@")[0] ?? "Usuario");
    const empresaId: string | null =
      typeof meta.empresaId === "string" ? meta.empresaId : null;

    // ── 2. Registrar log de acceso exitoso en la BD ──────────────────────────
    await prisma.logAcceso.create({
      data: {
        email,
        estado: "exito",
        detalles: `Login por email/password. Rol: ${rol}`,
      },
    }).catch((e: Error) => console.error("[Login] Error al guardar log de éxito:", e));

    // ── 3. Intentar notificar al microservicio de auth (best-effort) ─────────
    // Si AUTH_SERVICE_URL no está definida o el servicio está caído,
    // el login sigue funcionando igualmente.
    const authServiceUrl = process.env.AUTH_SERVICE_URL;
    if (authServiceUrl) {
      fetch(`${authServiceUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(5000),
      }).catch((e: Error) =>
        console.warn("[Login] Auth microservice unavailable (non-blocking):", e.message)
      );
    }

    // ── 4. Devolver datos del usuario al frontend ────────────────────────────
    const result: LoginResult = {
      usuario: { id: user.id, email: user.email ?? email, nombre, rol, empresaId },
    };

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error interno del servidor";
    console.error("[API/Auth/Login] Error inesperado:", error);

    await prisma.logAcceso.create({
      data: { email, estado: "error", detalles: `Error interno: ${msg}` },
    }).catch(() => {});

    return NextResponse.json(
      { success: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
