'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  Brain,
  BarChart3,
  Eye,
  Ban,
  RefreshCw
} from 'lucide-react'

interface AISystemStats {
  status: string
  modelsLoaded: boolean
  averageProcessingTime: number
  todayStats: {
    totalSubmissions: number
    approved: number
    underReview: number
    rejected: number
    banned: number
  }
  accuracyMetrics: {
    truePositiveRate: number
    falsePositiveRate: number
    confidence: number
  }
}

interface RiskProfile {
  userId: string
  email: string
  name: string
  riskScore: number
  riskLevel: string
  totalSubmissions: number
  approvalRate: number
  lastActivity: string
}

interface DetectionPattern {
  id: string
  name: string
  type: string
  timesDetected: number
  effectiveness: number
  isActive: boolean
  lastDetection?: string
}

export function AIAntiCheatDashboard() {
  const [stats, setStats] = useState<AISystemStats | null>(null)
  const [highRiskUsers, setHighRiskUsers] = useState<RiskProfile[]>([])
  const [detectionPatterns, setDetectionPatterns] = useState<DetectionPattern[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      // Fetch AI system stats
      const statsResponse = await fetch('/api/admin/ai-system')
      const statsData = await statsResponse.json()
      if (statsData.success) {
        setStats(statsData.aiSystem)
      }

      // Set high-risk users and detection patterns from API response
      if (statsData.highRiskUsers) {
        setHighRiskUsers(statsData.highRiskUsers)
      }

      if (statsData.detectionPatterns) {
        setDetectionPatterns(statsData.detectionPatterns)
      }

    } catch (error) {
      console.error('Failed to fetch AI dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'operational' ? 'text-green-600' : 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading AI Anti-Cheat Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">🛡️ AI Anti-Cheat System</h2>
          <p className="text-muted-foreground">
            Monitor and manage the AI-powered cheating detection system
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Status
          </CardTitle>
          <CardDescription>
            Current status and health of the AI detection system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getStatusColor(stats?.status || 'unknown')}`}>
                {stats?.status || 'Unknown'}
              </div>
              <p className="text-sm text-muted-foreground">System Status</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {stats?.modelsLoaded ? (
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600 mx-auto" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">Models Loaded</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {stats?.averageProcessingTime || 0}s
              </div>
              <p className="text-sm text-muted-foreground">Avg Processing Time</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats?.accuracyMetrics?.confidence || 0}%
              </div>
              <p className="text-sm text-muted-foreground">System Confidence</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">High-Risk Users</TabsTrigger>
          <TabsTrigger value="patterns">Detection Patterns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.todayStats?.totalSubmissions || 0}</div>
                <p className="text-xs text-muted-foreground">Today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Auto-Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats?.todayStats?.approved || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.todayStats?.totalSubmissions 
                    ? Math.round((stats.todayStats.approved / stats.todayStats.totalSubmissions) * 100)
                    : 0}% approval rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Under Review</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats?.todayStats?.underReview || 0}</div>
                <p className="text-xs text-muted-foreground">Human review queue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected/Banned</CardTitle>
                <Ban className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {(stats?.todayStats?.rejected || 0) + (stats?.todayStats?.banned || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Cheating detected</p>
              </CardContent>
            </Card>
          </div>

          {/* Accuracy Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Detection Accuracy</CardTitle>
              <CardDescription>How well the AI system is performing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">True Positive Rate</span>
                  <span className="text-sm">{stats?.accuracyMetrics?.truePositiveRate || 0}%</span>
                </div>
                <Progress value={stats?.accuracyMetrics?.truePositiveRate || 0} />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">False Positive Rate</span>
                  <span className="text-sm">{stats?.accuracyMetrics?.falsePositiveRate || 0}%</span>
                </div>
                <Progress 
                  value={stats?.accuracyMetrics?.falsePositiveRate || 0} 
                  className="[&>div]:bg-red-500"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* High-Risk Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                High-Risk Users
              </CardTitle>
              <CardDescription>
                Users with suspicious behavior patterns requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {highRiskUsers.map((user) => (
                  <div key={user.userId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.name}</span>
                        <Badge variant={getRiskBadgeColor(user.riskLevel) as any}>
                          {user.riskLevel} risk
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.totalSubmissions} submissions • {user.approvalRate}% approval rate
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-2xl font-bold text-red-600">{user.riskScore}</div>
                      <p className="text-xs text-muted-foreground">Risk Score</p>
                      <Button size="sm" variant="outline">
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
                {highRiskUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No high-risk users detected</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detection Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Detection Patterns
              </CardTitle>
              <CardDescription>
                AI patterns used to detect different types of cheating
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {detectionPatterns.map((pattern) => (
                  <div key={pattern.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{pattern.name}</span>
                        <Badge variant="outline">{pattern.type.replace('_', ' ')}</Badge>
                        {pattern.isActive ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Detected {pattern.timesDetected} times
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-2xl font-bold text-blue-600">{pattern.effectiveness}%</div>
                      <p className="text-xs text-muted-foreground">Effectiveness</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                System Analytics
              </CardTitle>
              <CardDescription>
                Detailed performance metrics and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertTitle>Analytics Coming Soon</AlertTitle>
                <AlertDescription>
                  Detailed charts and trend analysis will be available once sufficient data is collected.
                  The system needs at least 100 submissions to generate meaningful analytics.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}