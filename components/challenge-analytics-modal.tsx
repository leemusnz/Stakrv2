"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Trophy, 
  Target, 
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react"
import { toast } from "sonner"

interface ChallengeAnalyticsModalProps {
  challengeId: string
  challengeTitle: string
  trigger: React.ReactNode
}

interface Analytics {
  challenge: {
    id: string
    title: string
    status: string
    start_date: string
    end_date: string
  }
  participation: {
    total_participants: number
    active_participants: number
    completed_participants: number
    failed_participants: number
    success_rate: number
    average_stake: number
  }
  financial: {
    total_staked: number
    total_rewards_paid: number
    total_stakes_lost: number
    platform_revenue: number
  }
  daily_trends: Array<{
    date: string
    new_participants: number
  }>
}

export function ChallengeAnalyticsModal({ challengeId, challengeTitle, trigger }: ChallengeAnalyticsModalProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/challenges/${challengeId}/analytics`)
      const data = await response.json()
      
      if (data.success) {
        setAnalytics(data.analytics)
      } else {
        toast.error(`Failed to load analytics: ${data.error}`)
      }
    } catch (error) {
      console.error('Analytics error:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadAnalytics()
    }
  }, [open])

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mobile-safe-width">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Analytics: {challengeTitle}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading analytics...</span>
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Challenge Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Challenge Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-muted-foreground">Status</div>
                    <Badge variant={analytics.challenge.status === 'active' ? 'default' : 'outline'}>
                      {analytics.challenge.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Start Date</div>
                    <div>{formatDate(analytics.challenge.start_date)}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">End Date</div>
                    <div>{formatDate(analytics.challenge.end_date)}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Duration</div>
                    <div>
                      {Math.ceil((new Date(analytics.challenge.end_date).getTime() - new Date(analytics.challenge.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Participation Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-700">{analytics.participation.total_participants}</div>
                  <p className="text-xs text-blue-600 mt-1">
                    {analytics.participation.active_participants} active participants
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <Trophy className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">{analytics.participation.success_rate}%</div>
                  <p className="text-xs text-green-600 mt-1">
                    {analytics.participation.completed_participants} completed
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-purple-50/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Stake</CardTitle>
                  <Target className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-700">{formatCurrency(analytics.participation.average_stake)}</div>
                  <p className="text-xs text-purple-600 mt-1">
                    Per participant
                  </p>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-orange-50/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Failed</CardTitle>
                  <Activity className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-700">{analytics.participation.failed_participants}</div>
                  <p className="text-xs text-orange-600 mt-1">
                    Participants dropped out
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Financial Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{formatCurrency(analytics.financial.total_staked)}</div>
                    <div className="text-sm text-muted-foreground">Total Staked</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(analytics.financial.total_rewards_paid)}</div>
                    <div className="text-sm text-muted-foreground">Rewards Paid</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(analytics.financial.total_stakes_lost)}</div>
                    <div className="text-sm text-muted-foreground">Stakes Lost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{formatCurrency(analytics.financial.platform_revenue)}</div>
                    <div className="text-sm text-muted-foreground">Platform Revenue</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Host Earnings */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Trophy className="w-4 h-4" />
                  Your Host Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {formatCurrency(analytics.financial.platform_revenue * 0.30)}
                    </div>
                    <div className="text-sm text-green-600">Revenue Share (30%)</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      From entry fees & failed stakes
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {analytics.participation.success_rate >= 50 ? formatCurrency(50) : formatCurrency(0)}
                    </div>
                    <div className="text-sm text-green-600">Contribution Return</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {analytics.participation.success_rate >= 50 ? '✓ Earned (>50% success)' : '✗ Not earned (<50% success)'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {analytics.participation.success_rate >= 80 
                        ? formatCurrency((analytics.financial.platform_revenue * 0.30) * 0.20)
                        : formatCurrency(0)
                      }
                    </div>
                    <div className="text-sm text-green-600">Success Bonus</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {analytics.participation.success_rate >= 80 ? '🎉 Earned (>80% success)' : '⏳ Earn with >80% success'}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-center font-bold text-green-800">
                    <span>Total Host Earnings:</span>
                    <span className="text-xl">
                      {formatCurrency(
                        (analytics.financial.platform_revenue * 0.30) + // Revenue share
                        (analytics.participation.success_rate >= 50 ? 50 : 0) + // Contribution return
                        (analytics.participation.success_rate >= 80 ? (analytics.financial.platform_revenue * 0.30) * 0.20 : 0) // Success bonus
                      )}
                    </span>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    🎯 Great hosting creates sustainable income!
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Participation Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-4 h-4" />
                  Participation Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Participants</span>
                    <span>{analytics.participation.active_participants} / {analytics.participation.total_participants}</span>
                  </div>
                  <Progress 
                    value={analytics.participation.total_participants > 0 
                      ? (analytics.participation.active_participants / analytics.participation.total_participants) * 100 
                      : 0
                    } 
                    className="h-2" 
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completed</span>
                    <span>{analytics.participation.completed_participants} / {analytics.participation.total_participants}</span>
                  </div>
                  <Progress 
                    value={analytics.participation.total_participants > 0 
                      ? (analytics.participation.completed_participants / analytics.participation.total_participants) * 100 
                      : 0
                    } 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Recent Trends */}
            {analytics.daily_trends.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Recent Join Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.daily_trends.slice(0, 5).map((day, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{formatDate(day.date)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{day.new_participants} new</span>
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ 
                                width: `${Math.min((day.new_participants / Math.max(...analytics.daily_trends.map(d => d.new_participants))) * 100, 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No analytics data available
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
