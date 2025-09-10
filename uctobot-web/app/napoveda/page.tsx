"use client";


export const dynamic = "force-dynamic"

import { MessageCircle, Search, Book, Video, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';

export default function NapovedaPage() {
  return (
    <Layout >
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Nápověda a podpora</h1>
          <p className="text-xl text-muted-foreground">
            Vše co potřebujete vědět pro používání ÚčtoBot
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-8 mb-8 text-center">
          <h2 className="text-2xl font-bold text-green-800 mb-4">
            🚀 Rychlý start
          </h2>
          <p className="text-green-700 mb-6">
            Začněte používat ÚčtoBot během 5 minut! Stačí si přečíst naši rychlou příručku.
          </p>
          <Button
            onClick={() => window.location.href = '/navody'}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Prohlédnout návody
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl border p-8">
            <Book className="h-12 w-12 text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold mb-4">📚 Často kladené otázky</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Jak začít s ÚčtoBot?</h3>
                <p className="text-sm text-muted-foreground">
                  Stačí si vybrat ceník, zaplatit a dostanete instrukce pro nastavení WhatsApp.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Kolik stojí služba?</h3>
                <p className="text-sm text-muted-foreground">
                  299 Kč/měsíc nebo 249 Kč/měsíc při ročním placení. Cena navždy!
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Jak funguje AI zpracování?</h3>
                <p className="text-sm text-muted-foreground">
                  Pošlete foto účtenky do WhatsApp a AI automaticky extrahuje všechny údaje.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Mohu službu zrušit?</h3>
                <p className="text-sm text-muted-foreground">
                  Ano, kdykoliv bez výpovědní doby. Stačí nám napsat.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-8">
            <Video className="h-12 w-12 text-purple-600 mb-4" />
            <h2 className="text-2xl font-bold mb-4">🎥 Video tutoriály</h2>
            
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800 mb-2">
                  Úvod do ÚčtoBot (5 min)
                </h3>
                <p className="text-sm text-purple-700 mb-3">
                  Kompletní přehled všech funkcí a možností.
                </p>
                <Button
                  onClick={() => window.location.href = '/video-tutorialy'}
                  variant="outline"
                  size="sm"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  Přehrát video
                </Button>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800 mb-2">
                  Nastavení WhatsApp (3 min)
                </h3>
                <p className="text-sm text-purple-700 mb-3">
                  Krok za krokem jak nastavit ÚčtoBot.
                </p>
                <Button
                  onClick={() => window.location.href = '/video-tutorialy'}
                  variant="outline"
                  size="sm"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  Přehrát video
                </Button>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800 mb-2">
                  Práce s účtenkami (4 min)
                </h3>
                <p className="text-sm text-purple-700 mb-3">
                  Jak správně fotit a odesílat účtenky.
                </p>
                <Button
                  onClick={() => window.location.href = '/video-tutorialy'}
                  variant="outline"
                  size="sm"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  Přehrát video
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-8 mb-8 text-center">
          <Mail className="h-12 w-12 text-orange-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-orange-800 mb-4">
            💌 Potřebujete osobní pomoc?
          </h2>
          <p className="text-orange-700 mb-6">
            Náš tým podpory vám rád pomůže s jakýmkoliv dotazem. 
            Odpovídáme během 24 hodin, často i rychleji.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => window.location.href = 'mailto:info@dokladbot.cz'}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              📧 info@dokladbot.cz
            </Button>
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