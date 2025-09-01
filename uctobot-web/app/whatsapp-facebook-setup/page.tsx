'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MessageCircle, 
  ArrowLeft, 
  ExternalLink, 
  Copy, 
  CheckCircle,
  AlertCircle,
  Settings,
  Shield,
  Link,
  Send
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function FacebookWhatsAppSetupPage() {
  const router = useRouter()
  const [copied, setCopied] = useState<string | null>(null)
  const [testMessageSent, setTestMessageSent] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  
  useEffect(() => {
    // Get the actual URL when component mounts
    setWebhookUrl(`${window.location.origin}/api/whatsapp/facebook`)
  }, [])

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(field)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const sendTestMessage = async () => {
    try {
      const response = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'Test message from ÚčtoBot',
          phoneNumber: '+420777888999' 
        })
      })
      
      if (response.ok) {
        setTestMessageSent(true)
        setTimeout(() => setTestMessageSent(false), 3000)
      }
    } catch (error) {
      console.error('Test message failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button
          onClick={() => router.push('/whatsapp-setup')}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zpět na WhatsApp nastavení
        </Button>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <MessageCircle className="h-10 w-10 text-[#25D366]" />
            <h1 className="text-4xl font-bold">Facebook WhatsApp Cloud API</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Kompletní průvodce nastavením WhatsApp Business API přes Facebook
          </p>
        </div>

        {/* Prerequisites Alert */}
        <Alert className="mb-8 border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Před začátkem potřebujete:</strong>
            <ul className="list-disc list-inside mt-2">
              <li>Facebook Business účet</li>
              <li>Ověřené WhatsApp Business telefonní číslo</li>
              <li>Veřejně dostupnou URL (můžete použít ngrok pro testování)</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Step 1 - Meta Developer Account */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">1</span>
              </div>
              <div>
                <CardTitle>Vytvoření Meta Developer účtu a Business App</CardTitle>
                <CardDescription>Základní nastavení na Facebook Developers</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Vytvoření aplikace
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Přejděte na Facebook Developers</li>
                  <li>Klikněte na "My Apps" → "Create App"</li>
                  <li>Vyberte "Business" jako typ aplikace</li>
                  <li>Vyplňte název aplikace (např. "UctoBot WhatsApp")</li>
                  <li>Vyberte váš Business účet</li>
                </ol>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Otevřít Facebook Developers
                  </a>
                </Button>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Přidání WhatsApp produktu
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>V Dashboard aplikace najděte "Add Product"</li>
                  <li>Vyhledejte "WhatsApp" a klikněte "Set Up"</li>
                  <li>Vyberte existující Business účet nebo vytvořte nový</li>
                  <li>Systém vytvoří testovací telefonní číslo</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2 - Get Credentials */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-lg">2</span>
              </div>
              <div>
                <CardTitle>Získání přístupových údajů</CardTitle>
                <CardDescription>Zkopírujte tyto údaje z Facebook Developer Console</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="access-token">Temporary Access Token</Label>
                <div className="flex gap-2">
                  <Input 
                    id="access-token"
                    placeholder="Najdete v WhatsApp > API Setup > Temporary access token"
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('', 'access-token')}
                  >
                    {copied === 'access-token' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Token vyprší za 24 hodin, pro produkci použijte System User token</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone-id">Phone Number ID</Label>
                <div className="flex gap-2">
                  <Input 
                    id="phone-id"
                    placeholder="Najdete v WhatsApp > API Setup > From"
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('', 'phone-id')}
                  >
                    {copied === 'phone-id' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-id">WhatsApp Business Account ID</Label>
                <div className="flex gap-2">
                  <Input 
                    id="business-id"
                    placeholder="Najdete v WhatsApp > API Setup"
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('', 'business-id')}
                  >
                    {copied === 'business-id' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-700">
                Tyto údaje uložte do souboru <code className="px-1 py-0.5 bg-yellow-100 rounded">.env.local</code>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Step 3 - Configure Webhook */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold text-lg">3</span>
              </div>
              <div>
                <CardTitle>Nastavení Webhook</CardTitle>
                <CardDescription>Propojení Facebook WhatsApp s vaší aplikací</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Link className="h-4 w-4" />
                Webhook URL pro Facebook
              </h4>
              <div className="flex gap-2">
                <Input 
                  value={webhookUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                >
                  {copied === 'webhook' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Verify Token
              </h4>
              <div className="flex gap-2">
                <Input 
                  value="uctobot_verify_token_2024"
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard('uctobot_verify_token_2024', 'verify')}
                >
                  {copied === 'verify' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500">Použijte tento token při konfiguraci webhooků na Facebooku</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Nastavení na Facebook Developers:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Jděte do WhatsApp → Configuration → Webhook</li>
                <li>Klikněte "Edit" u Callback URL</li>
                <li>Vložte Webhook URL a Verify Token</li>
                <li>Klikněte "Verify and Save"</li>
                <li>Zaškrtněte pole "messages" pro příjem zpráv</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Step 4 - Add Test Numbers */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-bold text-lg">4</span>
              </div>
              <div>
                <CardTitle>Přidání testovacích čísel</CardTitle>
                <CardDescription>Přidejte telefonní čísla pro testování</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              V sekci WhatsApp → API Setup → To:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Klikněte na "Manage phone number list"</li>
              <li>Přidejte svoje telefonní číslo ve formátu +420XXXXXXXXX</li>
              <li>Facebook pošle ověřovací kód přes WhatsApp</li>
              <li>Zadejte kód pro ověření čísla</li>
              <li>Můžete přidat až 5 testovacích čísel zdarma</li>
            </ol>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Pro testování používáte sandbox prostředí s omezeními. Pro produkci je nutné požádat o Business verification.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Step 5 - Test Integration */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                <span className="text-teal-600 font-bold text-lg">5</span>
              </div>
              <div>
                <CardTitle>Testování integrace</CardTitle>
                <CardDescription>Ověřte, že vše funguje správně</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold">Test pomocí Facebook Console</h4>
                <p className="text-sm text-gray-600">
                  V sekci API Setup můžete poslat testovací zprávu přímo z konzole
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Otevřít Facebook Console
                  </a>
                </Button>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold">Test z aplikace</h4>
                <p className="text-sm text-gray-600">
                  Odešlete testovací zprávu z této aplikace
                </p>
                <Button 
                  onClick={sendTestMessage}
                  disabled={testMessageSent}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {testMessageSent ? 'Zpráva odeslána!' : 'Poslat testovací zprávu'}
                </Button>
              </div>
            </div>

            <div className="bg-[#25D366]/10 rounded-lg p-4">
              <h4 className="font-semibold text-[#25D366] mb-3">Testovací příkazy:</h4>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <code className="bg-white p-2 rounded">UCTOBOT-ABC123-1234</code>
                <code className="bg-white p-2 rounded">HELP</code>
                <code className="bg-white p-2 rounded">Příjem 1500 Kč</code>
                <code className="bg-white p-2 rounded">Výdaj 250 Kč</code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Production Checklist */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Checklist pro produkci
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-700">Facebook nastavení:</h4>
                <div className="space-y-1 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    Business verification dokončena
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    Permanentní Access Token vygenerován
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    Webhook nakonfigurován a ověřen
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    Message Templates schváleny
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-green-700">Aplikace nastavení:</h4>
                <div className="space-y-1 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    Environment variables nastaveny
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    HTTPS endpoint dostupný
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    Error handling implementován
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    Rate limiting nastaven
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="text-center">
          <Button 
            onClick={() => router.push('/admin')}
            className="mr-4"
          >
            Admin Panel
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push('/whatsapp-setup')}
          >
            Zpět na WhatsApp nastavení
          </Button>
        </div>
      </div>
    </div>
  )
}