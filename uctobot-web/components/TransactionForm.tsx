"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Plus, X, CalendarIcon, Building2, Receipt, CreditCard, Banknote, Info } from 'lucide-react'
import { format } from 'date-fns'
import { cs } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'

interface TransactionItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  unitPriceWithVat: number
  vatRate: number
  totalWithoutVat: number
  vatAmount: number
  totalWithVat: number
  categoryCode?: string
  categoryName?: string
}

interface TransactionFormData {
  type: 'income' | 'expense'
  description: string
  amount: number
  currency: string
  categoryCode: string
  categoryName: string
  
  // Document info
  documentNumber?: string
  documentDate?: Date
  dueDate?: Date
  paymentDate?: Date
  
  // Counterparty
  counterpartyName?: string
  counterpartyIco?: string
  counterpartyDic?: string
  counterpartyAddress?: string
  
  // Payment info
  paymentMethod?: string
  bankAccount?: string
  variableSymbol?: string
  constantSymbol?: string
  specificSymbol?: string
  
  // VAT info
  vatRate: number
  vatBase?: number
  vatAmount?: number
  vatIncluded: boolean
  
  // Items
  items: TransactionItem[]
  
  // Additional
  notes?: string
  tags?: string[]
}

interface TransactionFormProps {
  userId: number
  initialData?: Partial<TransactionFormData>
  onSubmit?: (data: TransactionFormData) => void
  onCancel?: () => void
}

const expenseCategories = [
  { code: "501100", name: "Spotřeba materiálu" },
  { code: "501300", name: "PHM" },
  { code: "501400", name: "Drobný majetek" },
  { code: "512100", name: "Cestovné" },
  { code: "513100", name: "Reprezentace" },
  { code: "518100", name: "Nájemné" },
  { code: "518200", name: "Telefon a internet" },
  { code: "518300", name: "Software" },
  { code: "518500", name: "Právní a poradenské služby" },
  { code: "518600", name: "Marketing a reklama" },
  { code: "518900", name: "Ostatní služby" },
  { code: "549100", name: "Ostatní provozní náklady" }
]

const incomeCategories = [
  { code: "602100", name: "Tržby za služby" },
  { code: "602200", name: "Tržby za poradenství" },
  { code: "604100", name: "Tržby za zboží" },
  { code: "648100", name: "Ostatní provozní výnosy" }
]

const paymentMethods = [
  { value: "hotovost", label: "Hotovost" },
  { value: "bankovní_převod", label: "Bankovní převod" },
  { value: "karta", label: "Platební karta" },
  { value: "online", label: "Online platba" }
]

const vatRates = [0, 12, 21]

