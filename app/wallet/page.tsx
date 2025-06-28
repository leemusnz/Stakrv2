"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

// Mock wallet data
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
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    console.log("Withdrawing:", withdrawAmount)
    setWithdrawAmount("")
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Wallet</h1>
          <p className="text-muted-foreground">Manage your credits, stakes, and transactions</p>
        </div>

        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
                  <p className="text-3xl font-bold text-primary">${mockWalletData.balance}</p>
                </div>
                <Wallet className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Earned</p>
                  <p className="text-3xl font-bold text-green-600">${mockWalletData.totalEarned}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Stakes</p>
                  <p className="text-3xl font-bold text-orange-600">${mockWalletData.totalStaked}</p>
                </div>
                <Target className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Rewards</p>
                  <p className="text-3xl font-bold text-secondary">${mockWalletData.pendingRewards}</p>
                </div>
                <Gift className="w-8 h-8 text-secondary" />
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
                    {mockWalletData.transactions.slice(0, 5).map((transaction) => (
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
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockWalletData.transactions.map((transaction) => (
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
                  {mockWalletData.activeStakes.map((stake) => (
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
                      placeholder="Enter amount"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Available for withdrawal: ${mockWalletData.balance - mockWalletData.totalStaked}
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleWithdraw}
                    disabled={!withdrawAmount || isLoading}
                    className="w-full bg-transparent"
                  >
                    {isLoading ? "Processing..." : "Withdraw Funds"}
                  </Button>
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
