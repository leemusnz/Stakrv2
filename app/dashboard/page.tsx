"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { DashboardMobile } from "@/components/dashboard-mobile"
import { MobileContainer } from "@/components/mobile-container"
import { LoadingScreen } from "@/components/loading-screen"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useApi } from "@/hooks/use-api"
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
  Shield,
  Clock
} from 'lucide-react'
import { FloatingAmbientGlows } from '@/components/floating-ambient-glows'

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
    xp: number
    level: number
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
  
  // Use the new useApi hook for automatic loading states and error handling
  // Note: The API returns { success: true, dashboard: {...} }
  // but apiCall extracts just the data, so we get { dashboard: {...} }
  const { 
    data: apiResponse, 
    loading, 
    error, 
    execute: loadDashboardData 
  } = useApi<{ dashboard: DashboardData }>(
    '/api/user/dashboard',
    {
      showSuccessToast: false, // Don't show toast on page load
      showErrorToast: true, // Show error toast automatically
    }
  )
  
  // Extract dashboard data from nested response structure
  const dashboardData = (apiResponse as any)?.dashboard || null

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
      loadDashboardData().catch(console.error)
    } else {
      // If not authenticated, redirect to alpha gate
      console.log('🔒 No session, redirecting to alpha gate...')
      router.push('/alpha-gate')
      return
    }
  }, [session, status, router])

  // loadDashboardData is now provided by useApi hook

  // Show loading while checking session/loading data
  if (status === "loading" || loading) {
    return (
      <LoadingScreen message="Loading your dashboard..." />
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-destructive">Error Loading Dashboard</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => loadDashboardData().catch(console.error)}>
            Try Again
          </Button>
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

      <div className="relative z-10 container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="w-20 h-20 border-2 border-[#F46036]/30 shadow-lg shadow-orange-500/20">
                <AvatarImage src={avatarUrl || '/placeholder.svg'} />
                <AvatarFallback className="text-2xl font-heading font-bold bg-gradient-to-br from-[#F46036] to-[#D74E25] text-white">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-[#F46036] to-[#D74E25] rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                {user.level}
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F46036] to-[#D74E25]">{user.name.split(' ')[0]}</span>
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg font-body mt-1">
                Level {user.level} • {user.challengesCompleted} Challenges Conquered
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {notifications.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/notifications')}
                className="bg-white/50 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-400 hover:bg-white dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white backdrop-blur-sm"
              >
                <Bell className="w-4 h-4 mr-2" />
                {notifications.length}
              </Button>
            )}
            <Button onClick={() => router.push('/my-active')} className="bg-gradient-to-r from-[#F46036] to-[#D74E25] hover:from-[#ff724c] hover:to-[#e85a30] text-white font-heading font-bold shadow-lg shadow-orange-500/20">
              <Trophy className="w-4 h-4 mr-2" />
              My Active
            </Button>
          </div>
        </div>

      {/* Stats Overview - Dark Glass HUD */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Balance Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
          <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-xl dark:shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative flex items-center justify-between mb-4">
              <span className="text-sm font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Balance</span>
              <div className="w-10 h-10 bg-gradient-to-br from-[#F46036]/20 to-[#D74E25]/20 backdrop-blur-sm border border-[#F46036]/20 rounded-xl flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#F46036]" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-slate-900 dark:text-white tracking-tight mb-2">${stats.currentBalance.toFixed(2)}</div>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-body">
              <span className="text-green-500 dark:text-green-400">+${stats.totalEarnings.toFixed(2)}</span> total earned
            </p>
          </div>
        </div>

        {/* Trust Score Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
          <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-xl dark:shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative flex items-center justify-between mb-4">
              <span className="text-sm font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Trust Score</span>
              <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center">
                <Shield className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-slate-900 dark:text-white tracking-tight mb-3">{user.trustScore}<span className="text-xl text-slate-500 dark:text-slate-400">/100</span></div>
            <div className="relative h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-full transition-all duration-500"
                style={{ width: `${user.trustScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Streak Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
          <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-xl dark:shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative flex items-center justify-between mb-4">
              <span className="text-sm font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Streak</span>
              <div className="w-10 h-10 bg-gradient-to-br from-[#F46036]/20 to-[#D74E25]/20 backdrop-blur-sm border border-[#F46036]/20 rounded-xl flex items-center justify-center">
                <Trophy className="h-5 w-5 text-[#F46036]" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-slate-900 dark:text-white tracking-tight mb-2">{user.currentStreak}<span className="text-xl text-slate-500 dark:text-slate-400"> days</span></div>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-body">
              Best: <span className="text-slate-900 dark:text-white font-medium">{user.longestStreak} days</span>
            </p>
          </div>
        </div>

        {/* XP Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
          <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-xl dark:shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative flex items-center justify-between mb-4">
              <span className="text-sm font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Experience</span>
              <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-slate-900 dark:text-white tracking-tight mb-3">{user.xp.toLocaleString()}<span className="text-xl text-slate-500 dark:text-slate-400"> XP</span></div>
            <div className="space-y-2">
              <div className="relative h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-full transition-all duration-500"
                  style={{ width: `${((user.xp % 200) / 200) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-body">
                {200 - (user.xp % 200)} XP to Level {user.level + 1}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Challenges - Themed Glass HUD */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-2xl opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500"></div>
        <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">Active Challenges</h2>
                <p className="text-slate-600 dark:text-slate-400 font-body mt-1">
                  {stats.activeChallengesCount} challenge{stats.activeChallengesCount !== 1 ? 's' : ''} in progress
                </p>
              </div>
              <Button variant="outline" onClick={() => router.push('/my-challenges')} className="bg-white/50 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-400 hover:bg-white dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white backdrop-blur-sm">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
          <div className="p-6">
            {activeChallenges.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-2">No Active Challenges</h3>
                <p className="text-slate-600 dark:text-slate-400 font-body mb-6 max-w-md mx-auto">
                  Start a new challenge to begin building better habits and earning rewards!
                </p>
                <Button onClick={() => router.push('/discover')} className="bg-gradient-to-r from-[#F46036] to-[#D74E25] hover:from-[#ff724c] hover:to-[#e85a30] text-white font-heading font-bold shadow-lg shadow-orange-500/20">
                  Browse Challenges
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeChallenges.map((challenge) => (
                  <div key={challenge.id} className="relative group/item">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-xl opacity-0 group-hover/item:opacity-10 blur transition-opacity duration-300"></div>
                    <div className="relative flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#F46036]/20 to-[#D74E25]/20 backdrop-blur-sm border border-[#F46036]/20 rounded-xl flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-[#F46036]" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-heading font-bold text-slate-900 dark:text-white mb-1">{challenge.title}</h4>
                          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 font-body">
                            <span className="px-2 py-0.5 bg-slate-200 dark:bg-white/10 rounded text-xs font-medium">{challenge.category}</span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {challenge.stakeAmount}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {challenge.daysRemaining}d left
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {challenge.proofSubmitted ? (
                          <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-lg text-green-600 dark:text-green-300 text-xs font-medium">
                            Proof Submitted
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-[#F46036]/20 border border-[#F46036]/30 rounded-lg text-[#F46036] text-xs font-medium">
                            In Progress
                          </span>
                        )}
                        <Button variant="outline" size="sm" onClick={() => router.push(`/challenge/${challenge.id}`)} className="bg-white/50 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-400 hover:bg-white dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white">
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity - Themed Glass HUD */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Completions */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-2xl opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500"></div>
          <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-white/10">
              <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">Recent Completions</h2>
              <p className="text-slate-600 dark:text-slate-400 font-body text-sm mt-1">Your latest successful challenges</p>
            </div>
            <div className="p-6">
              {completedChallenges.length === 0 ? (
                <p className="text-center text-slate-600 dark:text-slate-400 font-body py-8">
                  No completed challenges yet
                </p>
              ) : (
                <div className="space-y-3">
                  {completedChallenges.slice(0, 5).map((challenge) => (
                    <div key={challenge.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300">
                      <div>
                        <p className="font-heading font-medium text-slate-900 dark:text-white">{challenge.title}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-body mt-0.5">
                          {new Date(challenge.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-heading font-bold text-green-600 dark:text-green-400 mb-1">
                          +${challenge.rewardEarned.toFixed(2)}
                        </p>
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-white/10 rounded text-xs font-medium text-slate-700 dark:text-slate-400">
                          {challenge.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Status */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-2xl opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500"></div>
          <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-white/10">
              <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">Account Status</h2>
              <p className="text-slate-600 dark:text-slate-400 font-body text-sm mt-1">Your verification and membership details</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl">
                <span className="text-slate-700 dark:text-slate-400 font-body">Verification Tier</span>
                <span className={`px-3 py-1 rounded-lg text-sm font-heading font-bold ${
                  user.verificationTier === 'gold' 
                    ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 text-yellow-600 dark:text-yellow-300' 
                    : 'bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/20 text-slate-700 dark:text-slate-400'
                }`}>
                  {user.verificationTier.charAt(0).toUpperCase() + user.verificationTier.slice(1)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl">
                <span className="text-slate-700 dark:text-slate-400 font-body">Membership</span>
                <span className={`px-3 py-1 rounded-lg text-sm font-heading font-bold ${
                  user.premiumSubscription 
                    ? 'bg-gradient-to-r from-[#F46036]/20 to-[#D74E25]/20 border border-[#F46036]/30 text-[#F46036]' 
                    : 'bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/20 text-slate-700 dark:text-slate-400'
                }`}>
                  {user.premiumSubscription ? 'Premium' : 'Free'}
                </span>
              </div>
              <div className="h-px bg-slate-200 dark:bg-white/10"></div>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-slate-50 dark:bg-white/5 backdrop-blur-sm rounded-xl">
                  <span className="text-slate-600 dark:text-slate-400 font-body">Active Stakes</span>
                  <span className="text-slate-900 dark:text-white font-heading font-bold">${stats.activeStakes.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 dark:bg-white/5 backdrop-blur-sm rounded-xl">
                  <span className="text-slate-600 dark:text-slate-400 font-body">Total Earnings</span>
                  <span className="text-green-600 dark:text-green-400 font-heading font-bold">+${stats.totalEarnings.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 dark:bg-white/5 backdrop-blur-sm rounded-xl">
                  <span className="text-slate-600 dark:text-slate-400 font-body">Success Rate</span>
                  <span className="text-slate-900 dark:text-white font-heading font-bold">{stats.successRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
