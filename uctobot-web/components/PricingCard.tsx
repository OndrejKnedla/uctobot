'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Camera, FileText, Users, ExternalLink } from 'lucide-react';
import { paymentsAPI } from '@/lib/api';

interface PricingCardProps {
  plan: 'starter' | 'professional' | 'business';
  isPopular?: boolean;
  isYearly?: boolean;
}

export function PricingCard({ plan, isPopular = false, isYearly = false }: PricingCardProps) {
  const [loading, setLoading] = useState(false);
  
  const handlePayment = async () => {
    // Redirect to proper checkout page
    const planParam = isYearly ? `${plan.toUpperCase()}_YEARLY` : plan.toUpperCase();
    window.location.href = `/platba?plan=${planParam}`;
  };

  // Starter Plan
  if (plan === 'starter') {
    const monthlyPrice = 199;
    const yearlyPrice = Math.round(monthlyPrice * 12 * 0.8); // 20% sleva
    const currentPrice = isYearly ? Math.round(yearlyPrice / 12) : monthlyPrice;
    
    return (
      <Card className="relative bg-white rounded-lg border border-gray-200 p-6 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold mb-2 text-gray-900">Starter</CardTitle>
          <CardDescription className="text-gray-600 text-base">Pro začínající podnikatele</CardDescription>
          
          <div className="mt-6">
            <div className="flex items-baseline justify-center mb-2">
              <span className="text-5xl font-bold text-gray-900">{currentPrice}</span>
              <span className="text-xl ml-1 text-gray-900 font-semibold">Kč</span>
            </div>
            <p className="text-gray-700 text-base font-medium">
              Cena za uživatele, účtováno {isYearly ? 'ročně' : 'měsíčně'}.
            </p>
            {isYearly && (
              <p className="text-sm text-gray-600 mt-1">
                ({yearlyPrice} Kč/rok - ušetříte 20%)
              </p>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pb-6 flex-grow">
          <ul className="space-y-4">
            <li className="flex items-start text-base">
              <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-800 font-medium">Max 50 dokladů měsíčně</span>
            </li>
            <li className="flex items-start text-base">
              <Camera className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-800 font-medium">Skenování účtenek</span>
            </li>
            <li className="flex items-start text-base">
              <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-800 font-medium">WhatsApp rozhraní</span>
            </li>
            <li className="flex items-start text-base">
              <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-800 font-medium">Export do CSV</span>
            </li>
            <li className="flex items-start text-base">
              <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-800 font-medium">Základní podpora</span>
            </li>
            <li className="flex items-start text-base">
              <ExternalLink className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <a href="/funkce" className="text-gray-800 font-medium hover:text-green-600 underline">
                a další...
              </a>
            </li>
          </ul>
        </CardContent>
        
        <CardFooter className="pt-6">
          <Button
            onClick={handlePayment}
            disabled={loading}
            variant="outline"
            className="w-full py-4 font-semibold text-base border-2 hover:bg-gray-50"
            size="lg"
          >
            {loading ? 'Načítání...' : 'Vybrat'}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Professional Plan
  if (plan === 'professional') {
    const monthlyPrice = 349;
    const yearlyPrice = Math.round(monthlyPrice * 12 * 0.8); // 20% sleva
    const currentPrice = isYearly ? Math.round(yearlyPrice / 12) : monthlyPrice;
    
    return (
      <Card className={`relative bg-white rounded-lg border-2 ${isPopular ? 'border-green-500' : 'border-gray-200'} p-6 flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow`}>
        {isPopular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
              NEJPOPULÁRNĚJŠÍ
            </div>
          </div>
        )}
        
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold mb-2 text-gray-900">Profesionál</CardTitle>
          <CardDescription className="text-gray-600 text-base">Pro rostoucí podnikatele</CardDescription>
          
          <div className="mt-6">
            <div className="flex items-baseline justify-center mb-2">
              <span className="text-5xl font-bold text-gray-900">{currentPrice}</span>
              <span className="text-xl ml-1 text-gray-900 font-semibold">Kč</span>
            </div>
            <p className="text-gray-700 text-base font-medium">
              Cena za uživatele, účtováno {isYearly ? 'ročně' : 'měsíčně'}.
            </p>
            {isYearly && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  ({yearlyPrice} Kč/rok - ušetříte 20%)
                </p>
                <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-semibold mt-2">
                  Ušetříte {Math.round(monthlyPrice * 12 - yearlyPrice)} Kč
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pb-6 flex-grow">
          <ul className="space-y-4">
            <li className="flex items-start text-base">
              <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-800 font-medium">Neomezený počet dokladů</span>
            </li>
            <li className="flex items-start text-base">
              <Camera className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-800 font-medium">Pokročilé skenování účtenek</span>
            </li>
            <li className="flex items-start text-base">
              <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-800 font-medium">API napojení na banky</span>
            </li>
            <li className="flex items-start text-base">
              <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-800 font-medium">Prioritní podpora</span>
            </li>
            <li className="flex items-start text-base">
              <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-800 font-medium">DPH hlídač a optimalizace</span>
            </li>
            <li className="flex items-start text-base">
              <FileText className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-800 font-medium">Pokročilé reporty</span>
            </li>
            <li className="flex items-start text-base">
              <ExternalLink className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <a href="/funkce" className="text-gray-800 font-medium hover:text-green-600 underline">
                a další...
              </a>
            </li>
          </ul>
        </CardContent>
        
        <CardFooter className="pt-6">
          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 font-semibold text-base"
            size="lg"
          >
            {loading ? 'Načítání...' : 'Vybrat'}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Business Plan
  const monthlyPrice = 599;
  const yearlyPrice = Math.round(monthlyPrice * 12 * 0.8); // 20% sleva
  const currentPrice = isYearly ? Math.round(yearlyPrice / 12) : monthlyPrice;
  
  return (
    <Card className="relative bg-white rounded-lg border border-gray-200 p-6 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl font-bold mb-2 text-gray-900">Business</CardTitle>
        <CardDescription className="text-gray-600 text-base">Pro větší firmy a týmy</CardDescription>
        
        <div className="mt-6">
          <div className="flex items-baseline justify-center mb-2">
            <span className="text-5xl font-bold text-gray-900">{currentPrice}</span>
            <span className="text-xl ml-1 text-gray-900 font-semibold">Kč</span>
          </div>
          <p className="text-gray-700 text-base font-medium">
            Cena za uživatele, účtováno {isYearly ? 'ročně' : 'měsíčně'}.
          </p>
          {isYearly && (
            <p className="text-sm text-gray-600 mt-1">
              ({yearlyPrice} Kč/rok - ušetříte 20%)
            </p>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pb-6 flex-grow">
        <ul className="space-y-4">
          <li className="flex items-start text-base">
            <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-gray-800 font-medium">Vše z Profesionál</span>
          </li>
          <li className="flex items-start text-base">
            <Users className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-gray-800 font-medium">Multi-uživatelský přístup</span>
          </li>
          <li className="flex items-start text-base">
            <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-gray-800 font-medium">Vlastní branding</span>
          </li>
          <li className="flex items-start text-base">
            <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-gray-800 font-medium">Dedikovaná podpora</span>
          </li>
          <li className="flex items-start text-base">
            <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-gray-800 font-medium">API pro integrace</span>
          </li>
          <li className="flex items-start text-base">
            <FileText className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-gray-800 font-medium">Pokročilé analytiky</span>
          </li>
          <li className="flex items-start text-base">
            <ExternalLink className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <a href="/funkce" className="text-gray-800 font-medium hover:text-green-600 underline">
              a další...
            </a>
          </li>
        </ul>
      </CardContent>
      
      <CardFooter className="pt-6">
        <Button
          onClick={handlePayment}
          disabled={loading}
          variant="outline"
          className="w-full py-4 font-semibold text-base border-2 hover:bg-gray-50"
          size="lg"
        >
          {loading ? 'Načítání...' : 'Vybrat'}
        </Button>
      </CardFooter>
    </Card>
  );
}