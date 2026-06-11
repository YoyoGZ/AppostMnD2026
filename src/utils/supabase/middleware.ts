import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware de Supabase: Refresca la sesión y protege rutas.
 * Actúa como aduana perimetral del sistema.
 */
export async function updateSession(request: NextRequest) {
  console.log(`🔍 [MIDDLEWARE] Request a: ${request.nextUrl.pathname}${request.nextUrl.search}`);
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
          cookiesToSet.forEach(({ name, value, options }) => {
            const adjustedOptions = { ...options };
            if (process.env.NODE_ENV === 'development') {
              adjustedOptions.secure = false;
              adjustedOptions.sameSite = 'lax';
            }
            supabaseResponse.cookies.set(name, value, adjustedOptions)
          })
        },
      },
    }
  )

  // Refrescar sesión (getUser es seguro)
  const { data: { user } } = await supabase.auth.getUser()

  // --- PROTECCIÓN DE RUTAS ---
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/matches') ||
    request.nextUrl.pathname.startsWith('/standings') ||
    request.nextUrl.pathname.startsWith('/profile') ||
    request.nextUrl.pathname.startsWith('/settings') ||
    request.nextUrl.pathname.startsWith('/hq')

  // 1. Sin sesión + ruta protegida → a la Home (Login)
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // 2. Con sesión + en Home → Solo redirigir si TIENEN liga o son admin
  if (user && request.nextUrl.pathname === '/') {
    const role = user.user_metadata?.role;
    
    if (role === 'super_admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/hq'
      return NextResponse.redirect(url)
    }

    // Verificar si tiene liga
    const { data: membership } = await supabase
      .from('league_members')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (membership) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
    // Si no tiene membresía, no lo redirigimos. Le permitimos ver la Landing Page para que pueda leerla o desloguearse.
  }

  // 3. Verificación de membresía básica (solo para el Dashboard principal)
  if (user && request.nextUrl.pathname.startsWith('/dashboard') && request.nextUrl.pathname !== '/login') {
    const role = user.user_metadata?.role;
    if (role !== 'super_admin') {
      const { data: membership } = await supabase
        .from('league_members')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!membership) {
        // Redirigimos al paywall para resolver el flujo (comprar pass o crear liga)
        // en lugar de mandar a login?mode=register que causa bucles infinitos.
        const url = request.nextUrl.clone()
        url.pathname = '/paywall'
        return NextResponse.redirect(url)
      }
    }
  }

  // 4. Protección del "God Mode" (/hq)
  if (user && request.nextUrl.pathname.startsWith('/hq')) {
    const role = user.user_metadata?.role;
    if (role !== 'super_admin') {
      console.warn(`🛑 [SECURITY] Acceso denegado a /hq para el usuario: ${user.id}`);
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse
}
