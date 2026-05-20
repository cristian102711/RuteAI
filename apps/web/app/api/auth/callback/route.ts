import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import prisma from "@ruteai/database";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data?.user) {
      const user = data.user;
      const meta = user.user_metadata || {};
      const rol = meta.rol ?? "repartidor";

      // Registrar log de éxito en la base de datos para auditoría
      try {
        await prisma.logAcceso.create({
          data: {
            email: user.email || "oauth-user",
            estado: "exito",
            detalles: `Usuario logueado vía Google OAuth. Rol: ${rol}`,
          },
        });
      } catch (logError) {
        console.error("[OAuth Callback] Error al registrar log de acceso:", logError);
      }

      const isLocalEnv = process.env.NODE_ENV === "development";
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else {
        return NextResponse.redirect(`${appUrl}${next}`);
      }
    }
  }

  // En caso de error en el flujo OAuth, guardar log de fallo
  try {
    await prisma.logAcceso.create({
      data: {
        email: "oauth-failed",
        estado: "error",
        detalles: "Fallo en intercambio de código de autorización (OAuth Callback)",
      },
    });
  } catch (logError) {
    console.error("[OAuth Callback] Error al registrar log de acceso fallido:", logError);
  }

  // En caso de error, retornar a la página de login con indicador de error
  return NextResponse.redirect(`${origin}/login?error=oauth_error`);
}
