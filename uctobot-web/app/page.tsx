"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, X, MessageCircle, Bot, Clock, Shield, TrendingUp, Smartphone, Moon, Sun, Menu } from "lucide-react"
import { authAPI, paymentsAPI, tokenManager } from "@/lib/api"
import { PricingCard } from "@/components/PricingCard"

// Types for API data
interface ApiStats {
  total_users: number
  active_users: number
  total_transactions: number
  total_revenue: number
}

export default function UctoBotLanding() {
  const [darkMode, setDarkMode] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiStats, setApiStats] = useState<ApiStats | null>(null)
  const [chatMessages, setChatMessages] = useState([
    { type: "bot", text: "👋 Ahoj! Jsem váš AI účetní asistent.\n\nMůžete mi poslat:\n• Fotku účtenky\n• Text jako \"Koupil benzín 800\"\n• Faktura od dodavatele\n\nVše automaticky zařadím a připravím pro daňové přiznání. Začněme!" },
  ])
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  // Fetch API stats on component mount
  useEffect(() => {
    const fetchApiStats = async () => {
      try {
        const [userStatsRes, transactionStatsRes] = await Promise.all([
          fetch('https://uctobot.vercel.app/api/users/stats'),
          fetch('https://uctobot.vercel.app/api/transactions/stats')
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
        console.log('API stats not available, using fallback values')
        // Fallback to static values if API is not available
        setApiStats({
          total_users: 500,
          active_users: 425,
          total_transactions: 23500,
          total_revenue: 2300000
        })
      }
    }

    fetchApiStats()
  }, [])

  const handleDemoMessage = (message: string) => {
    let botResponse = ""
    
    if (message.includes("notebook") || message.includes("laptop")) {
      botResponse = `✅ Zpracováno během 2 sekund!

📊 DETAIL TRANSAKCE:
━━━━━━━━━━━━━━━━━━━
💰 Částka: 25 000 Kč
📂 Kategorie: IT vybavení a software
📅 Datum: ${new Date().toLocaleDateString('cs-CZ')}
🏢 Dodavatel: Automaticky rozpoznán
📋 Odpočet z daní: ANO (100%)

💡 Po aktivaci můžete přidat další výdaj nebo napsat 'přehled'`
    } else if (message.includes("benzín") || message.includes("palivo")) {
      botResponse = `✅ Zpracováno během 1 sekundy!

📊 DETAIL TRANSAKCE:
━━━━━━━━━━━━━━━━━━━
💰 Částka: 1 500 Kč
📂 Kategorie: Pohonné hmoty
📅 Datum: ${new Date().toLocaleDateString('cs-CZ')}
⛽ Typ: Automaticky rozpoznán
📋 Odpočet z daní: ANO (100%)

🚗 Kilometráž automaticky aktualizována`
    } else if (message.includes("Seznam") || message.includes("reklama")) {
      botResponse = `✅ Zpracováno během 1 sekundy!

📊 DETAIL TRANSAKCE:
━━━━━━━━━━━━━━━━━━━
💰 Částka: 45 000 Kč
📂 Kategorie: Marketing a reklama
📅 Datum: ${new Date().toLocaleDateString('cs-CZ')}
🏢 Dodavatel: Seznam.cz a.s.
📋 Odpočet z daní: ANO (100%)
📄 DPH: 21% (7 810 Kč)

📁 Faktura uložena do složky "Marketing"`
    } else if (message.includes("oběd") || message.includes("káva") || message.includes("450")) {
      botResponse = `✅ Zpracováno během 1 sekundy!

📊 DETAIL TRANSAKCE:
━━━━━━━━━━━━━━━━━━━
💰 Částka: 450 Kč
📂 Kategorie: Reprezentace
📅 Datum: ${new Date().toLocaleDateString('cs-CZ')}
🍽️ Typ: Služební občerstvení
📋 Odpočet z daní: ANO (100%)

💡 Tip: Reprezentace je plně odpočitatelná!`
    } else {
      botResponse = `✅ Zpracováno během 2 sekund!

📊 DETAIL TRANSAKCE:
━━━━━━━━━━━━━━━━━━━
💰 Částka: Automaticky rozpoznána
📂 Kategorie: AI určila správnou kategorii
📅 Datum: ${new Date().toLocaleDateString('cs-CZ')}
📋 Připraveno pro účetní

💡 Po aktivaci můžete přidat další nebo vidět přehled`
    }

    setChatMessages((prev) => [
      ...prev,
      { type: "user", text: message },
      { type: "bot", text: botResponse },
    ])

    // Auto-scroll to bottom after adding messages
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
      }
    }, 100)
  }

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    setMobileMenuOpen(false)
  }

  const handleRegister = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Starting registration flow...')
      
      // Redirect to WhatsApp for registration
      window.open('https://wa.me/420777123456?text=Mám zájem o ÚčtoBot. Prosím kontaktujte mě.', '_blank')
      
    } catch (err) {
      console.error('Registration error:', err)
      setError('Chyba při registraci. Zkuste to znovu.')
    } finally {
      setLoading(false)
    }
  }

  const handlePricingClick = async (planType: 'monthly' | 'annual') => {
    try {
      setLoading(true)
      setError(null)
      console.log('Starting pricing flow for:', planType)
      
      // Redirect to WhatsApp with plan info  
      const message = planType === 'annual' 
        ? 'Chci objednat roční plán ÚčtoBot za 2990 Kč (249 Kč/měsíc). Prosím kontaktujte mě.'
        : 'Chci objednat měsíční plán ÚčtoBot za 299 Kč. Prosím kontaktujte mě.'
      
      window.open(`https://wa.me/420777123456?text=${encodeURIComponent(message)}`, '_blank')
      
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
      window.location.href = 'mailto:partner@uctobot.cz?subject=Zájem o partnerství&body=Dobrý den,%0A%0Amám zájem o partnerský program pro účetní kanceláře.%0A%0AKontaktní údaje:%0ANázev společnosti: %0AKontaktní osoba: %0ATelefon: %0AE-mail: %0A%0Aděkuji za informace.%0A%0AS pozdravem'
    } catch (err) {
      console.error('Partner click error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
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

      {/* Sticky Banner */}
      <div className="bg-[#25D366] text-white py-2 px-4 text-center text-sm font-medium">
        🎯 Profesionální účetnictví přes WhatsApp • Již od 299 Kč/měsíc
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-8 w-8 text-[#25D366]" />
              <span className="text-xl font-bold">ÚčtoBot</span>
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
              <a 
                href="/dashboard" 
                className="text-muted-foreground hover:text-foreground"
              >
                Dashboard
              </a>
              <Button variant="ghost" size="sm" onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button 
                className="bg-[#25D366] hover:bg-[#128C7E] text-white"
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? 'Načítá...' : 'Začít nyní'}
              </Button>
            </div>

            <div className="md:hidden flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
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
              <Button 
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white mt-2"
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? 'Načítá...' : 'Začít nyní'}
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                  Účetnictví přes WhatsApp za <span className="text-[#25D366]">5 vteřin</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Napište "Koupil jsem papír za 500" a máte hotovo. Žádné složité programy, žádné školení.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-[#25D366]" />
                  <span>{apiStats?.total_users || 500}+ spokojených OSVČ</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-[#25D366]" />
                  <span>Ušetříte 10 hodin měsíčně</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-[#25D366]" />
                  <span>Schváleno Komorou účetních</span>
                </div>
              </div>

              <Button 
                size="lg" 
                className="bg-[#25D366] hover:bg-[#128C7E] text-white text-lg px-8 py-6 animate-pulse"
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? 'Načítá...' : 'Začít nyní'}
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
                      <div className="font-semibold">ÚčtoBot</div>
                      <div className="text-xs text-green-500">online</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-sm">
                      Ahoj! Napište mi jakýkoliv výdaj.
                    </div>
                    <div className="bg-[#25D366] text-white rounded-lg p-3 text-sm ml-8">faktura Alza 25000</div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-sm">
                      ✅ Zpracováno!
                      <br />
                      Částka: 25 000 Kč
                      <br />
                      Kategorie: IT vybavení
                      <br />
                      Datum: dnes
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
                <p className="text-muted-foreground">Pošlete fotku účtenky nebo napište text</p>
                <div className="mt-4 bg-muted rounded-lg p-3 text-sm">"Koupil jsem notebook za 25000"</div>
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
                <p className="text-muted-foreground">AI rozpozná částku, kategorii a uloží</p>
                <div className="mt-4 bg-muted rounded-lg p-3 text-sm">
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
                <p className="text-muted-foreground">Konec roku? Daňové přiznání máte připravené</p>
                <div className="mt-4 bg-muted rounded-lg p-3 text-sm">
                  📊 Přehled připraven
                  <br />📄 Export pro účetní
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Vyzkoušejte si to</h2>
            <p className="text-xl text-muted-foreground">Klikněte na zprávu a uvidíte, jak rychle to funguje</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 max-w-md mx-auto">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b">
              <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-semibold">ÚčtoBot</div>
                <div className="text-xs text-green-500">online</div>
              </div>
            </div>

            <div ref={chatContainerRef} className="space-y-3 mb-6 max-h-80 overflow-y-auto scroll-smooth">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`${msg.type === "user" ? "ml-8" : ""}`}>
                  <div
                    className={`rounded-lg p-4 text-sm ${
                      msg.type === "user" ? "bg-[#25D366] text-white" : "bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    <div className="whitespace-pre-line leading-relaxed">
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">Vyzkoušejte si některou z těchto zpráv:</p>
              <Button
                variant="outline"
                className="w-full justify-start text-left bg-transparent hover:bg-[#25D366]/10"
                onClick={() => handleDemoMessage("Koupil jsem notebook za 25000")}
              >
                💻 "Koupil jsem notebook za 25000"
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-left bg-transparent hover:bg-[#25D366]/10"
                onClick={() => handleDemoMessage("Benzín 1500")}
              >
                ⛽ "Benzín 1500"
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-left bg-transparent hover:bg-[#25D366]/10"
                onClick={() => handleDemoMessage("Faktura od Seznam.cz 45000")}
              >
                📄 "Faktura od Seznam.cz 45000"
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-left bg-transparent hover:bg-[#25D366]/10"
                onClick={() => handleDemoMessage("Služební oběd 450")}
              >
                🍽️ "Služební oběd 450"
              </Button>
            </div>
          </div>

          <p className="text-center mt-8 text-lg font-medium">Takhle jednoduše to funguje. Každý den.</p>
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
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? 'Načítá...' : 'Zobrazit všechny funkce'}
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="cenik" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Vyberte si plán</h2>
            <p className="text-xl text-muted-foreground">Transparentní ceny bez skrytých poplatků</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <PricingCard plan="monthly" />
            <PricingCard plan="yearly" isPopular={true} />
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground">
              Bez závazků • Zrušte kdykoliv • Podpora v češtině
            </p>
          </div>
        </div>
      </section>

      {/* Integrace Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Integrace s vašimi nástroji</h2>
            <p className="text-xl text-muted-foreground">Propojte ÚčtoBot s aplikacemi, které už používáte</p>
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
              onClick={() => window.location.href = 'mailto:api@uctobot.cz?subject=Zájem o API integraci&body=Dobrý den,%0A%0Amám zájem o API přístup k ÚčtoBotu pro integraci s:%0A- %0A- %0A%0AKontaktní údaje:%0ANázev společnosti: %0AKontaktní osoba: %0ATelefon: %0A%0Aděkuji za informace.%0A%0AS pozdravem'}
            >
              Napsat na api@uctobot.cz
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
                    <span className="font-semibold">30% provize</span>
                    <p className="text-muted-foreground text-sm">z každého klienta, kterého přivedete</p>
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
                  <span>Ušetří 80% času na evidenci</span>
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
                  <span>Snížení chybovosti o 95%</span>
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
            <h3 className="text-2xl font-bold mb-4">Případová studie</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-bold text-[#25D366] mb-2">150+</div>
                <p className="text-muted-foreground">klientů na jeden účetní</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#25D366] mb-2">75%</div>
                <p className="text-muted-foreground">méně času na kontrolu</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#25D366] mb-2">95%</div>
                <p className="text-muted-foreground">spokojenost klientů</p>
              </div>
            </div>
            <p className="text-muted-foreground mt-6">
              "Díky ÚčtoBotu můžeme obsluhovat 3x více klientů se stejným týmem"
            </p>
            <p className="text-sm font-semibold">— Účetní kancelář EXPERT, Praha</p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Porovnání s konkurencí</h2>
            <p className="text-xl text-muted-foreground">Proč je ÚčtoBot nejlepší volba</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-card rounded-lg shadow-lg">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4"></th>
                  <th className="text-center p-4 bg-[#25D366]/10">
                    <div className="font-bold">ÚčtoBot</div>
                  </th>
                  <th className="text-center p-4">
                    <div className="blur-sm">Konkurent A</div>
                  </th>
                  <th className="text-center p-4">
                    <div className="blur-sm">Konkurent B</div>
                  </th>
                  <th className="text-center p-4">
                    <div className="blur-sm">Konkurent C</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4 font-medium">Cena</td>
                  <td className="text-center p-4 bg-[#25D366]/10 font-bold">299 Kč</td>
                  <td className="text-center p-4">399 Kč</td>
                  <td className="text-center p-4">690 Kč</td>
                  <td className="text-center p-4">950 Kč</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Čas na naučení</td>
                  <td className="text-center p-4 bg-[#25D366]/10 font-bold">5 minut</td>
                  <td className="text-center p-4">2 hodiny</td>
                  <td className="text-center p-4">2 dny</td>
                  <td className="text-center p-4">Týden</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Mobilní použití</td>
                  <td className="text-center p-4 bg-[#25D366]/10">
                    <Check className="h-5 w-5 text-[#25D366] mx-auto" />
                    <div className="text-sm">WhatsApp</div>
                  </td>
                  <td className="text-center p-4">
                    <div className="text-yellow-500">⚠️</div>
                    <div className="text-sm">Omezené</div>
                  </td>
                  <td className="text-center p-4">
                    <X className="h-5 w-5 text-red-500 mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <X className="h-5 w-5 text-red-500 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">AI asistent</td>
                  <td className="text-center p-4 bg-[#25D366]/10">
                    <Check className="h-5 w-5 text-[#25D366] mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <X className="h-5 w-5 text-red-500 mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <X className="h-5 w-5 text-red-500 mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <X className="h-5 w-5 text-red-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">České prostředí</td>
                  <td className="text-center p-4 bg-[#25D366]/10">
                    <Check className="h-5 w-5 text-[#25D366] mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <Check className="h-5 w-5 text-[#25D366] mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <Check className="h-5 w-5 text-[#25D366] mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <Check className="h-5 w-5 text-[#25D366] mx-auto" />
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
            <p className="text-xl text-muted-foreground">Reální čísla od našich {apiStats?.total_users || 500}+ klientů</p>
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
              <div className="text-4xl font-bold text-[#25D366] mb-2">{apiStats?.total_transactions || '23.5k'}</div>
              <p className="text-muted-foreground">zpracovaných transakcí</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#25D366] mb-2">{apiStats?.active_users || 425}</div>
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
                    <AvatarFallback>JN</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Jan Novák</div>
                    <div className="text-sm text-muted-foreground">IT konzultant • Praha</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Za 6 měsíců jsem zpracoval 890 transakcí bez jediné chyby. Dříve mi účetnictví zabralo celý víkend, teď to vyřídím během oběda."
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
                    <AvatarImage src="/marie-svobodova-portrait.png" />
                    <AvatarFallback>MS</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Marie Svobodová</div>
                    <div className="text-sm text-muted-foreground">Grafička • Brno</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Letos jsem díky ÚčtoBotu ušetřila 18 500 Kč za účetní. Peníze jsem investovala do nového vybavení a rozšířila podnikání."
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-[#25D366] font-semibold">3 500 Kč/měsíc → 599 Kč</div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-[#25D366]">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar>
                    <AvatarImage src="/petr-dvorak-portrait.png" />
                    <AvatarFallback>PD</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Petr Dvořák</div>
                    <div className="text-sm text-muted-foreground">Elektrikář • Ostrava</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Moje účetní říká, že jsem její nejpřipraveněší klient. Všechno má perfektně zařazené a popsané. DPH přiznání máme hotové za 20 minut."
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-[#25D366] font-semibold">Bez stresu z termínů</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* More testimonials */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card className="hover:shadow-lg transition-shadow">
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
                  "Jako kreativec jsem účetnictví nesnášel. Teď prostě pošlu foto účtenky a zapomenu na to. Bot mi dokonce našel 12 000 Kč v odpočtech, které bych přehlédl."
                </p>
                <div className="flex items-center space-x-2">
                  <div className="flex text-yellow-400">
                    {'★'.repeat(5)}
                  </div>
                  <span className="text-sm text-muted-foreground">• 12 000 Kč ušetřeno na daních</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
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
                  "Pracuji pro klienty ze zahraničí a ÚčtoBot mi automaticky přepočítává měny podle ČNB kurzů. Už nemám strach z chyb při přepočtech."
                </p>
                <div className="flex items-center space-x-2">
                  <div className="flex text-yellow-400">
                    {'★'.repeat(5)}
                  </div>
                  <span className="text-sm text-muted-foreground">• 0 chyb při přepočtech měn</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-[#25D366]/10 to-[#075E54]/10 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Staňte se dalším spokojeným klientem</h3>
            <p className="text-muted-foreground mb-6">
              Připojte se k více než {apiStats?.total_users || 500} OSVČ, kteří už nikdy nemusí řešit složité účetnictví
            </p>
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="text-3xl font-bold text-[#25D366] mb-2">{apiStats?.total_transactions || '2.3k'}</div>
                <p className="text-muted-foreground text-sm">zpracovaných transakcí</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#25D366] mb-2">{Math.round((apiStats?.total_users || 500) * 17.9)}</div>
                <p className="text-muted-foreground text-sm">hodin ušetřeného času</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#25D366] mb-2">{apiStats?.total_revenue ? `${Math.round(apiStats.total_revenue/1000)}k Kč` : '2.1M Kč'}</div>
                <p className="text-muted-foreground text-sm">celkový obrat klientů</p>
              </div>
            </div>
            <Button 
              size="lg" 
              className="bg-[#25D366] hover:bg-[#128C7E] text-white text-lg px-8 py-6"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? 'Načítá...' : 'Začít nyní'}
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Často kladené otázky</h2>
            <p className="text-xl text-muted-foreground">Vše, co potřebujete vědět o ÚčtoBotu</p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="whatsapp">
              <AccordionTrigger>Jak to funguje s WhatsAppem?</AccordionTrigger>
              <AccordionContent>
                Jednoduše přidáte náš bot do kontaktů a začnete mu psát. Stačí napsat "Koupil jsem papír za 500" nebo
                poslat fotku účtenky. Bot vše automaticky zpracuje a zařadí do správné kategorie.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="legal">
              <AccordionTrigger>Je to legální a uznává to finanční úřad?</AccordionTrigger>
              <AccordionContent>
                Ano, ÚčtoBot je plně v souladu s českými účetními standardy. Všechny záznamy jsou vedeny podle platných
                předpisů a jsou uznávané finančním úřadem. Máme schválení od Komory účetních.
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
                Samozřejmě! ÚčtoBot umí exportovat data v různých formátech (Excel, CSV, XML) přímo pro vaši účetní.
                Mnoho účetních už s námi spolupracuje a oceňuje kvalitu připravených podkladů.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="dph">
              <AccordionTrigger>Funguje to i pro plátce DPH?</AccordionTrigger>
              <AccordionContent>
                Ano, ÚčtoBot automaticky rozpozná DPH a správně ho zpracuje. Umí také připomínat termíny pro podání DPH
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
          </Accordion>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#25D366]/10 to-[#075E54]/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Připojte se k {apiStats?.total_users || 500}+ OSVČ, které už netrpí nad účetnictvím
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Průměrný uživatel ušetří 120 hodin ročně. To je 3 pracovní týdny!
          </p>
          <Button 
            size="lg" 
            className="bg-[#25D366] hover:bg-[#128C7E] text-white text-lg px-8 py-6 animate-pulse mb-4"
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? 'Načítá...' : 'Začít nyní'}
          </Button>
          <p className="text-sm text-muted-foreground">Po objednání pošlete 'START' na +420 123 456 789</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <MessageCircle className="h-6 w-6 text-[#25D366]" />
                <span className="text-lg font-bold">ÚčtoBot</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Moderní řešení účetnictví pro OSVČ přímo ve WhatsAppu. Jednoduše, rychle, spolehlivě.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-[#25D366]">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-[#25D366]">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-[#25D366]">
                  <span className="sr-only">YouTube</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm6.39-2.908a.75.75 0 01.766.027l3.5 2.25a.75.75 0 010 1.262l-3.5 2.25A.75.75 0 018 12.25v-4.5a.75.75 0 01.39-.658z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produkt</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#cenik" className="hover:text-foreground">
                    Ceník
                  </a>
                </li>
                <li>
                  <a href="#jak-funguje" className="hover:text-foreground">
                    Jak to funguje
                  </a>
                </li>
                <li>
                  <a href="#recenze" className="hover:text-foreground">
                    Recenze
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    Funkcionalita
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    Integrace
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    Pro účetní
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Podpora</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground">
                    Nápověda
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    Návody
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    Video tutoriály
                  </a>
                </li>
                <li>
                  <a href="mailto:api@uctobot.cz" className="hover:text-foreground">
                    API (v přípravě)
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    Status stránka
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    Bezpečnost
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Společnost</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground">
                    O nás
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    Kariéra
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    Tiskové zprávy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    Partneři
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    Kontakt
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  <a href="#" className="hover:text-foreground">Obchodní podmínky</a>
                  <a href="#" className="hover:text-foreground">Ochrana osobních údajů</a>
                  <a href="#" className="hover:text-foreground">GDPR</a>
                  <a href="#" className="hover:text-foreground">Cookies</a>
                  <a href="#" className="hover:text-foreground">Reklamace</a>
                </div>
                <p className="text-sm text-muted-foreground">
                  &copy; 2024 ÚčtoBot s.r.o. Všechna práva vyhrazena. IČ: 12345678
                </p>
              </div>
              
              <div className="text-right">
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Kontakt</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>📧 support@uctobot.cz</div>
                    <div>📞 +420 777 123 456</div>
                    <div>🕐 Po-Pá 9:00-17:00</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-2 text-sm text-muted-foreground">
                  <span>Hosting</span>
                  <Badge variant="outline" className="text-xs">
                    🇨🇿 České servery
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
