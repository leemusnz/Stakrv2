"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { DashboardMobile } from "@/components/dashboard-mobile"
import { MobileContainer } from "@/components/mobile-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Trophy, Bell, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ArrowRight } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUserAvatar } from '@/hooks/use-user-avatar'
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  Shield
} from 'lucide-react'

interface DashboardData {
  user: {
    id: string
    name: string
    email: string
    avatar?: string
    credits: number
    trustScore: number
    verificationTier: string
    challengesCompleted: number
    currentStreak: number
    longestStreak: number
    premiumSubscription: boolean
    memberSince: string
  }
  stats: {
    totalEarnings: number
    currentBalance: number
    activeStakes: number
    activeChallengesCount: number
    completedChallengesCount: number
    successRate: number
  }
  activeChallenges: Array<{
    id: string
    title: string
    category: string
    stakeAmount: number
    daysRemaining: number
    completionStatus: string
    proofSubmitted: boolean
  }>
  completedChallenges: Array<{
    id: string
    title: string
    category: string
    rewardEarned: number
    completedAt: string
  }>
  notifications: Array<{
    id: string
    title: string
    message: string
    type: string
    createdAt: string
  }>
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isMobile } = useEnhancedMobile()
  const { avatarUrl } = useUserAvatar() // Use unified avatar system
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Don't do anything during loading
    if (status === "loading") return

    // If user is authenticated, load dashboard data
    if (session?.user) {
      console.log('📊 Dashboard page - User authenticated:', session.user.email)
      console.log('🎯 Onboarding completed:', session.user.onboardingCompleted)
      
      // Load dashboard data regardless of onboarding status
      // If they haven't completed onboarding, we'll show a different view
      console.log('✅ Loading dashboard data')
      loadDashboardData()
    } else {
      // If not authenticated, redirect to onboarding
      console.log('🔒 No session, redirecting to onboarding...')
      router.push('/onboarding')
      return
    }
  }, [session, status, router])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/dashboard')
      const data = await response.json()

      if (data.success) {
        setDashboardData(data.dashboard)
      } else {
        setError(data.message || 'Failed to load dashboard')
      }
    } catch (error) {
      setError('Failed to load dashboard data')
      console.error('Dashboard load error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking session/loading data
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Error Loading Dashboard</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={loadDashboardData}>Try Again</Button>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">No Data Available</h1>
          <p className="text-muted-foreground">Unable to load dashboard data</p>
        </div>
      </div>
    )
  }

  const { user, stats, activeChallenges, completedChallenges, notifications } = dashboardData

  // Use mobile dashboard on mobile devices
  if (isMobile) {
    return (
      <DashboardMobile 
        data={dashboardData}
        loading={loading}
        error={error}
        onRetry={loadDashboardData}
      />
    )
  }

  // Desktop dashboard
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={avatarUrl || '/placeholder.svg'} />
            <AvatarFallback className="text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your Stakr journey
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <Button variant="outline" size="sm">
              <Bell className="w-4 h-4 mr-2" />
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </Button>
          )}
          <Button onClick={() => router.push('/my-active')}>
            <Trophy className="w-4 h-4 mr-2" />
            My Active
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.currentBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +${stats.totalEarnings.toFixed(2)} total earned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trust Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.trustScore}/100</div>
            <Progress value={user.trustScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.currentStreak}</div>
            <p className="text-xs text-muted-foreground">
              Best: {user.longestStreak} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {user.challengesCompleted} challenges completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Challenges */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Challenges</CardTitle>
              <CardDescription>
                {stats.activeChallengesCount} challenges in progress
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => router.push('/my-challenges')}>
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeChallenges.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Active Challenges</h3>
              <p className="text-muted-foreground mb-4">
                Start a new challenge to begin building better habits!
              </p>
              <Button onClick={() => router.push('/discover')}>
                Browse Challenges
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeChallenges.map((challenge) => (
                <div key={challenge.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="font-medium">{challenge.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline">{challenge.category}</Badge>
                        <span>${challenge.stakeAmount} staked</span>
                        <span>•</span>
                        <span>{challenge.daysRemaining} days left</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {challenge.proofSubmitted ? (
                      <Badge>Proof Submitted</Badge>
                    ) : (
                      <Badge variant="secondary">In Progress</Badge>
                    )}
                    <Button variant="outline" size="sm" onClick={() => router.push(`/challenge/${challenge.id}`)}>
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Completions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Completions</CardTitle>
            <CardDescription>Your latest successful challenges</CardDescription>
          </CardHeader>
          <CardContent>
            {completedChallenges.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No completed challenges yet
              </p>
            ) : (
              <div className="space-y-3">
                {completedChallenges.slice(0, 5).map((challenge) => (
                  <div key={challenge.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{challenge.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(challenge.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">
                        +${challenge.rewardEarned.toFixed(2)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {challenge.category}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
            <CardDescription>Your verification and membership details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Verification Tier</span>
              <Badge variant={user.verificationTier === 'gold' ? 'default' : 'secondary'}>
                {user.verificationTier.charAt(0).toUpperCase() + user.verificationTier.slice(1)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Membership</span>
              <Badge variant={user.premiumSubscription ? 'default' : 'outline'}>
                {user.premiumSubscription ? 'Premium' : 'Free'}
              </Badge>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Stakes</span>
                <span>${stats.activeStakes.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Earnings</span>
                <span className="text-green-600">+${stats.totalEarnings.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
