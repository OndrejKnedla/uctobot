'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
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
      
      // Použij naši API funkci
      const data = await paymentsAPI.createCheckoutSession(planType);
      
      console.log('Checkout session response:', data);
      
      if (data.success && data.checkout_url) {
        // Přesměruj na Stripe Checkout
        window.location.href = data.checkout_url;
      } else {
        throw new Error(data.message || 'Nepodařilo se vytvořit platbu');
      }
    } catch (error) {
      console.error('Chyba při vytváření platby:', error);
      alert('Něco se pokazilo. Zkuste to prosím znovu.');
    } finally {
      setLoading(false);
    }
  };
  
  const monthlyPrice = plan === 'monthly' ? 299 : 249;
  const yearlyTotal = 2990;
  const savings = plan === 'yearly' ? '598 Kč ušetříte' : null;
  
  const features = [
    'Neomezené doklady',
    'AI zpracování účtenek',
    'WhatsApp podpora 24/7',
    'Automatické DPH',
    'Export pro účetní',
    'Podpora pro OSVČ i s.r.o.',
    'Mobilní aplikace',
    'Zálohování dat'
  ];
  
  return (
    <Card className={`relative ${isPopular ? 'border-2 border-green-500 shadow-lg' : ''}`}>
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 hover:bg-green-600">
          Nejoblíbenější
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
          className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
          size="lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Načítání...
            </>
          ) : (
            plan === 'monthly' ? 'Začít měsíční plán' : 'Vybrat roční plán'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}