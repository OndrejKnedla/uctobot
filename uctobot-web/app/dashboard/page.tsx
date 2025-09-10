"use client"


export const dynamic = "force-dynamic"

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

interface AppData {
  users: User[]
  recent_transactions: Transaction[]
}

export default function Dashboard() {
  const [appData, setAppData] = useState<AppData | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [transactionStats, setTransactionStats] = useState<TransactionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load data from local APIs only
      const [userStatsResponse, transactionStatsResponse] = await Promise.all([
        fetch('/api/users/stats'),
        fetch('/api/transactions/stats')
      ])

      if (!userStatsResponse.ok || !transactionStatsResponse.ok) {
        throw new Error('Chyba při načítání dat z API')
      }

      const [userStats, transactionStats] = await Promise.all([
        userStatsResponse.json(),
        transactionStatsResponse.json()
      ])

      setUserStats(userStats)
      setTransactionStats(transactionStats)
      
      // Initialize empty data
      setAppData({ users: [], recent_transactions: [] })
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

  if (loading && !appData) {
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
                Přehled systému ÚčtoBot
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
                <CardTitle>Transakce</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Pro zobrazení transakcí se přihlaste do svého účtu
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Přihlaste se pro zobrazení vašich transakcí</p>
                  <Button className="mt-4" onClick={() => window.location.href = '/login'}>
                    Přihlásit se
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Správa uživatelů</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Administrátorská funkce - pouze pro oprávněné uživatele
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Přístup pouze pro administrátory</p>
                  <Button className="mt-4" onClick={() => window.location.href = '/admin'}>
                    Admin panel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Systémové informace</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Platform:</div>
                    <div className="font-mono">Next.js</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Database:</div>
                    <div className="font-mono">PostgreSQL</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Status:</div>
                    <div className="text-green-600 font-medium">✅ Online</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Version:</div>
                    <div className="font-mono">1.0.0</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}