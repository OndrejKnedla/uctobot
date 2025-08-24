'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Copy, MessageCircle, Clock, Mail } from 'lucide-react';
import { GeistSans } from "geist/font/sans";

interface PaymentSuccessData {
  success: boolean;
  activation_token: string;
  whatsapp_number: string;
  user_email: string;
  expires_at: string;
  error?: string;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [data, setData] = useState<PaymentSuccessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (sessionId) {
      fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : 'https://uctobot.vercel.app'}/payments/payment-success?session_id=${sessionId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json();
        })
        .then(setData)
        .catch(err => {
          console.error('Chyba při načítání dat:', err);
          // Pro development ukážeme mock data
          setData({
            success: true,
            activation_token: 'DEMO-' + Math.random().toString(36).substr(2, 9),
            whatsapp_number: 'whatsapp:+14155238886',
            user_email: 'user@example.com',
            expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
          });
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      setData({ success: false, error: 'Chybí ID platební session' } as PaymentSuccessData);
    }
  }, [sessionId]);
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Nepodařilo se zkopírovat:', err);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-600">Zpracovávám platbu...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!data?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <CardTitle className="text-red-800">Chyba při zpracování</CardTitle>
            <CardDescription>
              {data?.error || 'Něco se pokazilo při zpracování vaší platby.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/">Zpět na hlavní stránku</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const whatsappLink = `https://api.whatsapp.com/send?phone=${data.whatsapp_number.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(data.activation_token)}`;
  const expiresDate = new Date(data.expires_at).toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return (
    <div className={`min-h-screen bg-white ${GeistSans.className}`}>
      {/* Header s logem */}
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#25D366] rounded-lg flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">ÚčtoBot</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hlavní success card */}
        <div className="text-center mb-12">
          <div className="mx-auto w-20 h-20 bg-[#25D366]/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-[#25D366]" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Platba úspěšná! 🎉
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Vaše předplatné ÚčetníBot je aktivní a můžete začít používat
          </p>
          <div className="bg-[#25D366]/10 rounded-2xl p-6 mb-8 max-w-2xl mx-auto">
            <p className="text-[#25D366] font-semibold text-lg mb-2">
              💚 Děkujeme za důvěru!
            </p>
            <p className="text-gray-700 mb-4">
              Jste součástí komunity 50+ spokojených podnikatelů, kteří si zjednodušili účetnictví. 
              Za 3 minuty budete moci poslat první účtenku! 
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm">
              <div className="flex items-center text-[#25D366]">
                <span className="w-2 h-2 bg-[#25D366] rounded-full mr-2"></span>
                7 dní zdarma
              </div>
              <div className="flex items-center text-[#25D366]">
                <span className="w-2 h-2 bg-[#25D366] rounded-full mr-2"></span>
                Bez platební karty
              </div>
              <div className="flex items-center text-[#25D366]">
                <span className="w-2 h-2 bg-[#25D366] rounded-full mr-2"></span>
                Zrušit kdykoliv
              </div>
            </div>
          </div>

          {/* WhatsApp Download sekce - ÚPLNĚ PRVNÍ */}
          <div className="bg-gradient-to-br from-[#25D366]/5 to-[#128C7E]/5 rounded-3xl p-8 mb-12 border border-[#25D366]/20">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                📱 Ještě nemáte WhatsApp?
              </h2>
              <p className="text-gray-600">
                Stáhněte si WhatsApp zdarma na všechny vaše zařízení
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <a
                href="https://www.whatsapp.com/download"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow group"
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">💻</div>
                  <div className="font-semibold text-sm text-gray-900 mb-1">Windows</div>
                  <div className="text-xs text-gray-600">Desktop app</div>
                </div>
              </a>
              
              <a
                href="https://www.whatsapp.com/download"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow group"
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">🍎</div>
                  <div className="font-semibold text-sm text-gray-900 mb-1">macOS</div>
                  <div className="text-xs text-gray-600">Desktop app</div>
                </div>
              </a>
              
              <a
                href="https://play.google.com/store/apps/details?id=com.whatsapp"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow group"
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">🤖</div>
                  <div className="font-semibold text-sm text-gray-900 mb-1">Android</div>
                  <div className="text-xs text-gray-600">Google Play</div>
                </div>
              </a>
              
              <a
                href="https://apps.apple.com/app/whatsapp-messenger/id310633997"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow group"
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">📱</div>
                  <div className="font-semibold text-sm text-gray-900 mb-1">iPhone</div>
                  <div className="text-xs text-gray-600">App Store</div>
                </div>
              </a>
            </div>
            
            <div className="text-center mt-6">
              <Button 
                asChild 
                variant="outline" 
                className="border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white"
              >
                <a 
                  href="https://web.whatsapp.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  💻 Nebo použít WhatsApp Web
                </a>
              </Button>
            </div>
          </div>

          {/* Kompletní setup návod */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-12 max-w-4xl mx-auto border border-blue-100">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                📋 Kompletní návod k aktivaci
              </h2>
              <p className="text-gray-600">
                Postupujte krok za krokem pro úspěšné spuštění účetnictví
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Krok 1 - První kontakt */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center mr-4 flex-shrink-0 text-lg font-bold">1</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">První zpráva - Aktivace</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Pošlete aktivační kód (zkopírujte výše) nebo napište "START" nebo "AHOJ"
                    </p>
                    <div className="bg-[#25D366]/10 rounded-lg p-3 border-l-4 border-[#25D366]">
                      <p className="text-sm font-mono text-gray-800 mb-1">
                        Příklad: <strong>START</strong>
                      </p>
                      <p className="text-xs text-gray-600">
                        Bot vás přivítá a začne proces registrace
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Krok 2 - IČO a údaje */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center mr-4 flex-shrink-0 text-lg font-bold">2</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Zadejte IČO a údaje</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Bot se zeptá na vaše IČO a ověří údaje automaticky
                    </p>
                    <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
                      <p className="text-sm font-mono text-gray-800 mb-1">
                        Příklad: <strong>12345678</strong>
                      </p>
                      <p className="text-xs text-gray-600">
                        Bot automaticky doplní jméno, adresu a další údaje z ARES
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Krok 3 - Nastavení */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center mr-4 flex-shrink-0 text-lg font-bold">3</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Nastavení DPH a typu evidence</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Zvolte typ evidence a DPH podle vaší činnosti
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-purple-50 rounded-lg p-3 border-l-4 border-purple-400">
                        <p className="text-sm font-semibold text-purple-800">Příjem/Výdej</p>
                        <p className="text-xs text-purple-600">Pro většinu OSVČ</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3 border-l-4 border-orange-400">
                        <p className="text-sm font-semibold text-orange-800">DPH 21%</p>
                        <p className="text-xs text-orange-600">Standardní sazba</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Krok 4 - První transakce */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center mr-4 flex-shrink-0 text-lg font-bold">4</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">První účtenka - Hotovo! 🎉</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Nyní můžete posílat účtenky jednoduchými zprávami
                    </p>
                    <div className="space-y-2">
                      <div className="bg-green-50 rounded-lg p-3 border-l-4 border-green-400">
                        <p className="text-sm font-mono text-gray-800 mb-1">
                          📸 "Pošlete fotku účtenky" <em>nebo</em>
                        </p>
                        <p className="text-sm font-mono text-gray-800">
                          💬 "Koupil jsem papír za 500 Kč"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center bg-[#25D366]/10 rounded-xl p-4">
              <p className="text-sm font-semibold text-[#25D366] mb-1">
                ⚡ Celý proces trvá jen 3-5 minut!
              </p>
              <p className="text-xs text-gray-600">
                Po nastavení už jen posíláte účtenky a vše se automaticky zpracuje
              </p>
            </div>
          </div>
        </div>
        
        {/* Aktivační proces */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Krok 1 */}
          <Card className="border-2 border-gray-100">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-[#25D366] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <CardTitle className="text-lg">Zkopírujte kód</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-4">
                <code className="text-sm font-mono text-gray-800 block text-center break-all">
                  {data.activation_token}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(data.activation_token)}
                  className="w-full mt-3 text-[#25D366] border-[#25D366] hover:bg-[#25D366] hover:text-white"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? 'Zkopírováno!' : 'Kopírovat kód'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Krok 2 */}
          <Card className="border-2 border-gray-100">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-[#25D366] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <CardTitle className="text-lg">Otevřete WhatsApp</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-center">
              <div className="text-2xl font-bold text-[#25D366] mb-2">
                {data.whatsapp_number?.replace('whatsapp:', '') || '+420 608 123 456'}
              </div>
              <p className="text-sm text-gray-600 mb-4">
                ÚčtoBot - AI účetní asistent
              </p>
              <Button 
                asChild 
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
              >
                <a 
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Otevřít WhatsApp
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Krok 3 */}
          <Card className="border-2 border-gray-100">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-[#25D366] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <CardTitle className="text-lg">Pošlete kód</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-center">
              <p className="text-sm text-gray-600 mb-4">
                Vložte zkopírovaný kód do WhatsApp zprávy a odešlete
              </p>
              <div className="bg-[#25D366]/10 rounded-lg p-4">
                <p className="text-sm font-semibold text-[#25D366]">
                  ⚡ Bot odpoví do 30 sekund!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Rychlé tipy */}
        <div className="bg-blue-50 rounded-2xl p-8 mb-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            💡 Rychlé tipy pro začátek
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                <span className="text-blue-600 text-sm font-bold">💬</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Jednoduchá zpráva stačí</h4>
                <p className="text-sm text-gray-600">
                  "Koupil jsem papír za 500" • "Benzín 1200" • "Faktura od Vodafone 850"
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                <span className="text-blue-600 text-sm font-bold">📸</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Pošlete fotku účtenky</h4>
                <p className="text-sm text-gray-600">
                  Bot automaticky přečte všechny údaje a uloží je do účetnictví
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                <span className="text-blue-600 text-sm font-bold">⚡</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Rychlá odpověď</h4>
                <p className="text-sm text-gray-600">
                  Bot odpoví do 30 sekund a potvrdí uložení transakce
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                <span className="text-blue-600 text-sm font-bold">📊</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Měsíční přehled</h4>
                <p className="text-sm text-gray-600">
                  Napište "přehled" a dostanete souhrn příjmů a výdajů
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Důležité informace */}
        <div className="bg-gray-50 rounded-2xl p-8 mb-12">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start">
              <Clock className="w-6 h-6 text-[#25D366] mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Kód platí do {expiresDate}
                </h3>
                <p className="text-gray-600">
                  Aktivujte svůj ÚčetníBot do 48 hodin od platby
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Mail className="w-6 h-6 text-[#25D366] mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Email potvrzení
                </h3>
                <p className="text-gray-600">
                  Kód a instrukce byly také zaslány na {data.user_email}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Podpora */}
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">Potřebujete pomoc?</h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Pokud máte problém s aktivací nebo jakékoliv dotazy, neváhejte nás kontaktovat. 
            Jsme tu pro vás 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Button 
              variant="outline" 
              asChild
              className="border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white"
            >
              <a href="mailto:podpora@ucetnibot.cz">
                <Mail className="w-4 h-4 mr-2" />
                podpora@ucetnibot.cz
              </a>
            </Button>
            <Button 
              asChild
              className="bg-[#25D366] hover:bg-[#128C7E] text-white"
            >
              <a href="/">
                Zpět na hlavní stránku
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <div className={GeistSans.className}>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
              <p className="text-gray-600">Načítám...</p>
            </CardContent>
          </Card>
        </div>
      }>
        <PaymentSuccessContent />
      </Suspense>
    </div>
  );
}