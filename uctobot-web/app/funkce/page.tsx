'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Bot, Clock, Shield, TrendingUp, MessageCircle, FileText, CreditCard, DollarSign, Smartphone, Target } from "lucide-react";
import Layout from '@/components/layout/Layout';

export default function FunkcePage() {
  const handleRegister = () => {
    window.location.href = '/#cenik';
  };

  return (
    <Layout >
      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#25D366]/5 to-[#075E54]/5">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20">
            ⚡ 15+ funkcí k dispozici
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Kompletní průvodce funkcemi
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Objevte všechny možnosti DokladBotu. Od základního vedení účetnictví po pokročilé analytické funkce.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Dostupné okamžitě</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              <span>Pouze přes WhatsApp</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#25D366]" />
              <span>Nové funkce každý měsíc</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Základní funkce</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tyto funkce používá každý uživatel DokladBotu denně
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Kategorizace */}
            <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-lg bg-gradient-to-br from-green-50/80 to-emerald-50/80">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-[#25D366]/10 rounded-xl">
                    <Bot className="h-7 w-7 text-[#25D366]" />
                  </div>
                  <CardTitle className="text-lg">AI Kategorizace</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Napíšete "koupil jsem papír za 500" a DokladBot automaticky pozná, že jde o kancelářské potřeby, zařadí do správné kategorie a připraví pro daňové přiznání.
                </p>
                <div className="flex items-center text-xs text-green-600 font-medium">
                  <span className="mr-2">✨</span>
                  Přesnost 95%+ po týdnu používání
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp Interface */}
            <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-lg bg-gradient-to-br from-blue-50/80 to-cyan-50/80">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <Smartphone className="h-7 w-7 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">WhatsApp Interface</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  100% práce přes WhatsApp. Žádné weby, aplikace ani programy. Stačí napsat zprávu jako kamarádovi - "vydal jsem 1200 za benzín" a je hotovo.
                </p>
                <div className="flex items-center text-xs text-blue-600 font-medium">
                  <span className="mr-2">📱</span>
                  Funguje na všech zařízeních
                </div>
              </CardContent>
            </Card>

            {/* Skenování účtenek */}
            <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-lg bg-gradient-to-br from-purple-50/80 to-violet-50/80">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-purple-500/10 rounded-xl">
                    <span className="text-2xl">📸</span>
                  </div>
                  <CardTitle className="text-lg">Skenování účtenek</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Pošlete fotku účtenky z Albert, Tesco nebo benzínky a za 5 sekund máte extrahovanou částku, datum, dodavatele i správnou kategorii.
                </p>
                <div className="flex items-center text-xs text-purple-600 font-medium">
                  <span className="mr-2">⚡</span>
                  Zpracování pod 5 sekund
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Reporting & Analytics */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50/50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Reporting & Analýzy</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Přehledy a analytické nástroje pro informované rozhodování
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Přehledy & Reporty */}
            <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-indigo-500/10 rounded-xl">
                    <TrendingUp className="h-7 w-7 text-indigo-600" />
                  </div>
                  <CardTitle className="text-lg">Přehledy & Reporty</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Každý měsíc dostanete krásný přehled: kolik jste vydali, na co, jak se daří cash flow. Vše připraveno pro účetního nebo finanční úřad.
                </p>
                <div className="flex items-center text-xs text-indigo-600 font-medium">
                  <span className="mr-2">📊</span>
                  Automaticky každý měsíc
                </div>
              </CardContent>
            </Card>

            {/* Business Intelligence */}
            <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-pink-500/10 rounded-xl">
                    <span className="text-2xl">📈</span>
                  </div>
                  <CardTitle className="text-lg">Business Intelligence</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  "Tento měsíc jste utratili o 20% více za dopravu než obvykle" nebo "Cash flow bude v příštím měsíci negativní" - AI vás upozorní na trendy.
                </p>
                <div className="flex items-center text-xs text-pink-600 font-medium">
                  <span className="mr-2">🤖</span>
                  Prediktivní analýzy
                </div>
              </CardContent>
            </Card>

            {/* Export dat */}
            <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-teal-500/10 rounded-xl">
                    <FileText className="h-7 w-7 text-teal-600" />
                  </div>
                  <CardTitle className="text-lg">Export dat</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Excel pro účetního, XML pro finanční úřad, CSV pro další systémy. Jedním kliknutiem máte data v jakémkoli formátu.
                </p>
                <div className="flex items-center text-xs text-teal-600 font-medium">
                  <span className="mr-2">💾</span>
                  5+ formátů k exportu
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Automation & Reminders */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Automatizace & Připomínky</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Nikdy nezapomenete na důležité termíny a povinnosti
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Automatické připomínky */}
            <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-orange-500/10 rounded-xl">
                    <Clock className="h-7 w-7 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">Automatické připomínky</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  "Příští týden je termín DPH přiznání" nebo "Za 3 dny platíte zálohu na sociální pojištění". Vždycky včas, nikdy nic nezapomenete.
                </p>
                <div className="flex items-center text-xs text-orange-600 font-medium">
                  <span className="mr-2">🔔</span>
                  7 typů automatických připomínek
                </div>
              </CardContent>
            </Card>

            {/* Daňové odpočty */}
            <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-yellow-500/10 rounded-xl">
                    <DollarSign className="h-7 w-7 text-yellow-600" />
                  </div>
                  <CardTitle className="text-lg">Daňové odpočty</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  "Tenhle výdaj můžete odečíst z daní" - automatické hlídání odpočitatelných položek. Ušetříte tisíce korun ročně na daních.
                </p>
                <div className="flex items-center text-xs text-yellow-600 font-medium">
                  <span className="mr-2">💰</span>
                  Průměrně 15 000 Kč úspory/rok
                </div>
              </CardContent>
            </Card>

            {/* Limity a cíle */}
            <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-red-500/10 rounded-xl">
                    <Target className="h-7 w-7 text-red-600" />
                  </div>
                  <CardTitle className="text-lg">Limity a cíle</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  "Pozor, blížíte se k limitu pro DPH plátcovství" nebo "Tento měsíc jste překročili rozpočet o 30%". Hlídáme váše finance.
                </p>
                <div className="flex items-center text-xs text-red-600 font-medium">
                  <span className="mr-2">🎯</span>
                  Preventivní upozornění
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Integrations & Security */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50/50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Integrace & Bezpečnost</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Propojení s externí systémy a maximální zabezpečení dat
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Bankovní propojení */}
            <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <CreditCard className="h-7 w-7 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Bankovní propojení</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Připojíme Fio Banku, KB, ČSOB nebo Monetu. Transakce se automaticky stahují a párují s vašimi výdaji. Žádné ruční překepávání.
                </p>
                <div className="flex items-center text-xs text-blue-600 font-medium">
                  <span className="mr-2">🏦</span>
                  4 největší banky v ČR
                </div>
              </CardContent>
            </Card>

            {/* ARES integrace */}
            <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-green-500/10 rounded-xl">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <CardTitle className="text-lg">ARES integrace</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Napíšete IČO dodavatele a automaticky se doplní název firmy, adresa, DIČ. Žádné hledání na internetu nebo překepávání údajů.
                </p>
                <div className="flex items-center text-xs text-green-600 font-medium">
                  <span className="mr-2">⚡</span>
                  Okamžité doplnění údajů
                </div>
              </CardContent>
            </Card>

            {/* Bezpečnost & GDPR */}
            <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-red-500/10 rounded-xl">
                    <Shield className="h-7 w-7 text-red-600" />
                  </div>
                  <CardTitle className="text-lg">Bezpečnost & GDPR</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  End-to-end šifrování jako u WhatsAppu, servery v ČR, certifikace ISO 27001, plná GDPR compliance. Vaše data jsou v bezpečí.
                </p>
                <div className="flex items-center text-xs text-red-600 font-medium">
                  <span className="mr-2">🔒</span>
                  Bankový standard zabezpečení
                </div>
              </CardContent>
            </Card>

            {/* API & integrace */}
            <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-purple-500/10 rounded-xl">
                    <span className="text-2xl">🔧</span>
                  </div>
                  <CardTitle className="text-lg">API & integrace</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  REST API pro propojení s e-shopy (Shoptet, Shopify), ERP systémy (SAP, Helios) nebo vlastními aplikacemi. Vše automaticky.
                </p>
                <div className="flex items-center text-xs text-purple-600 font-medium">
                  <span className="mr-2">🔗</span>
                  Integrace na míru
                </div>
              </CardContent>
            </Card>

            {/* Měnové kurzy */}
            <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-indigo-500/10 rounded-xl">
                    <span className="text-2xl">💱</span>
                  </div>
                  <CardTitle className="text-lg">Měnové kurzy</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Nakoupili jste v EUR nebo USD? Automatický přepočet podle kurzů ČNB na den transakce. Správné částky pro daňové přiznání.
                </p>
                <div className="flex items-center text-xs text-indigo-600 font-medium">
                  <span className="mr-2">💰</span>
                  Denní kurzy ČNB
                </div>
              </CardContent>
            </Card>

            {/* Kniha pohledávek */}
            <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-teal-500/10 rounded-xl">
                    <span className="text-2xl">📋</span>
                  </div>
                  <CardTitle className="text-lg">Kniha pohledávek</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Sledování nezaplacených faktur. "Faktura 2024001 má splatnost za 3 dny" nebo "Klient XY má 14 dní po splatnosti". Hlídáme vaše peníze.
                </p>
                <div className="flex items-center text-xs text-teal-600 font-medium">
                  <span className="mr-2">⏰</span>
                  Automatické upomínky
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#25D366]/10 to-[#075E54]/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Připraveni na profesionální účetnictví?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Vyzkoušejte všechny funkce 7 dní zdarma. Během týdne budete účetnictví zvládat za 10 minut denně místo hodin.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button 
              size="lg" 
              className="bg-[#25D366] hover:bg-[#128C7E] text-white text-lg px-8 py-6 font-semibold"
              onClick={handleRegister}
            >
              ZAČÍT ZDARMA - 7 DNÍ
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>7 dní zdarma</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              <span>Přes WhatsApp</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span>15+ funkcí</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-4 w-4 text-red-500" />
              <span>Bez závazků</span>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}