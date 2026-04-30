import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

/**
 * Proxy global de Next.js.
 * Intercepta TODAS las requests y delega la lógica de sesión a Supabase.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Interceptar todas las rutas EXCEPTO:
     * - _next/static (assets estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (ícono del navegador)
     * - Archivos de assets públicos (imágenes, SVGs, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
