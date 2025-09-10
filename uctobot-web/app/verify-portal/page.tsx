"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

function VerifyPortalContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    
    if (!token) {
      setStatus('error')
      setMessage('Chybí ověřovací token')
      return
    }

    // Verify token and get portal URL
    fetch('/api/verify-portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
    .then(async (response) => {
      if (response.ok) {
        const data = await response.json()
        setStatus('success')
        setMessage('Přesměrovávám na customer portal...')
        // Redirect to Stripe portal
        window.location.href = data.url
      } else {
        const errorData = await response.json()
        setStatus('error')
        setMessage(errorData.error || 'Chyba při ověřování')
      }
    })
    .catch((error) => {
      console.error('Verification error:', error)
      setStatus('error')
      setMessage('Chyba při připojení k serveru')
    })
  }, [searchParams])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        
        <Button
          onClick={() => router.push('/spravovat-predplatne')}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zpět
        </Button>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {status === 'loading' && 'Ověřuji přístup...'}
              {status === 'success' && 'Ověření úspěšné!'}
              {status === 'error' && 'Chyba ověření'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center">
            <div className="mb-6">
              {status === 'loading' && (
                <Loader2 className="h-16 w-16 animate-spin text-[#25D366] mx-auto" />
              )}
              {status === 'success' && (
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              )}
              {status === 'error' && (
                <XCircle className="h-16 w-16 text-red-600 mx-auto" />
              )}
            </div>
            
            <p className="text-gray-600 mb-6">
              {message}
            </p>

            {status === 'error' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Možné příčiny:
                </p>
                <ul className="text-sm text-gray-600 text-left space-y-1">
                  <li>• Ověřovací odkaz vypršel (platnost 15 minut)</li>
                  <li>• Odkaz již byl použit</li>
                  <li>• Neplatný formát odkazu</li>
                </ul>
                
                <Button 
                  onClick={() => router.push('/spravovat-predplatne')}
                  className="bg-[#25D366] hover:bg-[#128C7E] text-white mt-6"
                >
                  Zkusit znovu
                </Button>
              </div>
            )}

            {status === 'success' && (
              <p className="text-sm text-gray-500">
                Pokud se stránka automaticky nepřesměruje, zavřete toto okno.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyPortalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#25D366] mx-auto mb-4" />
          <p>Načítání...</p>
        </div>
      </div>
    }>
      <VerifyPortalContent />
    </Suspense>
  )
}