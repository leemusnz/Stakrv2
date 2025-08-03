"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { MobileContainer, MobileSectionWrapper } from "@/components/mobile-container"
import { SwipeableTabs } from "@/components/ui/swipeable-tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  Shield,
  Trophy,
  Bell,
  ArrowRight,
  Plus,
  Activity,
  Calendar,
  Users,
  Star
} from "lucide-react"
import { useUserAvatar } from '@/hooks/use-user-avatar'

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

interface DashboardMobileProps {
  data: DashboardData
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function DashboardMobile({ data, loading, error, onRetry }: DashboardMobileProps) {
  const { avatarUrl } = useUserAvatar() // Use unified avatar system
  const { isMobile } = useEnhancedMobile()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")

  if (!isMobile) return null
  
  if (loading) {
    return (
      <MobileContainer>
        <div className="space-y-4">
          <div className="h-24 bg-muted animate-pulse rounded-lg" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-muted animate-pulse rounded-lg" />
            <div className="h-20 bg-muted animate-pulse rounded-lg" />
          </div>
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
        </div>
      </MobileContainer>
    )
  }

  if (error) {
    return (
      <MobileContainer>
        <Card className="text-center p-6">
          <CardContent>
            <h3 className="text-lg font-medium text-destructive mb-2">Error Loading Dashboard</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={onRetry}>Try Again</Button>
          </CardContent>
        </Card>
      </MobileContainer>
    )
  }

  if (!data) return null

  const { user, stats, activeChallenges, completedChallenges, notifications } = data

  // Overview Tab Content
  const OverviewContent = () => (
    <div className="space-y-6">
      {/* User Header Card */}
      <Card className="overflow-hidden bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary/20">
              <AvatarImage src={avatarUrl || '/placeholder.svg'} />
              <AvatarFallback className="text-lg font-bold bg-primary/10">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{user.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user.premiumSubscription ? "default" : "outline"} className="text-xs">
                  {user.premiumSubscription ? "Premium" : "Free"}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {user.verificationTier.charAt(0).toUpperCase() + user.verificationTier.slice(1)}
                </Badge>
              </div>
            </div>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/notifications')}
                className="relative"
              >
                <Bell className="w-5 h-5" />
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                  {notifications.length}
                </Badge>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="flex flex-col items-center">
              <DollarSign className="w-6 h-6 text-primary mb-2" />
              <div className="text-2xl font-bold text-primary">${stats.currentBalance.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Current Balance</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="flex flex-col items-center">
              <Trophy className="w-6 h-6 text-yellow-500 mb-2" />
              <div className="text-2xl font-bold">{user.currentStreak}</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="flex flex-col items-center">
              <Shield className="w-6 h-6 text-blue-500 mb-2" />
              <div className="text-2xl font-bold">{user.trustScore}</div>
              <div className="text-xs text-muted-foreground">Trust Score</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="flex flex-col items-center">
              <TrendingUp className="w-6 h-6 text-green-500 mb-2" />
              <div className="text-2xl font-bold">{stats.successRate}%</div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => router.push('/discover')}
          className="h-14 flex flex-col gap-1"
          variant="outline"
        >
          <Target className="w-5 h-5" />
          <span className="text-xs">Browse Challenges</span>
        </Button>
        <Button
          onClick={() => router.push('/my-active')}
          className="h-14 flex flex-col gap-1"
          variant="outline"
        >
          <Activity className="w-5 h-5" />
          <span className="text-xs">My Active</span>
        </Button>
      </div>
    </div>
  )

  // Active Challenges Tab Content
  const ActiveContent = () => (
    <div className="space-y-4">
      {activeChallenges.length === 0 ? (
        <Card className="text-center p-8">
          <div className="space-y-4">
            <Target className="w-12 h-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-medium">No Active Challenges</h3>
            <p className="text-muted-foreground text-sm">
              Start a new challenge to begin building better habits!
            </p>
            <Button onClick={() => router.push('/discover')} className="mt-4">
              Browse Challenges
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeChallenges.map((challenge) => (
            <Card key={challenge.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium leading-tight">{challenge.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{challenge.category}</Badge>
                      <span className="text-sm text-muted-foreground">${challenge.stakeAmount} staked</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/challenge/${challenge.id}`)}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Days remaining: {challenge.daysRemaining}</span>
                    <Badge variant={challenge.proofSubmitted ? "default" : "secondary"}>
                      {challenge.proofSubmitted ? "Proof Submitted" : "In Progress"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  // Stats Tab Content
  const StatsContent = () => (
    <div className="space-y-6">
      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Trust Score</span>
              <span className="font-medium">{user.trustScore}/100</span>
            </div>
            <Progress value={user.trustScore} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                +${stats.totalEarnings.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">Total Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{user.challengesCompleted}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Completions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Wins</CardTitle>
        </CardHeader>
        <CardContent>
          {completedChallenges.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">
              No completed challenges yet
            </p>
          ) : (
            <div className="space-y-3">
              {completedChallenges.slice(0, 3).map((challenge) => (
                <div key={challenge.id} className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{challenge.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(challenge.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600 text-sm">
                      +${challenge.rewardEarned.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const tabs = [
    {
      value: "overview",
      label: "Overview",
      content: <OverviewContent />
    },
    {
      value: "active",
      label: "Active",
      content: <ActiveContent />
    },
    {
      value: "stats",
      label: "Stats", 
      content: <StatsContent />
    }
  ]

  return (
    <MobileContainer className="pb-6">
      <SwipeableTabs
        tabs={tabs}
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
        tabsListClassName="grid-cols-3"
      />
    </MobileContainer>
  )
}
