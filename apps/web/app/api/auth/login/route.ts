import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

interface LoginResponse {
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
    expiresIn: number;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string; password?: string };
    const email = body.email;
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email y contraseña son requeridos." },
        { status: 400 }
      );
    }

    const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://localhost:3002";
    
    // Llamar al microservicio de autenticación de Express
    const response = await fetch(`${authServiceUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json() as { error?: string } | null;
      return NextResponse.json(
        { success: false, error: errorData?.error || "Error de inicio de sesión." },
        { status: response.status }
      );
    }

    const data = await response.json() as LoginResponse;

    // Sincronizar la sesión en el cliente de Supabase para almacenar las cookies en el navegador
    const supabase = await createClient();
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.tokens.accessToken,
      refresh_token: data.tokens.refreshToken,
    });

    if (sessionError) {
      console.error("[API/Auth/Login] Error al sincronizar sesión Supabase:", sessionError);
      return NextResponse.json(
        { success: false, error: "No se pudo establecer la sesión en el navegador." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      usuario: data.usuario,
    });
  } catch (error: unknown) {
    console.error("[API/Auth/Login] Error en proxy:", error);
    const msg = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
