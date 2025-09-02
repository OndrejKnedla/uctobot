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
  
  console.log('CookieBot ID:', cookiebotId);
  
  return (
    <html lang="cs" className={`${GeistSans.variable} ${GeistMono.variable}`}>
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
            // Force Czech language for CookieBot
            window.addEventListener('CookiebotOnLoad', function() {
              if (window.Cookiebot) {
                window.Cookiebot.renew();
                // Set language to Czech
                if (window.Cookiebot.dialog && window.Cookiebot.dialog.language) {
                  window.Cookiebot.dialog.language = 'cs';
                }
              }
            });
            
            // Alternative method - set before CookieBot loads
            window.CookieScript = window.CookieScript || {};
            window.CookieScript.lang = 'cs';
          `
        }} />
        <style dangerouslySetInnerHTML={{
          __html: `
            /* CookieBot custom DokladBot green styling */
            #CybotCookiebotDialog {
              background: #ffffff !important;
              border: 2px solid #25D366 !important;
              border-radius: 12px !important;
              box-shadow: 0 8px 32px rgba(37, 211, 102, 0.2) !important;
            }
            
            #CybotCookiebotDialogBodyContent {
              color: #1a1a1a !important;
            }
            
            /* Blue buttons - change to green */
            button[style*="background-color: rgb(24, 119, 242)"],
            button[style*="background: rgb(24, 119, 242)"],
            .CybotCookiebotDialogBodyButton[style*="background-color: rgb(24, 119, 242)"],
            .CybotCookiebotDialogBodyButton[style*="background: rgb(24, 119, 242)"] {
              background: #25D366 !important;
              background-color: #25D366 !important;
              color: white !important;
              border: none !important;
              border-radius: 8px !important;
              padding: 12px 24px !important;
              font-weight: 600 !important;
              transition: all 0.2s ease !important;
            }
            
            button[style*="background-color: rgb(24, 119, 242)"]:hover,
            button[style*="background: rgb(24, 119, 242)"]:hover,
            .CybotCookiebotDialogBodyButton[style*="background-color: rgb(24, 119, 242)"]:hover,
            .CybotCookiebotDialogBodyButton[style*="background: rgb(24, 119, 242)"]:hover {
              background: #128C7E !important;
              background-color: #128C7E !important;
              transform: translateY(-1px) !important;
            }
            
            /* Accept all button - WhatsApp green */
            #CybotCookiebotDialogBodyButtonAccept,
            .CybotCookiebotDialogBodyButtonAccept {
              background: #25D366 !important;
              background-color: #25D366 !important;
              color: white !important;
              border: none !important;
              border-radius: 8px !important;
              padding: 12px 24px !important;
              font-weight: 600 !important;
              transition: all 0.2s ease !important;
            }
            
            #CybotCookiebotDialogBodyButtonAccept:hover,
            .CybotCookiebotDialogBodyButtonAccept:hover {
              background: #128C7E !important;
              background-color: #128C7E !important;
              transform: translateY(-1px) !important;
            }
            
            /* "Zezwól na wybór" and similar buttons */
            button[onclick*="allowSelection"],
            button[onclick*="CookieConsent"],
            .CybotCookiebotDialogBodyButton {
              background: #25D366 !important;
              background-color: #25D366 !important;
              color: white !important;
              border: none !important;
              border-radius: 8px !important;
              font-weight: 600 !important;
            }
            
            button[onclick*="allowSelection"]:hover,
            button[onclick*="CookieConsent"]:hover,
            .CybotCookiebotDialogBodyButton:hover {
              background: #128C7E !important;
              background-color: #128C7E !important;
            }
            
            /* Decline button - subtle gray */
            #CybotCookiebotDialogBodyButtonDecline,
            .CybotCookiebotDialogBodyButtonDecline {
              background: #f8f9fa !important;
              background-color: #f8f9fa !important;
              color: #6c757d !important;
              border: 1px solid #dee2e6 !important;
              border-radius: 8px !important;
              padding: 12px 24px !important;
              font-weight: 500 !important;
            }
            
            #CybotCookiebotDialogBodyButtonDecline:hover,
            .CybotCookiebotDialogBodyButtonDecline:hover {
              background: #e9ecef !important;
              background-color: #e9ecef !important;
              color: #495057 !important;
            }
            
            /* Dialog title */
            #CybotCookiebotDialogBodyContentTitle {
              color: #25D366 !important;
              font-weight: 700 !important;
              font-size: 18px !important;
            }
            
            /* Tab styling */
            .CybotCookiebotDialogTab,
            .CybotCookiebotDialogTabSelected {
              border-bottom: 2px solid #25D366 !important;
              color: #25D366 !important;
            }
            
            /* Toggle switches */
            .CybotCookiebotDialogBodyLevelButton input[type="checkbox"]:checked + .CybotCookiebotDialogBodyLevelButtonSlider {
              background-color: #25D366 !important;
            }
            
            /* Override any blue colors globally in CookieBot */
            #CybotCookiebotDialog * {
              color: inherit !important;
            }
            
            #CybotCookiebotDialog button {
              background: #25D366 !important;
              background-color: #25D366 !important;
              border-color: #25D366 !important;
            }
          `
        }} />
      </head>
      <body className={GeistSans.className}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
