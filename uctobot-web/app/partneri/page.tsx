"use client";


export const dynamic = "force-dynamic"

import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';

export default function PartneriPage() {
  return (
    <Layout >
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Partnerství s ÚčtoBot</h1>
          <p className="text-xl text-muted-foreground">
            Spolupracujte s námi a rozšiřte své služby o moderní účetnictví
          </p>
        </div>

        <div className="bg-white rounded-xl border p-8 mb-8">
          <div className="text-center">
            <div className="text-6xl mb-6">🤝</div>
            <h2 className="text-2xl font-bold mb-6">Hledáme partnery pro spolupráci</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-semibold text-green-800 mb-4">
                  💼 Pro účetní firmy
                </h3>
                <ul className="text-left space-y-2 text-sm text-green-700">
                  <li>• Digitalizace služeb pro klienty</li>
                  <li>• Automatizace rutinních úkolů</li>
                  <li>• Moderní nástroje pro OSVČ</li>
                  <li>• Provizní model spolupráce</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-800 mb-4">
                  🏢 Pro technologické firmy
                </h3>
                <ul className="text-left space-y-2 text-sm text-blue-700">
                  <li>• API integrace</li>
                  <li>• White-label řešení</li>
                  <li>• Společný vývoj funkcí</li>
                  <li>• Technická spolupráce</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-yellow-800 mb-4">
                📧 Kontaktujte nás pro partnerství
              </h3>
              <p className="text-yellow-700 mb-4">
                Máte zájem o spolupráci? Pošlete nám svůj návrh partnerství na:
              </p>
              <div className="space-y-2">
                <div>
                  <a 
                    href="mailto:partneri@dokladbot.cz" 
                    className="font-semibold text-yellow-600 hover:text-yellow-700 text-lg"
                  >
                    partneri@dokladbot.cz
                  </a>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="text-3xl mb-2">📈</div>
                <h4 className="font-semibold mb-1">Růst společně</h4>
                <p className="text-sm text-muted-foreground">
                  Expandujeme rychle a hledáme partnery pro společný růst
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl mb-2">🎯</div>
                <h4 className="font-semibold mb-1">Win-Win přístup</h4>
                <p className="text-sm text-muted-foreground">
                  Vytváříme partnerství, která jsou výhodná pro všechny strany
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl mb-2">🚀</div>
                <h4 className="font-semibold mb-1">Inovace</h4>
                <p className="text-sm text-muted-foreground">
                  Společně budujeme budoucnost účetnictví v Česku
                </p>
              </div>
            </div>
          </div>
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