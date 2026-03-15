"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getProxiedAvatarUrl } from "@/lib/utils"
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Award } from "lucide-react"

interface LeaderboardUser {
  id: string
  name: string
  avatar?: string
  score: number
  rank: number
  previousRank?: number
  streak: number
  completedChallenges: number
  totalEarnings: number
  badge?: "gold" | "silver" | "bronze"
}

interface LeaderboardProps {
  timeframe?: "daily" | "weekly" | "monthly" | "all-time"
  category?: "overall" | "earnings" | "streaks" | "completions"
  showCurrentUser?: boolean
}

// Real leaderboard data from API

export function Leaderboard({ timeframe = "weekly", category = "overall", showCurrentUser = true }: LeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([])
  const [currentUserData, setCurrentUserData] = useState<LeaderboardUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch leaderboard data from API
  const fetchLeaderboardData = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/social/leaderboard?timeframe=${timeframe}&category=${category}&limit=50`)
      const data = await response.json()
      
      if (data.success) {
        setLeaderboardData(data.data.leaderboard)
        setCurrentUserData(data.data.currentUser)
      } else {
        console.error('Failed to fetch leaderboard:', data.error)
      }
    } catch (error) {
      console.error('Leaderboard fetch error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [timeframe, category])

  // Load data when filters change
  useEffect(() => {
    fetchLeaderboardData()
  }, [fetchLeaderboardData])

  const getRankIcon = (rank: number, badge?: string) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />
    return (
      <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>
    )
  }

  const getTrendIcon = (rank: number, previousRank?: number) => {
    if (!previousRank) return <Minus className="w-4 h-4 text-muted-foreground" />
    if (rank < previousRank) return <TrendingUp className="w-4 h-4 text-success" />
    if (rank > previousRank) return <TrendingDown className="w-4 h-4 text-destructive" />
    return <Minus className="w-4 h-4 text-muted-foreground" />
  }

  const getScoreLabel = () => {
    switch (category) {
      case "earnings":
        return "Earned"
      case "streaks":
        return "Streak"
      case "completions":
        return "Completed"
      default:
        return "Points"
    }
  }

  const formatScore = (user: LeaderboardUser) => {
    // Score is already formatted by the API
    return user.score.toString()
  }

  const topUsers = leaderboardData.slice(0, 5)
  const currentUser = currentUserData

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Leaderboard
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {timeframe}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {topUsers.slice(0, 3).map((user, index) => (
            <div
              key={user.id}
              className={`text-center ${index === 0 ? "order-2" : index === 1 ? "order-1" : "order-3"}`}
            >
              <div className={`relative ${index === 0 ? "scale-110" : ""}`}>
                <Avatar className={`mx-auto mb-2 ${index === 0 ? "w-16 h-16" : "w-12 h-12"}`}>
                  <AvatarImage src={getProxiedAvatarUrl(user.avatar)} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-2 -right-2">{getRankIcon(user.rank, user.badge)}</div>
              </div>
              <p className={`font-medium ${index === 0 ? "text-base" : "text-sm"}`}>{user.name}</p>
              <p className={`text-primary font-bold ${index === 0 ? "text-lg" : "text-sm"}`}>{formatScore(user)}</p>
            </div>
          ))}
        </div>

        {/* Rest of leaderboard */}
        <div className="space-y-3">
          {topUsers.slice(3).map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2 w-8">
                  {getRankIcon(user.rank)}
                  {getTrendIcon(user.rank, user.previousRank)}
                </div>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={getProxiedAvatarUrl(user.avatar)} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.completedChallenges} challenges • {user.streak} day streak
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">{formatScore(user)}</p>
                <p className="text-xs text-muted-foreground">{getScoreLabel()}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Current User Position */}
        {showCurrentUser && currentUser && currentUser.rank > 5 && (
          <div className="pt-4 border-t border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2 w-8">
                  {getRankIcon(currentUser.rank)}
                  {getTrendIcon(currentUser.rank, currentUser.previousRank)}
                </div>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={getProxiedAvatarUrl(currentUser.avatar)} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {currentUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {currentUser.completedChallenges} challenges • {currentUser.streak} day streak
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">{formatScore(currentUser)}</p>
                <p className="text-xs text-muted-foreground">{getScoreLabel()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="pt-4 border-t border-slate-200 dark:border-white/10">
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Climb the ranks!</p>
                <p className="text-xs text-muted-foreground">Complete more challenges to move up</p>
              </div>
              <Button size="sm" variant="outline" className="bg-transparent">
                Join Challenge
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
