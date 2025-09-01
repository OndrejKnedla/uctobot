'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle, 
  ArrowLeft, 
  ExternalLink, 
  Copy, 
  CheckCircle,
  AlertCircle,
  Phone
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function WhatsAppSetupPage() {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook`

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zpět na hlavní stránku
        </Button>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <MessageCircle className="h-8 w-8 text-[#25D366]" />
            <h1 className="text-3xl font-bold">WhatsApp Bot Nastavení</h1>
          </div>
          <p className="text-muted-foreground">
            Nastavte si WhatsApp integraci pro DokladBot
          </p>
        </div>

        <div className="grid gap-8 mb-8">
          {/* Aktuální stav */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-yellow-800">Aktuální stav - Demo režim</CardTitle>
              </div>
              <CardDescription className="text-yellow-700">
                WhatsApp bot běží v demo režimu. Pro plnou funkcionalnost potřebujete nastavit Twilio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-[#25D366]" />
                    <span className="font-medium">WhatsApp číslo:</span>
                  </div>
                  <Badge variant="outline">+420608123456 (Demo)</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-4 w-4 text-[#25D366]" />
                    <span className="font-medium">Webhook endpoint:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      /api/whatsapp/webhook
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`${(typeof window !== 'undefined' ? window.location.origin : 'https://dokladbot.cz')}/api/whatsapp/webhook`)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Krok 1 - Twilio nastavení */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <CardTitle>Nastavení Twilio WhatsApp</CardTitle>
              </div>
              <CardDescription>
                Pro produkční WhatsApp bot potřebujete Twilio Business účet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">1. Vytvořte Twilio účet</h4>
                  <p className="text-sm text-gray-600">
                    Zaregistrujte se na Twilio.com a aktivujte WhatsApp Business API
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://www.twilio.com/console" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Otevřít Twilio Console
                    </a>
                  </Button>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">2. Webhook URL</h4>
                  <p className="text-sm text-gray-600">
                    Nastavte webhook URL v Twilio Console
                  </p>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={`${(typeof window !== 'undefined' ? window.location.origin : 'https://dokladbot.cz')}/api/whatsapp/webhook`}
                      readOnly 
                      className="text-xs"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`${(typeof window !== 'undefined' ? window.location.origin : 'https://dokladbot.cz')}/api/whatsapp/webhook`)}
                    >
                      {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Krok 2 - Testování */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <CardTitle>Testování bot funkcí</CardTitle>
              </div>
              <CardDescription>
                I v demo režimu můžete testovat základní funkcionalitu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-[#25D366]/10 rounded-lg p-4">
                  <h4 className="font-semibold text-[#25D366] mb-3">Demo příkazy:</h4>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div className="space-y-2">
                      <code className="block bg-white p-2 rounded">DOKLADBOT-ABC123-1234</code>
                      <p className="text-gray-600">Aktivační kód (generovaný po platbě)</p>
                    </div>
                    <div className="space-y-2">
                      <code className="block bg-white p-2 rounded">Příjem 1500 Kč za poradenství</code>
                      <p className="text-gray-600">Zaznamenat příjem</p>
                    </div>
                    <div className="space-y-2">
                      <code className="block bg-white p-2 rounded">Výdaj 250 Kč za kávu</code>
                      <p className="text-gray-600">Zaznamenat výdaj</p>
                    </div>
                    <div className="space-y-2">
                      <code className="block bg-white p-2 rounded">HELP</code>
                      <p className="text-gray-600">Zobrazit nápovědu</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Testování webhook endpointu:</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Můžete testovat webhook přímo pomocí curl nebo Postman:
                  </p>
                  <div className="bg-white p-3 rounded border">
                    <code className="text-xs text-gray-800">
                      curl -X POST {(typeof window !== 'undefined' ? window.location.origin : 'https://dokladbot.cz')}/api/whatsapp/webhook \\<br/>
                      &nbsp;&nbsp;-d "From=whatsapp:+420777888999&Body=HELP"
                    </code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Krok 3 - Produkce */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <CardTitle>Spuštění do produkce</CardTitle>
              </div>
              <CardDescription>
                Co potřebujete pro produkční nasazení
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Environment Variables</h4>
                    <div className="space-y-1 text-sm">
                      <code>TWILIO_ACCOUNT_SID=...</code><br/>
                      <code>TWILIO_AUTH_TOKEN=...</code><br/>
                      <code>WHATSAPP_PHONE_NUMBER=...</code>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Webhook konfigurace</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>• HTTP Method: POST</p>
                      <p>• Content-Type: application/x-www-form-urlencoded</p>
                      <p>• Webhook URL musí být veřejně dostupná</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Facebook WhatsApp API Setup */}
        <Card className="mb-8 border-green-200 bg-gradient-to-br from-green-50 to-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <MessageCircle className="h-6 w-6 text-[#25D366]" />
                  Facebook WhatsApp Cloud API
                </CardTitle>
                <CardDescription className="mt-2">
                  Oficiální WhatsApp Business API přímo od Meta/Facebook - doporučené řešení
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-700">
                Doporučeno
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Oficiální API od Meta</p>
                    <p className="text-sm text-gray-600">Přímá integrace s WhatsApp</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Zdarma pro testování</p>
                    <p className="text-sm text-gray-600">1000 zpráv měsíčně zdarma</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Rychlé nastavení</p>
                    <p className="text-sm text-gray-600">Spuštění do 15 minut</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Business funkce</p>
                    <p className="text-sm text-gray-600">Katalogy, platby, analytics</p>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => router.push('/whatsapp-facebook-setup')}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
                size="lg"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Nastavit Facebook WhatsApp API
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            onClick={() => router.push('/admin')}
            className="mr-4"
          >
            Zobrazit Admin Panel
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push('/')}
          >
            Zpět na hlavní stránku
          </Button>
        </div>
      </div>
    </div>
  )
}