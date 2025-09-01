'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Mail, ArrowLeft } from "lucide-react"
import { useRouter } from 'next/navigation'

export default function SpravovatPredplatnePage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const openCustomerPortal = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('Prosím zadejte váš email')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      if (response.ok) {
        const { url } = await response.json()
        window.open(url, '_blank')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Nepodařilo se najít váš účet')
      }
    } catch (error) {
      console.error('Portal error:', error)
      setError('Chyba při připojování k portálu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        
        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zpět na hlavní stránku
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Spravovat předplatné</h1>
          <p className="text-gray-600">
            Zadejte email, se kterým jste si vytvořili předplatné DokladBot
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Přístup k Customer Portal
            </CardTitle>
            <CardDescription>
              V portálu můžete zrušit předplatné, změnit platební kartu nebo stáhnout faktury
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={openCustomerPortal} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email adresa</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vas-email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                <Settings className="w-4 h-4 mr-2" />
                {loading ? 'Otevírám portál...' : 'Otevřít Customer Portal'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Informace o tom, co zákazník může dělat */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Co můžete v portálu spravovat:</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-green-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-green-700 mb-2">✅ Zrušit předplatné</h4>
                <p className="text-sm text-gray-600">
                  Kdykoli můžete zrušit své předplatné s okamžitým účinkem
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-blue-700 mb-2">💳 Změnit platební kartu</h4>
                <p className="text-sm text-gray-600">
                  Aktualizujte svou platební kartu pro budoucí platby
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-purple-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-purple-700 mb-2">🧾 Stáhnout faktury</h4>
                <p className="text-sm text-gray-600">
                  Přístup ke všem vašim fakturám a platebním dokladům
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-orange-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-orange-700 mb-2">📧 Upravit údaje</h4>
                <p className="text-sm text-gray-600">
                  Změňte svou emailovou adresu nebo fakturační údaje
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Podpora */}
        <div className="text-center mt-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Potřebujete pomoc?</h3>
          <p className="text-gray-600 mb-6">
            Pokud máte problémy s přístupem k portálu nebo jakékoliv dotazy, kontaktujte nás.
          </p>
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
        </div>

      </div>
    </div>
  )
}