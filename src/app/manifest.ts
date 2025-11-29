import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cacao Diseases',
    short_name: 'CacaoApp',
    description: 'Real-time diagnosis of cacao leaf health and diseases.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon-192x192.webp',
        sizes: '192x192',
        type: 'image/webp',
      },
      {
        src: '/icon-512x512.webp',
        sizes: '512x512',
        type: 'image/webp',
      },
    ],
  }
}
