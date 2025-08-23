import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

export const metadata: Metadata = {
  title: "ÚčtoBot - Profesionální účetnictví přes WhatsApp | 299 Kč/měsíc",
  description:
    'Profesionální účetnictví přímo ve WhatsAppu. Stačí napsat "koupil jsem papír za 500". AI kategorizace, připomínky na DPH, měsíční přehledy. Již od 299 Kč/měsíc.',
  generator: "v0.app",
  keywords: "účetnictví, OSVČ, WhatsApp, daně, účetní software, AI asistent",
  authors: [{ name: "ÚčtoBot" }],
  openGraph: {
    title: "ÚčtoBot - Účetnictví pro OSVČ přes WhatsApp",
    description: "Profesionální účetnictví přímo ve WhatsAppu. AI kategorizace, připomínky na DPH, měsíční přehledy. Již od 299 Kč/měsíc.",
    type: "website",
    locale: "cs_CZ",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="cs">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
