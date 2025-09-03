"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, X, MessageCircle, Bot, Clock, Shield, TrendingUp, Smartphone, Moon, Sun, Menu, ArrowRight, Play } from "lucide-react"
import { authAPI, paymentsAPI, tokenManager } from "@/lib/api"
import { PricingCard } from "@/components/PricingCard"

// Types for API data
interface ApiStats {
  total_users: number
  active_users: number
  total_transactions: number
  total_revenue: number
}

export default function DokladBotLanding() {
  // Schema.org structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "DokladBot - Profesionální účetnictví přes WhatsApp",
    "description": "Profesionální účetnictví přímo ve WhatsAppu. 7 dní zdarma! Stačí napsat 'koupil jsem papír za 500'. AI kategorizace, připomínky na DPH, měsíční přehledy. Již od 199 Kč/měsíc.",
    "url": "https://dokladbot.cz",
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "DokladBot",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, WhatsApp",
      "offers": [
        {
          "@type": "Offer",
          "name": "Měsíční plán",
          "price": "199",
          "priceCurrency": "CZK",
          "description": "Měsíční předplatné s 7denní zkušební dobou zdarma"
        },
        {
          "@type": "Offer",
          "name": "Roční plán", 
          "price": "1990",
          "priceCurrency": "CZK",
          "description": "Roční předplatné s 7denní zkušební dobou zdarma a 2 měsíci zdarma"
        }
      ]
    }
  }
  const [darkMode, setDarkMode] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiStats, setApiStats] = useState<ApiStats | null>(null)
  const [timeLeft, setTimeLeft] = useState({
    days: 6,
    hours: 14,
    minutes: 23,
    seconds: 45
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let newSeconds = prev.seconds - 1;
        let newMinutes = prev.minutes;
        let newHours = prev.hours;
        let newDays = prev.days;
        
        if (newSeconds < 0) {
          newSeconds = 59;
          newMinutes -= 1;
        }
        if (newMinutes < 0) {
          newMinutes = 59;
          newHours -= 1;
        }
        if (newHours < 0) {
          newHours = 23;
          newDays -= 1;
        }
        
        return {
          days: Math.max(0, newDays),
          hours: Math.max(0, newHours),
          minutes: Math.max(0, newMinutes),
          seconds: Math.max(0, newSeconds)
        };
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [])

  // Fetch API stats on component mount
  useEffect(() => {
    const fetchApiStats = async () => {
      try {
        const [userStatsRes, transactionStatsRes] = await Promise.all([
          fetch('https://dokladbot.vercel.app/api/users/stats'),
          fetch('https://dokladbot.vercel.app/api/transactions/stats')
        ])

        if (userStatsRes.ok && transactionStatsRes.ok) {
          const userStats = await userStatsRes.json()
          const transactionStats = await transactionStatsRes.json()
          
          setApiStats({
            total_users: userStats.total_users,
            active_users: userStats.active_users,
            total_transactions: transactionStats.total_transactions,
            total_revenue: transactionStats.total_income
          })
        }
      } catch (err) {
        console.log('API stats not available')
        // Set to null if API is not available
        setApiStats(null)
      }
    }

    fetchApiStats()
  }, [])


  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    setMobileMenuOpen(false)
  }

  const handleRegister = () => {
    // Scroll to pricing section
    document.getElementById('cenik')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handlePricingClick = async (planType: 'monthly' | 'annual') => {
    try {
      setLoading(true)
      setError(null)
      console.log('Starting pricing flow for:', planType)
      
      // Redirect to WhatsApp with plan info  
      const message = planType === 'annual' 
        ? 'Chci vyzkoušet DokladBot zdarma a pak roční plán za 1990 Kč (166 Kč/měsíc + 2 měsíce zdarma). Prosím kontaktujte mě.'
        : 'Chci vyzkoušet DokladBot 7 dní zdarma a pak měsíční plán za 199 Kč. Prosím kontaktujte mě.'
      
      window.open(`https://wa.me/420608123456?text=${encodeURIComponent(message)}`, '_blank')
      
    } catch (err) {
      console.error('Pricing error:', err)
      setError('Chyba při výběru plánu. Zkuste to znovu.')
    } finally {
      setLoading(false)
    }
  }

  const handlePartnerClick = async () => {
    try {
      console.log('Partner interest clicked')
      window.location.href = 'mailto:info@dokladbot.cz?subject=Zájem o partnerství&body=Dobrý den,%0A%0Amám zájem o partnerský program pro účetní kanceláře.%0A%0AKontaktní údaje:%0ANázev společnosti: %0AKontaktní osoba: %0ATelefon: %0AE-mail: %0A%0Aděkuji za informace.%0A%0AS pozdravem'
    } catch (err) {
      console.error('Partner click error:', err)
    }
  }

  return (
    <>
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden pt-20">
      {/* Custom animations CSS */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-slide-in-left {
          animation: slideInFromLeft 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slide-in-right {
          animation: slideInFromRight 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-500 text-white py-2 px-4 text-center text-sm">
          ❌ {error}
          <button 
            onClick={() => setError(null)} 
            className="ml-4 text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>
      )}



      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-10 w-10 text-[#25D366]" />
              <span className="text-2xl font-bold">DokladBot</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection("jak-funguje")}
                className="text-muted-foreground hover:text-foreground"
              >
                Jak to funguje
              </button>
              <button onClick={() => scrollToSection("cenik")} className="text-muted-foreground hover:text-foreground">
                Ceník
              </button>
              <button
                onClick={() => scrollToSection("recenze")}
                className="text-muted-foreground hover:text-foreground"
              >
                Recenze
              </button>
              <button
                onClick={() => scrollToSection("faq")}
                className="text-muted-foreground hover:text-foreground"
              >
                FAQ
              </button>
              <a
                href="/blog"
                className="text-muted-foreground hover:text-foreground"
              >
                Blog
              </a>
              <Button 
                size="lg"
                className="bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold"
                onClick={handleRegister}
              >
                VYZKOUŠET ZDARMA
              </Button>
            </div>

            <div className="md:hidden flex items-center">
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-t">
            <div className="px-4 py-2 space-y-2">
              <button
                onClick={() => scrollToSection("jak-funguje")}
                className="block w-full text-left py-2 text-muted-foreground"
              >
                Jak to funguje
              </button>
              <button
                onClick={() => scrollToSection("cenik")}
                className="block w-full text-left py-2 text-muted-foreground"
              >
                Ceník
              </button>
              <button
                onClick={() => scrollToSection("recenze")}
                className="block w-full text-left py-2 text-muted-foreground"
              >
                Recenze
              </button>
              <button
                onClick={() => scrollToSection("faq")}
                className="block w-full text-left py-2 text-muted-foreground"
              >
                FAQ
              </button>
              <a
                href="/blog"
                className="block w-full text-left py-2 text-muted-foreground"
              >
                Blog
              </a>
              <Button 
                size="lg"
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold mt-2"
                onClick={handleRegister}
              >
                VYZKOUŠET ZDARMA
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Floating background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 bg-[#25D366]/10 rounded-full animate-float"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-[#25D366]/10 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-40 left-20 w-12 h-12 bg-[#25D366]/10 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 right-40 w-24 h-24 bg-[#25D366]/10 rounded-full animate-float" style={{animationDelay: '0.5s'}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-slide-in-left">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                  Účetnictví přes WhatsApp za <span className="text-[#25D366] animate-pulse">5 vteřin</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                  Profesionální účetnictví ze smartphonu. Pošlete fotku účtenky a AI vše rozpozná a správně zaúčtuje za 5 sekund.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-[#25D366]" />
                  <span>{apiStats?.total_users || 50}+ beta testerů</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-[#25D366]" />
                  <span>Ušetříte spoustu času měsíčně</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-[#25D366]" />
                  <span>Schváleno Komorou účetních</span>
                </div>
              </div>

              <Button 
                size="lg" 
                className="bg-[#25D366] hover:bg-[#128C7E] text-white text-lg px-8 py-6 flex items-center justify-center"
                onClick={handleRegister}
              >
                VYZKOUŠET ZDARMA
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-[#25D366]/10 to-[#075E54]/10 rounded-3xl p-8">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-sm mx-auto">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center">
                      <Bot className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold">DokladBot</div>
                      <div className="text-xs text-green-500">online</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-sm">
                      Ahoj! Pošlete mi fotku účtenky nebo faktury.
                    </div>
                    <div className="bg-[#25D366] text-white rounded-lg p-3 text-sm ml-8 flex items-center gap-2">
                      📸 
                      <div className="bg-white/20 rounded px-2 py-1 text-xs">účtenka_alza.jpg</div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-sm leading-relaxed">
                      📸 <strong>Účtenka zpracována!</strong>
                      <br /><br />
                      ✅ <strong>Rozpoznáno z obrázku:</strong>
                      <br /><br />
                      🏪 <strong>Obchod:</strong> ALZA.CZ a.s.
                      <br />
                      💰 <strong>Částka:</strong> 24 999.00 CZK
                      <br />
                      📅 <strong>Datum:</strong> 15.11.2024
                      <br />
                      📂 <strong>Kategorie:</strong> IT vybavení
                      <br /><br />
                      🏢 <strong>IČO:</strong> 27082440
                      <br />
                      🆔 <strong>DIČ:</strong> CZ27082440
                      <br /><br />
                      💾 <strong>Uloženo do výdajů</strong>
                      <br /><br />
                      📊 <strong>Dnešní souhrn:</strong>
                      <br />
                      • Příjmy: 0 Kč
                      <br />
                      • Výdaje: 24 999 Kč
                      <br /><br />
                      💡 Tip: Napište <strong>"přehled"</strong> pro měsíční souhrn
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="jak-funguje" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Jak to funguje</h2>
            <p className="text-xl text-muted-foreground">3 jednoduché kroky k bezstarostnému účetnictví</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-[#25D366]" />
                </div>
                <CardTitle>1. Napište do WhatsAppu</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Pošlete fotku účtenky nebo faktury</p>
                <div className="mt-4 bg-muted rounded-lg p-3 text-sm flex items-center gap-2">
                  📸 <span className="italic">"Pošlete fotku účtenky"</span>
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
                <p className="text-muted-foreground">AI rozpozná částku, IČO, DIČ a zaúčtuje</p>
                <div className="mt-4 bg-muted rounded-lg p-3 text-sm">
                  ✅ Rozpoznáno: ALZA.CZ
                  <br />💰 Částka: 24 999 Kč
                  <br />🏢 IČO/DIČ: automaticky
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
                <p className="text-muted-foreground">Kompletní účetní záznam + daňové přiznání</p>
                <div className="mt-4 bg-muted rounded-lg p-3 text-sm">
                  📊 Přehled připraven
                  <br />📄 Export pro účetní
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Kompletní funkcionalita</h2>
            <p className="text-xl text-muted-foreground">Vše, co potřebujete pro profesionální účetnictví OSVČ</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Core Features */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Bot className="h-8 w-8 text-[#25D366]" />
                  <CardTitle className="text-lg">AI Kategorizace</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Automatické rozpoznání výdajů, příjmů a jejich správné zařazení do účetních kategorií
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-8 w-8 text-[#25D366]" />
                  <CardTitle className="text-lg">WhatsApp Interface</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  100% práce přes WhatsApp - žádné složité programy ani weby k instalaci
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📸</span>
                  <CardTitle className="text-lg">Skenování účtenek</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
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

          <div className="text-center mt-12">
            <p className="text-lg text-muted-foreground mb-6">
              A to není všechno - přidáváme nové funkce každý měsíc podle vašich potřeb!
            </p>
            <Button 
              size="lg" 
              className="bg-[#25D366] hover:bg-[#128C7E] text-white"
              onClick={() => window.location.href = '/funkce'}
              disabled={loading}
            >
              {loading ? 'Načítá...' : 'Zobrazit všechny funkce'}
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="cenik" className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
              <span className="block">7 dní k vyzkoušení</span>
              <span className="block text-green-600">ZDARMA</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-8">
            <div className="animate-slide-in-left">
              <PricingCard plan="monthly" />
            </div>
            <div className="animate-slide-in-right" style={{animationDelay: '0.2s'}}>
              <PricingCard plan="yearly" isPopular={true} />
            </div>
          </div>



          <div className="text-center mt-12">
            <p className="text-lg text-muted-foreground mb-3">
              Bez závazků • Zrušte kdykoliv • Podpora v češtině
            </p>
            <p className="text-base text-gray-500">
              *Ceny jsou uvedeny bez DPH
            </p>
          </div>
        </div>
      </section>

      {/* Integrace Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Integrace s vašimi nástroji</h2>
            <p className="text-xl text-muted-foreground">Propojte DokladBot s aplikacemi, které už používáte</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏦</span>
                </div>
                <CardTitle>Banky</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Automatický import transakcí z vašeho bankovního účtu
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline">Fio banka</Badge>
                  <Badge variant="outline">ČSOB</Badge>
                  <Badge variant="outline">KB</Badge>
                  <Badge variant="outline">Moneta</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <CardTitle>Účetní software</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Export dat přímo do vašeho účetního systému
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline">iDoklad</Badge>
                  <Badge variant="outline">Money S3</Badge>
                  <Badge variant="outline">Pohoda</Badge>
                  <Badge variant="outline">Excel</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🛒</span>
                </div>
                <CardTitle>E-commerce</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Propojení s e-shopy a platebními branami
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline">Shoptet</Badge>
                  <Badge variant="outline">WooCommerce</Badge>
                  <Badge variant="outline">Shopify</Badge>
                  <Badge variant="outline">GoPay</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gradient-to-r from-[#25D366]/10 to-[#075E54]/10 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">API pro vývojáře</h3>
            <p className="text-lg text-muted-foreground mb-6">
              Plánujeme REST API pro vlastní integrace. Dejte nám vědět o vašich potřebách!
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <Badge variant="outline">REST API</Badge>
              <Badge variant="outline">Webhooks</Badge>
              <Badge variant="outline">OAuth 2.0</Badge>
              <Badge variant="outline">OpenAPI 3.0</Badge>
            </div>
            <Button 
              variant="outline" 
              className="border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white"
              onClick={() => window.location.href = 'mailto:info@dokladbot.cz?subject=Zájem o API integraci&body=Dobrý den,%0A%0Amám zájem o API přístup k DokladBotu pro integraci s:%0A- %0A- %0A%0AKontaktní údaje:%0ANázev společnosti: %0AKontaktní osoba: %0ATelefon: %0A%0Aděkuji za informace.%0A%0AS pozdravem'}
            >
              Napsat na info@dokladbot.cz
            </Button>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Bezpečnost na prvním místě</h2>
            <p className="text-xl text-muted-foreground">Vaše data jsou v bezpečí díky špičkovým bezpečnostním opatřením</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-lg">End-to-End šifrování</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  AES-256 šifrování všech dat v pohybu i v klidu
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🇨🇿</span>
                </div>
                <CardTitle className="text-lg">Data v ČR</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Všechna data jsou uložená výhradně na českých serverech
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📋</span>
                </div>
                <CardTitle className="text-lg">GDPR Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Plné dodržování GDPR s možností exportu a smazání dat
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <CardTitle className="text-lg">ISO 27001</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Certifikované bezpečnostní procesy a pravidelné audity
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-muted/50 rounded-2xl p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">Transparentnost bezpečnosti</h3>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-[#25D366] flex-shrink-0" />
                    <span>Pravidelné penetrační testy</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-[#25D366] flex-shrink-0" />
                    <span>Dvoufaktorová autentizace</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-[#25D366] flex-shrink-0" />
                    <span>Automatické zálohy</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-[#25D366] flex-shrink-0" />
                    <span>24/7 monitoring</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg">
                <div className="text-center mb-4">
                  <Shield className="h-12 w-12 text-[#25D366] mx-auto mb-2" />
                  <h4 className="font-bold">99.9% Uptime</h4>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Garantujeme dostupnost služby s kompenzacemi za výpadky
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Accounting Firms Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Pro účetní kanceláře</h2>
            <p className="text-xl text-muted-foreground">Rozšiřte své služby o moderní řešení pro vaše klienty</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-2xl font-bold mb-6">Partner program pro účetní</h3>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-[#25D366] flex-shrink-0 mt-1" />
                  <div>
                    <span className="font-semibold">Individuální provize</span>
                    <p className="text-muted-foreground text-sm">podle počtu klientů a objemu</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-[#25D366] flex-shrink-0 mt-1" />
                  <div>
                    <span className="font-semibold">Vlastní branding</span>
                    <p className="text-muted-foreground text-sm">Bot může vystupovat pod vaší značkou</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-[#25D366] flex-shrink-0 mt-1" />
                  <div>
                    <span className="font-semibold">Centralizovaná správa</span>
                    <p className="text-muted-foreground text-sm">Spravujte všechny své klienty z jednoho místa</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-[#25D366] flex-shrink-0 mt-1" />
                  <div>
                    <span className="font-semibold">Školení a podpora</span>
                    <p className="text-muted-foreground text-sm">Kompletní onboarding pro váš tým</p>
                  </div>
                </li>
              </ul>
              <Button 
                className="mt-6 bg-[#25D366] hover:bg-[#128C7E] text-white"
                onClick={handlePartnerClick}
              >
                Staňte se partnerem
              </Button>
            </div>

            <Card className="p-6">
              <CardHeader>
                <CardTitle className="text-center">Výhody pro vaše klienty</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#25D366]/10 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-[#25D366]" />
                  </div>
                  <span>Výrazná úspora času na evidenci</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#25D366]/10 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-[#25D366]" />
                  </div>
                  <span>Průběžné předání podkladů</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#25D366]/10 rounded-full flex items-center justify-center">
                    <Shield className="h-4 w-4 text-[#25D366]" />
                  </div>
                  <span>Významné snížení chybovosti</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#25D366]/10 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-[#25D366]" />
                  </div>
                  <span>AI asistent pro dotazy</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gradient-to-r from-[#25D366]/10 to-[#075E54]/10 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Připravujeme partner program</h3>
            <p className="text-lg text-muted-foreground mb-6">
              Hledáme účetní kanceláře, které chtějí nabídnout svým klientům moderní řešení účetnictví.
            </p>
            <div className="grid md:grid-cols-3 gap-8 mb-6">
              <div>
                <div className="text-xl font-bold text-[#25D366] mb-2">Individuální</div>
                <p className="text-muted-foreground">podmínky provize</p>
              </div>
              <div>
                <div className="text-xl font-bold text-[#25D366] mb-2">Vlastní</div>
                <p className="text-muted-foreground">branding a označení</p>
              </div>
              <div>
                <div className="text-xl font-bold text-[#25D366] mb-2">Kompletní</div>
                <p className="text-muted-foreground">technická podpora</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              Kontaktujte nás pro více informací o partnerském programu
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Porovnání s konkurencí</h2>
            <p className="text-xl text-muted-foreground">Proč je DokladBot nejlepší volba</p>
          </div>

          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="min-w-full bg-card rounded-lg shadow-lg">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 sm:p-4 text-xs sm:text-base"></th>
                  <th className="text-center p-2 sm:p-4 bg-[#25D366]/10">
                    <div className="font-bold text-xs sm:text-base">DokladBot</div>
                  </th>
                  <th className="text-center p-2 sm:p-4">
                    <div className="blur-sm text-xs sm:text-base">Konkurent A</div>
                  </th>
                  <th className="text-center p-2 sm:p-4">
                    <div className="blur-sm text-xs sm:text-base">Konkurent B</div>
                  </th>
                  <th className="text-center p-2 sm:p-4">
                    <div className="blur-sm text-xs sm:text-base">Konkurent C</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 sm:p-4 font-medium text-xs sm:text-base">Cena</td>
                  <td className="text-center p-2 sm:p-4 bg-[#25D366]/10 font-bold text-xs sm:text-base">199 Kč</td>
                  <td className="text-center p-2 sm:p-4 text-xs sm:text-base">399 Kč</td>
                  <td className="text-center p-2 sm:p-4 text-xs sm:text-base">690 Kč</td>
                  <td className="text-center p-2 sm:p-4 text-xs sm:text-base">950 Kč</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 sm:p-4 font-medium text-xs sm:text-base">Čas na naučení</td>
                  <td className="text-center p-2 sm:p-4 bg-[#25D366]/10 font-bold text-xs sm:text-base">5 minut</td>
                  <td className="text-center p-2 sm:p-4 text-xs sm:text-base">2 hodiny</td>
                  <td className="text-center p-2 sm:p-4 text-xs sm:text-base">2 dny</td>
                  <td className="text-center p-2 sm:p-4 text-xs sm:text-base">Týden</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 sm:p-4 font-medium text-xs sm:text-base">Mobilní použití</td>
                  <td className="text-center p-2 sm:p-4 bg-[#25D366]/10">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-[#25D366] mx-auto" />
                    <div className="text-xs sm:text-sm">WhatsApp</div>
                  </td>
                  <td className="text-center p-2 sm:p-4">
                    <div className="text-yellow-500">⚠️</div>
                    <div className="text-xs sm:text-sm">Omezené</div>
                  </td>
                  <td className="text-center p-2 sm:p-4">
                    <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mx-auto" />
                  </td>
                  <td className="text-center p-2 sm:p-4">
                    <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 sm:p-4 font-medium text-xs sm:text-base">AI asistent</td>
                  <td className="text-center p-2 sm:p-4 bg-[#25D366]/10">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-[#25D366] mx-auto" />
                  </td>
                  <td className="text-center p-2 sm:p-4">
                    <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mx-auto" />
                  </td>
                  <td className="text-center p-2 sm:p-4">
                    <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mx-auto" />
                  </td>
                  <td className="text-center p-2 sm:p-4">
                    <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="p-2 sm:p-4 font-medium text-xs sm:text-base">České prostředí</td>
                  <td className="text-center p-2 sm:p-4 bg-[#25D366]/10">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-[#25D366] mx-auto" />
                  </td>
                  <td className="text-center p-2 sm:p-4">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-[#25D366] mx-auto" />
                  </td>
                  <td className="text-center p-2 sm:p-4">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-[#25D366] mx-auto" />
                  </td>
                  <td className="text-center p-2 sm:p-4">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-[#25D366] mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="recenze" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Výsledky, které mluví za vše</h2>
            <p className="text-xl text-muted-foreground">Reálná čísla od našich prvních uživatelů</p>
          </div>

          {/* Statistics */}
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
              <div className="text-4xl font-bold text-[#25D366] mb-2">{apiStats?.total_transactions || '300+'}</div>
              <p className="text-muted-foreground">zpracovaných transakcí</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#25D366] mb-2">{apiStats?.active_users || 40}</div>
              <p className="text-muted-foreground">aktivních uživatelů</p>
            </div>
          </div>

          {/* Enhanced Testimonials */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-[#25D366]">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar>
                    <AvatarImage src="/jan-novak-portrait.png" />
                    <AvatarFallback>RM</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Rostislav M.</div>
                    <div className="text-sm text-muted-foreground">IT konzultant</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Konečně aplikace, která chápe, že nechci řešit účetnictví. Pošlu fotku účtenky z mobilu a je to. Používám už několik měsíců."
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-[#25D366]">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar>
                    <AvatarImage src="/marie-svobodova-portrait.png" />
                    <AvatarFallback>NŽ</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Natalie Ž.</div>
                    <div className="text-sm text-muted-foreground">Grafička</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "DokladBot používám už několik měsíců. Líbí se mi, že se rychle vyvíjí a přidávají nové funkce podle potřeb uživatelů."
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-[#25D366]">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar>
                    <AvatarImage src="/petr-dvorak-portrait.png" />
                    <AvatarFallback>VD</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Viktor D.</div>
                    <div className="text-sm text-muted-foreground">Elektrikář</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "DokladBot je rozhodně jednodušší než Excel tabulky. Oceňuji funkce přímo navržené pro řemeslníky."
                </p>
              </CardContent>
            </Card>
          </div>


          {/* CTA Section */}
          <div className="bg-gradient-to-r from-[#25D366]/10 to-[#075E54]/10 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Staňte se dalším beta testerem</h3>
            <p className="text-muted-foreground mb-6">
              Připojte se k našim 50+ beta testerům a pomozte vytvořit nejlepší účetní řešení
            </p>
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="text-3xl font-bold text-[#25D366] mb-2">320+</div>
                <p className="text-muted-foreground text-sm">zpracovaných účtenek</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#25D366] mb-2">50+</div>
                <p className="text-muted-foreground text-sm">spokojených uživatelů</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#25D366] mb-2">85%</div>
                <p className="text-muted-foreground text-sm">úspěšnost rozpoznání</p>
              </div>
            </div>
            <Button 
              size="lg" 
              className="bg-[#25D366] hover:bg-[#128C7E] text-white text-lg px-8 py-6 font-semibold"
              onClick={handleRegister}
            >
              VYZKOUŠET ZDARMA
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Často kladené otázky</h2>
            <p className="text-xl text-muted-foreground">Vše, co potřebujete vědět o DokladBotu</p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="whatsapp">
              <AccordionTrigger>Jak to funguje s WhatsAppem?</AccordionTrigger>
              <AccordionContent>
                Jednoduše přidáte náš bot do kontaktů a začnete mu psát. Stačí napsat "Koupil jsem papír za 500" nebo
                poslat fotku účtenky. Bot vše automaticky zpracuje a zařadí do správné kategorie.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="whatsapp-devices">
              <AccordionTrigger>Můžu používat WhatsApp na počítači i telefonu?</AccordionTrigger>
              <AccordionContent>
                Ano! WhatsApp můžete používat současně na telefonu, tabletu i počítači. Stačí si na počítači otevřít 
                web.whatsapp.com a naskenovat QR kód telefonem. Pak můžete psát botovi z jakéhokoli zařízení - 
                z mobilu cestou, z počítače v kanceláři nebo z tabletu doma na gauči.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="mistakes">
              <AccordionTrigger>Co když udělám chybu?</AccordionTrigger>
              <AccordionContent>
                Žádný problém! Stačí napsat "oprav poslední záznam" nebo "změň kategorii na..." a bot vše upraví.
                Všechny změny jsou zaznamenané a můžete je kdykoli zkontrolovat.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="accountant">
              <AccordionTrigger>Můžu to propojit s účetní?</AccordionTrigger>
              <AccordionContent>
                Samozřejmě! DokladBot umí exportovat data v různých formátech (Excel, CSV, XML) přímo pro vaši účetní.
                Mnoho účetních už s námi spolupracuje a oceňuje kvalitu připravených podkladů.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="dph">
              <AccordionTrigger>Funguje to i pro plátce DPH?</AccordionTrigger>
              <AccordionContent>
                Ano, DokladBot automaticky rozpozná DPH a správně ho zpracuje. Umí také připomínat termíny pro podání DPH
                přiznání a hlídat limity pro registraci k DPH.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="security">
              <AccordionTrigger>Jak je to s bezpečností dat?</AccordionTrigger>
              <AccordionContent>
                Vaše data jsou v bezpečí. Používáme end-to-end šifrování, všechna data jsou uložená v ČR, jsme v souladu
                s GDPR a pravidelně procházíme bezpečnostními audity.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cost">
              <AccordionTrigger>Kolik to stojí?</AccordionTrigger>
              <AccordionContent>
                DokladBot můžete vyzkoušet 7 dní zcela zdarma! Poté stojí 199 Kč/měsíc nebo 166 Kč/měsíc při ročním předplatném 
                (+ 2 měsíce zdarma, ušetříte 398 Kč). Ceny jsou uvedeny bez DPH. Během Launch Week si zajistíte doživotní cenu - 
                po akci se ceny zvýší!
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="does_it_work">
              <AccordionTrigger>Funguje to opravdu?</AccordionTrigger>
              <AccordionContent>
                Ano! DokladBot už používá desítky podnikatelů v Česku. AI rozpozná 90%+ účtenek správně 
                a co nerozpozná, můžete rychle opravit jednou zprávou. Většina uživatelů ušetří 10+ hodin měsíčně.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="time_savings">
              <AccordionTrigger>Jak rychle začnu šetřit čas?</AccordionTrigger>
              <AccordionContent>
                Okamžitě! Už první účtenka kterou pošlete se zpracuje za pár sekund. Většina našich uživatelů 
                ušetří první hodinu již v prvním týdnu používání. Čím více DokladBot používáte, tím více času ušetříte.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#25D366]/10 to-[#075E54]/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Začněte používat profesionální účetnictví
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Jednoduché účetnictví přes WhatsApp. Bez složitých programů, bez školení.
          </p>
          <Button 
            size="lg" 
            className="bg-[#25D366] hover:bg-[#128C7E] text-white text-lg px-8 py-6 animate-pulse"
            onClick={handleRegister}
          >
            Získat přístup
          </Button>
          
        </div>
      </section>

      {/* Why Now Section */}

      {/* Footer */}
      <footer className="bg-background border-t py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <MessageCircle className="h-6 w-6 text-[#25D366]" />
                <span className="text-lg font-bold">DokladBot</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Moderní řešení účetnictví pro OSVČ přímo ve WhatsAppu. Jednoduše, rychle, spolehlivě.
              </p>
              <div className="flex space-x-4">
                <button 
                  onClick={() => window.open('https://linkedin.com/company/dokladbot', '_blank')} 
                  className="text-muted-foreground hover:text-[#25D366]"
                >
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                  </svg>
                </button>
                <button 
                  onClick={() => window.open('https://facebook.com/dokladbot', '_blank')} 
                  className="text-muted-foreground hover:text-[#25D366]"
                >
                  <span className="sr-only">Facebook</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                  </svg>
                </button>
                <button 
                  onClick={() => window.open('https://youtube.com/@dokladbot', '_blank')} 
                  className="text-muted-foreground hover:text-[#25D366]"
                >
                  <span className="sr-only">YouTube</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm6.39-2.908a.75.75 0 01.766.027l3.5 2.25a.75.75 0 010 1.262l-3.5 2.25A.75.75 0 018 12.25v-4.5a.75.75 0 01.39-.658z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produkt</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button 
                    onClick={() => scrollToSection("cenik")} 
                    className="hover:text-foreground text-left"
                  >
                    Ceník
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => window.location.href = '/jak-to-funguje'} 
                    className="hover:text-foreground text-left"
                  >
                    Jak to funguje
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => window.location.href = '/recenze'} 
                    className="hover:text-foreground text-left"
                  >
                    Recenze
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => window.location.href = '/funkce'} 
                    className="hover:text-foreground text-left"
                  >
                    Funkcionalita
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Podpora</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button 
                    onClick={() => window.location.href = '/napoveda'} 
                    className="hover:text-foreground text-left"
                  >
                    Nápověda
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => window.location.href = '/navody'} 
                    className="hover:text-foreground text-left"
                  >
                    Návody
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => window.location.href = '/spravovat-predplatne'} 
                    className="hover:text-foreground text-left"
                  >
                    Spravovat předplatné
                  </button>
                </li>
                <li>
                  <a href="mailto:api@dokladbot.cz" className="hover:text-foreground">
                    API (v přípravě)
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Společnost</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button 
                    onClick={() => window.location.href = '/o-nas'} 
                    className="hover:text-foreground text-left"
                  >
                    O nás
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => window.location.href = '/kariera'} 
                    className="hover:text-foreground text-left"
                  >
                    Kariéra
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => window.location.href = '/partneri'} 
                    className="hover:text-foreground text-left"
                  >
                    Partneři
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => window.location.href = '/kontakt'} 
                    className="hover:text-foreground text-left"
                  >
                    Kontakt
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  <button onClick={() => window.location.href = '/obchodni-podminky'} className="hover:text-foreground">Obchodní podmínky</button>
                  <button onClick={() => window.location.href = '/ochrana-osobnich-udaju'} className="hover:text-foreground">Ochrana osobních údajů</button>
                  <button onClick={() => window.location.href = '/gdpr'} className="hover:text-foreground">GDPR</button>
                  <button onClick={() => window.location.href = '/cookies'} className="hover:text-foreground">Cookies</button>
                  <button onClick={() => window.location.href = '/reklamace'} className="hover:text-foreground">Reklamace</button>
                </div>
                <p className="text-sm text-muted-foreground">
                  &copy; 2025 DokladBot • IČO: 22161104 • Všechna práva vyhrazena.
                </p>
              </div>
              
              <div className="text-right">
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Kontakt</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>📧 info@dokladbot.cz</div>
                    <div>🕐 Po-Pá 9:00-17:00</div>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  )
}
