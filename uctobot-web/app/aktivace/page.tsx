"use client"


export const dynamic = "force-dynamic"

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { Copy, CheckCircle, MessageSquare, Clock, Shield, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

function ActivationContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  
  const WHATSAPP_NUMBER = '+420722158002' // Vaše WhatsApp číslo
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${token}`
  
  // Format token with dashes for better readability
  const formatToken = (token: string) => {
    if (!token || token.length !== 32) return token
    return token.match(/.{1,4}/g)?.join('-') || token
  }
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(token || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }
  
  // Countdown timer (assuming 48 hours from now - in real app you'd get this from API)
  useEffect(() => {
    const targetTime = new Date().getTime() + (48 * 60 * 60 * 1000) // 48 hours from now
    
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const distance = targetTime - now
      
      if (distance > 0) {
        const hours = Math.floor(distance / (1000 * 60 * 60))
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        setTimeLeft(`${hours}h ${minutes}m`)
      } else {
        setTimeLeft('Vypršel')
        clearInterval(interval)
      }
    }, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [])
  
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4 mx-auto">
              <MessageSquare className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-800">Chybí aktivační kód</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Tato stránka vyžaduje platný aktivační token.
            </p>
            <Button asChild variant="outline">
              <a href="/">← Zpět na hlavní stránku</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Platba úspěšná! 🎉
          </h1>
          <p className="text-xl text-gray-600">
            Zbývá už jen aktivovat WhatsApp
          </p>
        </div>
        
        {/* Main Activation Card */}
        <Card className="mb-8 border-green-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Váš aktivační kód</CardTitle>
              <Badge variant="secondary" className="bg-white/20 text-white">
                <Clock className="w-4 h-4 mr-1" />
                {timeLeft}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="bg-gray-50 rounded-lg p-6 mb-6 border-2 border-dashed border-green-300">
              <div className="text-center">
                <div className="font-mono text-2xl font-bold text-gray-800 tracking-wider break-all mb-4">
                  {formatToken(token)}
                </div>
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="bg-white hover:bg-gray-50"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      Zkopírováno!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Zkopírovat kód
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Pozor:</strong> Kód je platný pouze 48 hodin od nákupu
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
        
        {/* Instructions */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Steps Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Smartphone className="w-5 h-5 mr-2 text-green-600" />
                Jak aktivovat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-green-600">1</span>
                </div>
                <div>
                  <h3 className="font-semibold">Uložte si číslo</h3>
                  <p className="text-gray-600">WhatsApp: {WHATSAPP_NUMBER}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-green-600">2</span>
                </div>
                <div>
                  <h3 className="font-semibold">Pošlete kód</h3>
                  <p className="text-gray-600">Zkopírujte aktivační kód a pošlete ho na WhatsApp</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-green-600">3</span>
                </div>
                <div>
                  <h3 className="font-semibold">Dokončete registraci</h3>
                  <p className="text-gray-600">Vyplníte IČO a základní obchodní údaje</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-green-600">4</span>
                </div>
                <div>
                  <h3 className="font-semibold">Začněte účtovat!</h3>
                  <p className="text-gray-600">Pošlete první fotku účtenky nebo zadejte transakci</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Features Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-600" />
                Co získáváte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span>Neomezené zpracování účtenek</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span>AI kategorizace výdajů</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span>Měsíční a kvartální přehledy</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span>DPH výpočty a reporty</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span>Export do CSV/XML</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span>Připomínky daňových termínů</span>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">💡 Dobré vědět:</h4>
                <ul className="space-y-1 text-sm text-blue-700">
                  <li>• Kód stačí poslat jednou</li>
                  <li>• Bot si vás zapamatuje podle čísla</li>
                  <li>• Pak už píšete normálně bez kódu</li>
                  <li>• Fakturu obdržíte do 24 hodin</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* CTA Button */}
        <div className="text-center mt-8">
          <Button 
            asChild 
            size="lg" 
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg"
          >
            <a href={whatsappLink}>
              <MessageSquare className="mr-2 w-5 h-5" />
              Aktivovat na WhatsApp
            </a>
          </Button>
          
          <p className="text-sm text-gray-500 mt-4">
            Nebo si číslo uložte a pošlete kód ručně: {WHATSAPP_NUMBER}
          </p>
        </div>
        
        {/* Support */}
        <div className="text-center mt-8 pt-8 border-t border-gray-200">
          <p className="text-gray-600">
            Potřebujete pomoc? 
            <a 
              href="mailto:info@dokladbot.cz" 
              className="text-green-600 hover:underline ml-1 font-medium"
            >
              info@dokladbot.cz
            </a>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            DokladBot - Vaše chytré účetnictví
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ActivationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    }>
      <ActivationContent />
    </Suspense>
  )
}