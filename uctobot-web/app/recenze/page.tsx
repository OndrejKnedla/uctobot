'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, MessageCircle } from "lucide-react";

export default function RecenzePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Zpět na hlavní stránku
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-8 w-8 text-[#25D366]" />
              <span className="text-xl font-bold">DokladBot</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Ohlasy beta testerů
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Co říkají OSVČ, které testují DokladBot v beta verzi před oficiálním spuštěním
          </p>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#25D366] mb-2">50</div>
              <p className="text-muted-foreground">beta testerů</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#25D366] mb-2">8 hodin</div>
              <p className="text-muted-foreground">ušetřených týdně</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#25D366] mb-2">850</div>
              <p className="text-muted-foreground">testovacích transakcí</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#25D366] mb-2">92%</div>
              <p className="text-muted-foreground">pozitivních ohlasů</p>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-[#25D366]">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar>
                    <AvatarFallback>P</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Pavel</div>
                    <div className="text-sm text-muted-foreground">IT konzultant</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Testuji DokladBot už 3 týdny a jsem nadšený! Beta verze už teď dokáže rozpoznat všechny moje účtenky správně. Konečně můžu účtovat z mobilu."
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-[#25D366] font-semibold">Beta tester od února 2024</div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-[#25D366]">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar>
                    <AvatarFallback>T</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Tereza</div>
                    <div className="text-sm text-muted-foreground">Grafička</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Testuji DokladBot 2 měsíce a už teď vidím potenciál pro výrazné úspory na účetních službách. Beta verze funguje spolehlivě jak na tabletu v kanceláři, tak na mobilu během cest."
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-[#25D366] font-semibold">Beta tester od ledna 2024</div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-[#25D366]">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar>
                    <AvatarFallback>M</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Michal</div>
                    <div className="text-sm text-muted-foreground">Elektrikář</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Účastním se beta testingu už 6 týdnů. DokladBot mi pomáhá organizovat doklady systematicky. Testování probíhá hlavně přes WhatsApp, což je velmi praktické pro práci v terénu."
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-[#25D366] font-semibold">Beta testing od prosince 2023</div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-[#25D366]">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4 mb-4">
                  <Avatar>
                    <AvatarFallback>D</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">David</div>
                    <div className="text-sm text-muted-foreground">Fotograf</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Beta testuji DokladBot už měsíc a oceňujem jednoduchost systému. Stačí poslat foto účtenky a systém se postará o zbytek. Testuji na různých zařízeních - telefon, tablet i PC v ateliéru."
                </p>
                <div className="flex items-center space-x-2">
                  <div className="flex text-yellow-400">
                    {'★'.repeat(5)}
                  </div>
                  <span className="text-sm text-muted-foreground">• Testování na 3 platformách</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-[#25D366]">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4 mb-4">
                  <Avatar>
                    <AvatarFallback>J</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Jana</div>
                    <div className="text-sm text-muted-foreground">Překladatelka</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Testuji DokladBot pro mezinárodní projekty. Beta verze zvládá základní funkcionalitu s měnami. Testování probíhá na PC i tabletu během služebních cest."
                </p>
                <div className="flex items-center space-x-2">
                  <div className="flex text-yellow-400">
                    {'★'.repeat(5)}
                  </div>
                  <span className="text-sm text-muted-foreground">• Beta test měnových funkcí</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-[#25D366]">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4 mb-4">
                  <Avatar>
                    <AvatarFallback>T</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Tomáš</div>
                    <div className="text-sm text-muted-foreground">Truhlář</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Beta testuji DokladBot především pro mobilní použití. Během montáží testuju odesílání fotek přímo z telefonu. Večer kontroluju na PC, jak se data zpracovala. Beta verze je slibná pro mobilní práci."
                </p>
                <div className="flex items-center space-x-2">
                  <div className="text-[#25D366] font-semibold text-sm">Mobile beta testing</div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-[#25D366]">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4 mb-4">
                  <Avatar>
                    <AvatarFallback>K</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Klára</div>
                    <div className="text-sm text-muted-foreground">Marketingová konzultantka</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "V beta testingu zkouším DokladBot pro organizaci výdajů podle projektů. Testuju automatickou kategorizaci a základní reporty. WhatsApp Web testuju na různých počítačích."
                </p>
                <div className="flex items-center space-x-2">
                  <div className="text-[#25D366] font-semibold text-sm">Beta test projektových funkcí</div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-[#25D366]">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4 mb-4">
                  <Avatar>
                    <AvatarFallback>J</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Jakub</div>
                    <div className="text-sm text-muted-foreground">Webdesigner</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Beta testuji DokladBot z pohledu IT profesionála. Oceňuju, že nevyžaduje instalaci dalších aplikací. Testuju kompatibilitu na Linux PC a Android mobilu. Zatím bez problémů."
                </p>
                <div className="flex items-center space-x-2">
                  <div className="text-[#25D366] font-semibold text-sm">Multi-platform beta test</div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-[#25D366]">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4 mb-4">
                  <Avatar>
                    <AvatarFallback>P</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Petra</div>
                    <div className="text-sm text-muted-foreground">Fyzioterapeutka</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Beta testuji DokladBot pro potřeby zdravotnické praxe. Zkouším funkcionalitu na tabletu v ordinaci a přes WhatsApp Web. Večer na telefonu kontroluju, jak probíhá synchronizace dat."
                </p>
                <div className="flex items-center space-x-2">
                  <div className="text-[#25D366] font-semibold text-sm">Beta test pro zdravotníky</div>
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
            Staňte se dalším spokojeným klientem
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Připojte se k beta testování a pomozte nám vytvořit nejlepší účetní řešení pro OSVČ
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
    </div>
  );
}