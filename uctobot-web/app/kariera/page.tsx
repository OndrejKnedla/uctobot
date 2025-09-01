'use client';

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function KarieraPage() {
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
          <h1 className="text-4xl font-bold mb-4">Kariéra v ÚčtoBot</h1>
          <p className="text-xl text-muted-foreground">
            Připojte se k našemu týmu a pomozte revoluci v účetnictví
          </p>
        </div>

        <div className="bg-white rounded-xl border p-8 mb-8">
          <div className="text-center">
            <div className="text-6xl mb-6">💼</div>
            <h2 className="text-2xl font-bold mb-4">Momentálně nejsou otevřené žádné pozice</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Aktuálně nehledáme nové kolegy, ale to se může rychle změnit. 
              Pokud máte zájem o práci v ÚčtoBot, neváhejte nás kontaktovat!
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-green-800 mb-2">
                📧 Spontánní žádosti vítáme
              </h3>
              <p className="text-green-700">
                Pokud si myslíte, že byste mohli být přínosem pro náš tým, 
                pošlete nám svůj CV a motivační dopis na:
              </p>
              <a 
                href="mailto:info@dokladbot.cz" 
                className="font-semibold text-green-600 hover:text-green-700"
              >
                info@dokladbot.cz
              </a>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="text-left">
                <h3 className="font-semibold mb-2">🚀 Co nabízíme</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Práci na inovativním produktu</li>
                  <li>• Flexibilní pracovní dobu</li>
                  <li>• Možnost home office</li>
                  <li>• Profesní rozvoj</li>
                  <li>• Mladý a dynamický tým</li>
                </ul>
              </div>
              
              <div className="text-left">
                <h3 className="font-semibold mb-2">🔍 Co obvykle hledáme</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Frontend/Backend vývojáře</li>
                  <li>• UI/UX designéry</li>
                  <li>• Product managery</li>
                  <li>• Marketing specialisty</li>
                  <li>• Účetní konzultanty</li>
                </ul>
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
    </div>
  );
}