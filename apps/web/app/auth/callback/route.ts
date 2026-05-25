import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { logAuthEvent } from '@/lib/authLogger';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // Detectar y forzar protocolo seguro HTTPS en producción
  const isLocalEnv = process.env.NODE_ENV === 'development';
  let appUrl = origin;
  if (!isLocalEnv && appUrl.startsWith('http://')) {
    appUrl = appUrl.replace('http://', 'https://');
  }
  const redirectBase = process.env.NEXT_PUBLIC_APP_URL || appUrl;

  console.log(
    JSON.stringify({
      event: 'oauth.callback.start',
      hasCode: !!code,
      origin,
      redirectBase,
      timestamp: new Date().toISOString(),
    })
  );

  try {
    if (!code) {
      console.warn('[OAuth Callback] No se recibió código de autorización.');
      return NextResponse.redirect(`${redirectBase}/login?error=auth_failed`);
    }

    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !user) {
      console.error(
        JSON.stringify({
          event: 'oauth.callback.exchange_failed',
          error: error?.message ?? 'No user returned',
          timestamp: new Date().toISOString(),
        })
      );

      await logAuthEvent({
        userId: 'anonymous',
        email: 'unknown',
        provider: 'google',
        status: 'failed',
        error: error?.message ?? 'Error en intercambio de código',
      });

      return NextResponse.redirect(`${redirectBase}/login?error=auth_failed`);
    }

    // Sesión establecida correctamente
    console.log(
      JSON.stringify({
        event: 'oauth.callback.session_ok',
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString(),
      })
    );

    await logAuthEvent({
      userId: user.id,
      email: user.email ?? '',
      provider: 'google',
      status: 'success',
    });

    // Buscar rol del usuario en la DB vía Admin Client
    // Si falla (ej: env var ausente en Vercel), redirige a /dashboard como fallback seguro
    let usuarioDB: { id: string; rol: string } | null = null;

    try {
      // Import dinámico para evitar que un throw en la inicialización rompa el flujo
      const { createAdminClient } = await import('@/lib/supabaseAdmin');
      const admin = createAdminClient();
      const { data, error: dbError } = await admin
        .from('Usuario')
        .select('id, rol')
        .eq('id', user.id)
        .single();

      if (dbError) {
        console.warn(
          JSON.stringify({
            event: 'oauth.callback.db_warn',
            warning: dbError.message,
            userId: user.id,
            timestamp: new Date().toISOString(),
          })
        );
      } else {
        usuarioDB = data;
      }
    } catch (adminErr) {
      // Fallo silencioso: la sesión ya está establecida, se usa fallback de redirección
      console.error(
        JSON.stringify({
          event: 'oauth.callback.admin_client_error',
          error: adminErr instanceof Error ? adminErr.message : String(adminErr),
          fallback: '/dashboard',
          timestamp: new Date().toISOString(),
        })
      );
    }

    // Si el usuario no tiene fila en Usuario → onboarding
    if (!usuarioDB) {
      console.log(
        JSON.stringify({
          event: 'oauth.callback.redirect',
          destination: '/onboarding',
          reason: 'user_not_in_db',
          userId: user.id,
          timestamp: new Date().toISOString(),
        })
      );
      return NextResponse.redirect(`${redirectBase}/onboarding`);
    }

    // Rutear según rol
    const destination =
      usuarioDB.rol === 'super_admin'
        ? '/admin'
        : usuarioDB.rol === 'repartidor'
        ? '/dashboard/pedidos'
        : '/dashboard';

    console.log(
      JSON.stringify({
        event: 'oauth.callback.redirect',
        destination,
        rol: usuarioDB.rol,
        userId: user.id,
        timestamp: new Date().toISOString(),
      })
    );

    return NextResponse.redirect(`${redirectBase}${destination}`);
  } catch (err) {
    console.error(
      JSON.stringify({
        event: 'oauth.callback.exception',
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      })
    );
  }

  return NextResponse.redirect(`${redirectBase}/login?error=auth_failed`);
}
