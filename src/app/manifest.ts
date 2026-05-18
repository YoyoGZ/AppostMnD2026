import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/?source=pwa',
    name: 'MundiApp26 Liga',
    short_name: 'MundiApp26',
    description: 'La plataforma premium de pronósticos para MundiApp26',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'es-AR',
    dir: 'ltr',
    background_color: '#050505',
    theme_color: '#050505',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
