"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Receipt, 
  DollarSign,
  ArrowLeft,
  RefreshCw,
  Eye,
  Edit,
  ExternalLink
} from "lucide-react"

// Types
interface User {
  id: number
  full_name: string
  business_name: string
  subscription_status: string
  total_transactions: number
  current_year_revenue: number
  created_at: string
}

interface Transaction {
  id: number
  user_name?: string
  type: "income" | "expense"
  amount: number
  description: string
  counterparty_name?: string
  created_at: string
}

interface UserStats {
  total_users: number
  active_users: number
  trial_users: number
}

interface TransactionStats {
  total_transactions: number
  total_income: number
  total_expenses: number
  profit: number
  current_month_transactions: number
}

interface DemoData {
  demo_users: User[]
  recent_transactions: Transaction[]
}

export default function Dashboard() {
  const [demoData, setDemoData] = useState<DemoData | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [transactionStats, setTransactionStats] = useState<TransactionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Paralelní načtení všech dat
      const [demoResponse, userStatsResponse, transactionStatsResponse] = await Promise.all([
        fetch('http://localhost:8000/api/demo'),
        fetch('http://localhost:8000/api/users/stats'),
        fetch('http://localhost:8000/api/transactions/stats')
      ])

      if (!demoResponse.ok || !userStatsResponse.ok || !transactionStatsResponse.ok) {
        throw new Error('Chyba při načítání dat z API')
      }

      const [demo, userStats, transactionStats] = await Promise.all([
        demoResponse.json(),
        userStatsResponse.json(),
        transactionStatsResponse.json()
      ])

      setDemoData(demo)
      setUserStats(userStats)
      setTransactionStats(transactionStats)
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Chyba při načítání dat:', err)
      setError('Nepodařilo se načíst data z API. Zkuste to znovu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      'active': 'bg-green-100 text-green-800',
      'trial': 'bg-yellow-100 text-yellow-800',
      'inactive': 'bg-gray-100 text-gray-800'
    }
    
    const labels: Record<string, string> = {
      'active': 'Aktivní',
      'trial': 'Zkušební',
      'inactive': 'Neaktivní'
    }

    return (
      <Badge className={variants[status.toLowerCase()] || variants.inactive}>
        {labels[status.toLowerCase()] || status}
      </Badge>
    )
  }

  if (loading && !demoData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Načítám data z API...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Chyba při načítání dat</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="space-y-2">
            <Button onClick={fetchData} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Zkusit znovu
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zpět na hlavní stránku
            </Button>
          </div>
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
            <div>
              <h1 className="text-3xl font-bold">ÚčetníBot Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Přehled dat z nové databáze • API v2.0.0
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right text-sm text-muted-foreground">
                <div>Poslední aktualizace:</div>
                <div>{formatDate(lastRefresh.toISOString())}</div>
              </div>
              <Button 
                variant="outline" 
                onClick={fetchData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Obnovit
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/transactions'}>
                <Receipt className="h-4 w-4 mr-2" />
                Transakce
              </Button>
              <Button variant="outline" onClick={() => window.open('http://localhost:8000/docs', '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                API Docs
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Celkem uživatelů</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats?.total_users || 0}</div>
              <p className="text-xs text-muted-foreground">
                Aktivní: {userStats?.active_users || 0}, Zkušební: {userStats?.trial_users || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Celkem transakcí</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactionStats?.total_transactions || 0}</div>
              <p className="text-xs text-muted-foreground">
                Tento měsíc: {transactionStats?.current_month_transactions || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Celkový obrat</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency((transactionStats?.total_income || 0) + (transactionStats?.total_expenses || 0))}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                Příjmy: {formatCurrency(transactionStats?.total_income || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Zisk</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(transactionStats?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(transactionStats?.profit || 0)}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                Výdaje: {formatCurrency(transactionStats?.total_expenses || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="transactions">Poslední transakce</TabsTrigger>
            <TabsTrigger value="users">Uživatelé</TabsTrigger>
            <TabsTrigger value="api">API Info</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Poslední transakce</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {demoData?.recent_transactions.length || 0} nejnovějších záznamů z databáze
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {demoData?.recent_transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-2 h-2 rounded-full ${
                          transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.user_name && `${transaction.user_name} • `}
                            {transaction.counterparty_name && `${transaction.counterparty_name} • `}
                            {formatDate(transaction.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Demo uživatelé</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {demoData?.demo_users.length || 0} uživatelů v databázi
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {demoData?.demo_users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {user.full_name?.charAt(0) || user.business_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.business_name} • {user.total_transactions} transakcí
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div>{getStatusBadge(user.subscription_status)}</div>
                        <div className="text-sm font-medium">
                          {formatCurrency(user.current_year_revenue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Endpointy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Základní endpointy:</h4>
                    <div className="text-sm space-y-1 font-mono">
                      <div>GET /api/demo</div>
                      <div>GET /api/users/stats</div>
                      <div>GET /api/transactions/stats</div>
                      <div>GET /api/users</div>
                      <div>GET /api/transactions</div>
                      <div>POST /api/transactions</div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('http://localhost:8000/docs', '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Otevřít API dokumentaci
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Backend Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Backend URL:</div>
                      <div className="font-mono">localhost:8000</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">API verze:</div>
                      <div className="font-mono">v2.0.0</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Databáze:</div>
                      <div className="font-mono">SQLite</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Status:</div>
                      <div className="text-green-600 font-medium">✅ Běží</div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('http://localhost:8000/health', '_blank')}
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Zkontrolovat health endpoint
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}