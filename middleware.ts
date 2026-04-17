import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: No agregar lógica entre createServerClient y auth.getUser()
  // Un pequeño error aquí puede dejar usuarios deslogueados aleatoriamente.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 🔒 PROTEGER: Si el usuario no está logueado e intenta entrar al dashboard → redirigir a login
  if (!user && pathname.startsWith('/dashboard')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // 🟢 REDIRIGIR: Si el usuario ya está logueado e intenta entrar al login → mandarlo al dashboard
  if (user && pathname === '/login') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  // ✅ La página de tracking (/tracking/[id]) es PÚBLICA, no se protege.

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Interceptar todas las rutas EXCEPTO:
     * - Archivos estáticos (_next/static, _next/image, favicon.ico, etc.)
     * - Rutas públicas de APIs de Supabase 
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
