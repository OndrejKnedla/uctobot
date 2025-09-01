import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DokladBot - Profesionální účetnictví přes WhatsApp',
    short_name: 'DokladBot',
    description: 'Profesionální účetnictví přímo ve WhatsAppu. 7 dní zdarma! AI kategorizace, připomínky na DPH, měsíční přehledy.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#25D366',
    categories: ['business', 'finance', 'productivity'],
    lang: 'cs',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      }
    ],
  }
}