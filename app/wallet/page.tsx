"use client"

import { useEffect, useMemo, useState } from "react"
import { useApi, useMutation } from "@/hooks/use-api"
import { LoadingSpinner, SkeletonLoader } from "@/components/loading-spinner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FloatingAmbientGlows } from '@/components/floating-ambient-glows'
import {
  Wallet,
  CreditCard,
  DollarSign,
  TrendingUp,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Trophy,
  Target,
  Gift,
  AlertCircle,
} from "lucide-react"

// Default mock wallet data (fallback)
const mockWalletData = {
  balance: 250,
  totalEarned: 1250,
  totalSpent: 1000,
  totalStaked: 125,
  pendingRewards: 75,
  transactions: [
    {
      id: "1",
      type: "reward",
      amount: 37.5,
      description: "7-Day Water Challenge - Completion Reward",
      date: "2024-01-15T10:30:00Z",
      status: "completed",
      challengeId: "ch-1",
    },
    {
      id: "2",
      type: "stake",
      amount: -50,
      description: "30-Day Morning Workout - Challenge Stake",
      date: "2024-01-14T08:15:00Z",
      status: "active",
      challengeId: "ch-2",
    },
    {
      id: "3",
      type: "deposit",
      amount: 100,
      description: "Credit Card Deposit",
      date: "2024-01-13T16:45:00Z",
      status: "completed",
      paymentMethod: "•••• 4242",
    },
    {
      id: "4",
      type: "reward",
      amount: 22.5,
      description: "No Social Media Weekend - Completion Reward",
      date: "2024-01-12T23:59:00Z",
      status: "completed",
      challengeId: "ch-3",
    },
    {
      id: "5",
      type: "forfeit",
      amount: -40,
      description: "5AM Club Challenge - Stake Forfeited",
      date: "2024-01-10T05:00:00Z",
      status: "failed",
      challengeId: "ch-4",
    },
    {
      id: "6",
      type: "stake",
      amount: -30,
      description: "Daily Reading Challenge - Challenge Stake",
      date: "2024-01-09T12:00:00Z",
      status: "active",
      challengeId: "ch-5",
    },
    {
      id: "7",
      type: "deposit",
      amount: 200,
      description: "PayPal Deposit",
      date: "2024-01-08T14:20:00Z",
      status: "completed",
      paymentMethod: "PayPal",
    },
    {
      id: "8",
      type: "withdrawal",
      amount: -150,
      description: "Bank Transfer Withdrawal",
      date: "2024-01-07T11:30:00Z",
      status: "completed",
      paymentMethod: "•••• 1234",
    },
  ],
  activeStakes: [
    {
      id: "stake-1",
      challengeTitle: "30-Day Morning Workout",
      amount: 50,
      progress: 67,
      daysLeft: 10,
      potentialReward: 75,
      status: "active",
    },
    {
      id: "stake-2",
      challengeTitle: "Daily Reading Challenge",
      amount: 30,
      progress: 45,
      daysLeft: 12,
      potentialReward: 45,
      status: "active",
    },
    {
      id: "stake-3",
      challengeTitle: "Meditation Mastery",
      amount: 45,
      progress: 85,
      daysLeft: 2,
      potentialReward: 67.5,
      status: "active",
    },
  ],
  paymentMethods: [
    {
      id: "pm-1",
      type: "card",
      last4: "4242",
      brand: "Visa",
      isDefault: true,
    },
    {
      id: "pm-2",
      type: "card",
      last4: "1234",
      brand: "Mastercard",
      isDefault: false,
    },
    {
      id: "pm-3",
      type: "paypal",
      email: "alex@example.com",
      isDefault: false,
    },
  ],
}

