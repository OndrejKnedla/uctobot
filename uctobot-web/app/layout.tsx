import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

export const metadata: Metadata = {
  title: "DokladBot - Profesionální účetnictví přes WhatsApp | 7 dní zdarma",
  description:
    'Profesionální účetnictví přes WhatsApp. 7 dní zdarma! AI kategorizace, DPH připomínky, měsíční přehledy. Stačí napsat výdaj, zbytek za vás. 199 Kč/měsíc.',
  keywords: [
    'dokladbot',
    'DokladBot',
    'doklad bot',
    'Doklad Bot',
    'účtobot',
    'ÚčtoBot',
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
      },
      {
        url: '/logo-dokladbot.png',
        width: 400,
        height: 400,
        alt: 'DokladBot Logo'
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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon', sizes: '32x32', type: 'image/png' },
      { url: '/icon?size=16', sizes: '16x16', type: 'image/png' },
      { url: '/icon?size=192', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookiebotId = process.env.NEXT_PUBLIC_COOKIEBOT_DOMAIN_GROUP_ID;
  
  console.log('CookieBot ID:', cookiebotId);
  
  return (
    <html lang="cs">
      <head>
        <script 
          id="Cookiebot" 
          src="https://consent.cookiebot.com/uc.js?culture=cs" 
          data-cbid="2f9a443f-1ad7-4e38-b9f3-7354ba0f7a6c"
          data-blockingmode="auto"
          data-culture="cs"
          data-language="cs"
          type="text/javascript"
        />
        <script dangerouslySetInnerHTML={{
          __html: `
            // CookieBot event handlers
            window.addEventListener('CookiebotOnLoad', function() {
              console.log('CookieBot loaded');
            });
            
            window.addEventListener('CookiebotOnAccept', function() {
              console.log('CookieBot accepted');
              // Hide the dialog after acceptance
              var dialog = document.getElementById('CybotCookiebotDialog');
              if (dialog) {
                dialog.style.display = 'none';
              }
            });
            
            window.addEventListener('CookiebotOnDecline', function() {
              console.log('CookieBot declined');
              // Hide the dialog after decline
              var dialog = document.getElementById('CybotCookiebotDialog');
              if (dialog) {
                dialog.style.display = 'none';
              }
            });
          `
        }} />
        <style dangerouslySetInnerHTML={{
          __html: `
            /* CookieBot - změna modré na zelenou DokladBot barvu */
            #CybotCookiebotDialog button,
            #CybotCookiebotDialog a {
              background-color: #25D366 !important;
              border-color: #25D366 !important;
            }
            
            #CybotCookiebotDialog button:hover,
            #CybotCookiebotDialog a:hover {
              background-color: #128C7E !important;
              border-color: #128C7E !important;
            }
            
            /* Toggle switches */
            #CybotCookiebotDialog input[type="checkbox"]:checked + .CybotCookiebotDialogBodyLevelButtonSlider {
              background-color: #25D366 !important;
            }
            
            /* Active tabs */
            #CybotCookiebotDialog .CybotCookiebotDialogDetailBodyContentTabsItem[aria-selected="true"] {
              background-color: #25D366 !important;
              border-color: #25D366 !important;
            }
            
            /* Links and active elements */
            #CybotCookiebotDialog a[style*="color"] {
              color: #25D366 !important;
            }
            
            /* Hide CookieBot logo/branding */
            #CybotCookiebotDialogPoweredbyLink,
            .CybotCookiebotDialogPoweredBy,
            a[href*="cookiebot"],
            img[src*="cookiebot"],
            [class*="cookiebot"][class*="logo"],
            #CybotCookiebotDialog [style*="cookiebot"] {
              display: none !important;
            }
          `
        }} />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
