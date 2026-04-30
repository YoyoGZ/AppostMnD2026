import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware de Supabase: Refresca la sesión y protege rutas.
 * Actúa como aduana perimetral del sistema.
 */
export async function updateSession(request: NextRequest) {
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

  // Refrescar sesión (CRÍTICO: no usar getSession(), usar getUser() para seguridad real)
  const { data: { user } } = await supabase.auth.getUser()

  // --- LÓGICA DE PRIORIDAD: INVITACIONES ---
  const inviteCode = request.nextUrl.searchParams.get('invite')

  // 1. Si hay invitación y el usuario ya está logueado, pero NO está en la landing
  // lo mandamos a la landing para que vea la tarjeta de invitación (Priority Control)
  if (inviteCode && user && request.nextUrl.pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('invite', inviteCode)
    return NextResponse.redirect(url)
  }

  // 2. Rutas protegidas: todo lo que no sea la landing de login o onboarding
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/matches') ||
    request.nextUrl.pathname.startsWith('/standings') ||
    request.nextUrl.pathname.startsWith('/profile') ||
    request.nextUrl.pathname.startsWith('/settings')

  // Sin sesión + ruta protegida → expulsar al login (preservando invitación)
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    if (inviteCode) url.searchParams.set('invite', inviteCode)
    return NextResponse.redirect(url)
  }

  // Con sesión + en login → redirigir al dashboard (A MENOS que traiga una invitación)
  // 2. Con sesión + en login → redirigir al dashboard (A MENOS que traiga una invitación)
  if (user && request.nextUrl.pathname === '/' && !inviteCode) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // 3. Interceptor de Membresía: ¿Tiene liga? (Solo para rutas protegidas, excepto onboarding)
  if (user && isProtectedRoute && request.nextUrl.pathname !== '/onboarding') {
    const { data: membership } = await supabase
      .from('league_members')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      if (inviteCode) url.searchParams.set('invite', inviteCode)
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
