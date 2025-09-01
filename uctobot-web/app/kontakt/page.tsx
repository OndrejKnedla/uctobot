'use client';

import { MessageCircle, Mail, Phone, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function KontaktPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-2"
            >
              <MessageCircle className="h-8 w-8 text-[#25D366]" />
              <span className="text-xl font-bold">DokladBot</span>
            </button>

            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="hidden md:flex"
            >
              Zpět na hlavní stránku
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Kontakt</h1>
          <p className="text-xl text-muted-foreground">
            Potřebujete pomoc nebo máte dotazy? Rádi vám pomůžeme!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl border p-8">
            <h2 className="text-2xl font-bold mb-6">📞 Kontaktní údaje</h2>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Mail className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold">Email podpora</h3>
                  <a 
                    href="mailto:info@dokladbot.cz" 
                    className="text-green-600 hover:text-green-700"
                  >
                    info@dokladbot.cz
                  </a>
                </div>
              </div>
              
              
              <div className="flex items-center space-x-4">
                <Clock className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold">Pracovní doba</h3>
                  <p className="text-muted-foreground">Po-Pá 9:00-17:00</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <MapPin className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold">Sídlo</h3>
                  <p className="text-muted-foreground">
                    Praha, Česká republika<br/>
                    IČ: 12345678
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-8">
            <h2 className="text-2xl font-bold mb-6">💬 Specializované kontakty</h2>
            
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">
                  🏢 Pro účetní firmy
                </h3>
                <a 
                  href="mailto:info@dokladbot.cz" 
                  className="text-green-600 hover:text-green-700"
                >
                  info@dokladbot.cz
                </a>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">
                  🤝 Partnerství
                </h3>
                <a 
                  href="mailto:info@dokladbot.cz" 
                  className="text-blue-600 hover:text-blue-700"
                >
                  info@dokladbot.cz
                </a>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800 mb-2">
                  💼 Kariéra
                </h3>
                <a 
                  href="mailto:info@dokladbot.cz" 
                  className="text-purple-600 hover:text-purple-700"
                >
                  info@dokladbot.cz
                </a>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-800 mb-2">
                  🔧 API podpora
                </h3>
                <a 
                  href="mailto:info@dokladbot.cz" 
                  className="text-orange-600 hover:text-orange-700"
                >
                  info@dokladbot.cz
                </a>
                <p className="text-sm text-orange-600 mt-1">(v přípravě)</p>
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
    </div>
  );
}