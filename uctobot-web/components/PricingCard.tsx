'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Camera, FileText, Users } from 'lucide-react';
import { paymentsAPI } from '@/lib/api';

interface PricingCardProps {
  plan: 'starter' | 'professional' | 'business';
  isPopular?: boolean;
}

export function PricingCard({ plan, isPopular = false }: PricingCardProps) {
  const [loading, setLoading] = useState(false);
  
  const handlePayment = async () => {
    // Redirect to proper checkout page
    window.location.href = `/platba?plan=${plan.toUpperCase()}`;
  };

  // Starter Plan
  if (plan === 'starter') {
    return (
      <Card className="relative bg-white rounded-lg border border-gray-200 p-6 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-xl font-semibold mb-2 text-gray-900">Starter</CardTitle>
          <CardDescription className="text-gray-600 text-sm">Pro začínající podnikatele</CardDescription>
          
          <div className="mt-6">
            <div className="flex items-baseline justify-center mb-2">
              <span className="text-4xl font-bold text-gray-900">199</span>
              <span className="text-lg ml-1 text-gray-900">Kč</span>
            </div>
            <p className="text-gray-600 text-sm">Cena za uživatele, účtováno měsíčně.</p>
          </div>
        </CardHeader>
        
        <CardContent className="pb-6 flex-grow">
          <ul className="space-y-3">
            <li className="flex items-start text-sm">
              <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Max 50 dokladů měsíčně</span>
            </li>
            <li className="flex items-start text-sm">
              <Camera className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Skenování účtenek</span>
            </li>
            <li className="flex items-start text-sm">
              <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">WhatsApp rozhraní</span>
            </li>
            <li className="flex items-start text-sm">
              <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Export do CSV</span>
            </li>
            <li className="flex items-start text-sm">
              <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Základní podpora</span>
            </li>
          </ul>
        </CardContent>
        
        <CardFooter className="pt-6">
          <Button
            onClick={handlePayment}
            disabled={loading}
            variant="outline"
            className="w-full py-3 font-medium"
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
    return (
      <Card className={`relative bg-white rounded-lg border-2 ${isPopular ? 'border-gray-900' : 'border-gray-200'} p-6 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow`}>
        {isPopular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-medium">
              20% sleva
            </div>
          </div>
        )}
        
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-xl font-semibold mb-2 text-gray-900">Profesionál</CardTitle>
          <CardDescription className="text-gray-600 text-sm">Pro rostoucí podnikatele</CardDescription>
          
          <div className="mt-6">
            {isPopular && (
              <div className="text-gray-500 text-sm line-through mb-1">4 188 Kč</div>
            )}
            <div className="flex items-baseline justify-center mb-2">
              <span className="text-4xl font-bold text-gray-900">349</span>
              <span className="text-lg ml-1 text-gray-900">Kč</span>
            </div>
            <p className="text-gray-600 text-sm">Cena za uživatele, účtováno {isPopular ? 'ročně' : 'měsíčně'}.</p>
            {isPopular && (
              <div className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium mt-2">
                Ušetříte 718 Kč
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pb-6 flex-grow">
          <ul className="space-y-3">
            <li className="flex items-start text-sm">
              <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Neomezený počet dokladů</span>
            </li>
            <li className="flex items-start text-sm">
              <Camera className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Pokročilé skenování účtenek</span>
            </li>
            <li className="flex items-start text-sm">
              <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">API napojení na banky</span>
            </li>
            <li className="flex items-start text-sm">
              <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Prioritní podpora</span>
            </li>
            <li className="flex items-start text-sm">
              <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">DPH hlídač a optimalizace</span>
            </li>
            <li className="flex items-start text-sm">
              <FileText className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Pokročilé reporty</span>
            </li>
          </ul>
        </CardContent>
        
        <CardFooter className="pt-6">
          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 font-medium"
            size="lg"
          >
            {loading ? 'Načítání...' : 'Vybrat'}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Business Plan
  return (
    <Card className="relative bg-white rounded-lg border border-gray-200 p-6 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-xl font-semibold mb-2 text-gray-900">Business</CardTitle>
        <CardDescription className="text-gray-600 text-sm">Pro větší firmy a týmy</CardDescription>
        
        <div className="mt-6">
          <div className="flex items-baseline justify-center mb-2">
            <span className="text-4xl font-bold text-gray-900">599</span>
            <span className="text-lg ml-1 text-gray-900">Kč</span>
          </div>
          <p className="text-gray-600 text-sm">Cena za uživatele, účtováno měsíčně.</p>
        </div>
      </CardHeader>
      
      <CardContent className="pb-6 flex-grow">
        <ul className="space-y-3">
          <li className="flex items-start text-sm">
            <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Vše z Profesionál</span>
          </li>
          <li className="flex items-start text-sm">
            <Users className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Multi-uživatelský přístup</span>
          </li>
          <li className="flex items-start text-sm">
            <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Vlastní branding</span>
          </li>
          <li className="flex items-start text-sm">
            <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Dedikovaná podpora</span>
          </li>
          <li className="flex items-start text-sm">
            <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">API pro integrace</span>
          </li>
          <li className="flex items-start text-sm">
            <FileText className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Pokročilé analytiky</span>
          </li>
        </ul>
      </CardContent>
      
      <CardFooter className="pt-6">
        <Button
          onClick={handlePayment}
          disabled={loading}
          variant="outline"
          className="w-full py-3 font-medium"
          size="lg"
        >
          {loading ? 'Načítání...' : 'Vybrat'}
        </Button>
      </CardFooter>
    </Card>
  );
}