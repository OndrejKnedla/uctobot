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
              <span className="text-xl font-bold">ÚčtoBot</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Recenze našich klientů
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Reální příběhy 500+ spokojených OSVČ, které ušetřily čas a peníze
          </p>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#25D366] mb-2">95%</div>
              <p className="text-muted-foreground">snížení chybovosti</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#25D366] mb-2">12 hodin</div>
              <p className="text-muted-foreground">ušetřených měsíčně</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#25D366] mb-2">23.5k</div>
              <p className="text-muted-foreground">zpracovaných transakcí</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#25D366] mb-2">425</div>
              <p className="text-muted-foreground">aktivních uživatelů</p>
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
                    <AvatarFallback>JN</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Jan Novák</div>
                    <div className="text-sm text-muted-foreground">IT konzultant • Praha</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Za 6 měsíců jsem zpracoval 890 transakcí bez jediné chyby. Dříve mi účetnictví zabralo celý víkend, teď to vyřídím během oběda. Používám na PC i mobilu - synchronizace je perfektní."
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-[#25D366] font-semibold">15 hodin/měsíc → 45 minut</div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-[#25D366]">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar>
                    <AvatarFallback>MS</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Marie Svobodová</div>
                    <div className="text-sm text-muted-foreground">Grafička • Brno</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Letos jsem díky ÚčtoBotu ušetřila 18 500 Kč za účetní. Peníze jsem investovala do nového vybavení a rozšířila podnikání. Bot funguje skvěle na tabletu doma i mobilu venku."
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-[#25D366] font-semibold">3 500 Kč/měsíc → 299 Kč</div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-[#25D366]">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar>
                    <AvatarFallback>PD</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Petr Dvořák</div>
                    <div className="text-sm text-muted-foreground">Elektrikář • Ostrava</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Moje účetní říká, že jsem její nejpřipraveněší klient. Všechno má perfektně zařazené a popsané. DPH přiznání máme hotové za 20 minut. WhatsApp mám v mobilu pořád, takže nic nezapomenu."
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-[#25D366] font-semibold">Bez stresu z termínů</div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-[#25D366]">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4 mb-4">
                  <Avatar>
                    <AvatarFallback>LK</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Lukáš Kratochvíl</div>
                    <div className="text-sm text-muted-foreground">Fotograf • České Budějovice</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Jako kreativec jsem účetnictví nesnášel. Teď prostě pošlu foto účtenky a zapomenu na to. Bot mi dokonce našel 12 000 Kč v odpočtech, které bych přehlédl. Funguje všude - na telefonu, tabletu i počítači v ateliéru."
                </p>
                <div className="flex items-center space-x-2">
                  <div className="flex text-yellow-400">
                    {'★'.repeat(5)}
                  </div>
                  <span className="text-sm text-muted-foreground">• 12 000 Kč ušetřeno na daních</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-[#25D366]">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4 mb-4">
                  <Avatar>
                    <AvatarFallback>ZH</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Zuzana Horáková</div>
                    <div className="text-sm text-muted-foreground">Překladatelka • Plzeň</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Pracuji pro klienty ze zahraničí a ÚčtoBot mi automaticky přepočítává měny podle ČNB kurzů. Už nemám strach z chyb při přepočtech. Používám na PC doma a na tabletu při cestách."
                </p>
                <div className="flex items-center space-x-2">
                  <div className="flex text-yellow-400">
                    {'★'.repeat(5)}
                  </div>
                  <span className="text-sm text-muted-foreground">• 0 chyb při přepočtech měn</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-[#25D366]">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4 mb-4">
                  <Avatar>
                    <AvatarFallback>MV</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Martin Veselý</div>
                    <div className="text-sm text-muted-foreground">Truhlář • Karlovy Vary</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Jsem pořád v dílně nebo na montážích, takže mobil je pro mě klíčový. Když si koupím materiál, hned to pošlu z telefonu. Večer si na PC zkontroluju přehledy. Je super, že to všechno funguje automaticky."
                </p>
                <div className="flex items-center space-x-2">
                  <div className="text-[#25D366] font-semibold text-sm">Mobilita na prvním místě</div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-[#25D366]">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4 mb-4">
                  <Avatar>
                    <AvatarFallback>KS</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Klara Svobodová</div>
                    <div className="text-sm text-muted-foreground">Marketingová konzultantka • Liberec</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Pracuji s různými klienty a potřebuji mít dokonalý přehled o výdajích na každý projekt. ÚčtoBot mi kategorizuje vše automaticky a já vidím okamžité reporty. WhatsApp Web používám na všech počítačích."
                </p>
                <div className="flex items-center space-x-2">
                  <div className="text-[#25D366] font-semibold text-sm">Projektová účetnost vyřešena</div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-[#25D366]">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4 mb-4">
                  <Avatar>
                    <AvatarFallback>TV</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Tomáš Vávra</div>
                    <div className="text-sm text-muted-foreground">Webdesigner • Hradec Králové</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Jako IT person oceňuju, že nepotřebujem instalovat žádné aplikace. WhatsApp mám už všude a ÚčtoBot prostě funguje. Používám Linux na PC a Android na mobilu - všechno bez problémů."
                </p>
                <div className="flex items-center space-x-2">
                  <div className="text-[#25D366] font-semibold text-sm">Multi-platform bez starostí</div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-[#25D366]">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4 mb-4">
                  <Avatar>
                    <AvatarFallback>AN</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Anna Nováková</div>
                    <div className="text-sm text-muted-foreground">Fyzioterapeutka • Olomouc</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Mám ordinaci a často jsem mimo kancelář. Tablet používám pro pacienty a přes WhatsApp Web zadávám výdaje. Večer doma na telefonu zkontroluju, jestli jsem nic nezapomněla. Synchronizace je skvělá."
                </p>
                <div className="flex items-center space-x-2">
                  <div className="text-[#25D366] font-semibold text-sm">Flexibilita pro zdravotníky</div>
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
            Připojte se k 500+ OSVČ, které už používají moderní účetnictví na všech zařízeních
          </p>
          <Button 
            size="lg" 
            className="bg-[#25D366] hover:bg-[#128C7E] text-white text-lg px-8 py-6"
            onClick={() => window.location.href = '/'}
          >
            Začít nyní
          </Button>
        </div>
      </section>
    </div>
  );
}