export default function WalletPage() {
  const [selectedTab, setSelectedTab] = useState("overview")
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // Use the new useApi hook for wallet data
  const { data: walletData, loading: isLoadingWallet, execute: loadWallet } = useApi<typeof mockWalletData>(
    '/api/user/credits',
    {
      showSuccessToast: false,
      showErrorToast: true
    }
  )
  
  const [wallet, setWallet] = useState(mockWalletData)
  const data = walletData ?? wallet ?? mockWalletData
  const [txTypes, setTxTypes] = useState<string[]>([])
  const [fromDate, setFromDate] = useState<string>("")
  const [toDate, setToDate] = useState<string>("")
  const [page, setPage] = useState<number>(1)
  const [pagination, setPagination] = useState<{ page: number; pageSize: number; total: number; totalPages: number; hasNext: boolean } | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async (nextPage = 1) => {
      try {
        // Prefer dedicated credits endpoint; fallback to dashboard
        const params = new URLSearchParams({ page: String(nextPage), pageSize: '20' })
        if (txTypes.length) params.set('type', txTypes.join(','))
        if (fromDate) params.set('from', new Date(fromDate).toISOString())
        if (toDate) params.set('to', new Date(toDate).toISOString())
        let res = await fetch(`/api/user/credits?${params.toString()}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load dashboard')
        const data = await res.json()
        if (data?.success && data.wallet) {
          if (mounted) {
            setWallet({ ...mockWalletData, ...data.wallet })
            setPagination(data.pagination || null)
            setPage(nextPage)
          }
        } else {
          // Fallback
          res = await fetch('/api/user/dashboard', { cache: 'no-store' })
          if (!res.ok) throw new Error('Failed to load dashboard')
          const dash = await res.json()
          const balance = Number(dash.dashboard?.user?.credits || 0)
          const txs = (dash.dashboard?.recentTransactions || []).map((t: any) => ({
            id: t.id,
            type: t.type.includes('reward') ? 'reward' : (t.type.includes('stake') ? 'stake' : 'deposit'),
            amount: Number(t.amount),
            description: t.type,
            date: t.createdAt,
            status: t.status,
            challengeId: t.challengeId
          }))
          const activeStakes = (dash.dashboard?.activeChallenges || []).map((c: any) => ({
            id: c.id,
            challengeTitle: c.title,
            amount: Number(c.stakeAmount || 0),
            progress: 0,
            daysLeft: Math.max(0, Math.ceil((new Date(c.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
            potentialReward: 0,
            status: c.status
          }))
          if (mounted) {
            setWallet({
              ...mockWalletData,
              balance,
              transactions: txs,
              activeStakes
            })
            setPagination(null)
            setPage(1)
          }
        }
      } catch (_) {
        if (mounted) setWallet(mockWalletData)
      }
    }
    load(1)
    return () => { mounted = false }
  }, [txTypes, fromDate, toDate])

  const toggleType = (type: string) => {
    setTxTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])
  }

  const canPrev = useMemo(() => page > 1, [page])
  const canNext = useMemo(() => !!pagination?.hasNext, [pagination])

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "reward":
        return <Trophy className="w-4 h-4 text-green-600" />
      case "stake":
        return <Target className="w-4 h-4 text-orange-600" />
      case "deposit":
        return <ArrowDownLeft className="w-4 h-4 text-blue-600" />
      case "withdrawal":
        return <ArrowUpRight className="w-4 h-4 text-purple-600" />
      case "forfeit":
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />
    }
  }

  const getTransactionColor = (type: string, amount: number) => {
    if (amount > 0) return "text-green-600"
    if (type === "forfeit") return "text-red-600"
    return "text-gray-900"
  }

  const exportCsv = () => {
    const header = ['id','type','amount','description','date','status','challengeId','paymentMethod']
    const rows = (data.transactions || []).map((t:any)=>[
      t.id, t.type, t.amount, (t.description||'').replace(/\n|\r/g,' '), t.date, t.status, t.challengeId || '', t.paymentMethod || ''
    ])
    const csv = [header, ...rows]
      .map(r => r.map(v => {
        const s = String(v ?? '')
        return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}` : s
      }).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleDeposit = async () => {
    if (!depositAmount || Number.parseFloat(depositAmount) <= 0) return
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    console.log("Depositing:", depositAmount)
    setDepositAmount("")
    setIsLoading(false)
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || Number.parseFloat(withdrawAmount) <= 0) return
    
    const amount = Number.parseFloat(withdrawAmount)
    if (amount < 10) {
      alert("Minimum withdrawal amount is $10")
      return
    }
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/payments/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: amount,
          withdrawalMethodId: 'default' 
        })
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        alert(`✅ Withdrawal successful!\n\nAmount: $${result.withdrawal.amount}\nFee: $${result.withdrawal.fee}\nTotal deducted: $${result.withdrawal.total_deducted}\n\nNew balance: $${result.withdrawal.new_balance}\n\n${result.withdrawal.note}`)
        setWithdrawAmount("")
        // Refresh wallet data
        window.location.reload()
      } else {
        alert(`❌ Withdrawal failed:\n\n${result.message || result.error}${result.details ? '\n\nDetails:\n' + JSON.stringify(result.details, null, 2) : ''}`)
      }
    } catch (error) {
      console.error('Withdrawal error:', error)
      alert('❌ Withdrawal failed. Please try again or contact support.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0A0A0A] dark:via-[#1A1A1A] dark:to-[#0F0F0F] relative overflow-hidden">
      {/* Ambient Glows */}
      <FloatingAmbientGlows />

      {/* Noise Texture */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-slate-900 dark:text-white tracking-tight mb-2">Wallet</h1>
          <p className="text-slate-600 dark:text-slate-400 font-body text-lg">Manage your credits, cash account, stakes, and transactions</p>
        </div>

        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Credits Balance */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
                  <p className="text-3xl font-bold text-primary">${data.balance}</p>
                </div>
                <Wallet className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          {/* Total Earned */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Earned</p>
                  <p className="text-3xl font-bold text-green-600">${data.totalEarned ?? 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          {/* Active Stakes */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Stakes</p>
                  <p className="text-3xl font-bold text-orange-600">${data.totalStaked ?? 0}</p>
                </div>
                <Target className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          {/* Pending Rewards and Cash Account */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Rewards</p>
                  <p className="text-3xl font-bold text-secondary">${data.pendingRewards ?? 0}</p>
                </div>
                <Gift className="w-8 h-8 text-secondary" />
              </div>
              <div className="mt-4 p-3 rounded-md border bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Cash Account</p>
                    <p className="text-xl font-semibold">${(data as any).cashAccount?.balance ?? 0}</p>
                    <p className="text-xs text-muted-foreground">
                      {(data as any).cashAccount?.connected ? 'Connected' : 'Not connected'}{(data as any).cashAccount?.lastSync ? ` • Last sync ${(data as any).cashAccount?.lastSync}` : ''}
                    </p>
                  </div>
                  <CreditCard className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wallet Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="stakes">Active Stakes</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button className="h-12 flex flex-col items-center gap-1">
                      <Plus className="w-4 h-4" />
                      <span className="text-xs">Add Funds</span>
                    </Button>
                    <Button variant="outline" className="h-12 flex flex-col items-center gap-1 bg-transparent">
                      <Minus className="w-4 h-4" />
                      <span className="text-xs">Withdraw</span>
                    </Button>
                  </div>
                  <Button variant="outline" className="w-full bg-transparent">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Payment Methods
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                   {(data.transactions).slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <p className="text-sm font-medium">{transaction.description}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                          </div>
                        </div>
                        <span className={`font-bold ${getTransactionColor(transaction.type, transaction.amount)}`}>
                          {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">Filter by type:</span>
                  {["reward","stake","fee","deposit","withdrawal"].map((t) => (
                    <Button
                      key={t}
                      variant={txTypes.includes(t) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleType(t)}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="from-date" className="text-xs">From</Label>
                    <Input id="from-date" type="date" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} className="h-8 w-40" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="to-date" className="text-xs">To</Label>
                    <Input id="to-date" type="date" value={toDate} onChange={(e)=>setToDate(e.target.value)} className="h-8 w-40" />
                  </div>
                  <Button variant="outline" size="sm" onClick={()=>{ setTxTypes([]); setFromDate(""); setToDate(""); }}>Clear</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between flex-row">
                <CardTitle>Transaction History</CardTitle>
                <Button variant="outline" size="sm" onClick={exportCsv} className="bg-transparent">Export CSV</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                   {data.transactions.length === 0 && (
                     <div className="p-6 text-center text-sm text-muted-foreground border rounded-lg">
                       No transactions to display. Adjust filters or check back later.
                     </div>
                   )}
                   {(data.transactions).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {formatDate(transaction.date)}
                            <Badge
                              variant={
                                transaction.status === "completed"
                                  ? "default"
                                  : transaction.status === "active"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className="text-xs"
                            >
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-lg font-bold ${getTransactionColor(transaction.type, transaction.amount)}`}
                        >
                          {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount)}
                        </span>
                        {transaction.paymentMethod && (
                          <p className="text-xs text-muted-foreground">{transaction.paymentMethod}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {data.transactions.length > 0 && (
                    <div className="flex items-center justify-end gap-8 pt-2 border-t">
                      <div className="text-sm">
                        <span className="text-muted-foreground mr-2">Total In:</span>
                        <span className="font-bold text-green-600">
                          ${data.transactions.filter(t=>t.amount>0).reduce((s,t)=>s+Math.abs(Number(t.amount||0)),0)}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground mr-2">Total Out:</span>
                        <span className="font-bold text-red-600">
                          ${data.transactions.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(Number(t.amount||0)),0)}
                        </span>
                      </div>
                    </div>
                  )}
                  {/* Pagination */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      Page {page}{pagination?.totalPages ? ` of ${pagination.totalPages}` : ''}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={!canPrev} onClick={async()=>{
                        const next = Math.max(1, page - 1)
                        const params = new URLSearchParams({ page: String(next), pageSize: '20' })
                        if (txTypes.length) params.set('type', txTypes.join(','))
                        if (fromDate) params.set('from', new Date(fromDate).toISOString())
                        if (toDate) params.set('to', new Date(toDate).toISOString())
                        const res = await fetch(`/api/user/credits?${params.toString()}`, { cache: 'no-store' })
                        if (res.ok) {
                          const payload = await res.json()
                          if (payload?.success) {
                            setWallet({ ...mockWalletData, ...payload.wallet })
                            setPagination(payload.pagination || null)
                            setPage(next)
                          }
                        }
                      }}>Prev</Button>
                      <Button variant="outline" size="sm" disabled={!canNext} onClick={async()=>{
                        const next = page + 1
                        const params = new URLSearchParams({ page: String(next), pageSize: '20' })
                        if (txTypes.length) params.set('type', txTypes.join(','))
                        if (fromDate) params.set('from', new Date(fromDate).toISOString())
                        if (toDate) params.set('to', new Date(toDate).toISOString())
                        const res = await fetch(`/api/user/credits?${params.toString()}`, { cache: 'no-store' })
                        if (res.ok) {
                          const payload = await res.json()
                          if (payload?.success) {
                            setWallet({ ...mockWalletData, ...payload.wallet })
                            setPagination(payload.pagination || null)
                            setPage(next)
                          }
                        }
                      }}>Next</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Stakes Tab */}
          <TabsContent value="stakes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Stakes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                   {(data.activeStakes).map((stake) => (
                    <div key={stake.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{stake.challengeTitle}</h3>
                        <Badge variant="secondary">{stake.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Staked Amount</p>
                          <p className="font-bold text-orange-600">${stake.amount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Progress</p>
                          <p className="font-bold text-primary">{stake.progress}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Days Left</p>
                          <p className="font-bold">{stake.daysLeft} days</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Potential Reward</p>
                          <p className="font-bold text-green-600">${stake.potentialReward}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Add Funds */}
              <Card>
                <CardHeader>
                  <CardTitle>Add Funds</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="deposit-amount">Amount</Label>
                    <Input
                      id="deposit-amount"
                      type="number"
                      placeholder="Enter amount"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDepositAmount("25")}
                      className="bg-transparent"
                    >
                      $25
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDepositAmount("50")}
                      className="bg-transparent"
                    >
                      $50
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDepositAmount("100")}
                      className="bg-transparent"
                    >
                      $100
                    </Button>
                  </div>
                  <Button onClick={handleDeposit} disabled={!depositAmount || isLoading} className="w-full">
                    {isLoading ? "Processing..." : "Add Funds"}
                  </Button>
                </CardContent>
              </Card>

              {/* Withdraw Funds */}
              <Card>
                <CardHeader>
                  <CardTitle>Withdraw Funds</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="withdraw-amount">Amount</Label>
                    <Input
                      id="withdraw-amount"
                      type="number"
                      placeholder="Enter amount (min $10)"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      Available for withdrawal: ${((data.balance) - (data.totalStaked ?? 0)).toFixed(2)}
                    </p>
                    {withdrawAmount && Number.parseFloat(withdrawAmount) > 0 && (
                      <div className="bg-muted p-3 rounded-md space-y-1">
                        <p className="font-medium">Withdrawal Breakdown:</p>
                        <div className="flex justify-between">
                          <span>Amount:</span>
                          <span>${Number.parseFloat(withdrawAmount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-orange-600">
                          <span>Fee (3%):</span>
                          <span>${(Number.parseFloat(withdrawAmount) * 0.03).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-medium border-t pt-1">
                          <span>Total deducted:</span>
                          <span>${(Number.parseFloat(withdrawAmount) * 1.03).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleWithdraw}
                    disabled={!withdrawAmount || isLoading}
                    className="w-full bg-transparent"
                  >
                    {isLoading ? "Processing..." : "Withdraw Funds"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Funds typically arrive in 3-5 business days
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockWalletData.paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {method.type === "card" ? `${method.brand} •••• ${method.last4}` : method.email}
                          </p>
                          {method.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full bg-transparent">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payment Method
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
