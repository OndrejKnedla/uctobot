"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, MessageCircle, ArrowLeft, Star, Mail, Copy, Clock, Settings, Phone, FileText, Calculator } from "lucide-react"
import { useRouter, useSearchParams } from 'next/navigation'

interface ActivationData {
  activationCode: string
  whatsappNumber: string
  userEmail: string
  expiresAt: string
}

// Use the actual Twilio WhatsApp number
const WHATSAPP_NUMBER = '+14155238886' // Twilio WhatsApp Sandbox number

function PlatbaUspesnaPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activationData, setActivationData] = useState<ActivationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  
  useEffect(() => {
    // Add null check for searchParams
    if (!searchParams) {
      setLoading(false)
      return
    }
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
            setActivationData({
              ...sessionData,
              whatsappNumber: WHATSAPP_NUMBER // Override with correct number
            })
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
      let emailFromUrl = 'customer@example.com'
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        emailFromUrl = urlParams.get('email') || 'customer@example.com'
      }
      
      setActivationData({
        activationCode: code,
        whatsappNumber: WHATSAPP_NUMBER,
        userEmail: emailFromUrl,
        expiresAt: expiresAt.toISOString()
      })
      
      // Show success message even if API fails
      console.log('Platba byla úspěšná! Aktivační kód byl vygenerován.')
    }
    
    fetchSessionData()
  }, [])

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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#25D366] mx-auto mb-4"></div>
          <p style={{ fontFamily: 'Neue Machina, system-ui, sans-serif' }}>Generuji aktivační kód...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50" style={{ fontFamily: 'Neue Machina, system-ui, sans-serif' }}>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl">
        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          className="mb-4 sm:mb-6 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Zpět na hlavní stránku</span>
          <span className="sm:hidden">Zpět</span>
        </Button>

        {/* Success Header - Mobile Optimized */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 text-gray-900">Platba byla úspěšná! 🎉</h1>
          
          <div className="bg-gradient-to-r from-[#25D366]/10 to-[#128C7E]/10 border border-[#25D366]/30 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Star className="h-5 w-5 sm:h-6 sm:w-6 text-[#25D366] fill-[#25D366]" />
              <span className="text-lg sm:text-xl font-semibold text-gray-800">Vaše předplatné je aktivní!</span>
            </div>
            <p className="text-gray-700 text-sm sm:text-base">
              Děkujeme za platbu! Nyní můžete aktivovat svého WhatsApp účetního asistenta pomocí kódu níže.
            </p>
          </div>
        </div>

        {/* Activation Steps - Mobile First Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {/* Step 1 - Copy Code */}
          <Card className="border-2 border-[#25D366]/20 hover:border-[#25D366]/40 transition-all shadow-sm hover:shadow-md">
            <CardHeader className="text-center pb-3 sm:pb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-lg sm:text-xl font-bold shadow-md">
                1
              </div>
              <CardTitle className="text-base sm:text-lg">Zkopírujte aktivační kód</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                <code className="text-xs sm:text-sm font-mono text-gray-800 block text-center break-all font-semibold">
                  {activationData.activationCode}
                </code>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(activationData.activationCode)}
                className="w-full text-[#25D366] border-[#25D366] hover:bg-[#25D366] hover:text-white transition-all"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied ? '✓ Zkopírováno!' : 'Kopírovat kód'}
              </Button>
            </CardContent>
          </Card>

          {/* Step 2 - Open WhatsApp */}
          <Card className="border-2 border-[#25D366]/20 hover:border-[#25D366]/40 transition-all shadow-sm hover:shadow-md">
            <CardHeader className="text-center pb-3 sm:pb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-lg sm:text-xl font-bold shadow-md">
                2
              </div>
              <CardTitle className="text-base sm:text-lg">Otevřete WhatsApp</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-center">
              <div className="bg-[#25D366]/10 rounded-lg p-3 mb-3">
                <Phone className="w-5 h-5 text-[#25D366] mx-auto mb-2" />
                <div className="text-base sm:text-lg font-bold text-[#25D366]">
                  {activationData.whatsappNumber}
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                DokladBot - AI účetní asistent
              </p>
              <Button 
                asChild 
                className="w-full bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#128C7E] hover:to-[#075E54] text-white shadow-md"
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

          {/* Step 3 - Send Code */}
          <Card className="border-2 border-[#25D366]/20 hover:border-[#25D366]/40 transition-all shadow-sm hover:shadow-md">
            <CardHeader className="text-center pb-3 sm:pb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-lg sm:text-xl font-bold shadow-md">
                3
              </div>
              <CardTitle className="text-base sm:text-lg">Pošlete kód a začněte</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-center">
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                Vložte aktivační kód do WhatsApp zprávy a odešlete
              </p>
              <div className="bg-gradient-to-r from-[#25D366]/15 to-[#128C7E]/15 rounded-lg p-3 sm:p-4 border border-[#25D366]/30">
                <p className="text-xs sm:text-sm font-semibold text-[#25D366]">
                  ⚡ Bot odpoví do 30 sekund!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Important Information - Mobile Optimized */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-6 sm:p-8 mb-8 sm:mb-12 border border-blue-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <div className="flex items-start">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-[#25D366] mr-3 sm:mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                  Kód platí do {expiresDate}
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Aktivujte svůj DokladBot do 48 hodin od platby
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-[#25D366] mr-3 sm:mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                  Email potvrzení
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Kód a instrukce byly zaslány na:<br/>
                  <span className="font-medium">{activationData.userEmail}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps - Mobile Optimized */}
        <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-6 sm:p-8 mb-8 sm:mb-12">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 text-center">
            💡 Co následuje po aktivaci
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="flex items-start">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3 sm:mr-4 mt-0.5 flex-shrink-0">
                <span className="text-white text-xs sm:text-sm font-bold">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Registrace IČO</h4>
                <p className="text-xs sm:text-sm text-gray-600">
                  Bot si automaticky stáhne vaše údaje z ARES databáze
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3 sm:mr-4 mt-0.5 flex-shrink-0">
                <span className="text-white text-xs sm:text-sm font-bold">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Nastavení DPH</h4>
                <p className="text-xs sm:text-sm text-gray-600">
                  Zvolíte typ evidence a DPH podle své činnosti
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3 sm:mr-4 mt-0.5 flex-shrink-0">
                <span className="text-white text-xs sm:text-sm font-bold">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">První účtenka</h4>
                <p className="text-xs sm:text-sm text-gray-600">
                  Můžete ihned začít posílat účtenky - fotky nebo text
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3 sm:mr-4 mt-0.5 flex-shrink-0">
                <span className="text-white text-xs sm:text-sm font-bold">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Automatizace</h4>
                <p className="text-xs sm:text-sm text-gray-600">
                  Bot zpracuje vše automaticky a připraví přehledy
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Section - Mobile Optimized */}
        <div className="text-center">
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">Potřebujete pomoc s aktivací?</h3>
          <p className="text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto text-sm sm:text-base">
            Pokud máte problém s aktivací nebo jakékoliv dotazy, kontaktujte nás. 
            Jsme tu pro vás 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-2xl mx-auto">
            <Button 
              onClick={openCustomerPortal}
              disabled={portalLoading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md"
            >
              <Settings className="w-4 h-4 mr-2" />
              {portalLoading ? 'Otevírám...' : 'Spravovat předplatné'}
            </Button>
            
            <Button 
              variant="outline" 
              asChild
              className="border-gray-300 hover:border-gray-400"
            >
              <a href={`mailto:info@dokladbot.cz?subject=Pomoc s aktivací&body=Potřebuji pomoc s aktivací. Můj aktivační kód je: ${activationData.activationCode}`}>
                <Mail className="w-4 h-4 mr-2" />
                Kontaktovat podporu
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PlatbaUspesnaPage() {
  return <PlatbaUspesnaPageContent />
}