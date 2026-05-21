import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import prisma from "@ruteai/database";
import { logAuthEvent } from '../../login/actions';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  // Detectar y forzar protocolo seguro HTTPS en producción
  const isLocalEnv = process.env.NODE_ENV === "development";
  let appUrl = origin;
  if (!isLocalEnv && appUrl.startsWith("http://")) {
    appUrl = appUrl.replace("http://", "https://");
  }
  const redirectBase = process.env.NEXT_PUBLIC_APP_URL || appUrl;

  try {
    if (code) {
      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error && user) {
        // 1. Log success
        await logAuthEvent({
          userId: user.id,
          email: user.email ?? "",
          provider: "google",
          status: "success",
        });

        // 2. Check if user exists in the Prisma database
        const usuarioDB = await prisma.usuario.findUnique({
          where: { id: user.id },
        });

        if (!usuarioDB) {
          // Redirect to onboarding to configure company details
          return NextResponse.redirect(`${redirectBase}/onboarding`);
        }

        // 3. Route according to their role
        if (usuarioDB.rol === "super_admin") {
          return NextResponse.redirect(`${redirectBase}/admin`);
        } else if (usuarioDB.rol === "repartidor") {
          return NextResponse.redirect(`${redirectBase}/dashboard/pedidos`);
        } else {
          return NextResponse.redirect(`${redirectBase}/dashboard`);
        }
      } else {
        // Log failure
        await logAuthEvent({
          userId: "anonymous",
          email: "unknown",
          provider: "google",
          status: "failed",
          error: error?.message ?? "Error en intercambio de código",
        });
      }
    }
  } catch (err) {
    console.error("[OAuth Callback Exception]:", err);
  }

  // Fallback to login in case of failure
  return NextResponse.redirect(`${redirectBase}/login?error=auth_failed`);
}

