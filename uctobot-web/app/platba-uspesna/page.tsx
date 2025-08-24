'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Copy, MessageCircle, Clock, Mail } from 'lucide-react';

interface PaymentSuccessData {
  success: boolean;
  activation_token: string;
  whatsapp_number: string;
  user_email: string;
  expires_at: string;
  error?: string;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [data, setData] = useState<PaymentSuccessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (sessionId) {
      fetch(`https://uctobot.vercel.app/api/payment-success?session_id=${sessionId}`)
        .then(res => res.json())
        .then(setData)
        .catch(err => {
          console.error('Chyba při načítání dat:', err);
          setData({ success: false, error: 'Nepodařilo se načíst data platby' } as PaymentSuccessData);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      setData({ success: false, error: 'Chybí ID platební session' } as PaymentSuccessData);
    }
  }, [sessionId]);
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Nepodařilo se zkopírovat:', err);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-600">Zpracovávám platbu...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!data?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <CardTitle className="text-red-800">Chyba při zpracování</CardTitle>
            <CardDescription>
              {data?.error || 'Něco se pokazilo při zpracování vaší platby.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/">Zpět na hlavní stránku</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const whatsappLink = `https://api.whatsapp.com/send?phone=${data.whatsapp_number.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(data.activation_token)}`;
  const expiresDate = new Date(data.expires_at).toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Hlavní success card */}
        <Card className="mb-6 border-green-200 shadow-lg">
          <CardHeader className="text-center bg-green-50 rounded-t-lg">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-3xl text-green-800 mb-2">
              ✅ Platba úspěšná!
            </CardTitle>
            <CardDescription className="text-lg">
              Vaše předplatné ÚčetníBot je aktivní
            </CardDescription>
          </CardHeader>
        </Card>
        
        {/* Aktivační kód */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Badge className="mr-2">1</Badge>
              Váš aktivační kód
            </CardTitle>
            <CardDescription>
              Zkopírujte tento kód a pošlete ho na WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-between">
              <code className="text-lg font-mono text-gray-800 flex-1 mr-4">
                {data.activation_token}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(data.activation_token)}
                className="flex items-center"
              >
                <Copy className="w-4 h-4 mr-1" />
                {copied ? 'Zkopírováno!' : 'Kopírovat'}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* WhatsApp číslo */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Badge className="mr-2">2</Badge>
              WhatsApp číslo
            </CardTitle>
            <CardDescription>
              Uložte si toto číslo a napište aktivační kód
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-800 mb-2">
                  {data.whatsapp_number}
                </div>
                <div className="text-sm text-blue-600">
                  ÚčetníBot - AI účetní asistent
                </div>
              </div>
            </div>
            
            <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white py-6">
              <a 
                href={whatsappLink}
                className="flex items-center justify-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Aktivovat na WhatsApp →
              </a>
            </Button>
          </CardContent>
        </Card>
        
        {/* Instrukce */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Badge className="mr-2">3</Badge>
              Jak na to
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-blue-600 text-sm font-semibold">1</span>
                </div>
                <div>
                  <div className="font-semibold">Uložte číslo</div>
                  <div className="text-sm text-gray-600">
                    Přidejte {data.whatsapp_number} do kontaktů jako "ÚčetníBot"
                  </div>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-blue-600 text-sm font-semibold">2</span>
                </div>
                <div>
                  <div className="font-semibold">Pošlete aktivační kód</div>
                  <div className="text-sm text-gray-600">
                    Napište nebo zkopírujte kód do WhatsApp zprávy
                  </div>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-blue-600 text-sm font-semibold">3</span>
                </div>
                <div>
                  <div className="font-semibold">Začněte používat</div>
                  <div className="text-sm text-gray-600">
                    Bot vás přivítá a můžete začít posílat účtenky!
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Důležité informace */}
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start">
              <Clock className="w-5 h-5 text-amber-600 mr-3 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-800 mb-1">
                  Kód platí do {expiresDate}
                </div>
                <div className="text-sm text-amber-700">
                  Aktivujte svůj ÚčetníBot do 48 hodin od platby
                </div>
              </div>
            </div>
            
            <div className="flex items-start mt-4">
              <Mail className="w-5 h-5 text-amber-600 mr-3 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-800 mb-1">
                  Email potvrzení
                </div>
                <div className="text-sm text-amber-700">
                  Kód a instrukce byly také zaslány na {data.user_email}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Podpora */}
        <Card>
          <CardContent className="text-center p-6">
            <h3 className="font-semibold mb-2">Potřebujete pomoc?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Pokud máte problém s aktivací, kontaktujte nás
            </p>
            <div className="space-y-2">
              <Button variant="outline" asChild>
                <a href="mailto:podpora@ucetnibot.cz">
                  podpora@ucetnibot.cz
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-600">Načítám...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}