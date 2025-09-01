'use client';

import { MessageCircle, Play, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VideoTutorialyPage() {
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
          <h1 className="text-4xl font-bold mb-4">🎥 Video tutoriály</h1>
          <p className="text-xl text-muted-foreground">
            Naučte se používat ÚčtoBot pomocí krátkých video návodů
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-8 mb-8 text-center">
          <h2 className="text-2xl font-bold text-purple-800 mb-4">
            🎬 Připravujeme video obsah
          </h2>
          <p className="text-purple-700 mb-6">
            Momentálně natáčíme profesionální video tutoriály, které vám pomohou 
            rychle se naučit všechny funkce ÚčtoBot. Budou k dispozici velmi brzy!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl border p-8">
            <div className="flex items-center mb-6">
              <div className="bg-red-100 rounded-full p-3 mr-4">
                <Play className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Úvod do ÚčtoBot</h2>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>5 minut</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-200 rounded-lg h-48 flex items-center justify-center mb-4">
              <div className="text-center">
                <Play className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Video se připravuje</p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Kompletní přehled všech funkcí ÚčtoBot - od registrace po export dat pro účetního.
            </p>
            
            <Button disabled className="w-full" variant="outline">
              🎬 Připravuje se
            </Button>
          </div>

          <div className="bg-white rounded-xl border p-8">
            <div className="flex items-center mb-6">
              <div className="bg-green-100 rounded-full p-3 mr-4">
                <Play className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Nastavení WhatsApp</h2>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>3 minuty</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-200 rounded-lg h-48 flex items-center justify-center mb-4">
              <div className="text-center">
                <Play className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Video se připravuje</p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Krok za krokem jak nastavit ÚčtoBot ve vašem WhatsApp a ověřit správné fungování.
            </p>
            
            <Button disabled className="w-full" variant="outline">
              🎬 Připravuje se
            </Button>
          </div>

          <div className="bg-white rounded-xl border p-8">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 rounded-full p-3 mr-4">
                <Play className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Práce s účtenkami</h2>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>4 minuty</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-200 rounded-lg h-48 flex items-center justify-center mb-4">
              <div className="text-center">
                <Play className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Video se připravuje</p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Jak správně fotit účtenky, posílat je do WhatsApp a kontrolovat zpracované údaje.
            </p>
            
            <Button disabled className="w-full" variant="outline">
              🎬 Připravuje se
            </Button>
          </div>

          <div className="bg-white rounded-xl border p-8">
            <div className="flex items-center mb-6">
              <div className="bg-orange-100 rounded-full p-3 mr-4">
                <Play className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Export pro účetního</h2>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>3 minuty</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-200 rounded-lg h-48 flex items-center justify-center mb-4">
              <div className="text-center">
                <Play className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Video se připravuje</p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Jak exportovat data ve formátu pro váš účetní program a předávat podklady.
            </p>
            
            <Button disabled className="w-full" variant="outline">
              🎬 Připravuje se
            </Button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 mb-8">
          <div className="flex items-center mb-4">
            <Users className="h-8 w-8 text-yellow-600 mr-4" />
            <h2 className="text-2xl font-bold text-yellow-800">
              📺 Chcete být první, kdo uvidí nová videa?
            </h2>
          </div>
          
          <p className="text-yellow-700 mb-6">
            Přihlaste se k odběru novinek a budeme vás informovat, jakmile budou 
            video tutoriály k dispozici. Navíc získáte přístup k exkluzivnímu obsahu!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => window.location.href = 'mailto:support@uctobot.cz?subject=Zájem o video tutoriály'}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              📧 Přihlásit se k odběru
            </Button>
            <Button
              onClick={() => window.location.href = '/navody'}
              variant="outline"
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            >
              📚 Zatím si přečtěte návody
            </Button>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-green-800 mb-4">
            💡 Mezitím použijte textové návody
          </h2>
          <p className="text-green-700 mb-6">
            Dokud nejsou videa připravena, všechny potřebné informace najdete 
            v našich detailních textových návodech.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => window.location.href = '/navody'}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              📖 Prohlédnout návody
            </Button>
            <Button
              onClick={() => window.location.href = '/napoveda'}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              💬 Nápověda a FAQ
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