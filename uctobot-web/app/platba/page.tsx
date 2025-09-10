"use client"


export const dynamic = "force-dynamic"

import { useState, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, MessageCircle, ArrowLeft, Star, CreditCard, User, Mail } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'


function PlanovaStrankaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedPlan, setSelectedPlan] = useState<'MONTHLY' | 'YEARLY'>('YEARLY')
  const [isFoundingMember, setIsFoundingMember] = useState(true)
  const [showPayment, setShowPayment] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: ''
  })
  const [selectedTier, setSelectedTier] = useState<'starter' | 'professional' | 'business'>('professional')

  const getPriceDisplay = (tier: 'starter' | 'professional' | 'business', frequency: 'MONTHLY' | 'YEARLY') => {
    const prices = {
      starter: { monthly: '199 Kč/měsíc', yearly: '1 990 Kč/rok' },
      professional: { monthly: '349 Kč/měsíc', yearly: '3 490 Kč/rok' },
      business: { monthly: '599 Kč/měsíc', yearly: '5 990 Kč/rok' }
    }
    return prices[tier][frequency === 'MONTHLY' ? 'monthly' : 'yearly']
  }

  useEffect(() => {
    const planParam = searchParams.get('plan')
    
    // Parse plan parameter that might be like "PROFESSIONAL_YEARLY" or "STARTER"
    if (planParam) {
      if (planParam.includes('_YEARLY')) {
        setSelectedPlan('YEARLY')
        const tier = planParam.replace('_YEARLY', '').toLowerCase() as 'starter' | 'professional' | 'business'
        if (['starter', 'professional', 'business'].includes(tier)) {
          setSelectedTier(tier)
        }
      } else if (planParam.includes('_MONTHLY')) {
        setSelectedPlan('MONTHLY')
        const tier = planParam.replace('_MONTHLY', '').toLowerCase() as 'starter' | 'professional' | 'business'
        if (['starter', 'professional', 'business'].includes(tier)) {
          setSelectedTier(tier)
        }
      } else {
        // Handle legacy or simple plan names
        const tier = planParam.toLowerCase()
        if (['starter', 'professional', 'business'].includes(tier)) {
          setSelectedTier(tier as 'starter' | 'professional' | 'business')
        }
      }
    }
  }, [searchParams])

  const handlePaymentSuccess = () => {
    router.push('/platba-uspesna')
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleCustomerInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!customerInfo.name.trim()) {
      alert('Zadejte prosím jméno a příjmení')
      return
    }
    
    if (!customerInfo.email.trim()) {
      alert('Zadejte prosím email')
      return
    }
    
    if (!isValidEmail(customerInfo.email)) {
      alert('Zadejte prosím platnou emailovou adresu')
      return
    }
    
    if (customerInfo.name && customerInfo.email) {
      setShowPayment(true)
      
      // Ihned přesměrovat na Stripe
      try {
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            plan: selectedPlan,
            tier: selectedTier, 
            isFoundingMember, 
            customerName: customerInfo.name,
            customerEmail: customerInfo.email
          })
        })

        const data = await response.json()

        if (response.ok && data.url) {
          // Přesměrovat na Stripe Checkout
          window.location.href = data.url
        } else {
          console.error('Failed to create checkout session:', data.error)
        }
      } catch (error) {
        console.error('Error creating checkout session:', error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          onClick={() => router.push('/cenik')}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zpět na ceník
        </Button>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <MessageCircle className="h-8 w-8 text-[#25D366]" />
            <h1 className="text-3xl font-bold">Dokončit objednávku</h1>
          </div>
          <p className="text-muted-foreground">
            {isFoundingMember && '🚀 Launch Week Special - Zakladatelská cena navždy!'}
          </p>
        </div>

        <div className="max-w-md mx-auto">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Shrnutí objednávky</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Plán:</span>
                <span className="font-semibold capitalize">
                  {selectedTier === 'professional' ? 'Profesionál' : 
                   selectedTier === 'starter' ? 'Starter' : 'Business'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Frekvence:</span>
                <span className="font-semibold">
                  {selectedPlan === 'MONTHLY' ? 'Měsíčně' : 'Ročně'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Cena:</span>
                <div className="text-right">
                  <span className="font-semibold text-2xl text-[#25D366]">
                    {getPriceDisplay(selectedTier, selectedPlan)}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">Ceny jsou uvedeny bez DPH</p>
                </div>
              </div>

              {selectedPlan === 'YEARLY' && (
                <div className="text-sm text-muted-foreground">
                  2 měsíce ZDARMA!
                </div>
              )}
              
              {/* Plan switching suggestion */}
              {selectedPlan === 'MONTHLY' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 font-medium text-sm">💰 Ušetřete s ročním plánem!</span>
                  </div>
                  <p className="text-sm text-green-700 mb-2">
                    Roční plán: 2 měsíce ZDARMA
                  </p>
                  <button 
                    onClick={() => setSelectedPlan('YEARLY')}
                    className="text-green-600 hover:text-green-700 text-sm font-medium underline"
                  >
                    Přepnout na roční →
                  </button>
                </div>
              )}
              
              {selectedPlan === 'YEARLY' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-600 font-medium text-sm">Preferujete měsíční platbu?</span>
                  </div>
                  <button 
                    onClick={() => setSelectedPlan('MONTHLY')}
                    className="text-gray-600 hover:text-gray-700 text-sm font-medium underline"
                  >
                    Přepnout na měsíční →
                  </button>
                </div>
              )}

              {isFoundingMember && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold text-yellow-800">Zakladatelská cena</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Tato cena vám zůstane navždy, i když později zdražíme!
                  </p>
                </div>
              )}

              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-[#25D366]" />
                  <span>Žádné skryté poplatky</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-[#25D366]" />
                  <span>Zrušit kdykoliv</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-[#25D366]" />
                  <span>7 dní zdarma pro nové uživatele</span>
                </div>
              </div>

              <form onSubmit={handleCustomerInfoSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Jméno a příjmení</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Jan Novák"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="jan@example.com"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      required
                      className={`pl-10 ${
                        customerInfo.email && !isValidEmail(customerInfo.email) 
                          ? 'border-red-500 focus:border-red-500' 
                          : ''
                      }`}
                    />
                    {customerInfo.email && !isValidEmail(customerInfo.email) && (
                      <p className="text-red-500 text-sm mt-1">Neplatná emailová adresa</p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#6366f1] hover:bg-[#5b5cf6] text-white"
                  size="lg"
                  disabled={showPayment}
                >
                  {showPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Přesměrovávám na Stripe...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Zaplatit přes Stripe
                    </>
                  )}
                </Button>
                
                <div className="text-center text-sm text-gray-500 space-y-2">
                  <p className="flex items-center justify-center gap-2">
                    <span className="inline-block w-6 h-4 bg-[#6366f1] text-white text-xs rounded font-bold leading-4">S</span>
                    Powered by Stripe - Bezpečná platba
                  </p>
                  <p className="text-xs">Po kliknutí budete přesměrováni na bezpečnou Stripe platbu</p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Máte otázky? <a href="mailto:info@dokladbot.cz" className="text-[#25D366] hover:underline">Napište nám</a></p>
        </div>
      </div>
    </div>
  )
}

export default function PlanovaStranka() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-center">Načítání...</div></div>}>
      <PlanovaStrankaContent />
    </Suspense>
  )
}