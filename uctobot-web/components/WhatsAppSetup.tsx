"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QrCode, MessageSquare, CheckCircle, Camera, Bot, Sparkles, Smartphone } from 'lucide-react'

interface WhatsAppSetupProps {
  whatsappNumber?: string
}

export default function WhatsAppSetup({ whatsappNumber = '+14155238886' }: WhatsAppSetupProps) {
  const [activeTab, setActiveTab] = useState("qr")
  
  const whatsappLink = `https://wa.me/${whatsappNumber.replace('+', '')}?text=Ahoj%2C%20chci%20vyzkou%C5%A1et%20%C3%9A%C4%8DtoBot`

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Připojte WhatsApp za 30 sekund</h1>
        <p className="text-xl text-gray-600">
          Začněte účtovat přímo z WhatsApp s AI asistentem
        </p>
        
        <div className="flex justify-center gap-4">
          <Badge variant="secondary" className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Fotky účtenek
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            AI rozpoznávání
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Auto kategorie
          </Badge>
        </div>
      </div>

      {/* Setup Options */}
      <Card>
        <CardHeader>
          <CardTitle>Vyberte způsob připojení</CardTitle>
          <CardDescription>
            Připojte se k ÚčtoBotu pomocí QR kódu nebo přímého odkazu
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qr" className="flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                QR kód
              </TabsTrigger>
              <TabsTrigger value="link" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Přímý odkaz
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qr" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* QR Code */}
                <div className="flex flex-col items-center space-y-4">
                  <h3 className="font-semibold text-lg">1. Naskenujte QR kód</h3>
                  
                  {/* QR Code Placeholder */}
                  <div className="w-64 h-64 bg-white border rounded-lg shadow-md flex items-center justify-center">
                    <div className="text-center">
                      <QrCode className="w-24 h-24 mx-auto text-gray-400 mb-4" />
                      <p className="text-sm text-gray-500">
                        QR kód pro {whatsappNumber}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        V reálné implementaci by zde byl<br/>
                        skutečný QR kód pro WhatsApp
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600 font-medium">
                      📱 Na mobilu otevřete WhatsApp
                    </p>
                    <p className="text-xs text-gray-500">
                      Nastavení → Propojená zařízení → Přidat zařízení
                    </p>
                  </div>
                </div>
                
                {/* Instructions */}
                <div className="space-y-6">
                  <h3 className="font-semibold text-lg">2. Postupujte podle kroků</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Otevřete WhatsApp</p>
                        <p className="text-sm text-gray-600">Na vašem telefonu spusťte aplikaci WhatsApp</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Naskenujte QR kód</p>
                        <p className="text-sm text-gray-600">Použijte kameru k naskenování QR kódu vlevo</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Napište "Ahoj"</p>
                        <p className="text-sm text-gray-600">Pošlete první zprávu pro aktivaci bota</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="link" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Direct Link */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">1. Klikněte na tlačítko</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="font-medium text-green-900 mb-2">WhatsApp číslo:</p>
                      <p className="font-mono text-lg text-green-800">{whatsappNumber}</p>
                    </div>
                    
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white">
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Otevřít WhatsApp
                      </Button>
                    </a>
                    
                    <p className="text-sm text-gray-600 text-center">
                      Tlačítko otevře WhatsApp s připravenou zprávou
                    </p>
                  </div>
                </div>
                
                {/* Manual Option */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">2. Nebo přidejte ručně</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="text-green-500 mt-1" size={20} />
                      <span className="text-sm">Otevřete WhatsApp na telefonu</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="text-green-500 mt-1" size={20} />
                      <span className="text-sm">Přidejte kontakt: <strong>{whatsappNumber}</strong></span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="text-green-500 mt-1" size={20} />
                      <span className="text-sm">Napište "Ahoj, chci vyzkoušet ÚčtoBot"</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Instructions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Receipt Processing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              Jak posílat účtenky
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-500 mt-1" size={16} />
              <span className="text-sm">Vyfoťte účtenku mobilem (nemusí být dokonalá)</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-500 mt-1" size={16} />
              <span className="text-sm">Pošlete fotku na WhatsApp</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-500 mt-1" size={16} />
              <span className="text-sm">Bot automaticky rozpozná údaje a uloží transakci</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-500 mt-1" size={16} />
              <span className="text-sm">Dostanete potvrzení s rozpoznanými údaji</span>
            </div>
          </CardContent>
        </Card>

        {/* Text Commands */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-600" />
              Textové příkazy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Příklady zpráv:</p>
              <div className="space-y-1">
                <code className="block bg-gray-100 px-3 py-2 rounded text-sm">
                  "Benzín 800 Kč"
                </code>
                <code className="block bg-gray-100 px-3 py-2 rounded text-sm">
                  "Alza notebook 25000"
                </code>
                <code className="block bg-gray-100 px-3 py-2 rounded text-sm">
                  "Faktura od klienta 15000"
                </code>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Užitečné příkazy:</p>
              <div className="text-sm space-y-1">
                <p>• "Pomoc" - kompletní návod</p>
                <p>• "Přehled" - měsíční souhrn</p>
                <p>• "Export" - export dat</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Message */}
      <Alert>
        <Smartphone className="h-4 w-4" />
        <AlertDescription>
          <strong>První zpráva k vyzkoušení:</strong>
          <br />
          <code className="bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
            "Ahoj, chci vyzkoušet ÚčtoBot"
          </code>
        </AlertDescription>
      </Alert>

      {/* Features Overview */}
      <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4 text-center">Co všechno umím rozpoznat z účtenek:</h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-semibold">AI Rozpoznání</h4>
            <p className="text-sm text-gray-600">
              Celkové částky, názvy obchodů, data nákupů
            </p>
          </div>
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-semibold">Validace</h4>
            <p className="text-sm text-gray-600">
              IČO přes ARES registr, automatické DPH výpočty
            </p>
          </div>
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-semibold">Kategorizace</h4>
            <p className="text-sm text-gray-600">
              Automatické zařazení do správných účetních kategorií
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <p className="text-gray-600 mb-4">
          Připraveni začít s inteligentním účetnictvím?
        </p>
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
          <Button size="lg" className="bg-green-600 hover:bg-green-700">
            <MessageSquare className="w-5 h-5 mr-2" />
            Spustit ÚčtoBot
          </Button>
        </a>
      </div>
    </div>
  )
}