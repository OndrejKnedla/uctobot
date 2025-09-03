'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Shield, Star, TrendingUp, Clock, Zap, Users, Smartphone, Building, Crown } from 'lucide-react';
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
      <Card className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col h-full shadow-sm">
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <Smartphone className="h-3 w-3" />
            STARTER
          </div>
        </div>
        
        <CardHeader className="text-center pb-3 pt-6">
          <CardTitle className="text-xl font-bold mb-1 text-gray-900 dark:text-white">Starter</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400 text-sm">Pro začínající podnikatele</CardDescription>
          
          <div className="mt-4">
            <div className="flex items-baseline justify-center mb-1">
              <span className="text-4xl font-bold text-blue-600">199</span>
              <span className="text-xl ml-1 text-gray-900 dark:text-white">Kč</span>
              <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">/měsíc</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">Ceny jsou uvedeny bez DPH</p>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-2 mb-2">
              <div className="text-orange-700 dark:text-orange-300 font-medium text-sm">
                🎁 Prvních 7 dní ZDARMA
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-3">
          <ul className="space-y-2">
            <li className="flex items-center text-sm">
              <Check className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
              <span className="dark:text-gray-200">Max 50 dokladů měsíčně</span>
            </li>
            <li className="flex items-center text-sm">
              <Check className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
              <span className="dark:text-gray-200">Základní účetní funkce</span>
            </li>
            <li className="flex items-center text-sm">
              <Check className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
              <span className="dark:text-gray-200">WhatsApp rozhraní</span>
            </li>
            <li className="flex items-center text-sm">
              <Check className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
              <span className="dark:text-gray-200">Export do CSV</span>
            </li>
            <li className="flex items-center text-sm">
              <Check className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
              <span className="dark:text-gray-200">Základní support</span>
            </li>
          </ul>
        </CardContent>
        
        <CardFooter className="mt-auto">
          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold text-lg"
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

  // Professional Plan
  if (plan === 'professional') {
    return (
      <Card className={`relative bg-white dark:bg-gray-900 rounded-2xl border-2 ${isPopular ? 'border-green-500 dark:border-green-400' : 'border-gray-200 dark:border-gray-700'} p-4 flex flex-col h-full shadow-sm`}>
        {isPopular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <div className="bg-green-500 dark:bg-green-400 text-white dark:text-black px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <Star className="h-3 w-3" />
              NEJPOPULÁRNĚJŠÍ
            </div>
          </div>
        )}
        
        <CardHeader className="text-center pb-3 pt-6">
          <CardTitle className="text-xl font-bold mb-1 text-gray-900 dark:text-white flex items-center justify-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Profesionál
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400 text-sm">Pro rostoucí podnikatele</CardDescription>
          
          <div className="mt-4">
            <div className="flex items-baseline justify-center mb-1">
              <span className="text-4xl font-bold text-green-600">349</span>
              <span className="text-xl ml-1 text-gray-900 dark:text-white">Kč</span>
              <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">/měsíc</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">
              nebo <strong>3490 Kč/rok</strong> = 291 Kč/měsíc
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">Ceny jsou uvedeny bez DPH</p>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-2 mb-2">
              <div className="text-orange-700 dark:text-orange-300 font-medium text-sm">
                🎁 Prvních 7 dní ZDARMA
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-3">
          <ul className="space-y-2">
            <li className="flex items-center text-sm">
              <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
              <span className="dark:text-gray-200">Neomezený počet dokladů</span>
            </li>
            <li className="flex items-center text-sm">
              <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
              <span className="dark:text-gray-200">Všechny funkce</span>
            </li>
            <li className="flex items-center text-sm">
              <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
              <span className="dark:text-gray-200">API napojení na banky</span>
            </li>
            <li className="flex items-center text-sm">
              <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
              <span className="dark:text-gray-200">Prioritní podpora</span>
            </li>
            <li className="flex items-center text-sm">
              <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
              <span className="dark:text-gray-200">DPH hlídač a optimalizace</span>
            </li>
            <li className="flex items-center text-sm">
              <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
              <span className="dark:text-gray-200">AI zpracování účtenek</span>
            </li>
            <li className="flex items-center text-sm">
              <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
              <span className="dark:text-gray-200">Pokročilé reporty</span>
            </li>
          </ul>
        </CardContent>
        
        <CardFooter className="mt-auto">
          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-semibold text-lg"
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

  // Business Plan
  return (
    <Card className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col h-full shadow-sm">
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
        <div className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
          <Crown className="h-3 w-3" />
          BUSINESS
        </div>
      </div>
      
      <CardHeader className="text-center pb-3 pt-6">
        <CardTitle className="text-xl font-bold mb-1 text-gray-900 dark:text-white flex items-center justify-center gap-2">
          <Building className="h-5 w-5 text-purple-600" />
          Business
        </CardTitle>
        <CardDescription className="text-gray-500 dark:text-gray-400 text-sm">Pro větší firmy a agentury</CardDescription>
        
        <div className="mt-4">
          <div className="flex items-baseline justify-center mb-1">
            <span className="text-4xl font-bold text-purple-600">599</span>
            <span className="text-xl ml-1 text-gray-900 dark:text-white">Kč</span>
            <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">/měsíc</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">
            nebo <strong>5990 Kč/rok</strong>
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">Ceny jsou uvedeny bez DPH</p>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-2 mb-2">
            <div className="text-orange-700 dark:text-orange-300 font-medium text-sm">
              🎁 Prvních 7 dní ZDARMA
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <ul className="space-y-2">
          <li className="flex items-center text-sm">
            <Check className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0" />
            <span className="dark:text-gray-200">Vše z Profesionál</span>
          </li>
          <li className="flex items-center text-sm">
            <Check className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0" />
            <span className="dark:text-gray-200">Multi-uživatelský přístup</span>
          </li>
          <li className="flex items-center text-sm">
            <Check className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0" />
            <span className="dark:text-gray-200">Vlastní branding (white label)</span>
          </li>
          <li className="flex items-center text-sm">
            <Check className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0" />
            <span className="dark:text-gray-200">Dedikovaná podpora</span>
          </li>
          <li className="flex items-center text-sm">
            <Check className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0" />
            <span className="dark:text-gray-200">API pro integrace</span>
          </li>
          <li className="flex items-center text-sm">
            <Check className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0" />
            <span className="dark:text-gray-200">Vlastní onboarding</span>
          </li>
          <li className="flex items-center text-sm">
            <Check className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0" />
            <span className="dark:text-gray-200">SLA garantované</span>
          </li>
        </ul>
      </CardContent>
      
      <CardFooter className="mt-auto">
        <Button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-lg font-semibold text-lg"
          size="lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Načítání...
            </>
          ) : (
            'Kontaktovat prodej'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}