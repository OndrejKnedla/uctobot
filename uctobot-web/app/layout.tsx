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
            // CookieBot event handlers and styling
            function applyDokladBotStyles() {
              const style = document.createElement('style');
              style.innerHTML = \`
                /* Force DokladBot green styling with highest specificity */
                #CybotCookiebotDialog *[style*="rgb(24, 119, 242)"] { background: #25D366 !important; background-color: #25D366 !important; }
                #CybotCookiebotDialog *[style*="rgb(68, 130, 247)"] { background: #25D366 !important; background-color: #25D366 !important; }
                #CybotCookiebotDialog *[style*="rgb(66, 133, 244)"] { background: #25D366 !important; background-color: #25D366 !important; }
                
                /* All possible buttons */
                #CybotCookiebotDialog button:not([id*="Decline"]):not([class*="decline"]),
                #CybotCookiebotDialog a:not([id*="Decline"]):not([class*="decline"]) {
                  background: #25D366 !important;
                  background-color: #25D366 !important;
                  color: white !important;
                  border: none !important;
                }
                
                /* Toggle switches */
                #CybotCookiebotDialog input[type="checkbox"]:checked + * {
                  background-color: #25D366 !important;
                }
                
                /* Tab active states */
                #CybotCookiebotDialog .CybotCookiebotDialogDetailBodyContentTabsItem[class*="active"],
                #CybotCookiebotDialog .CybotCookiebotDialogDetailBodyContentTabsItem[aria-selected="true"] {
                  background: #25D366 !important;
                  border-color: #25D366 !important;
                }
              \`;
              document.head.appendChild(style);
              
              // Force style all blue elements
              const blueElements = document.querySelectorAll('#CybotCookiebotDialog *[style*="rgb(24, 119, 242)"], #CybotCookiebotDialog *[style*="rgb(68, 130, 247)"], #CybotCookiebotDialog *[style*="rgb(66, 133, 244)"]');
              blueElements.forEach(el => {
                el.style.setProperty('background', '#25D366', 'important');
                el.style.setProperty('background-color', '#25D366', 'important');
                el.style.setProperty('border-color', '#25D366', 'important');
              });
            }
            
            window.addEventListener('CookiebotOnLoad', function() {
              console.log('CookieBot loaded');
              setTimeout(applyDokladBotStyles, 100);
              // Keep applying styles every 500ms for 5 seconds
              let attempts = 0;
              const styleInterval = setInterval(() => {
                applyDokladBotStyles();
                attempts++;
                if (attempts >= 10) clearInterval(styleInterval);
              }, 500);
            });
            
            // Apply styles when dialog shows
            const observer = new MutationObserver(() => {
              const dialog = document.getElementById('CybotCookiebotDialog');
              if (dialog && dialog.style.display !== 'none') {
                setTimeout(applyDokladBotStyles, 50);
              }
            });
            
            document.addEventListener('DOMContentLoaded', () => {
              observer.observe(document.body, { 
                childList: true, 
                subtree: true, 
                attributes: true,
                attributeFilter: ['style']
              });
            });
            
            window.addEventListener('CookiebotOnAccept', function() {
              console.log('CookieBot accepted');
              var dialog = document.getElementById('CybotCookiebotDialog');
              if (dialog) {
                dialog.style.display = 'none';
              }
            });
            
            window.addEventListener('CookiebotOnDecline', function() {
              console.log('CookieBot declined');
              var dialog = document.getElementById('CybotCookiebotDialog');
              if (dialog) {
                dialog.style.display = 'none';
              }
            });
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
              transition: opacity 0.3s ease !important;
            }
            
            /* Hide dialog when accepted */
            #CybotCookiebotDialog.CybotCookiebotDialogActive[style*="display: none"] {
              display: none !important;
            }
            
            /* Hide dialog overlay when not needed */
            .CybotCookiebotDialogBodyUnderlay[style*="display: none"] {
              display: none !important;
            }
            
            #CybotCookiebotDialogBodyContent {
              color: #1a1a1a !important;
            }
            
            /* All buttons - force green color */
            #CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll,
            #CybotCookiebotDialogBodyLevelButtonLevelOptinAllowallSelection,
            #CybotCookiebotDialogBodyLevelButtonLevelOptinDeclineAll,
            #CybotCookiebotDialogBodyButtonAccept,
            a#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll,
            a#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowallSelection,
            button#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll,
            button#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowallSelection,
            .CybotCookiebotDialogBodyButton,
            .CybotCookiebotDialogBodyLevelButton,
            [id*="CybotCookiebotDialogBodyLevelButton"] {
              background: #25D366 !important;
              background-color: #25D366 !important;
              color: white !important;
              border: none !important;
              border-radius: 8px !important;
              padding: 12px 24px !important;
              font-weight: 600 !important;
              transition: all 0.2s ease !important;
              text-decoration: none !important;
            }
            
            /* Secondary buttons - outline style */
            #CybotCookiebotDialogBodyButtonDecline,
            button#CybotCookiebotDialogBodyLevelButtonLevelOptinDeclineAll {
              background: transparent !important;
              background-color: transparent !important;
              color: #25D366 !important;
              border: 2px solid #25D366 !important;
            }
            
            /* Hover states */
            #CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll:hover,
            #CybotCookiebotDialogBodyLevelButtonLevelOptinAllowallSelection:hover,
            #CybotCookiebotDialogBodyButtonAccept:hover,
            .CybotCookiebotDialogBodyButton:hover,
            .CybotCookiebotDialogBodyLevelButton:hover,
            [id*="CybotCookiebotDialogBodyLevelButton"]:hover {
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
            
            /* Toggle switches - green when active */
            .CybotCookiebotDialogBodyLevelButtonSliderWrapper .CybotCookiebotDialogBodyLevelButtonSlider {
              background-color: #25D366 !important;
            }
            
            .CybotCookiebotDialogBodyLevelButtonSliderWrapper input:checked + .CybotCookiebotDialogBodyLevelButtonSlider {
              background-color: #25D366 !important;
            }
            
            /* Detail view buttons - force green */
            button[style*="rgb(68, 130, 247)"],
            button[style*="rgb(24, 119, 242)"],
            .CybotCookiebotDialogDetailBodyContentTab,
            .CybotCookiebotDialogDetailBodyContentTabsItem {
              background: #25D366 !important;
              background-color: #25D366 !important;
              border-color: #25D366 !important;
            }
            
            /* Bottom buttons - all green */
            .CybotCookiebotDialogBodyEdgeMoreDetailsButton,
            .CybotCookiebotDialogBodyLevelButtonWrapper button,
            .CybotCookiebotDialogBodyLevelButtonWrapper a {
              background: #25D366 !important;
              background-color: #25D366 !important;
              color: white !important;
              border: none !important;
              border-radius: 8px !important;
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
