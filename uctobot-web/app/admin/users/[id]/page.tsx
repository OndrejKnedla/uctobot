"use client"


export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, User, CreditCard, Receipt, Edit } from "lucide-react"

interface User {
  id: number
  email: string
  phone: string
  whatsapp_number: string
  profile_name: string
  full_name: string
  business_name: string
  ico: string
  dic: string
  vat_payer: boolean
  subscription_status: string
  subscription_plan: string
  trial_ends_at: string
  subscription_ends_at: string
  whatsapp_activated: boolean
  activation_token: string
  created_at: string
  updated_at: string
  last_activity: string
  stripe_customer_id: string
  stripe_subscription_id: string
  stats: {
    payments_count: number
    transactions_count: number
  }
}

interface Payment {
  id: number
  payment_id: string
  amount: number
  currency: string
  status: string
  provider: string
  payment_method: string
  created_at: string
  completed_at: string
}

interface Transaction {
  id: number
  type: string
  amount_czk: number
  description: string
  category_name: string
  counterparty_name: string
  vat_rate: number
  created_at: string
  transaction_date: string
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params?.id as string

  const [user, setUser] = useState<User | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = "https://uctobot.vercel.app"

  useEffect(() => {
    if (userId) {
      loadUserData()
    }
  }, [userId])

  const loadUserData = async () => {
    try {
      setLoading(true)
      
      // Load user details
      const userResponse = await fetch(`${API_BASE_URL}/api/users/${userId}`)
      if (!userResponse.ok) {
        throw new Error('Nepodařilo se načíst data uživatele')
      }
      
      const userData = await userResponse.json()
      if (userData.success) {
        setUser(userData.user)
      }

      // Load user payments
      const paymentsResponse = await fetch(`${API_BASE_URL}/api/users/${userId}/payments`)
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json()
        if (paymentsData.success) {
          setPayments(paymentsData.payments)
        }
      }

      // Load user transactions
      const transactionsResponse = await fetch(`${API_BASE_URL}/api/users/${userId}/transactions`)
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json()
        if (transactionsData.success) {
          setTransactions(transactionsData.transactions)
        }
      }
      
    } catch (err) {
      console.error('Error loading user data:', err)
      setError('Chyba při načítání dat uživatele')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", text: "Aktivní" },
      trial: { color: "bg-blue-100 text-blue-800", text: "Zkušební" },
      expired: { color: "bg-red-100 text-red-800", text: "Vypršené" },
      cancelled: { color: "bg-gray-100 text-gray-800", text: "Zrušené" }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.cancelled
    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Neuvedeno'
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#25D366] mx-auto mb-4"></div>
          <p className="text-gray-600">Načítám data uživatele...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Uživatel nenalezen'}</p>
          <Button onClick={() => router.back()}>
            Zpět
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zpět
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user.full_name || user.email}
              </h1>
              <p className="text-gray-600">
                ID: {user.id} • {getStatusBadge(user.subscription_status)}
              </p>
            </div>
          </div>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Upravit
          </Button>
        </div>

        {/* User Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Platby
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.stats.payments_count}</div>
              <p className="text-xs text-muted-foreground">
                celkem plateb
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Transakce
              </CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.stats.transactions_count}</div>
              <p className="text-xs text-muted-foreference">
                celkem transakcí
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                WhatsApp
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user.whatsapp_activated ? '✅' : '❌'}
              </div>
              <p className="text-xs text-muted-foreground">
                {user.whatsapp_activated ? 'Aktivován' : 'Neaktivován'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="payments">Platby</TabsTrigger>
            <TabsTrigger value="transactions">Transakce</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Osobní údaje</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm">{user.email || 'Neuvedeno'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Celé jméno</label>
                    <p className="text-sm">{user.full_name || 'Neuvedeno'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telefon</label>
                    <p className="text-sm">{user.phone || 'Neuvedeno'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">WhatsApp číslo</label>
                    <p className="text-sm">{user.whatsapp_number || 'Neuvedeno'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Podnikání</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Obchodní název</label>
                    <p className="text-sm">{user.business_name || 'Neuvedeno'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">IČO</label>
                    <p className="text-sm">{user.ico || 'Neuvedeno'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">DIČ</label>
                    <p className="text-sm">{user.dic || 'Neuvedeno'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Plátce DPH</label>
                    <p className="text-sm">
                      {user.vat_payer ? 'Ano' : 'Ne'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Předplatné</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">{getStatusBadge(user.subscription_status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Plán</label>
                    <p className="text-sm">
                      {user.subscription_plan ? 
                        (user.subscription_plan === 'yearly' ? 'Roční' : 'Měsíční') : 
                        'Neuvedeno'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Zkušební období končí</label>
                    <p className="text-sm">{formatDate(user.trial_ends_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Předplatné končí</label>
                    <p className="text-sm">{formatDate(user.subscription_ends_at)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Systémové údaje</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Registrace</label>
                    <p className="text-sm">{formatDate(user.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Poslední aktualizace</label>
                    <p className="text-sm">{formatDate(user.updated_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Poslední aktivita</label>
                    <p className="text-sm">{formatDate(user.last_activity)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Aktivační token</label>
                    <p className="text-sm font-mono text-xs">
                      {user.activation_token || 'Neuvedeno'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Historie plateb</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Částka</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Způsob</TableHead>
                      <TableHead>Vytvořeno</TableHead>
                      <TableHead>Dokončeno</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length > 0 ? payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-sm">
                          {payment.payment_id}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {payment.status === 'completed' ? 'Dokončeno' :
                             payment.status === 'pending' ? 'Čeká' : 'Neúspěšné'}
                          </Badge>
                        </TableCell>
                        <TableCell>{payment.payment_method || payment.provider}</TableCell>
                        <TableCell>{formatDate(payment.created_at)}</TableCell>
                        <TableCell>{formatDate(payment.completed_at)}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500">
                          Žádné platby nenalezeny
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Uživatelské transakce</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Typ</TableHead>
                      <TableHead>Částka</TableHead>
                      <TableHead>Popis</TableHead>
                      <TableHead>Kategorie</TableHead>
                      <TableHead>Datum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length > 0 ? transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <Badge className={
                            transaction.type === 'income' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {transaction.type === 'income' ? 'Příjem' : 'Výdaj'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(transaction.amount_czk)}
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{transaction.category_name || 'Nezařazeno'}</TableCell>
                        <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500">
                          Žádné transakce nenalezeny
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}