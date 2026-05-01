import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

/**
 * Proxy global de Next.js.
 * Responsabilidad ÚNICA: refrescar la sesión de Supabase y proteger rutas.
 * La lógica de invitaciones fue migrada a /join/[code] (ruta dedicada).
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
     * - /join/* (flujo de invitación — autónomo, no requiere interceptación)
     * - Archivos de assets públicos (imágenes, SVGs, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|join/|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
