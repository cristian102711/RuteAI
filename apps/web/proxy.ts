import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Obtener sesión del usuario activo
  const { data: { user } } = await supabase.auth.getUser()

  // Solo redirigir en peticiones GET (para navegación)
  // Las peticiones POST (Server Actions, APIs) no deben ser redirigidas aquí
  if (request.method === 'GET') {
    // SI el usuario NO está logueado y quiere entrar al dashboard o admin → redirigir al login
    if (!user && (
      request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/admin')
    )) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // SI el usuario YA está logueado e intenta ir al login → mandarlo al dashboard
    if (user && request.nextUrl.pathname === '/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const middleware = proxy;

export const config = {
  // Protege tanto /dashboard como /admin y evita redirigir rutas internas de Next.js
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login'],
}
