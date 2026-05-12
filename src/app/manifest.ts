import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mundial 2026 Liga',
    short_name: 'Mundial 26',
    description: 'La plataforma premium de pronósticos para el Mundial 2026',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#050505',
    icons: [
      {
        src: '/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: 'https://placehold.co/192x192/050505/FCD34D/png?text=M26',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://placehold.co/512x512/050505/FCD34D/png?text=Mundial+2026',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
