"use client";


export const dynamic = "force-dynamic"

import { MessageCircle, Mail, Phone, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';

export default function KontaktPage() {
  return (
    <Layout >
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Kontakt</h1>
          <p className="text-xl text-muted-foreground">
            Potřebujete pomoc nebo máte dotazy? Rádi vám pomůžeme!
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-white rounded-xl border p-8 text-center">
            <h2 className="text-2xl font-bold mb-6">📞 Kontaktní údaje</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-center space-x-4">
                <Mail className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold">Email podpora</h3>
                  <a 
                    href="mailto:info@dokladbot.cz" 
                    className="text-green-600 hover:text-green-700 text-lg"
                  >
                    info@dokladbot.cz
                  </a>
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-4">
                <Clock className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold">Pracovní doba</h3>
                  <p className="text-muted-foreground">Po-Pá 9:00-17:00</p>
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-4">
                <MapPin className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold">Sídlo</h3>
                  <p className="text-muted-foreground">
                    Praha, Česká republika<br/>
                    IČO: 22161104
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-8 mb-8 text-center">
          <h2 className="text-2xl font-bold text-green-800 mb-4">
            💡 Nejrychlejší pomoc přes WhatsApp
          </h2>
          <p className="text-green-700 mb-6">
            Pro existující zákazníky je nejrychlejší způsob kontaktu přímo přes WhatsApp, 
            kde máte už nastavený DokladBot. Odpovídáme obvykle do 30 minut během pracovní doby.
          </p>
          <Button
            onClick={() => window.location.href = '/#jak-funguje'}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Jak nastavit WhatsApp
          </Button>
        </div>

        <div className="text-center">
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
          >
            Zpět na hlavní stránku
          </Button>
        </div>
      </div>
    </Layout>
  );
}