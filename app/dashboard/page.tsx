"use client"

import { useEffect, useState } from "react"
import { StatsCard } from "@/components/stats-card"
import { ActivityFeed } from "@/components/activity-feed"
import { StreakCounter } from "@/components/streak-counter"
import { UpcomingDeadlines } from "@/components/upcoming-deadlines"
import { ChallengeCard } from "@/components/challenge-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Wallet, Zap, Plus } from "lucide-react"
import { VerificationTrigger } from "@/components/verification-trigger"
import { Leaderboard } from "@/components/social/leaderboard"
import { FriendActivity } from "@/components/social/friend-activity"
import { AchievementShowcase } from "@/components/social/achievement-showcase"
import { SocialProof } from "@/components/social/social-proof"
import { userApi, dashboardApi, activityApi, challengeApi } from "@/lib/api"
import type { User, StatsData, ActivityItem, Deadline, Challenge } from "@/lib/types"

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<StatsData[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"overview" | "social" | "achievements">("overview")

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        const [userData, statsData, activityData, deadlineData, challengeData] = await Promise.all([
          userApi.getCurrentUser(),
          dashboardApi.getStats(),
          activityApi.getUserActivity(),
          dashboardApi.getDeadlines(),
          challengeApi.getActiveChallenges(),
        ])
        setUser(userData)
        setStats(statsData)
        setActivities(activityData)
        setDeadlines(deadlineData)
        setActiveChallenges(challengeData)
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadDashboardData()
  }, [])

  if (loading || !user) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="h-8 bg-muted rounded w-64 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header with Social Proof */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            Welcome back, <span className="text-primary">{user.name.split(" ")[0]}</span>! 👋
          </h1>
          <p className="text-muted-foreground">You're crushing it! Keep up the momentum and reach your goals.</p>
        </div>
        <SocialProof variant="inline" />
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-muted">
        <Button
          variant={activeTab === "overview" ? "default" : "ghost"}
          onClick={() => setActiveTab("overview")}
          className="rounded-b-none"
        >
          Overview
        </Button>
        <Button
          variant={activeTab === "social" ? "default" : "ghost"}
          onClick={() => setActiveTab("social")}
          className="rounded-b-none"
        >
          Social
        </Button>
        <Button
          variant={activeTab === "achievements" ? "default" : "ghost"}
          onClick={() => setActiveTab("achievements")}
          className="rounded-b-none"
        >
          Achievements
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl font-bold">Active Challenges</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2 bg-muted/50 hover:bg-muted border-muted-foreground/20 hover:border-muted-foreground/40 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Join New
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeChallenges.map((challenge) => (
                      <div key={challenge.id} className="space-y-4">
                        <ChallengeCard challenge={challenge} />
                        {challenge.proofRequirements && <VerificationTrigger challenge={challenge} variant="card" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <ActivityFeed activities={activities} />
            </div>
            <div className="space-y-6">
              <StreakCounter currentStreak={user.currentStreak} longestStreak={user.longestStreak} streakType="daily" />
              <AchievementShowcase variant="compact" />
              <UpcomingDeadlines deadlines={deadlines} />
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Zap className="w-4 h-4 mr-2" />
                    Browse Challenges
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Trophy className="w-4 h-4 mr-2" />
                    View Achievements
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Wallet className="w-4 h-4 mr-2" />
                    Add Credits
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {activeTab === "social" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Leaderboard timeframe="weekly" />
            <SocialProof showActivity={true} showStats={false} showTestimonials={false} />
          </div>
          <div className="space-y-6">
            <FriendActivity />
            <SocialProof showActivity={false} showStats={true} showTestimonials={true} />
          </div>
        </div>
      )}

      {activeTab === "achievements" && (
        <div className="space-y-6">
          <AchievementShowcase variant="grid" showProgress={true} showSharing={true} />
        </div>
      )}
    </div>
  )
}
