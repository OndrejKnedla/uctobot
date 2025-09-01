'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Shield, Star, TrendingUp, Clock, Zap, Users } from 'lucide-react';
import { paymentsAPI } from '@/lib/api';

interface PricingCardProps {
  plan: 'monthly' | 'yearly';
  isPopular?: boolean;
}

export function PricingCard({ plan, isPopular = false }: PricingCardProps) {
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 6,
    hours: 14,
    minutes: 23,
    seconds: 45
  });
  
  const handlePayment = async () => {
    // Redirect to proper checkout page instead of using old API
    const planType = plan === 'yearly' ? 'YEARLY' : 'MONTHLY';
    window.location.href = `/platba?plan=${planType}`;
  };
  
  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let newSeconds = prev.seconds - 1;
        let newMinutes = prev.minutes;
        let newHours = prev.hours;
        let newDays = prev.days;
        
        if (newSeconds < 0) {
          newSeconds = 59;
          newMinutes -= 1;
        }
        if (newMinutes < 0) {
          newMinutes = 59;
          newHours -= 1;
        }
        if (newHours < 0) {
          newHours = 23;
          newDays -= 1;
        }
        
        return {
          days: Math.max(0, newDays),
          hours: Math.max(0, newHours),
          minutes: Math.max(0, newMinutes),
          seconds: Math.max(0, newSeconds)
        };
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  if (plan === 'monthly') {
    return (
      <Card className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col h-full shadow-sm">
        {/* Top Badge */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-gray-800 dark:bg-gray-700 text-white px-4 py-1 rounded-full text-sm font-medium">
            Nejflexibilnější
          </div>
        </div>
        
        <CardHeader className="text-center pb-3 pt-3">
          <CardTitle className="text-xl font-bold mb-1 text-gray-900 dark:text-white">Měsíční plán</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400 text-sm">Flexibilní měsíční platba</CardDescription>
          
          <div className="mt-4">
            <div className="flex items-baseline justify-center mb-1">
              <span className="text-4xl font-bold text-green-600">199</span>
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
              <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
              <span className="dark:text-gray-200">Všechny funkce</span>
            </li>
            <li className="flex items-center text-sm">
              <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
              <span className="dark:text-gray-200">Neomezené transakce</span>
            </li>
            <li className="flex items-center text-sm">
              <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
              <span className="dark:text-gray-200">AI zpracování účtenek</span>
            </li>
            <li className="flex items-center text-sm">
              <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
              <span className="dark:text-gray-200">WhatsApp podpora</span>
            </li>
            <li className="flex items-center text-sm">
              <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
              <span className="dark:text-gray-200">Automatické DPH</span>
            </li>
            <li className="flex items-center text-sm">
              <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
              <span className="dark:text-gray-200">Export pro účetní</span>
            </li>
            <li className="flex items-center text-sm">
              <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
              <span className="dark:text-gray-200">Zrušit kdykoliv</span>
            </li>
            <li className="flex items-center text-sm">
              <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
              <span className="dark:text-gray-200">Support do 24 hodin</span>
            </li>
            <li className="flex items-center text-sm">
              <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
              <a 
                href="/funkce" 
                className="text-green-600 hover:text-green-700 underline cursor-pointer"
              >
                a další...
              </a>
            </li>
          </ul>
        </CardContent>
        
        <CardFooter className="mt-auto">
          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-gray-800 hover:bg-gray-900 text-white py-4 rounded-lg font-semibold text-lg"
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

  // Yearly plan
  return (
    <Card className="relative bg-white dark:bg-gray-900 rounded-2xl border-2 border-green-500 dark:border-green-400 p-4 flex flex-col h-full shadow-sm">
      {/* Badge */}
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
        <div className="bg-green-500 dark:bg-green-400 text-white dark:text-black px-4 py-1 rounded-full text-sm font-medium">
          + 2 měsíce ZDARMA
        </div>
      </div>
      
      <CardHeader className="text-center pb-3 pt-3">
        <CardTitle className="text-xl font-bold mb-1 dark:text-white">Roční plán</CardTitle>
        <CardDescription className="text-gray-500 dark:text-gray-400 text-sm">Ušetřete s ročním plánem</CardDescription>
        
        <div className="mt-4">
          <div className="flex items-baseline justify-center mb-1">
            <span className="text-4xl font-bold text-green-600">166</span>
            <span className="text-xl ml-1 text-gray-900 dark:text-white">Kč</span>
            <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">/měsíc</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
            Fakturováno ročně 1990 Kč
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">Ceny jsou uvedeny bez DPH</p>
          <p className="text-green-600 dark:text-green-400 font-semibold text-sm mb-2">
            398 Kč ušetříte
          </p>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-2">
            <div className="text-orange-700 font-medium text-sm">
              🎁 7 dní zdarma + 2 měsíce ZDARMA
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <ul className="space-y-2">
          <li className="flex items-center text-sm">
            <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
            <span className="dark:text-gray-200">Vše z měsíčního plánu</span>
          </li>
          <li className="flex items-center text-sm">
            <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
            <span className="dark:text-gray-200">2 měsíce ZDARMA</span>
          </li>
          <li className="flex items-center text-sm">
            <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
            <span className="dark:text-gray-200">Prioritní support</span>
          </li>
          <li className="flex items-center text-sm">
            <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
            <span className="dark:text-gray-200">Founding member cena navždy</span>
          </li>
          <li className="flex items-center text-sm">
            <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
            <span className="dark:text-gray-200">AI zpracování účtenek</span>
          </li>
          <li className="flex items-center text-sm">
            <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
            <span className="dark:text-gray-200">WhatsApp podpora 24/7</span>
          </li>
          <li className="flex items-center text-sm">
            <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
            <span className="dark:text-gray-200">Automatické DPH</span>
          </li>
          <li className="flex items-center text-sm">
            <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
            <span className="dark:text-gray-200">Export pro účetní</span>
          </li>
          <li className="flex items-center text-sm">
            <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
            <a 
              href="/funkce" 
              className="text-green-600 hover:text-green-700 underline cursor-pointer"
            >
              a další...
            </a>
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