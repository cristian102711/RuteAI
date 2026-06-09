import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { logAuthEvent } from "@/lib/authLogger";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  const isLocalEnv = process.env.NODE_ENV === "development";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
  const redirectBase =
    !isLocalEnv && appUrl.startsWith("http://")
      ? appUrl.replace("http://", "https://")
      : appUrl;

  console.log(
    JSON.stringify({
      event: "api.auth.callback.start",
      hasCode: !!code,
      next,
      timestamp: new Date().toISOString(),
    })
  );

  if (!code) {
    await logAuthEvent({
      userId: "anonymous",
      email: "oauth-failed",
      provider: "google",
      status: "failed",
      error: "No se recibió código de autorización",
    });
    return NextResponse.redirect(`${origin}/login?error=oauth_error`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (!error && data?.user) {
    const user = data.user;

    await logAuthEvent({
      userId: user.id,
      email: user.email || "oauth-user",
      provider: "google",
      status: "success",
    });

    // Intentar role-routing via Admin Client (con fallback seguro)
    let destination = next;
    try {
      const { createAdminClient } = await import("@/lib/supabaseAdmin");
      const admin = createAdminClient();
      const { data: usuarioDB } = await admin
        .from("Usuario")
        .select("rol")
        .eq("id", user.id)
        .single();

      if (usuarioDB?.rol) {
        destination =
          usuarioDB.rol === "super_admin"
            ? "/admin"
            : usuarioDB.rol === "repartidor"
            ? "/dashboard/pedidos"
            : "/dashboard";
      }
    } catch (adminErr) {
      console.warn(
        JSON.stringify({
          event: "api.auth.callback.admin_fallback",
          error: adminErr instanceof Error ? adminErr.message : String(adminErr),
          fallback: destination,
          timestamp: new Date().toISOString(),
        })
      );
    }

    console.log(
      JSON.stringify({
        event: "api.auth.callback.redirect",
        destination,
        userId: user.id,
        timestamp: new Date().toISOString(),
      })
    );

    return isLocalEnv
      ? NextResponse.redirect(`${origin}${destination}`)
      : NextResponse.redirect(`${redirectBase}${destination}`);
  }

  // Fallo en el intercambio de código
  await logAuthEvent({
    userId: "anonymous",
    email: "oauth-failed",
    provider: "google",
    status: "failed",
    error: error?.message ?? "Fallo en intercambio de código (api/auth/callback)",
  });

  return NextResponse.redirect(`${origin}/login?error=oauth_error`);
}
