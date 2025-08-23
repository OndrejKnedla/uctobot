"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Camera, Receipt, FileText, Sparkles } from 'lucide-react'
import Link from 'next/link'
import ReceiptUpload from '@/components/ReceiptUpload'
import TransactionForm from '@/components/TransactionForm'
import { toast } from '@/hooks/use-toast'

interface Transaction {
  id: number
  type: string
  description: string
  amount: number
  currency: string
  category: string
  document_number?: string
  counterparty?: string
  items_count: number
  created_at?: string
}

export default function DemoPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [activeTab, setActiveTab] = useState("upload")

  // Mock user ID for demo
  const DEMO_USER_ID = 1

  const handleTransactionCreated = (transaction: Transaction) => {
    // Add timestamp
    const newTransaction = {
      ...transaction,
      created_at: new Date().toISOString()
    }
    
    setTransactions(prev => [newTransaction, ...prev])
    
    toast({
      title: "Demo transakce vytvořena",
      description: `Transakce ${transaction.description} byla přidána do seznamu`
    })
  }

  const handleFormSubmit = async (formData: any) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock transaction creation
    const mockTransaction: Transaction = {
      id: Date.now(),
      type: formData.type,
      description: formData.description,
      amount: formData.amount,
      currency: formData.currency,
      category: formData.categoryName,
      document_number: formData.documentNumber,
      counterparty: formData.counterpartyName,
      items_count: formData.items.length,
      created_at: new Date().toISOString()
    }

    handleTransactionCreated(mockTransaction)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zpět na hlavní stránku
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">ÚčtoBot - Pokročilé funkce</h1>
              <p className="text-gray-600">Demo nových účetních funkcí s OCR a AI zpracováním</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Features Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                OCR Zpracování
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Vyfotografujte účtenku a AI automaticky extrahuje všechny údaje včetně položek, dodavatele a DPH.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-green-600" />
                Detailní transakce
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Kompletní formulář s položkami faktury, údaji o dodavateli, IČO, DIČ a platebními údaji.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Validace
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                AI kontroluje IČO přes ARES, validuje DPH výpočty a navrhuje správné kategorie.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Nové účetní funkce</CardTitle>
                <CardDescription>
                  Vyzkoušejte pokročilé funkce pro profesionální účetnictví OSVČ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Nahrát účtenku
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Ruční zadání
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-medium text-blue-900 mb-2">📸 OCR Demo</h3>
                        <p className="text-blue-700 text-sm">
                          <strong>Poznámka:</strong> Pro plnou funkcionalnost OCR je potřeba nainstalovat Tesseract OCR na serveru. 
                          V demo režimu se zobrazí simulované výsledky.
                        </p>
                      </div>
                      <ReceiptUpload 
                        userId={DEMO_USER_ID}
                        onTransactionCreated={handleTransactionCreated}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="manual" className="space-y-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h3 className="font-medium text-green-900 mb-2">📝 Detailní formulář</h3>
                        <p className="text-green-700 text-sm">
                          Vyplňte všechny účetní údaje včetně položek faktury, údajů o dodavateli a platebních informací.
                        </p>
                      </div>
                      <TransactionForm 
                        userId={DEMO_USER_ID}
                        onSubmit={handleFormSubmit}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Recent Transactions */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Demo transakce
                </CardTitle>
                <CardDescription>
                  Transakce vytvořené v této demo session
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Zatím žádné transakce</p>
                    <p className="text-sm">Vytvořte první transakci pomocí formuláře nebo nahráním účtenky</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <Card key={transaction.id} className="p-3">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                              {transaction.type === 'income' ? 'Příjem' : 'Výdaj'}
                            </Badge>
                            <span className="font-bold text-sm">
                              {transaction.amount.toLocaleString()} {transaction.currency}
                            </span>
                          </div>
                          
                          <h4 className="font-medium text-sm">{transaction.description}</h4>
                          
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>Kategorie: {transaction.category}</div>
                            {transaction.counterparty && (
                              <div>Dodavatel: {transaction.counterparty}</div>
                            )}
                            {transaction.document_number && (
                              <div>Doklad: {transaction.document_number}</div>
                            )}
                            {transaction.items_count > 0 && (
                              <div>Položky: {transaction.items_count}</div>
                            )}
                            {transaction.created_at && (
                              <div>Vytvořeno: {new Date(transaction.created_at).toLocaleString('cs-CZ')}</div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                    
                    {transactions.length > 0 && (
                      <div className="pt-4 border-t">
                        <p className="text-sm text-gray-600 text-center">
                          Celkem: {transactions.length} transakcí
                        </p>
                        <p className="text-xs text-gray-500 text-center mt-1">
                          Demo data - neukládají se do databáze
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Technical Info */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Technické informace
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Backend rozšíření:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Rozšířené databázové modely (Transaction, TransactionItem, TransactionAttachment)</li>
                    <li>• OCR endpoint s podporou Tesseract</li>
                    <li>• Enhanced AI parser s Groq LLaMA-70B</li>
                    <li>• ARES validace IČO/DIČ</li>
                    <li>• Automatické DPH výpočty</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Frontend komponenty:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• ReceiptUpload - drag & drop, preview, progress</li>
                    <li>• TransactionForm - multi-tab detailní formulář</li>
                    <li>• Validace, kalkulace DPH, položky faktury</li>
                    <li>• Real-time feedback a notifikace</li>
                    <li>• Responsive design pro všechna zařízení</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">API Endpointy:</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p><code>/ocr/status</code> - Kontrola OCR služby</p>
                    <p><code>/ocr/process-receipt</code> - Zpracování účtenky</p>
                  </div>
                  <div>
                    <p><code>/ocr/extract-text</code> - Pouze extrakce textu</p>
                    <p><code>/ocr/languages</code> - Podporované jazyky</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}