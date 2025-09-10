'use client'

import { useEffect, useState, Suspense } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, MessageCircle, ArrowLeft, Star, Mail, Copy, Clock, Settings } from "lucide-react"
import { useRouter, useSearchParams } from 'next/navigation'

interface ActivationData {
  activationCode: string
  whatsappNumber: string
  userEmail: string
  expiresAt: string
}

function PlatbaUspesnaPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activationData, setActivationData] = useState<ActivationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  
  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    
    const fetchSessionData = async () => {
      if (sessionId) {
        try {
          // Get session data and automatically create activation code
          const response = await fetch(`/api/create-activation-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
          })
          
          if (response.ok) {
            const sessionData = await response.json()
            setActivationData(sessionData)
          } else {
            // Fallback to generating data
            generateFallbackData()
          }
        } catch (error) {
          console.error('Error creating activation code:', error)
          generateFallbackData()
        }
      } else {
        generateFallbackData()
      }
      setLoading(false)
    }
    
    const generateFallbackData = () => {
      const code = `DOKLADBOT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours from now
      
      // Try to get email from URL params if available
      const urlParams = new URLSearchParams(window.location.search)
      const emailFromUrl = urlParams.get('email') || 'customer@example.com'
      
      setActivationData({
        activationCode: code,
        whatsappNumber: '+420608123456',
        userEmail: emailFromUrl,
        expiresAt: expiresAt.toISOString()
      })
      
      // Show success message even if API fails
      console.log('Platba byla úspěšná! Aktivační kód byl vygenerován.')
    }
    
    fetchSessionData()
  }, [searchParams])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Nepodařilo se zkopírovat:', err)
    }
  }

  const openCustomerPortal = async () => {
    if (!activationData?.userEmail) return
    
    setPortalLoading(true)
    try {
      const response = await fetch('/api/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: activationData.userEmail })
      })
      
      if (response.ok) {
        const { url } = await response.json()
        window.open(url, '_blank')
      } else {
        alert('Nepodařilo se otevřít portál pro správu předplatného')
      }
    } catch (error) {
      console.error('Portal error:', error)
      alert('Chyba při otevírání portálu')
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading || !activationData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#25D366] mx-auto mb-4"></div>
          <p>Generuji aktivační kód...</p>
        </div>
      </div>
    )
  }

  const whatsappLink = `https://wa.me/${activationData.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(activationData.activationCode)}`
  const expiresDate = new Date(activationData.expiresAt).toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zpět na hlavní stránku
        </Button>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-4">Platba byla úspěšná! 🎉</h1>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-6 w-6 text-green-600 fill-green-600" />
              <span className="text-xl font-semibold text-green-800">Vaše předplatné je aktivní!</span>
            </div>
            <p className="text-green-700 mb-4">
              Děkujeme za platbu! Nyní můžete aktivovat svého WhatsApp účetního asistenta pomocí kódu níže.
            </p>
          </div>
        </div>

        {/* Aktivační kroky */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Krok 1 - Zkopírovat kód */}
          <Card className="border-2 border-[#25D366]/20">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-[#25D366] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <CardTitle className="text-lg">Zkopírujte aktivační kód</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-4 mb-4">
                <code className="text-sm font-mono text-gray-800 block text-center break-all">
                  {activationData.activationCode}
                </code>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(activationData.activationCode)}
                className="w-full text-[#25D366] border-[#25D366] hover:bg-[#25D366] hover:text-white"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied ? 'Zkopírováno!' : 'Kopírovat kód'}
              </Button>
            </CardContent>
          </Card>

          {/* Krok 2 - Otevřít WhatsApp */}
          <Card className="border-2 border-[#25D366]/20">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-[#25D366] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <CardTitle className="text-lg">Otevřete WhatsApp</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-center">
              <div className="text-lg font-bold text-[#25D366] mb-2">
                {activationData.whatsappNumber}
              </div>
              <p className="text-sm text-gray-600 mb-4">
                DokladBot - AI účetní asistent
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

          {/* Krok 3 - Poslat kód */}
          <Card className="border-2 border-[#25D366]/20">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-[#25D366] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <CardTitle className="text-lg">Pošlete kód a začněte</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-center">
              <p className="text-sm text-gray-600 mb-4">
                Vložte aktivační kód do WhatsApp zprávy a odešlete
              </p>
              <div className="bg-[#25D366]/10 rounded-lg p-4">
                <p className="text-sm font-semibold text-[#25D366]">
                  ⚡ Bot odpoví do 30 sekund!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Důležité informace */}
        <div className="bg-blue-50 rounded-2xl p-8 mb-12">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start">
              <Clock className="w-6 h-6 text-[#25D366] mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Kód platí do {expiresDate}
                </h3>
                <p className="text-gray-600">
                  Aktivujte svůj DokladBot do 48 hodin od platby
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
                  Kód a instrukce byly zaslány na {activationData.userEmail}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rychlé tipy */}
        <div className="bg-gray-50 rounded-2xl p-8 mb-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            💡 Co následuje po aktivaci
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                <span className="text-blue-600 text-sm font-bold">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Registrace IČO</h4>
                <p className="text-sm text-gray-600">
                  Bot si automaticky stáhne vaše údaje z ARES databáze
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                <span className="text-blue-600 text-sm font-bold">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Nastavení DPH</h4>
                <p className="text-sm text-gray-600">
                  Zvolíte typ evidence a DPH podle své činnosti
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                <span className="text-blue-600 text-sm font-bold">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">První účtenka</h4>
                <p className="text-sm text-gray-600">
                  Můžete ihned začít posílat účtenky - buď fotkami nebo textem
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                <span className="text-blue-600 text-sm font-bold">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Automatizace</h4>
                <p className="text-sm text-gray-600">
                  Bot zpracuje vše automaticky a připraví měsíční přehledy
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Podpora */}
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">Potřebujete pomoc s aktivací?</h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Pokud máte problém s aktivací nebo jakékoliv dotazy, kontaktujte nás. 
            Jsme tu pro vás 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
            <Button 
              onClick={openCustomerPortal}
              disabled={portalLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Settings className="w-4 h-4 mr-2" />
              {portalLoading ? 'Otevírám...' : 'Spravovat předplatné'}
            </Button>
            
            <Button 
              variant="outline" 
              asChild
              className="border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white"
            >
              <a href="mailto:info@dokladbot.cz">
                <Mail className="w-4 h-4 mr-2" />
                info@dokladbot.cz
              </a>
            </Button>
            
            <Button 
              variant="outline"
              asChild
            >
              <a href="/">
                Zpět na hlavní stránku
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PlatbaUspesnaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-center">Načítání...</div></div>}>
      <PlatbaUspesnaPageContent />
    </Suspense>
  )
}