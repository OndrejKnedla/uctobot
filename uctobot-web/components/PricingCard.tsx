'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Shield } from 'lucide-react';
import { paymentsAPI } from '@/lib/api';

interface PricingCardProps {
  plan: 'monthly' | 'yearly';
  isPopular?: boolean;
}

export function PricingCard({ plan, isPopular = false }: PricingCardProps) {
  const [loading, setLoading] = useState(false);
  
  const handlePayment = async () => {
    setLoading(true);
    
    try {
      console.log('Creating checkout session for plan:', plan);
      
      // Převeď plan typ na správný formát pro API
      const planType = plan === 'yearly' ? 'annual' : 'monthly';
      
      // Use the API function with proper environment detection
      const data = await paymentsAPI.createCheckoutSession(planType, 7);
      
      console.log('Checkout session response:', data);
      
      if (data.success) {
        // Show demo message instead of redirect
        alert(`${data.message}\n\nDemo URL: ${data.checkout_url}\n\nV reálné aplikaci by došlo k přesměrování na Stripe platební stránku.`);
      } else {
        throw new Error(data.message || 'Nepodařilo se vytvořit platbu');
      }
    } catch (error) {
      console.error('Chyba při vytváření platby:', error);
      
      // Zobraz konkrétní chybu uživateli pro debug
      const errorMessage = error instanceof Error ? error.message : 'Neznámá chyba';
      alert(`Chyba: ${errorMessage}\n\nZkuste to prosím znovu nebo otevřete Console (F12) pro více informací.`);
    } finally {
      setLoading(false);
    }
  };
  
  const monthlyPrice = plan === 'monthly' ? 299 : 249;
  const yearlyTotal = 2988;  // 249 × 12 = 2988
  const savings = plan === 'yearly' ? '600 Kč ušetříte' : null;  // 3588 - 2988 = 600
  
  const features = plan === 'monthly' ? [
    'Všechny funkce',
    'Neomezené transakce', 
    'AI zpracování účtenek',
    'WhatsApp podpora',
    'Automatické DPH',
    'Export pro účetní',
    'Zrušit kdykoliv',
    'Support do 24 hodin'
  ] : [
    'Vše z měsíčního plánu',
    '2 měsíce ZDARMA',
    'Prioritní support',
    'Founding member cena navždy',
    'AI zpracování účtenek',
    'WhatsApp podpora 24/7',
    'Automatické DPH',
    'Export pro účetní'
  ];
  
  return (
    <Card className={`relative ${isPopular ? 'border-2 border-green-500 shadow-lg transform scale-105' : 'border-2 border-gray-200'}`}>
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 hover:bg-green-600">
          Ušetříte 598 Kč
        </Badge>
      )}
      
      {!isPopular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white">
          Nejflexibilnější
        </Badge>
      )}
      
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {plan === 'monthly' ? 'Měsíční plán' : 'Roční plán'}
        </CardTitle>
        <CardDescription>
          {plan === 'monthly' ? 'Flexibilní měsíční platba' : 'Ušetřete s ročním plánem'}
        </CardDescription>
        
        <div className="mt-4">
          <div className="text-4xl font-bold text-green-600">
            {monthlyPrice} Kč
            <span className="text-lg text-gray-600 font-normal">/měsíc</span>
          </div>
          
          {plan === 'yearly' && (
            <div className="text-sm text-gray-600 mt-2">
              <div>Fakturováno ročně {yearlyTotal} Kč</div>
              {savings && <div className="text-green-600 font-semibold">{savings}</div>}
            </div>
          )}
        </div>
        
        {/* Trial Banner */}
        <div className="bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-200 text-center py-2 rounded-lg mt-4">
          🎁 {plan === 'yearly' ? '7 dní zdarma + 2 měsíce NAVÍC' : 'Prvních 7 dní ZDARMA'}
        </div>
      </CardHeader>
      
      <CardContent>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter>
        <Button
          onClick={handlePayment}
          disabled={loading}
          className={`w-full py-6 text-lg font-semibold transition ${
            plan === 'yearly' 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-gray-800 hover:bg-gray-900 text-white'
          }`}
          size="lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Načítání...
            </>
          ) : (
            'Vyzkoušet 7 dní zdarma'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}