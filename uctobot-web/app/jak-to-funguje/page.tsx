'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft, Smartphone, Tablet, Monitor, MessageCircle, Bot, TrendingUp } from "lucide-react";
import Layout from '@/components/layout/Layout';

export default function JakToFungujePage() {
  return (
    <Layout >
      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Jak DokladBot funguje na všech zařízeních
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Detailní průvodce používáním DokladBotu na mobilu, tabletu i počítači
          </p>
        </div>
      </section>

      {/* Multi-Platform Guide */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              WhatsApp funguje všude
            </h2>
            <p className="text-xl text-muted-foreground">
              Používejte DokladBot kdekoliv - v kanceláři na PC, doma na tabletu, nebo cestou na mobilu
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 mb-16">
            {/* Desktop */}
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Monitor className="h-12 w-12 text-blue-600" />
                </div>
                <Badge className="absolute -top-2 -right-2 bg-green-500">Nejpohodlnější</Badge>
              </div>
              <h3 className="text-xl font-bold mb-3">WhatsApp Web na PC</h3>
              <p className="text-muted-foreground mb-4">
                Velká obrazovka, pohodlné psaní na klávesnici. Ideální pro práci v kanceláři nebo doma.
              </p>
              <ul className="text-sm text-left space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Rychlé psaní na klávesnici</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Velká obrazovka pro přehledy</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Drag & drop pro soubory</span>
                </li>
              </ul>
            </div>

            {/* Tablet */}
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Tablet className="h-12 w-12 text-purple-600" />
                </div>
                <Badge className="absolute -top-2 -right-2 bg-blue-500">Univerzální</Badge>
              </div>
              <h3 className="text-xl font-bold mb-3">Tablet</h3>
              <p className="text-muted-foreground mb-4">
                Kombinace pohodlí počítače s mobilitou telefonu. Perfekt pro práci z domu.
              </p>
              <ul className="text-sm text-left space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Větší obrazovka než mobil</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Dotykové ovládání</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Přenosnost</span>
                </li>
              </ul>
            </div>

            {/* Mobile */}
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Smartphone className="h-12 w-12 text-green-600" />
                </div>
                <Badge className="absolute -top-2 -right-2 bg-orange-500">Nejrychlejší</Badge>
              </div>
              <h3 className="text-xl font-bold mb-3">Mobil</h3>
              <p className="text-muted-foreground mb-4">
                Vždycky po ruce. Vyfotíte účtenku a hned ji pošlete. Účetnictví skutečně za 5 vteřin.
              </p>
              <ul className="text-sm text-left space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Vždycky s sebou</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Okamžité fotografie</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Push notifikace</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Real scenarios */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-center mb-8">Reálné scénáře použití</h3>
            <div className="grid md:grid-cols-3 gap-8 text-sm">
              <div className="text-center">
                <div className="text-2xl mb-3">🏢</div>
                <h4 className="font-semibold mb-2">V kanceláři</h4>
                <p className="text-muted-foreground">
                  "Otevřu WhatsApp Web v prohlížeči a během práce zadávám všechny výdaje. Na konci dne mám účetnictví hotové."
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-3">🏠</div>
                <h4 className="font-semibold mb-2">Doma na tabletu</h4>
                <p className="text-muted-foreground">
                  "Večer si prohlédnu přehledy na tabletu u kávy. Pohodlně zkontroluju měsíční výsledky a pošlu dotaz botovi."
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-3">🚗</div>
                <h4 className="font-semibold mb-2">Cestou na mobilu</h4>
                <p className="text-muted-foreground">
                  "Po tankování benzínu hned pošlu účtenku z mobilu. Za 5 vteřin je zařazená a můžu zapomenout."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step by Step Guide */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Krok za krokem</h2>
            <p className="text-xl text-muted-foreground">Jak začít používat DokladBot za 5 minut</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-[#25D366]" />
                </div>
                <CardTitle>1. Napište z jakéhokoliv zařízení</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Z mobilu, tabletu nebo PC - pošlete fotku nebo napište text</p>
                <div className="bg-muted rounded-lg p-3 text-sm mb-4">"Koupil jsem notebook za 25000"</div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Smartphone className="h-3 w-3" />
                  <Tablet className="h-3 w-3" />  
                  <Monitor className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="h-8 w-8 text-[#25D366]" />
                </div>
                <CardTitle>2. Bot vše zpracuje</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">AI rozpozná částku, kategorii a uloží</p>
                <div className="bg-muted rounded-lg p-3 text-sm">
                  ✅ Kategorie: IT vybavení
                  <br />💰 Částka: 25 000 Kč
                </div>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-[#25D366]" />
                </div>
                <CardTitle>3. Máte hotovo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Konec roku? Daňové přiznání máte připravené</p>
                <div className="bg-muted rounded-lg p-3 text-sm">
                  📊 Přehled připraven
                  <br />📄 Export pro účetní
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#25D366]/10 to-[#075E54]/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Připraveni začít?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Vyzkoušejte DokladBot zdarma na jakémkoliv zařízení
          </p>
          <Button 
            size="lg" 
            className="bg-[#25D366] hover:bg-[#128C7E] text-white text-lg px-8 py-6 font-semibold"
            onClick={() => window.location.href = '/'}
          >
            VYZKOUŠET ZDARMA
          </Button>
        </div>
      </section>
    </Layout>
  );
}