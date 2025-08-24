"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  ArrowLeft,
  Plus,
  Download,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  Receipt
} from "lucide-react"

// Types
interface Transaction {
  id: number
  type: "income" | "expense"
  amount: number
  vat_amount: number
  vat_rate: number
  description: string
  category?: string
  counterparty_name?: string
  counterparty_ico?: string
  document_date?: string
  payment_date?: string
  created_at: string
}

interface CreateTransactionData {
  type: "income" | "expense"
  amount: number
  description: string
  category?: string
  counterparty_name?: string
  vat_rate: number
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form data for new transaction
  const [formData, setFormData] = useState<CreateTransactionData>({
    type: "expense",
    amount: 0,
    description: "",
    category: "",
    counterparty_name: "",
    vat_rate: 21
  })

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('https://uctobot.vercel.app/api/transactions?limit=50')
      
      if (!response.ok) {
        throw new Error('Chyba při načítání transakcí')
      }
      
      const data = await response.json()
      setTransactions(data)
    } catch (err) {
      console.error('Chyba při načítání transakcí:', err)
      setError('Nepodařilo se načíst transakce. Zkuste to znovu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSubmitting(true)
      setError(null)
      
      const response = await fetch('https://uctobot.vercel.app/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Chyba při vytváření transakce')
      }
      
      // Reset form and close dialog
      setFormData({
        type: "expense",
        amount: 0,
        description: "",
        category: "",
        counterparty_name: "",
        vat_rate: 21
      })
      setIsAddDialogOpen(false)
      
      // Refresh transactions
      fetchTransactions()
      
    } catch (err) {
      console.error('Chyba při vytváření transakce:', err)
      setError(err instanceof Error ? err.message : 'Nepodařilo se vytvořit transakci')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.counterparty_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === "all" || transaction.type === filterType
    
    return matchesSearch && matchesFilter
  })

  // Calculate totals
  const totals = filteredTransactions.reduce((acc, transaction) => {
    if (transaction.type === 'income') {
      acc.income += transaction.amount
    } else {
      acc.expense += transaction.amount
    }
    acc.total += transaction.type === 'income' ? transaction.amount : -transaction.amount
    return acc
  }, { income: 0, expense: 0, total: 0 })

  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Načítám transakce...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => window.location.href = '/'}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zpět
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Transakce</h1>
                <p className="text-muted-foreground mt-1">
                  Přehled všech transakcí a možnost přidání nových
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#25D366] hover:bg-[#128C7E] text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Nová transakce
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Přidat novou transakci</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="type">Typ transakce</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) => setFormData({...formData, type: value as "income" | "expense"})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="income">Příjem</SelectItem>
                            <SelectItem value="expense">Výdaj</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="amount">Částka (Kč)</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.amount}
                          onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Popis transakce</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Např. Nákup kancelářských potřeb"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Kategorie</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({...formData, category: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte kategorii" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="office-supplies">Kancelářské potřeby</SelectItem>
                            <SelectItem value="it-equipment">IT vybavení</SelectItem>
                            <SelectItem value="fuel">Pohonné hmoty</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="services">Služby</SelectItem>
                            <SelectItem value="travel">Cestovné</SelectItem>
                            <SelectItem value="meals">Stravování</SelectItem>
                            <SelectItem value="other">Ostatní</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="vat_rate">Sazba DPH (%)</Label>
                        <Select
                          value={formData.vat_rate.toString()}
                          onValueChange={(value) => setFormData({...formData, vat_rate: parseInt(value)})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0% (bez DPH)</SelectItem>
                            <SelectItem value="12">12% (snížená)</SelectItem>
                            <SelectItem value="21">21% (základní)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="counterparty">Dodavatel/Odběratel</Label>
                      <Input
                        id="counterparty"
                        value={formData.counterparty_name}
                        onChange={(e) => setFormData({...formData, counterparty_name: e.target.value})}
                        placeholder="Název společnosti"
                      />
                    </div>

                    {error && (
                      <div className="text-red-500 text-sm bg-red-50 p-3 rounded">
                        {error}
                      </div>
                    )}

                    <div className="flex justify-end space-x-3">
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Zrušit
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={submitting}
                        className="bg-[#25D366] hover:bg-[#128C7E] text-white"
                      >
                        {submitting ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Ukládám...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Přidat transakci
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Celkové příjmy</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totals.income)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Celkové výdaje</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totals.expense)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Zisk</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totals.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totals.total)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtrování a vyhledávání</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Vyhledat podle popisu, dodavatele nebo kategorie..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={(value) => setFilterType(value as "all" | "income" | "expense")}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny transakce</SelectItem>
                  <SelectItem value="income">Pouze příjmy</SelectItem>
                  <SelectItem value="expense">Pouze výdaje</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchTransactions} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Obnovit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Seznam transakcí ({filteredTransactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Žádné transakce</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterType !== "all" 
                    ? "Nebyli nalezeny žádné transakce odpovídající filtru."
                    : "Zatím nemáte žádné transakce. Přidejte první!"}
                </p>
                {(!searchTerm && filterType === "all") && (
                  <Button 
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-[#25D366] hover:bg-[#128C7E] text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Přidat první transakci
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.counterparty_name && `${transaction.counterparty_name} • `}
                          {transaction.category && `${transaction.category} • `}
                          {formatDate(transaction.created_at)}
                        </div>
                        {transaction.vat_amount > 0 && (
                          <div className="text-xs text-muted-foreground">
                            DPH {transaction.vat_rate}%: {formatCurrency(transaction.vat_amount)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-lg ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </div>
                      <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                        {transaction.type === 'income' ? 'Příjem' : 'Výdaj'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}