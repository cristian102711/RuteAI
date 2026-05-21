import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { logAuthEvent } from "@/lib/authLogger";

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

      // Registrar log de éxito vía microservicio (sin prisma.logAcceso)
      await logAuthEvent({
        userId: user.id,
        email: user.email || "oauth-user",
        provider: "google",
        status: "success",
      });

      const isLocalEnv = process.env.NODE_ENV === "development";
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;

      // Forzar HTTPS en producción
      const redirectBase = !isLocalEnv && appUrl.startsWith("http://")
        ? appUrl.replace("http://", "https://")
        : appUrl;

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else {
        return NextResponse.redirect(`${redirectBase}${next}`);
      }
    }
  }

  // En caso de error en el flujo OAuth
  await logAuthEvent({
    userId: "anonymous",
    email: "oauth-failed",
    provider: "google",
    status: "failed",
    error: "Fallo en intercambio de código de autorización (OAuth Callback)",
  });

  return NextResponse.redirect(`${origin}/login?error=oauth_error`);
}
