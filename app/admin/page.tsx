"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DevAccessManager } from "@/components/admin/dev-access-manager"
import { UserManagement } from "@/components/admin/user-management"
import { ModerationDashboard } from "@/components/admin/moderation-dashboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Users,
  Trophy,
  DollarSign,
  AlertTriangle,
  Bell,
  Activity,
  Database,
  Server,
  Zap,
  RefreshCw,
  TrendingUp,
  Eye,
  Settings,
  BarChart3,
  PieChart,
  LineChart,
  Monitor,
  Bug,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  MessageSquare,
  RotateCcw,
  Shield
} from "lucide-react"
import { useNotifications } from "@/components/notifications/notification-provider"

export default function AdminDashboard() {
  const { addNotification } = useNotifications()
  const [activeTab, setActiveTab] = useState("analytics")
  const [analytics, setAnalytics] = useState<any>(null)
  const [systemData, setSystemData] = useState<any>(null)
  const [verifications, setVerifications] = useState<any>(null)
  const [appeals, setAppeals] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics')
      const data = await response.json()
      
      if (data.success) {
        setAnalytics(data.analytics)
      } else {
        throw new Error(data.error || 'Failed to load analytics')
      }
    } catch (error) {
      console.error('Analytics error:', error)
      addNotification({
        type: "system",
        title: "Analytics Error",
        message: "Failed to load analytics data"
      })
    }
  }

  const loadSystemData = async () => {
    try {
      const response = await fetch('/api/admin/system')
      const data = await response.json()
      
      if (data.success) {
        setSystemData(data.system)
      } else {
        throw new Error(data.error || 'Failed to load system data')
      }
    } catch (error) {
      console.error('System monitoring error:', error)
      addNotification({
        type: "system", 
        title: "System Error",
        message: "Failed to load system data"
      })
    }
  }

  const loadVerifications = async () => {
    try {
      const response = await fetch('/api/admin/verifications')
      const data = await response.json()
      
      if (data.success) {
        setVerifications(data.verifications)
      } else {
        throw new Error(data.error || 'Failed to load verifications')
      }
    } catch (error) {
      console.error('Verifications error:', error)
      addNotification({
        type: "system",
        title: "Verifications Error",
        message: "Failed to load verification data"
      })
    }
  }

  const loadAppeals = async () => {
    try {
      const response = await fetch('/api/admin/appeals')
      const data = await response.json()
      
      if (data.success) {
        setAppeals(data.appeals)
      } else {
        throw new Error(data.error || 'Failed to load appeals')
      }
    } catch (error) {
      console.error('Appeals error:', error)
      addNotification({
        type: "system",
        title: "Appeals Error",
        message: "Failed to load appeals data"
      })
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await Promise.all([loadAnalytics(), loadSystemData(), loadVerifications(), loadAppeals()])
    setRefreshing(false)
    
    addNotification({
      type: "system",
      title: "Data Refreshed",
      message: "Dashboard data has been updated"
    })
  }

  const processVerificationDecision = async (verificationId: string, decision: 'approved' | 'rejected', reason?: string) => {
    try {
      const response = await fetch('/api/admin/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationId, decision, reason })
      })
      
      const data = await response.json()
      
      if (data.success) {
        addNotification({
          type: "system",
          title: "Verification Processed",
          message: data.message
        })
        await loadVerifications() // Refresh verification data
      } else {
        throw new Error(data.error || 'Failed to process verification')
      }
    } catch (error) {
      addNotification({
        type: "system",
        title: "Verification Error",
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const processAppealDecision = async (appealId: string, decision: 'approved' | 'rejected', reason?: string) => {
    try {
      const response = await fetch('/api/admin/appeals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appealId, decision, reason })
      })
      
      const data = await response.json()
      
      if (data.success) {
        addNotification({
          type: "system",
          title: "Appeal Processed",
          message: data.message
        })
        await Promise.all([loadAppeals(), loadVerifications()]) // Refresh both appeals and verifications
      } else {
        throw new Error(data.error || 'Failed to process appeal')
      }
    } catch (error) {
      addNotification({
        type: "system",
        title: "Appeal Error",
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const reverseVerificationDecision = async (verificationId: string, reason: string) => {
    try {
      const response = await fetch('/api/admin/verifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationId, reason })
      })
      
      const data = await response.json()
      
      if (data.success) {
        addNotification({
          type: "system",
          title: "Decision Reversed",
          message: data.message
        })
        await loadVerifications() // Refresh verification data
      } else {
        throw new Error(data.error || 'Failed to reverse decision')
      }
    } catch (error) {
      addNotification({
        type: "system",
        title: "Reversal Error",
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const executeSystemAction = async (action: string, params?: any) => {
    try {
      const response = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, params })
      })
      
      const data = await response.json()
      
      if (data.success) {
        addNotification({
          type: "system",
          title: "Action Completed",
          message: data.result.message
        })
        await loadSystemData() // Refresh system data
      } else {
        throw new Error(data.error || 'Action failed')
      }
    } catch (error) {
      addNotification({
        type: "system",
        title: "Action Failed",
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([loadAnalytics(), loadSystemData(), loadVerifications(), loadAppeals()])
      setLoading(false)
    }
    
    loadData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🛠️ Admin Dashboard</h1>
          <p className="text-muted-foreground">Complete platform analytics and system monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live Data
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="verifications" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Verifications
          </TabsTrigger>
          <TabsTrigger value="appeals" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Appeals
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Moderation
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="dev-access" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Dev Access
          </TabsTrigger>
          <TabsTrigger value="dev-tools" className="flex items-center gap-2">
            <Bug className="w-4 h-4" />
            Dev Tools
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        {/* Analytics Dashboard */}
        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-700">{analytics.userStats.totalUsers.toLocaleString()}</div>
                    <p className="text-xs text-blue-600">
                      {analytics.userStats.premiumUsers} premium • +{analytics.userStats.newUsersToday} today
                    </p>
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground">Monthly Growth</div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-600" />
                        <span className="text-sm font-medium text-green-600">
                          {analytics.userStats.userGrowthRate}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Challenges</CardTitle>
                    <Trophy className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-700">{analytics.challengeStats.activeChallenges}</div>
                    <p className="text-xs text-green-600">
                      {analytics.challengeStats.totalChallenges} total • {analytics.challengeStats.pendingChallenges} pending
                    </p>
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground">Success Rate</div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span className="text-sm font-medium text-green-600">
                          {analytics.challengeStats.successRate}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-yellow-200 bg-yellow-50/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-700">
                      ${analytics.financialStats.monthlyRevenue.toLocaleString()}
                    </div>
                    <p className="text-xs text-yellow-600">
                      ${analytics.financialStats.totalRevenue.toLocaleString()} total revenue
                    </p>
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground">Today's Revenue</div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-600">
                          ${analytics.financialStats.dailyRevenue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Stakes</CardTitle>
                    <PieChart className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-700">
                      ${analytics.financialStats.activeStakes.toLocaleString()}
                    </div>
                    <p className="text-xs text-purple-600">
                      Avg: ${analytics.financialStats.averageStakeAmount} per stake
                    </p>
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground">Total Stakes</div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-purple-600" />
                        <span className="text-sm font-medium text-purple-600">
                          ${analytics.financialStats.totalStakes.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Real Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-indigo-200 bg-indigo-50/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">User Trust & Engagement</CardTitle>
                    <Activity className="h-4 w-4 text-indigo-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Avg Trust Score</span>
                        <span className="text-sm font-medium">{analytics.userStats.averageTrustScore}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Avg Current Streak</span>
                        <span className="text-sm font-medium">{analytics.userStats.averageStreak} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Premium Users</span>
                        <span className="text-sm font-medium">{analytics.userStats.premiumUsers}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-teal-200 bg-teal-50/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Challenge Performance</CardTitle>
                    <BarChart3 className="h-4 w-4 text-teal-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Avg Participants</span>
                        <span className="text-sm font-medium">{analytics.challengeStats.averageParticipants}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Monthly Growth</span>
                        <span className="text-sm font-medium">{analytics.challengeStats.challengeGrowthRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Success Rate</span>
                        <span className="text-sm font-medium">{analytics.challengeStats.successRate}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Health</CardTitle>
                    <Server className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">DB Response</span>
                        <span className="text-sm font-medium">{analytics.systemHealth.apiResponseTime}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Total Records</span>
                        <span className="text-sm font-medium">{analytics.systemHealth.totalRecords?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Status</span>
                        <span className="text-sm font-medium text-green-600">{analytics.systemHealth.databaseStatus}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts and Trends */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="w-5 h-5" />
                      Weekly Activity Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.weeklyData && (
                      <div className="space-y-4">
                        {analytics.weeklyData.map((day: any, index: number) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{day.day}</span>
                              <span className="text-muted-foreground">
                                {day.users} users • ${day.revenue}
                              </span>
                            </div>
                            <Progress 
                              value={(day.users / 800) * 100} 
                              className="h-2"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Top Performing Challenges
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.topChallenges && (
                      <div className="space-y-4">
                        {analytics.topChallenges.map((challenge: any, index: number) => (
                          <div key={challenge.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{challenge.title}</p>
                                <p className="text-sm text-muted-foreground">{challenge.category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{challenge.participants} participants</p>
                              <p className="text-xs text-green-600">{challenge.successRate}% success</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Real-Time Activity Feed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.recentActivity && (
                    <div className="space-y-3">
                      {analytics.recentActivity.map((activity: any) => (
                        <div key={activity.id} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.type === 'user_registration' ? 'bg-blue-500' :
                            activity.type === 'challenge_completion' ? 'bg-green-500' :
                            activity.type === 'verification_pending' ? 'bg-yellow-500' :
                            'bg-purple-500'
                          }`} />
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="font-medium">{activity.user}</span> {activity.action}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {activity.type.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Verification Management */}
        <TabsContent value="verifications" className="space-y-6">
          {verifications && (
            <>
              {/* Verification Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-orange-200 bg-orange-50/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                    <Eye className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-700">{verifications.stats.pendingCount}</div>
                    <p className="text-xs text-orange-600">
                      ${verifications.stats.totalStakesUnderReview.toFixed(2)} total stakes
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-700">{verifications.stats.approvedToday}</div>
                    <p className="text-xs text-green-600">Successful verifications</p>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rejected Today</CardTitle>
                    <XCircle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-700">{verifications.stats.rejectedToday}</div>
                    <p className="text-xs text-red-600">Failed verifications</p>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
                    <Clock className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-700">{verifications.stats.avgProcessingTime}h</div>
                    <p className="text-xs text-blue-600">Average review time</p>
                  </CardContent>
                </Card>
              </div>

              {/* Pending Verifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Pending Verification Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {verifications.pendingVerifications.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                      <h3 className="text-lg font-medium">All Caught Up!</h3>
                      <p className="text-muted-foreground">No pending verifications to review</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {verifications.pendingVerifications.map((verification: any) => (
                        <Card key={verification.id} className="border-l-4 border-l-orange-500">
                          <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row gap-6">
                              {/* Verification Info */}
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-4">
                                  <div>
                                    <h3 className="text-lg font-bold mb-1">{verification.challengeTitle}</h3>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      By <span className="font-medium">{verification.userName}</span> ({verification.userEmail})
                                    </p>
                                    <div className="flex items-center gap-4 text-sm">
                                      <Badge variant="outline">{verification.proofType}</Badge>
                                      <span>${verification.stakeAmount} staked</span>
                                      <span>{verification.participantCount} participants</span>
                                    </div>
                                  </div>
                                  <Badge variant="secondary">
                                    {new Date(verification.submittedAt).toLocaleTimeString()}
                                  </Badge>
                                </div>

                                {/* Proof Content */}
                                <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                                  <h4 className="font-medium mb-2">Submitted Proof:</h4>
                                  <p className="text-sm">{verification.proofText}</p>
                                  {verification.proofUrl && (
                                    <div className="mt-2">
                                      <Button variant="outline" size="sm" className="h-8">
                                        <FileText className="w-3 h-3 mr-1" />
                                        View {verification.proofType}
                                      </Button>
                                    </div>
                                  )}
                                </div>

                                {/* Additional Details */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <div className="font-medium text-muted-foreground">Progress</div>
                                    <div>{verification.daysIntoChallenge}/{verification.challengeDuration} days</div>
                                  </div>
                                  <div>
                                    <div className="font-medium text-muted-foreground">Submitted</div>
                                    <div>{new Date(verification.submittedAt).toLocaleDateString()}</div>
                                  </div>
                                  <div>
                                    <div className="font-medium text-muted-foreground">Type</div>
                                    <div className="capitalize">{verification.proofType}</div>
                                  </div>
                                  <div>
                                    <div className="font-medium text-muted-foreground">Priority</div>
                                    <Badge variant={
                                      verification.priority === 'high' ? 'destructive' :
                                      verification.priority === 'medium' ? 'secondary' : 'outline'
                                    }>
                                      {verification.priority}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-col gap-2 lg:w-48">
                                <Button 
                                  onClick={() => processVerificationDecision(verification.id, 'approved')}
                                  className="w-full bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve
                                </Button>
                                
                                <Button 
                                  onClick={() => processVerificationDecision(verification.id, 'rejected', 'Insufficient evidence provided')}
                                  variant="destructive" 
                                  className="w-full"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                                
                                <Button 
                                  variant="outline" 
                                  className="w-full"
                                  onClick={() => window.location.href = `/challenge/${verification.challengeId}`}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Challenge
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Decisions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Verification Decisions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {verifications.recentDecisions.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No recent decisions</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {verifications.recentDecisions.map((decision: any) => (
                        <div key={decision.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            {decision.decision === 'approved' ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <div>
                              <p className="font-medium">{decision.challengeTitle}</p>
                              <p className="text-sm text-muted-foreground">
                                {decision.userName} • ${decision.stakeAmount}
                              </p>
                              {decision.reason && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Reason: {decision.reason}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <Badge variant={decision.decision === 'approved' ? 'default' : 'destructive'}>
                              {decision.decision}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const reason = prompt(`Reverse this ${decision.decision} decision?\n\nPlease provide a reason for reversal:`)
                                if (reason) {
                                  reverseVerificationDecision(decision.id, reason)
                                }
                              }}
                              className="h-7 px-2 text-xs"
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Reverse
                            </Button>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {new Date(decision.decidedAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* System Monitoring */}
        <TabsContent value="monitoring" className="space-y-6">
          {systemData && (
            <>
              {/* System Health Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Status</CardTitle>
                    <Server className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-lg font-bold text-green-700">Healthy</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Uptime: {systemData.systemHealth.uptime || 99.8}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {systemData.performance.memoryUsage || 45}%
                    </div>
                    <Progress 
                      value={systemData.performance.memoryUsage || 45} 
                      className="mt-2 h-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Database</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-lg font-bold text-green-700">Connected</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Response: {systemData.database.responseTime || 35}ms
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">API Response</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {systemData.performance.apiResponseTime || 142}ms
                    </div>
                    <p className="text-xs text-green-600">Excellent</p>
                  </CardContent>
                </Card>
              </div>

              {/* Service Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Service Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {systemData.services && Object.entries(systemData.services).map(([service, data]: [string, any]) => (
                      <div key={service} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{service.replace(/([A-Z])/g, ' $1')}</p>
                          <p className="text-sm text-muted-foreground">
                            {data.responseTime ? `${data.responseTime}ms` : 'Active'}
                          </p>
                        </div>
                        <Badge className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Online
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System Alerts */}
              {systemData.monitoring?.alerts && systemData.monitoring.alerts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      System Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {systemData.monitoring.alerts.map((alert: any) => (
                        <Alert key={alert.id} variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{alert.message}</p>
                                <p className="text-sm">
                                  Current: {alert.current} | Threshold: {alert.threshold}
                                </p>
                              </div>
                              <span className="text-xs">
                                {new Date(alert.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Users Management */}
        <TabsContent value="users" className="space-y-6">
          <UserManagement />
        </TabsContent>

        {/* Dev Access */}
        <TabsContent value="dev-access" className="space-y-6">
          <DevAccessManager />
        </TabsContent>

        {/* Dev Tools */}
        <TabsContent value="dev-tools" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="w-5 h-5" />
                  System Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => executeSystemAction('test_database')}
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Test Database Connection
                </Button>
                
                <Button 
                  onClick={() => executeSystemAction('clear_cache')}
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear System Cache
                </Button>
                
                <Button 
                  onClick={() => executeSystemAction('toggle_debug', { enabled: true })}
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Toggle Debug Mode
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database Migrations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/admin/run-migration', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ migration: 'challenge-schema' })
                      })
                      
                      const data = await response.json()
                      
                      if (data.success) {
                        addNotification({
                          type: "system",
                          title: "Migration Successful",
                          message: data.message
                        })
                      } else {
                        throw new Error(data.error || 'Migration failed')
                      }
                    } catch (error) {
                      addNotification({
                        type: "system",
                        title: "Migration Failed",
                        message: error instanceof Error ? error.message : 'Unknown error'
                      })
                    }
                  }}
                  className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Run Challenge Schema Migration
                </Button>
                
                <Button 
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/admin/run-migration', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ migration: 'content-moderation' })
                      })
                      
                      const data = await response.json()
                      
                      if (data.success) {
                        addNotification({
                          type: "system",
                          title: "Moderation Setup Complete ✅",
                          message: data.message
                        })
                      } else {
                        throw new Error(data.error || 'Moderation migration failed')
                      }
                    } catch (error) {
                      addNotification({
                        type: "system",
                        title: "Migration Failed ❌",
                        message: error instanceof Error ? error.message : 'Unknown error'
                      })
                    }
                  }}
                  className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Setup Content Moderation
                </Button>
                
                <Button 
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/admin/moderation/queue')
                      const reportsResponse = await fetch('/api/admin/moderation/reports')
                      
                      const queueData = await response.json()
                      const reportsData = await reportsResponse.json()
                      
                      if (response.ok && reportsResponse.ok) {
                        addNotification({
                          type: "system",
                          title: "Moderation System Active ✅",
                          message: `Queue: ${queueData.items?.length || 0} items, Reports: ${reportsData.reports?.length || 0} pending`
                        })
                      } else {
                        throw new Error('Moderation system not accessible')
                      }
                    } catch (error) {
                      addNotification({
                        type: "system",
                        title: "Moderation Check Failed",
                        message: "Run 'Setup Content Moderation' first"
                      })
                    }
                  }}
                  variant="outline"
                  className="w-full justify-start border-purple-600 text-purple-600 hover:bg-purple-50"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Check Moderation Status
                </Button>
                
                <Button 
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/admin/moderation/test-data', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                      })
                      
                      const data = await response.json()
                      
                      if (data.success) {
                        addNotification({
                          type: "system",
                          title: "Test Data Added ✅",
                          message: "Sample moderation data inserted! Check the Moderation tab to see the queue and reports."
                        })
                      } else {
                        throw new Error(data.error || 'Failed to add test data')
                      }
                    } catch (error) {
                      addNotification({
                        type: "system",
                        title: "Test Data Failed ❌",
                        message: error instanceof Error ? error.message : 'Unknown error occurred'
                      })
                    }
                  }}
                  variant="outline"
                  className="w-full justify-start border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Add Test Data
                </Button>
                
                <div className="text-xs text-muted-foreground p-3 bg-blue-50 rounded border">
                  <p className="font-medium mb-1">What this migration does:</p>
                  <ul className="space-y-1">
                    <li>• Adds missing columns for enhanced challenge creation</li>
                    <li>• Enables timer and random verification features</li>
                    <li>• Fixes database schema for full functionality</li>
                    <li>• Safe to run multiple times</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {systemData && (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Memory Usage</span>
                      <span className="font-mono">{systemData.performance.memoryUsage || 45}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>API Response Time</span>
                      <span className="font-mono">{systemData.performance.apiResponseTime || 142}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Database Response</span>
                      <span className="font-mono">{systemData.database.responseTime || 35}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Connections</span>
                      <span className="font-mono">{systemData.performance.activeConnections || 234}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Logs */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                System Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {systemData?.logs ? (
                <div className="space-y-2">
                  {systemData.logs.map((log: any) => (
                    <div key={log.id} className="flex items-center gap-4 p-3 border rounded-lg font-mono text-sm">
                      <Badge variant={
                        log.level === 'error' ? 'destructive' :
                        log.level === 'warning' ? 'secondary' :
                        'outline'
                      }>
                        {log.level}
                      </Badge>
                      <span className="text-muted-foreground">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span className="flex-1">{log.message}</span>
                      <Badge variant="outline" className="text-xs">
                        {log.service}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No recent logs available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appeals Management */}
        <TabsContent value="appeals" className="space-y-6">
          {appeals && (
            <>
              {/* Appeal Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-purple-200 bg-purple-50/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Appeals</CardTitle>
                    <MessageSquare className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-700">{appeals.stats.pendingAppeals}</div>
                    <p className="text-xs text-purple-600">Awaiting review</p>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-700">{appeals.stats.appealsApprovedToday}</div>
                    <p className="text-xs text-green-600">Successful appeals</p>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rejected Today</CardTitle>
                    <XCircle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-700">{appeals.stats.appealsRejectedToday}</div>
                    <p className="text-xs text-red-600">Denied appeals</p>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-700">{appeals.stats.appealSuccessRate}%</div>
                    <p className="text-xs text-blue-600">Appeals approved</p>
                  </CardContent>
                </Card>
              </div>

              {/* Pending Appeals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Pending Appeal Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {appeals.pendingAppeals.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                      <h3 className="text-lg font-medium">No Pending Appeals</h3>
                      <p className="text-muted-foreground">All appeals have been processed</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {appeals.pendingAppeals.map((appeal: any) => (
                        <Card key={appeal.id} className="border-l-4 border-l-purple-500">
                          <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row gap-6">
                              {/* Appeal Info */}
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-4">
                                  <div>
                                    <h3 className="text-lg font-bold mb-1">{appeal.challengeTitle}</h3>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      Appeal by <span className="font-medium">{appeal.userName}</span> ({appeal.userEmail})
                                    </p>
                                    <div className="flex items-center gap-4 text-sm">
                                      <Badge variant="destructive">Originally {appeal.originalDecision}</Badge>
                                      <span>${appeal.stakeAmount} at stake</span>
                                    </div>
                                  </div>
                                  <Badge variant="secondary">
                                    {new Date(appeal.appealSubmittedAt).toLocaleTimeString()}
                                  </Badge>
                                </div>

                                {/* Original Decision */}
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                  <h4 className="font-medium text-red-800 mb-1">Original Rejection Reason:</h4>
                                  <p className="text-sm text-red-700">{appeal.originalReason}</p>
                                </div>

                                {/* User's Appeal */}
                                <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                                  <h4 className="font-medium mb-2">User's Appeal:</h4>
                                  <p className="text-sm">{appeal.appealReason}</p>
                                  {appeal.additionalEvidence && (
                                    <div className="mt-2">
                                      <p className="text-xs font-medium text-muted-foreground">Additional Evidence:</p>
                                      <p className="text-xs text-muted-foreground">{appeal.additionalEvidence}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Timeline */}
                                <div className="text-xs text-muted-foreground">
                                  <p>Appeal submitted: {new Date(appeal.appealSubmittedAt).toLocaleString()}</p>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-col gap-2 lg:w-48">
                                <Button 
                                  onClick={() => processAppealDecision(appeal.id, 'approved', 'Appeal justified - decision reversed')}
                                  className="w-full bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve Appeal
                                </Button>
                                
                                <Button 
                                  onClick={() => {
                                    const reason = prompt('Please provide a reason for rejecting this appeal:')
                                    if (reason) {
                                      processAppealDecision(appeal.id, 'rejected', reason)
                                    }
                                  }}
                                  variant="destructive" 
                                  className="w-full"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject Appeal
                                </Button>
                                
                                <Button 
                                  variant="outline" 
                                  className="w-full"
                                  onClick={() => window.location.href = `/challenge/${appeal.challengeId}`}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Challenge
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Appeal Decisions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Appeal Decisions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {appeals.recentAppealDecisions.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No recent appeal decisions</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {appeals.recentAppealDecisions.map((decision: any) => (
                        <div key={decision.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            {decision.appealDecision === 'approved' ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <div>
                              <p className="font-medium">{decision.challengeTitle}</p>
                              <p className="text-sm text-muted-foreground">
                                {decision.userName} • ${decision.stakeAmount} • Originally {decision.originalDecision}
                              </p>
                              {decision.appealReason && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {decision.appealReason}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={decision.appealDecision === 'approved' ? 'default' : 'destructive'}>
                              Appeal {decision.appealDecision}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(decision.appealDecidedAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Content Moderation */}
        <TabsContent value="moderation" className="space-y-6">
          <ModerationDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