export default function TransactionForm({ 
  userId, 
  initialData, 
  onSubmit, 
  onCancel 
}: TransactionFormProps) {
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'expense',
    description: '',
    amount: 0,
    currency: 'CZK',
    categoryCode: '',
    categoryName: '',
    vatRate: 21,
    vatIncluded: true,
    items: [],
    ...initialData
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")

  // Generate unique ID for new items
  const generateItemId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const updateFormData = (field: keyof TransactionFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCategoryChange = (categoryCode: string) => {
    const categories = formData.type === 'expense' ? expenseCategories : incomeCategories
    const category = categories.find(c => c.code === categoryCode)
    
    setFormData(prev => ({
      ...prev,
      categoryCode,
      categoryName: category?.name || ''
    }))
  }

  const addItem = () => {
    const newItem: TransactionItem = {
      id: generateItemId(),
      description: '',
      quantity: 1,
      unit: 'ks',
      unitPrice: 0,
      unitPriceWithVat: 0,
      vatRate: formData.vatRate,
      totalWithoutVat: 0,
      vatAmount: 0,
      totalWithVat: 0
    }
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
  }

  const updateItem = (itemId: string, field: keyof TransactionItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== itemId) return item

        const updatedItem = { ...item, [field]: value }

        // Recalculate totals when relevant fields change
        if (['quantity', 'unitPrice', 'unitPriceWithVat', 'vatRate'].includes(field)) {
          if (updatedItem.unitPriceWithVat > 0) {
            updatedItem.unitPrice = updatedItem.unitPriceWithVat / (1 + updatedItem.vatRate / 100)
          } else if (updatedItem.unitPrice > 0) {
            updatedItem.unitPriceWithVat = updatedItem.unitPrice * (1 + updatedItem.vatRate / 100)
          }

          updatedItem.totalWithoutVat = updatedItem.unitPrice * updatedItem.quantity
          updatedItem.vatAmount = updatedItem.totalWithoutVat * (updatedItem.vatRate / 100)
          updatedItem.totalWithVat = updatedItem.totalWithoutVat + updatedItem.vatAmount
        }

        return updatedItem
      })
    }))
  }

  const removeItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }))
  }

  const calculateTotals = () => {
    const itemsTotal = formData.items.reduce((sum, item) => sum + item.totalWithVat, 0)
    return {
      itemsTotal,
      mainAmount: formData.amount,
      difference: Math.abs(itemsTotal - formData.amount)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.description.trim()) {
      toast({
        title: "Chybějící popis",
        description: "Vyplňte prosím popis transakce",
        variant: "destructive"
      })
      return
    }

    if (formData.amount <= 0) {
      toast({
        title: "Neplatná částka",
        description: "Částka musí být větší než 0",
        variant: "destructive"
      })
      return
    }

    if (!formData.categoryCode) {
      toast({
        title: "Chybějící kategorie",
        description: "Vyberte prosím kategorii transakce",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (onSubmit) {
        await onSubmit(formData)
      }
      
      toast({
        title: "Transakce uložena",
        description: "Transakce byla úspěšně uložena do systému"
      })
    } catch (error: any) {
      toast({
        title: "Chyba při ukládání",
        description: error.message || "Nepodařilo se uložit transakci",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const totals = calculateTotals()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            {initialData ? 'Upravit transakci' : 'Nová transakce'}
          </CardTitle>
          <CardDescription>
            Vyplňte detailní informace o transakci pro přesné účetní záznamy
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Základní</TabsTrigger>
              <TabsTrigger value="document">Doklad</TabsTrigger>
              <TabsTrigger value="counterparty">Protistrana</TabsTrigger>
              <TabsTrigger value="items">Položky</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              {/* Transaction Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Typ transakce</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value: 'income' | 'expense') => updateFormData('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Výdaj</SelectItem>
                      <SelectItem value="income">Příjem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Celková částka *</Label>
                  <div className="flex">
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => updateFormData('amount', parseFloat(e.target.value) || 0)}
                      className="rounded-r-none"
                      required
                    />
                    <Select value={formData.currency} onValueChange={(value) => updateFormData('currency', value)}>
                      <SelectTrigger className="w-20 rounded-l-none border-l-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CZK">CZK</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Popis transakce *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Např. Nákup kancelářských potřeb"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <Label>Kategorie *</Label>
                <Select 
                  value={formData.categoryCode} 
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte kategorii" />
                  </SelectTrigger>
                  <SelectContent>
                    {(formData.type === 'expense' ? expenseCategories : incomeCategories).map(category => (
                      <SelectItem key={category.code} value={category.code}>
                        {category.code} - {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* VAT Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sazba DPH (%)</Label>
                  <Select 
                    value={formData.vatRate.toString()} 
                    onValueChange={(value) => updateFormData('vatRate', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vatRates.map(rate => (
                        <SelectItem key={rate} value={rate.toString()}>
                          {rate}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="vatIncluded"
                    checked={formData.vatIncluded}
                    onCheckedChange={(checked) => updateFormData('vatIncluded', checked)}
                  />
                  <Label htmlFor="vatIncluded">DPH je zahrnuto v ceně</Label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Poznámky</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => updateFormData('notes', e.target.value)}
                  placeholder="Dodatečné poznámky k transakci"
                  rows={2}
                />
              </div>
            </TabsContent>

            <TabsContent value="document" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="documentNumber">Číslo dokladu</Label>
                  <Input
                    id="documentNumber"
                    value={formData.documentNumber || ''}
                    onChange={(e) => updateFormData('documentNumber', e.target.value)}
                    placeholder="Např. 2024001234"
                  />
                </div>

                <div>
                  <Label>Datum vystavení</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.documentDate ? (
                          format(formData.documentDate, "d. MMMM yyyy", { locale: cs })
                        ) : (
                          <span>Vyberte datum</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.documentDate}
                        onSelect={(date) => updateFormData('documentDate', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Datum splatnosti</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dueDate ? (
                          format(formData.dueDate, "d. MMMM yyyy", { locale: cs })
                        ) : (
                          <span>Vyberte datum</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.dueDate}
                        onSelect={(date) => updateFormData('dueDate', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Datum úhrady</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.paymentDate ? (
                          format(formData.paymentDate, "d. MMMM yyyy", { locale: cs })
                        ) : (
                          <span>Vyberte datum</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.paymentDate}
                        onSelect={(date) => updateFormData('paymentDate', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Payment Info */}
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Platební údaje
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Způsob platby</Label>
                    <Select 
                      value={formData.paymentMethod || ''} 
                      onValueChange={(value) => updateFormData('paymentMethod', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte způsob" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map(method => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="bankAccount">Bankovní účet</Label>
                    <Input
                      id="bankAccount"
                      value={formData.bankAccount || ''}
                      onChange={(e) => updateFormData('bankAccount', e.target.value)}
                      placeholder="123456789/0300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="variableSymbol">Variabilní symbol</Label>
                    <Input
                      id="variableSymbol"
                      value={formData.variableSymbol || ''}
                      onChange={(e) => updateFormData('variableSymbol', e.target.value)}
                      placeholder="2024001234"
                    />
                  </div>

                  <div>
                    <Label htmlFor="constantSymbol">Konstantní symbol</Label>
                    <Input
                      id="constantSymbol"
                      value={formData.constantSymbol || ''}
                      onChange={(e) => updateFormData('constantSymbol', e.target.value)}
                      placeholder="0308"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="counterparty" className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Informace o protistraně
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="counterpartyName">Název firmy</Label>
                  <Input
                    id="counterpartyName"
                    value={formData.counterpartyName || ''}
                    onChange={(e) => updateFormData('counterpartyName', e.target.value)}
                    placeholder="Název společnosti s.r.o."
                  />
                </div>

                <div>
                  <Label htmlFor="counterpartyIco">IČO</Label>
                  <Input
                    id="counterpartyIco"
                    value={formData.counterpartyIco || ''}
                    onChange={(e) => updateFormData('counterpartyIco', e.target.value)}
                    placeholder="12345678"
                    maxLength={8}
                  />
                </div>

                <div>
                  <Label htmlFor="counterpartyDic">DIČ</Label>
                  <Input
                    id="counterpartyDic"
                    value={formData.counterpartyDic || ''}
                    onChange={(e) => updateFormData('counterpartyDic', e.target.value)}
                    placeholder="CZ12345678"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="counterpartyAddress">Adresa</Label>
                  <Textarea
                    id="counterpartyAddress"
                    value={formData.counterpartyAddress || ''}
                    onChange={(e) => updateFormData('counterpartyAddress', e.target.value)}
                    placeholder="Ulice 123, 110 00 Praha"
                    rows={2}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="items" className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Položky faktury</h4>
                <Button type="button" onClick={addItem} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Přidat položku
                </Button>
              </div>

              {formData.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Info className="w-8 h-8 mx-auto mb-2" />
                  <p>Žádné položky</p>
                  <p className="text-sm">Klikněte na "Přidat položku" pro detailní rozpis faktury</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.items.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-6 gap-2 items-end">
                          <div className="col-span-2">
                            <Label className="text-xs">Popis</Label>
                            <Input
                              value={item.description}
                              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                              placeholder="Název položky"
                              className="text-sm"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-xs">Množství</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              className="text-sm"
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Jednotka</Label>
                            <Input
                              value={item.unit}
                              onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                              placeholder="ks"
                              className="text-sm"
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Cena s DPH</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitPriceWithVat}
                              onChange={(e) => updateItem(item.id, 'unitPriceWithVat', parseFloat(e.target.value) || 0)}
                              className="text-sm"
                            />
                          </div>

                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mt-2 text-xs text-gray-600">
                          <div>Cena bez DPH: {item.unitPrice.toFixed(2)}</div>
                          <div>DPH: {item.vatAmount.toFixed(2)}</div>
                          <div>Celkem bez DPH: {item.totalWithoutVat.toFixed(2)}</div>
                          <div className="font-medium">Celkem s DPH: {item.totalWithVat.toFixed(2)}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Items Summary */}
                  <Card>
                    <CardContent className="pt-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Součet položek:</span>
                          <span className="font-medium">{totals.itemsTotal.toFixed(2)} {formData.currency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Hlavní částka:</span>
                          <span className="font-medium">{formData.amount.toFixed(2)} {formData.currency}</span>
                        </div>
                        {totals.difference > 0.01 && (
                          <div className="flex justify-between text-amber-600">
                            <span>Rozdíl:</span>
                            <span className="font-medium">{totals.difference.toFixed(2)} {formData.currency}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Banknote className="w-4 h-4 mr-2" />
              Ukládám...
            </>
          ) : (
            <>
              <Banknote className="w-4 h-4 mr-2" />
              {initialData ? 'Uložit změny' : 'Vytvořit transakci'}
            </>
          )}
        </Button>
        
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Zrušit
          </Button>
        )}
      </div>
    </form>
  )
}