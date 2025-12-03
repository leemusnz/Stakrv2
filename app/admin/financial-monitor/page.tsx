'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingUp, Shield, AlertTriangle, Users, Activity } from 'lucide-react'

export default function FinancialMonitorPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7')
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/financial-monitor?timeRange=${timeRange}`)
      if (!response.ok) throw new Error('Failed to load data')
      const result = await response.json()
      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [timeRange])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading financial data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Data</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadData}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Monitoring Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time oversight of platform finances</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadData} variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Revenue Summary */}
      {data?.revenue && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Entry Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${data.revenue.entry_fees.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Failed Stakes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${data.revenue.failed_stakes.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Insurance Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                ${data.revenue.insurance_fees.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Cashout Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ${data.revenue.cashout_fees.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${data.revenue.total.toFixed(2)}
              </div>
              <p className="text-xs text-blue-100 mt-1">
                {data.revenue.transaction_count} transactions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insurance Statistics */}
      {data?.insurance?.statistics && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <CardTitle>Insurance Performance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Insured</p>
                <p className="text-2xl font-bold">{data.insurance.statistics.total_insured}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Claims Filed</p>
                <p className="text-2xl font-bold">{data.insurance.statistics.claims_filed}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Claim Rate</p>
                <p className="text-2xl font-bold">{data.insurance.statistics.claim_rate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ${data.insurance.statistics.total_revenue.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${data.insurance.statistics.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${data.insurance.statistics.net_profit.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Withdrawals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <CardTitle>Recent Withdrawals</CardTitle>
              </div>
              <Badge>{data?.withdrawals?.count || 0}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data?.withdrawals?.recent?.length > 0 ? (
                data.withdrawals.recent.map((w: any) => (
                  <div key={w.id} className="flex justify-between items-center border-b pb-2">
                    <div className="flex-1">
                      <p className="font-medium">{w.user.name}</p>
                      <p className="text-xs text-gray-500">{w.user.email}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(w.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">${w.amount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Fee: ${w.fee.toFixed(2)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No withdrawals in this period</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Insurance Payouts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <CardTitle>Insurance Payouts</CardTitle>
              </div>
              <Badge variant="secondary">{data?.insurance?.recent_payouts?.length || 0}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data?.insurance?.recent_payouts?.length > 0 ? (
                data.insurance.recent_payouts.map((p: any) => (
                  <div key={p.id} className="flex justify-between items-center border-b pb-2">
                    <div className="flex-1">
                      <p className="font-medium">{p.user.name}</p>
                      <p className="text-xs text-gray-500">{p.challenge.title}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(p.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">${p.amount.toFixed(2)}</p>
                      <Badge variant="outline" className="text-xs">Protected</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No insurance payouts in this period</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Large Transactions / Suspicious Activity */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <CardTitle>Large Transactions & Risk Monitoring</CardTitle>
          </div>
          <CardDescription>Transactions over $100 and suspicious patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data?.large_transactions?.length > 0 ? (
              data.large_transactions.map((t: any) => (
                <div 
                  key={t.id} 
                  className={`flex justify-between items-center border-b pb-2 ${t.is_suspicious ? 'bg-red-100 p-2 rounded' : ''}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{t.user.name}</p>
                      {t.is_suspicious && (
                        <Badge variant="destructive" className="text-xs">Suspicious</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{t.user.email}</p>
                    <p className="text-xs text-gray-400">
                      Trust Score: {t.user.trust_score} | Recent withdrawals: {t.recent_withdrawals}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${Math.abs(t.amount).toFixed(2)}</p>
                    <Badge variant="outline" className="text-xs">{t.type}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No large transactions in this period</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Stakes */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <CardTitle>Active Stakes (Money at Risk)</CardTitle>
          </div>
          <CardDescription>Current challenges with locked stakes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data?.active_stakes?.length > 0 ? (
              data.active_stakes.map((s: any) => (
                <div key={s.challenge_id} className="flex justify-between items-center border-b pb-2">
                  <div className="flex-1">
                    <p className="font-medium">{s.challenge_title}</p>
                    <p className="text-xs text-gray-500">
                      {s.participant_count} participants | Ends: {new Date(s.end_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {s.insured_count} insured (${s.insured_stakes.toFixed(2)})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">${s.total_stakes.toFixed(2)}</p>
                    <p className="text-xs text-orange-600">At risk: ${s.at_risk.toFixed(2)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No active stakes</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Earners */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            <CardTitle>Top Earners (Last 30 Days)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data?.top_earners?.length > 0 ? (
              data.top_earners.map((e: any, index: number) => (
                <div key={e.user.id} className="flex justify-between items-center border-b pb-2">
                  <div className="flex items-center gap-3 flex-1">
                    <Badge variant={index < 3 ? "default" : "outline"}>#{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{e.user.name}</p>
                      <p className="text-xs text-gray-500">
                        {e.challenges_won} wins | Trust: {e.user.trust_score}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${e.total_earnings.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      ${e.avg_earning_per_challenge.toFixed(2)}/win
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No earnings data</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

