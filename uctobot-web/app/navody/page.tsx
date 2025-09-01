'use client';

import { MessageCircle, Smartphone, Camera, FileText, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NavodyPage() {
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
              <span className="text-xl font-bold">ÚčtoBot</span>
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
          <h1 className="text-4xl font-bold mb-4">Návody pro ÚčtoBot</h1>
          <p className="text-xl text-muted-foreground">
            Krok za krokem k automatizaci vašeho účetnictví
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-8 mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-800 mb-6">🚀 Rychlý start za 5 minut</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border-2 border-green-200">
                  <span className="text-2xl font-bold text-green-600">1</span>
                </div>
                <h3 className="font-semibold text-green-800 mb-2">Zaplaťte</h3>
                <p className="text-sm text-green-700">Vyberte si plán a proveďte platbu</p>
              </div>
              
              <div className="text-center">
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border-2 border-green-200">
                  <span className="text-2xl font-bold text-green-600">2</span>
                </div>
                <h3 className="font-semibold text-green-800 mb-2">Nastavte</h3>
                <p className="text-sm text-green-700">Přidejte náš kontakt do WhatsApp</p>
              </div>
              
              <div className="text-center">
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border-2 border-green-200">
                  <span className="text-2xl font-bold text-green-600">3</span>
                </div>
                <h3 className="font-semibold text-green-800 mb-2">Ověřte</h3>
                <p className="text-sm text-green-700">Pošlete testovací zprávu</p>
              </div>
              
              <div className="text-center">
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border-2 border-green-200">
                  <span className="text-2xl font-bold text-green-600">4</span>
                </div>
                <h3 className="font-semibold text-green-800 mb-2">Používejte</h3>
                <p className="text-sm text-green-700">Posílejte účtenky a nechte AI pracovat</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-xl border p-8">
            <div className="flex items-center mb-6">
              <Smartphone className="h-8 w-8 text-blue-600 mr-4" />
              <h2 className="text-2xl font-bold">📱 Nastavení WhatsApp</h2>
            </div>
            
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Krok 1: Přidání kontaktu</h3>
                <p className="text-blue-700 mb-3">
                  Po platbě obdržíte email s kontaktem ÚčtoBot. Přidejte si tento kontakt do svého telefonu.
                </p>
                <div className="bg-blue-100 rounded p-3 text-sm text-blue-800">
                  💡 Tip: Pojmenujte kontakt "ÚčtoBot - Účetnictví" pro snadné nalezení
                </div>
              </div>
              
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Krok 2: První zpráva</h3>
                <p className="text-blue-700 mb-3">
                  Otevřete WhatsApp a pošlete zprávu "AHOJ" na číslo ÚčtoBot. Měli byste dostat uvítací zprávu během několika sekund.
                </p>
              </div>
              
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Krok 3: Ověření účtu</h3>
                <p className="text-blue-700">
                  ÚčtoBot vás požádá o základní informace (jméno, IČ). Tyto údaje se použijí pro správné zařazení účtenek.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-8">
            <div className="flex items-center mb-6">
              <Camera className="h-8 w-8 text-purple-600 mr-4" />
              <h2 className="text-2xl font-bold">📸 Fotografování účtenek</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-green-800 mb-4">✅ Správně</h3>
                <ul className="space-y-2 text-sm text-green-700">
                  <li>• Celá účtenka je viditelná</li>
                  <li>• Dobré osvětlení</li>
                  <li>• Ostrý snímek</li>
                  <li>• Rovně natočené</li>
                  <li>• Text je čitelný</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-red-800 mb-4">❌ Špatně</h3>
                <ul className="space-y-2 text-sm text-red-700">
                  <li>• Rozmazané foto</li>
                  <li>• Špatné světlo/stíny</li>
                  <li>• Oříznutá účtenka</li>
                  <li>• Pokrčený papír</li>
                  <li>• Nečitelný text</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-6">
              <h3 className="font-semibold text-purple-800 mb-2">
                💡 Pro tip: Použijte skenování v telefonu
              </h3>
              <p className="text-sm text-purple-700">
                Většina telefonů má vestavěnou funkci skenování dokumentů v aplikaci fotoaparát. 
                Tím získáte nejlepší kvalitu snímku.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-8">
            <div className="flex items-center mb-6">
              <FileText className="h-8 w-8 text-orange-600 mr-4" />
              <h2 className="text-2xl font-bold">📄 Typy účtenek</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">✅ Podporované</h3>
                <ul className="space-y-1 text-sm text-green-700">
                  <li>• Účtenky z obchodů</li>
                  <li>• Faktury</li>
                  <li>• Doklady o službách</li>
                  <li>• Pokladní doklady</li>
                  <li>• Online účtenky (PDF)</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Omezeně</h3>
                <ul className="space-y-1 text-sm text-yellow-700">
                  <li>• Ručně psané účtenky</li>
                  <li>• Velmi staré účtenky</li>
                  <li>• Poškozené doklady</li>
                  <li>• Nestandartní formáty</li>
                </ul>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">❌ Nepodporované</h3>
                <ul className="space-y-1 text-sm text-red-700">
                  <li>• Úplně nečitelné</li>
                  <li>• Bez DPH informací</li>
                  <li>• Cizí jazyky</li>
                  <li>• Neúplné doklady</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-8 mt-8 text-center">
          <Settings className="h-12 w-12 text-orange-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-orange-800 mb-4">
            🔧 Potřebujete pomoc s nastavením?
          </h2>
          <p className="text-orange-700 mb-6">
            Náš tým vám rád pomůže s prvním nastavením. Můžeme vás provést celým procesem krok za krokem.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => window.location.href = 'mailto:info@dokladbot.cz'}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              📧 Napsat na support
            </Button>
            <Button
              onClick={() => window.location.href = '/video-tutorialy'}
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              🎥 Sledovat videa
            </Button>
          </div>
        </div>

        <div className="text-center mt-8">
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