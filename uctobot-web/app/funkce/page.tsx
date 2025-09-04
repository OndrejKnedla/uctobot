'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Bot, Clock, Shield, TrendingUp, MessageCircle, FileText, CreditCard, DollarSign } from "lucide-react";
import Layout from '@/components/layout/Layout';

export default function FunkcePage() {
  const handleRegister = () => {
    window.location.href = '/#cenik';
  };

  return (
    <Layout showMainPageSections={true}>
      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#25D366]/5 to-[#075E54]/5">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Co všechno umí DokladBot
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Profesionální účetnictví přímo ve WhatsAppu. Vše co potřebujete pro správu financí OSVČ.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Dostupné nyní</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              <span>Přes WhatsApp</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#25D366]" />
              <span>199 Kč/měsíc</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Hlavní funkce</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Vše potřebné pro profesionální účetnictví OSVČ v jedné aplikaci
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Kategorizace */}
            <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#25D366]/10 rounded-lg">
                    <Bot className="h-6 w-6 text-[#25D366]" />
                  </div>
                  <CardTitle className="text-lg">AI Kategorizace</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Automatické rozpoznání výdajů, příjmů a jejich správné zařazení do účetních kategorií.
                </p>
              </CardContent>
            </Card>

            {/* Skenování účtenek */}
            <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <span className="text-xl">📸</span>
                  </div>
                  <CardTitle className="text-lg">Skenování účtenek</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Pošlete fotku účtenky a bot automaticky extrahuje částku, datum i dodavatele.
                </p>
              </CardContent>
            </Card>

            {/* Přehledy & Reporty */}
            <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Přehledy & Reporty</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Měsíční, čtvrtletní přehledy, cash flow, analýza výdajů dle kategorií.
                </p>
              </CardContent>
            </Card>

            {/* Automatické připomínky */}
            <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">Automatické připomínky</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  DPH přiznání, zálohy na daň, sociální a zdravotní pojištění - nic nezapomenete.
                </p>
              </CardContent>
            </Card>

            {/* Export dat */}
            <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Export dat</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Excel, CSV, XML formáty pro účetní, finanční úřad nebo jiné účetní systémy.
                </p>
              </CardContent>
            </Card>

            {/* Bezpečnost */}
            <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle className="text-lg">Bezpečnost & GDPR</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  End-to-end šifrování, data v ČR, plná GDPR compliance, pravidelné audity.
                </p>
              </CardContent>
            </Card>

            {/* Daňové odpočty */}
            <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <DollarSign className="h-6 w-6 text-yellow-600" />
                  </div>
                  <CardTitle className="text-lg">Daňové odpočty</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Automatické hlídání odpočitatelných položek a optimalizace daňové zátěže.
                </p>
              </CardContent>
            </Card>

            {/* Bankovní propojení */}
            <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <CreditCard className="h-6 w-6 text-indigo-600" />
                  </div>
                  <CardTitle className="text-lg">Bankovní propojení</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Automatický import transakcí z bank (Fio, KB, ČSOB, Moneta) přes API.
                </p>
              </CardContent>
            </Card>

            {/* Multi-platform */}
            <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-teal-500/10 rounded-lg">
                    <MessageCircle className="h-6 w-6 text-teal-600" />
                  </div>
                  <CardTitle className="text-lg">Všude dostupné</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Funguje na mobilu, tabletu i PC přes WhatsApp - žádné instalace, všude synchronizováno.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50/50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Proč DokladBot?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Jednoduché, rychlé a spolehlivé řešení pro každého podnikatele
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6 border-0 shadow-md">
              <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="font-bold mb-2">Rychlé nastavení</h3>
              <p className="text-sm text-muted-foreground">
                Začnete během 5 minut. Žádné složité instalace nebo konfigurace.
              </p>
            </Card>

            <Card className="text-center p-6 border-0 shadow-md">
              <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="font-bold mb-2">Ušetříte čas i peníze</h3>
              <p className="text-sm text-muted-foreground">
                Místo hodin papírování stačí pár zpráv. Levnější než tradiční účetní software.
              </p>
            </Card>

            <Card className="text-center p-6 border-0 shadow-md">
              <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="font-bold mb-2">Vždy aktuální</h3>
              <p className="text-sm text-muted-foreground">
                Automatické aktualizace daňových zákonů a nové funkce bez placení extra.
              </p>
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
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Vyzkoušejte DokladBot 7 dní zdarma. Bez závazků, kdykoli můžete zrušit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button 
              size="lg" 
              className="bg-[#25D366] hover:bg-[#128C7E] text-white text-lg px-8 py-6 font-semibold"
              onClick={handleRegister}
            >
              VYZKOUŠET 7 DNÍ ZDARMA
            </Button>
            <Button 
              variant="outline"
              size="lg" 
              className="text-lg px-8 py-6 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
              onClick={() => window.location.href = '/jak-to-funguje'}
            >
              Jak to funguje
            </Button>
          </div>
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Bez závazků</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              <span>Přes WhatsApp</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span>199 Kč/měsíc</span>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}