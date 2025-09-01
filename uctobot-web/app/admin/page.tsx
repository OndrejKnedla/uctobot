"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, CreditCard, Activity, TrendingUp, Search, Eye, Edit } from "lucide-react"

interface User {
  id: number
  email: string
  full_name: string
  business_name: string
  subscription_status: string
  subscription_plan: string
  whatsapp_activated: boolean
  created_at: string
  stats?: {
    payments_count: number
    transactions_count: number
  }
}

interface DashboardStats {
  users: {
    total: number
    active: number
  }
  transactions: {
    total: number
    recent: number
  }
  revenue: {
    total_income: number
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load users from local API
      await loadUsers()
      
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Chyba při načítání dat')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async (page = 1, search = "") => {
    try {
      const response = await fetch('/api/admin/users')
      if (!response.ok) {
        throw new Error('Nepodařilo se načíst uživatele')
      }
      
      const userData = await response.json()
      setUsers(userData.map((user: any) => ({
        id: user.id,
        email: user.email || 'N/A',
        full_name: user.name,
        business_name: '',
        subscription_status: user.subscription?.status || 'cancelled',
        subscription_plan: user.subscription?.plan?.toLowerCase() || null,
        whatsapp_activated: !!user.whatsappPhone,
        created_at: user.createdAt,
        stats: {
          payments_count: 0,
          transactions_count: user._count?.invoices + user._count?.expenses || 0
        }
      })))

      // Calculate real stats from user data
      const calculatedStats = {
        users: {
          total: userData.length,
          active: userData.filter((u: any) => u.subscription?.status === 'ACTIVE').length
        },
        transactions: {
          total: userData.reduce((sum: number, u: any) => sum + (u._count?.invoices + u._count?.expenses || 0), 0),
          recent: userData.filter((u: any) => {
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return new Date(u.createdAt) > weekAgo
          }).length
        },
        revenue: {
          total_income: userData.reduce((sum: number, u: any) => {
            // Calculate total revenue from active subscriptions
            if (u.subscription?.status === 'ACTIVE') {
              return sum + (u.subscription?.plan === 'YEARLY' ? 2988 : 299)
            }
            return sum
          }, 0)
        }
      }
      setStats(calculatedStats)
      
    } catch (err) {
      console.error('Error loading users:', err)
      setError('Chyba při načítání uživatelů')
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadUsers(1, searchTerm)
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
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#25D366] mx-auto mb-4"></div>
          <p className="text-gray-600">Načítám data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ÚčtoBot Admin
          </h1>
          <p className="text-gray-600">
            Správa uživatelů a předplatných
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Celkem uživatelů
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.users.active} aktivních
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Celkem transakcí
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.transactions.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.transactions.recent} za posledních 7 dní
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Celkové příjmy
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('cs-CZ', {
                    style: 'currency',
                    currency: 'CZK',
                    minimumFractionDigits: 0
                  }).format(stats.revenue.total_income)}
                </div>
                <p className="text-xs text-muted-foreground">
                  z uživatelských transakcí
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Aktivní uživatelé
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users.active}</div>
                <p className="text-xs text-muted-foreground">
                  s aktivním předplatným
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Uživatelé</TabsTrigger>
            <TabsTrigger value="payments">Platby</TabsTrigger>
            <TabsTrigger value="transactions">Transakce</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Správa uživatelů</CardTitle>
                <div className="flex items-center space-x-4">
                  <form onSubmit={handleSearch} className="flex items-center space-x-2">
                    <Input
                      placeholder="Hledat uživatele..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                    <Button type="submit" size="sm">
                      <Search className="h-4 w-4" />
                    </Button>
                  </form>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => loadUsers(currentPage, searchTerm)}
                  >
                    Obnovit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Jméno</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plán</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Registrace</TableHead>
                      <TableHead>Akce</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {user.full_name || 'Neuvedeno'}
                            </div>
                            {user.business_name && (
                              <div className="text-sm text-gray-500">
                                {user.business_name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {getStatusBadge(user.subscription_status)}
                        </TableCell>
                        <TableCell>
                          {user.subscription_plan ? (
                            <Badge variant="outline">
                              {user.subscription_plan === 'yearly' ? 'Roční' : 'Měsíční'}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {user.whatsapp_activated ? (
                            <Badge className="bg-green-100 text-green-800">
                              Aktivní
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">
                              Neaktivní
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDate(user.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(`/admin/users/${user.id}`, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(`/admin/users/${user.id}/edit`, '_blank')}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => loadUsers(currentPage - 1, searchTerm)}
                      >
                        Předchozí
                      </Button>
                      <span className="text-sm text-gray-600">
                        Stránka {currentPage} z {totalPages}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={currentPage >= totalPages}
                        onClick={() => loadUsers(currentPage + 1, searchTerm)}
                      >
                        Další
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Historie plateb</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Seznam plateb a předplatných bude implementován zde.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transakce uživatelů</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Přehled všech uživatelských transakcí bude implementován zde.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}