import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import prisma from "@ruteai/database";
import { logAuthEvent } from '../../login/actions';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
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
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      // 3. Route according to their role
      if (usuarioDB.rol === "super_admin") {
        return NextResponse.redirect(`${origin}/admin`);
      } else if (usuarioDB.rol === "repartidor") {
        return NextResponse.redirect(`${origin}/dashboard/pedidos`);
      } else {
        return NextResponse.redirect(`${origin}/dashboard`);
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

  // Fallback to login in case of failure
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
