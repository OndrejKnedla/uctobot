'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft, Smartphone, Tablet, Monitor, Bot, Clock, Shield, TrendingUp } from "lucide-react";
import Layout from '@/components/layout/Layout';

export default function FunkcePage() {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#25D366]/5 to-[#075E54]/5">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20">
            🚀 Připravené k nasazení
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Všechny funkce DokladBotu
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Kompletní přehled funkcí pro profesionální účetnictví OSVČ a firem. Pravidelně přidáváme nové funkce.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Plně funkční</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Otestováno</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#25D366]" />
              <span>Nové funkce každý měsíc</span>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Compatibility */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Kompatibilní se všemi platformami</h2>
            <p className="text-xl text-muted-foreground">
              WhatsApp běží na všech operačních systémech - používejte DokladBot bez ohledu na to, jaká zařízení máte
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center mb-16">
            {/* Desktop OS */}
            <div>
              <h3 className="text-2xl font-bold mb-8">Počítače & Notebooky</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🪟</span>
                  </div>
                  <div>
                    <div className="font-semibold">Windows</div>
                    <div className="text-sm text-muted-foreground">
                      Windows 10, 11 • WhatsApp Web v jakémkoli prohlížeči
                    </div>
                  </div>
                  <Check className="h-5 w-5 text-green-500 ml-auto" />
                </div>

                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🍎</span>
                  </div>
                  <div>
                    <div className="font-semibold">macOS</div>
                    <div className="text-sm text-muted-foreground">
                      Mac OS X • Chrome, Safari, Firefox
                    </div>
                  </div>
                  <Check className="h-5 w-5 text-green-500 ml-auto" />
                </div>

                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🐧</span>
                  </div>
                  <div>
                    <div className="font-semibold">Linux</div>
                    <div className="text-sm text-muted-foreground">
                      Ubuntu, Fedora, Debian • Všechny prohlížeče
                    </div>
                  </div>
                  <Check className="h-5 w-5 text-green-500 ml-auto" />
                </div>
              </div>
            </div>

            {/* Mobile OS */}
            <div>
              <h3 className="text-2xl font-bold mb-8">Mobily & Tablety</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <div>
                    <div className="font-semibold">Android</div>
                    <div className="text-sm text-muted-foreground">
                      Android 7+ • WhatsApp aplikace i WhatsApp Web
                    </div>
                  </div>
                  <Check className="h-5 w-5 text-green-500 ml-auto" />
                </div>

                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📱</span>
                  </div>
                  <div>
                    <div className="font-semibold">iOS</div>
                    <div className="text-sm text-muted-foreground">
                      iPhone, iPad • WhatsApp aplikace i Safari
                    </div>
                  </div>
                  <Check className="h-5 w-5 text-green-500 ml-auto" />
                </div>

                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🖥️</span>
                  </div>
                  <div>
                    <div className="font-semibold">HarmonyOS</div>
                    <div className="text-sm text-muted-foreground">
                      Huawei zařízení • WhatsApp Web i aplikace
                    </div>
                  </div>
                  <Check className="h-5 w-5 text-green-500 ml-auto" />
                </div>
              </div>
            </div>
          </div>

          {/* Browser compatibility */}
          <div className="bg-gradient-to-r from-[#25D366]/10 to-[#075E54]/10 rounded-2xl p-8 mb-16">
            <h3 className="text-2xl font-bold text-center mb-8">Podporované prohlížeče</h3>
            <div className="grid md:grid-cols-6 gap-6 items-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
                  <span className="text-2xl">🌐</span>
                </div>
                <div className="font-semibold text-sm">Chrome</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
                  <span className="text-2xl">🦊</span>
                </div>
                <div className="font-semibold text-sm">Firefox</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
                  <span className="text-2xl">🧭</span>
                </div>
                <div className="font-semibold text-sm">Safari</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
                  <span className="text-2xl">🌊</span>
                </div>
                <div className="font-semibold text-sm">Edge</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
                  <span className="text-2xl">🎭</span>
                </div>
                <div className="font-semibold text-sm">Opera</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
                  <span className="text-2xl">⚡</span>
                </div>
                <div className="font-semibold text-sm">Brave</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              🔧 Neustále přidáváme nové funkce
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Kompletní funkcionalita</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Všechny funkce jsou plně funkční a připravené k použití. Nové možnosti přibývají každý měsíc.
            </p>
            <div className="mt-8 grid md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Dostupné: 12 funkcí</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Ve vývoji: 3 funkce</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Plánované: 5+ funkcí</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Core Features */}
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-0 shadow-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#25D366]/10 rounded-lg">
                    <Bot className="h-6 w-6 text-[#25D366]" />
                  </div>
                  <CardTitle className="text-lg">AI Kategorizace</CardTitle>
                </div>
                <Badge variant="outline" className="w-fit text-xs mt-2 border-green-500 text-green-700">Dostupné</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Automatické rozpoznání výdajů, příjmů a jejich správné zařazení do účetních kategorií. Učí se z vašich dat.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-0 shadow-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <div className="flex space-x-1">
                      <Smartphone className="h-4 w-4 text-blue-600" />
                      <Tablet className="h-4 w-4 text-blue-600" />
                      <Monitor className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <CardTitle className="text-lg">Multi-Platform</CardTitle>
                </div>
                <Badge variant="outline" className="w-fit text-xs mt-2 border-green-500 text-green-700">Dostupné</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Funguje na mobilu, tabletu i PC přes WhatsApp - žádné instalace, všude synchronizováno
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-0 shadow-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <span className="text-xl">📸</span>
                  </div>
                  <CardTitle className="text-lg">Skenování účtenek</CardTitle>
                </div>
                <Badge variant="outline" className="w-fit text-xs mt-2 border-blue-500 text-blue-700">Ve vývoji</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Pošlete fotku účtenky a bot automaticky extrahuje částku, datum i dodavatele
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-8 w-8 text-[#25D366]" />
                  <CardTitle className="text-lg">Přehledy & Reporty</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Měsíční, čtvrtletní přehledy, cash flow, analýza výdajů dle kategorií
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Clock className="h-8 w-8 text-[#25D366]" />
                  <CardTitle className="text-lg">Automatické připomínky</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  DPH přiznání, zálohy na daň, sociální a zdravotní pojištění - nic nezapomenete
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">💰</span>
                  <CardTitle className="text-lg">Daňové odpočty</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Automatické hlídání odpočitatelných položek a optimalizace daňové zátěže
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📊</span>
                  <CardTitle className="text-lg">Export dat</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Excel, CSV, XML formáty pro účetní, finanční úřad nebo jiné účetní systémy
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🔄</span>
                  <CardTitle className="text-lg">Bankovní propojení</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Automatický import transakcí z bank (Fio, KB, ČSOB, Moneta) přes API
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Shield className="h-8 w-8 text-[#25D366]" />
                  <CardTitle className="text-lg">Bezpečnost & GDPR</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  End-to-end šifrování, data v ČR, plná GDPR compliance, pravidelné audity
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📋</span>
                  <CardTitle className="text-lg">Kniha pohledávek</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Sledování faktur, termínů splatnosti, upomínek a pohledávek po splatnosti
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🏢</span>
                  <CardTitle className="text-lg">ARES integrace</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Automatické doplňování údajů o dodavatelích a odběratelích z registru ARES
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">💱</span>
                  <CardTitle className="text-lg">Měnové kurzy</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Automatické přepočty cizích měn podle denních kursů ČNB pro daňové účely
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📈</span>
                  <CardTitle className="text-lg">Business Intelligence</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Analýza trendů, predikce cash flow, srovnání období a identifikace úspor
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🎯</span>
                  <CardTitle className="text-lg">Limity a cíle</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Sledování rozpočtů, upozornění na překročení limitů DPH, sociálního pojištění
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🔧</span>
                  <CardTitle className="text-lg">API & integrace</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  REST API pro propojení s e-shopy, ERP systémy nebo vlastními aplikacemi
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Advantages */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-2xl font-bold mb-8">Proč je multi-platform přístup výhodný?</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔄</span>
                </div>
                <h4 className="font-bold mb-2">Synchronizace všude</h4>
                <p className="text-sm text-muted-foreground">
                  Začnete na mobilu, dokončíte na PC. Všechna data jsou vždy synchronizovaná napříč zařízeními.
                </p>
              </Card>

              <Card className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚙️</span>
                </div>
                <h4 className="font-bold mb-2">Žádné instalace</h4>
                <p className="text-sm text-muted-foreground">
                  Nemusíte instalovat žádné speciální aplikace. WhatsApp už máte a DokladBot funguje okamžitě.
                </p>
              </Card>

              <Card className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚀</span>
                </div>
                <h4 className="font-bold mb-2">Vždy aktuální</h4>
                <p className="text-sm text-muted-foreground">
                  Automatické aktualizace přes WhatsApp. Nové funkce získáte okamžitě bez staráhání aktualizací.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#25D366]/10 to-[#075E54]/10">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20">
            ⚡ Připraveno k použití
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Vyzkoušejte všechny funkce
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Začněte používat profesionální účetnictví na všech svých zařízeních. Staňte se Founding Member s 30denní garancí vrácení peněz.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button 
              size="lg" 
              className="bg-[#25D366] hover:bg-[#128C7E] text-white text-lg px-8 py-6 font-semibold"
              onClick={() => window.location.href = '/'}
            >
              VYZKOUŠET ZDARMA
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
              <span>30denní garance vrácení peněz</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              <span>Funguje na všech zařízeních</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span>Founding Member přístup</span>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}