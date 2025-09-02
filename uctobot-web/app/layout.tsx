import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

export const metadata: Metadata = {
  title: "DokladBot - Profesionální účetnictví přes WhatsApp | 7 dní zdarma",
  description:
    'Profesionální účetnictví přes WhatsApp. 7 dní zdarma! AI kategorizace, DPH připomínky, měsíční přehledy. Stačí napsat výdaj, zbytek za vás. 199 Kč/měsíc.',
  keywords: [
    'účetnictví OSVČ',
    'WhatsApp účetnictví',
    'AI účetní asistent',
    'automatické účetnictví',
    'účetní software',
    'DPH připomínky',
    'daňové přiznání',
    'účetní evidence',
    'podnikatelské účetnictví',
    'digitální účetnictví',
    'online účetnictví',
    'chytrý účetní',
    '7 dní zdarma',
    '199 kč měsíčně',
    'zakladatelská cena'
  ].join(', '),
  authors: [{ name: "DokladBot Team", url: "https://dokladbot.cz" }],
  creator: "DokladBot",
  publisher: "DokladBot",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  metadataBase: new URL('https://dokladbot.cz'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'cs_CZ',
    url: 'https://dokladbot.cz',
    siteName: 'DokladBot',
    title: "DokladBot - Profesionální účetnictví přes WhatsApp | 7 dní zdarma",
    description: 'Profesionální účetnictví přes WhatsApp. 7 dní zdarma! AI kategorizace, DPH připomínky, měsíční přehledy. Stačí napsat výdaj, zbytek za vás. 199 Kč/měsíc.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'DokladBot - Profesionální účetnictví přes WhatsApp'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@dokladbot',
    creator: '@dokladbot',
    title: "DokladBot - Profesionální účetnictví přes WhatsApp | 7 dní zdarma",
    description: 'Profesionální účetnictví přímo ve WhatsAppu. 7 dní zdarma! AI kategorizace, připomínky na DPH, měsíční přehledy. Již od 199 Kč/měsíc.',
    images: ['/og-image.jpg'],
  },
  verification: {
    google: 'your-google-site-verification-code',
  },
  category: 'business',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookiebotId = process.env.NEXT_PUBLIC_COOKIEBOT_DOMAIN_GROUP_ID;
  
  return (
    <html lang="cs" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        {cookiebotId && (
          <script 
            id="Cookiebot" 
            src="https://consent.cookiebot.com/uc.js" 
            data-cbid={cookiebotId}
            data-blockingmode="auto"
            type="text/javascript"
          />
        )}
      </head>
      <body className={GeistSans.className}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
