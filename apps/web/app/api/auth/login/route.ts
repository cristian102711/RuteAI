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

    // ── 1. Intentar autenticación a través del microservicio de auth ──────────
    const authServiceUrl = process.env.AUTH_SERVICE_URL;
    let useFallback = true;
    let loginErrorMsg = "Credenciales incorrectas. Intenta de nuevo.";
    let loginStatus = 401;

    if (authServiceUrl) {
      try {
        console.log(`[Login] Intentando autenticación mediante microservicio en: ${authServiceUrl}`);
        const response = await fetch(`${authServiceUrl}/api/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          signal: AbortSignal.timeout(5000),
        });

        if (response.status === 200) {
          const resData = (await response.json()) as {
            success: boolean;
            data?: {
              usuario: {
                id: string;
                email: string;
                nombre: string;
                rol: string;
                empresaId: string;
              };
              tokens: {
                accessToken: string;
                refreshToken: string;
              };
            };
          };

          if (resData.success && resData.data?.tokens) {
            const { tokens, usuario } = resData.data;
            const supabase = await createClient();
            
            // Establecer la sesión activa de Supabase en el servidor (se guardan cookies)
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: tokens.accessToken,
              refresh_token: tokens.refreshToken,
            });

            if (sessionError) {
              console.error("[Login] Error al establecer la sesión en Supabase desde los tokens del microservicio:", sessionError);
            } else {
              useFallback = false;
              const result: LoginResult = {
                usuario: {
                  id: usuario.id,
                  email: usuario.email || email,
                  nombre: usuario.nombre,
                  rol: usuario.rol,
                  empresaId: usuario.empresaId || null,
                },
              };
              return NextResponse.json({ success: true, ...result });
            }
          }
        } else {
          // Si el microservicio responde con un error de credenciales explícito (400 o 401),
          // evitamos hacer fallback ya que la contraseña o email son incorrectos y ya fue registrado.
          const resData = (await response.json().catch(() => ({}))) as { error?: string };
          loginErrorMsg = resData.error || "Credenciales incorrectas. Intenta de nuevo.";
          loginStatus = response.status;
          useFallback = false;
        }
      } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : "Error desconocido";
        console.warn(`[Login] El microservicio de autenticación falló o no está disponible (Fallback activo). Detalle: ${errorMsg}`);
      }
    }

    // ── 2. Fallback: Intentar login directo con Supabase Auth (server-side) ───
    if (useFallback) {
      console.log("[Login] Ejecutando fallback de inicio de sesión directo con Supabase");
      const supabase = await createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData?.user || !authData?.session) {
        const msg = authError?.message ?? "Credenciales inválidas.";

        // Log de error en BD
        await prisma.logAcceso.create({
          data: { email, estado: "error", detalles: `Direct Fallback Failure: ${msg}` },
        }).catch((e: Error) => console.error("[Login] Error al guardar log de fallo:", e));

        return NextResponse.json(
          { success: false, error: loginErrorMsg },
          { status: loginStatus }
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

      // Registrar log de acceso exitoso en la BD (fallback)
      await prisma.logAcceso.create({
        data: {
          email,
          estado: "exito",
          detalles: `Login por email/password (Direct Fallback). Rol: ${rol}`,
        },
      }).catch((e: Error) => console.error("[Login] Error al guardar log de éxito:", e));

      const result: LoginResult = {
        usuario: { id: user.id, email: user.email ?? email, nombre, rol, empresaId },
      };

      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json(
      { success: false, error: loginErrorMsg },
      { status: loginStatus }
    );
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
