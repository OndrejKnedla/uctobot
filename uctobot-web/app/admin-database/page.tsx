'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AdminDatabasePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('users')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/database')
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Načítám databázi...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">📊 DokladBot Database</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Uživatelé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.stats?.users || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Aktivační kódy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.stats?.codes || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Předplatná</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.stats?.subscriptions || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Aktivní</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{data?.stats?.activeSubscriptions || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="users">👥 Uživatelé</TabsTrigger>
            <TabsTrigger value="codes">🔑 Aktivační kódy</TabsTrigger>
            <TabsTrigger value="subscriptions">💳 Předplatná</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Uživatelé ({data?.users?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Jméno</th>
                        <th className="text-left p-2">Telefon</th>
                        <th className="text-left p-2">Registrace</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.users?.map((user: any) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">{user.email || '-'}</td>
                          <td className="p-2">{user.name || '-'}</td>
                          <td className="p-2">{user.whatsappPhone || '-'}</td>
                          <td className="p-2">{new Date(user.createdAt).toLocaleDateString('cs-CZ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="codes">
            <Card>
              <CardHeader>
                <CardTitle>Aktivační kódy ({data?.codes?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Kód</th>
                        <th className="text-left p-2">Uživatel</th>
                        <th className="text-left p-2">Použit</th>
                        <th className="text-left p-2">Vyprší</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.codes?.map((code: any) => (
                        <tr key={code.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-mono text-xs">{code.code}</td>
                          <td className="p-2">{code.user?.email || '-'}</td>
                          <td className="p-2">
                            {code.used ? (
                              <span className="text-red-600">✓ Použit</span>
                            ) : (
                              <span className="text-green-600">✗ Aktivní</span>
                            )}
                          </td>
                          <td className="p-2">{new Date(code.expiresAt).toLocaleDateString('cs-CZ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle>Předplatná ({data?.subscriptions?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Uživatel</th>
                        <th className="text-left p-2">Plán</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Cena</th>
                        <th className="text-left p-2">Zakladatel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.subscriptions?.map((sub: any) => (
                        <tr key={sub.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">{sub.user?.email || '-'}</td>
                          <td className="p-2">{sub.plan}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              sub.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {sub.status}
                            </span>
                          </td>
                          <td className="p-2">{sub.price} Kč</td>
                          <td className="p-2">
                            {sub.isFoundingMember ? '🏆 Ano' : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <Button onClick={fetchData} variant="outline">
            🔄 Aktualizovat data
          </Button>
        </div>
      </div>
    </div>
  )
}