"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Trophy, Star, Zap, Target, Crown, Medal, Share2, Lock } from "lucide-react"

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  rarity: "common" | "rare" | "epic" | "legendary"
  progress?: number
  maxProgress?: number
  unlocked: boolean
  unlockedAt?: string
  category: "streaks" | "earnings" | "social" | "challenges" | "special"
}

interface AchievementShowcaseProps {
  variant?: "grid" | "compact" | "carousel"
  showProgress?: boolean
  showSharing?: boolean
  category?: string
}

const mockAchievements: Achievement[] = [
  {
    id: "first-challenge",
    title: "First Steps",
    description: "Complete your first challenge",
    icon: <Target className="w-6 h-6" />,
    rarity: "common",
    unlocked: true,
    unlockedAt: "2 weeks ago",
    category: "challenges",
  },
  {
    id: "week-warrior",
    title: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: <Zap className="w-6 h-6" />,
    rarity: "rare",
    unlocked: true,
    unlockedAt: "1 week ago",
    category: "streaks",
  },
  {
    id: "money-maker",
    title: "Money Maker",
    description: "Earn $100 from challenges",
    icon: <Trophy className="w-6 h-6" />,
    rarity: "epic",
    progress: 85,
    maxProgress: 100,
    unlocked: false,
    category: "earnings",
  },
  {
    id: "social-butterfly",
    title: "Social Butterfly",
    description: "Invite 5 friends to join",
    icon: <Star className="w-6 h-6" />,
    rarity: "rare",
    progress: 3,
    maxProgress: 5,
    unlocked: false,
    category: "social",
  },
  {
    id: "legend",
    title: "Legend",
    description: "Complete 50 challenges",
    icon: <Crown className="w-6 h-6" />,
    rarity: "legendary",
    progress: 12,
    maxProgress: 50,
    unlocked: false,
    category: "challenges",
  },
  {
    id: "perfectionist",
    title: "Perfectionist",
    description: "100% success rate with 10+ challenges",
    icon: <Medal className="w-6 h-6" />,
    rarity: "epic",
    progress: 6,
    maxProgress: 10,
    unlocked: false,
    category: "special",
  },
]

export function AchievementShowcase({
  variant = "grid",
  showProgress = false,
  showSharing = false,
  category,
}: AchievementShowcaseProps) {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-500/10 border-gray-500/20 text-gray-600"
      case "rare":
        return "bg-blue-500/10 border-blue-500/20 text-blue-600"
      case "epic":
        return "bg-purple-500/10 border-purple-500/20 text-purple-600"
      case "legendary":
        return "bg-yellow-500/10 border-yellow-500/20 text-yellow-600"
      default:
        return "bg-muted border-muted-foreground/20"
    }
  }

  const getRarityGlow = (rarity: string, unlocked: boolean) => {
    if (!unlocked) return ""
    switch (rarity) {
      case "epic":
        return "shadow-lg shadow-purple-500/20"
      case "legendary":
        return "shadow-lg shadow-yellow-500/20 animate-pulse"
      default:
        return ""
    }
  }

  const filteredAchievements = category ? mockAchievements.filter((a) => a.category === category) : mockAchievements

  const unlockedCount = filteredAchievements.filter((a) => a.unlocked).length
  const totalCount = filteredAchievements.length

  if (variant === "compact") {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Achievements
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {unlockedCount}/{totalCount}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex -space-x-2">
            {filteredAchievements.slice(0, 5).map((achievement) => (
              <div
                key={achievement.id}
                className={`relative w-12 h-12 rounded-full border-2 border-background flex items-center justify-center ${
                  achievement.unlocked ? getRarityColor(achievement.rarity) : "bg-muted border-muted-foreground/20"
                } ${getRarityGlow(achievement.rarity, achievement.unlocked)}`}
              >
                {achievement.unlocked ? (
                  <div className="text-current">{achievement.icon}</div>
                ) : (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round((unlockedCount / totalCount) * 100)}%</span>
            </div>
            <Progress value={(unlockedCount / totalCount) * 100} className="h-2" />
          </div>
          <Button variant="outline" size="sm" className="w-full bg-transparent">
            View All Achievements
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            Achievements
          </h2>
          <p className="text-muted-foreground">
            {unlockedCount} of {totalCount} unlocked • {Math.round((unlockedCount / totalCount) * 100)}% complete
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {unlockedCount}/{totalCount}
          </Badge>
          {showSharing && (
            <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
              <Share2 className="w-4 h-4" />
              Share Progress
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={(unlockedCount / totalCount) * 100} className="h-3" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Beginner</span>
          <span>Expert</span>
          <span>Master</span>
          <span>Legend</span>
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => (
          <Card
            key={achievement.id}
            className={`relative overflow-hidden transition-all hover:scale-105 ${
              achievement.unlocked ? "cursor-pointer" : "opacity-60"
            } ${getRarityGlow(achievement.rarity, achievement.unlocked)}`}
          >
            <CardContent className="p-6 space-y-4">
              {/* Achievement Icon */}
              <div className="flex items-center justify-between">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    achievement.unlocked
                      ? getRarityColor(achievement.rarity)
                      : "bg-muted border border-muted-foreground/20"
                  }`}
                >
                  {achievement.unlocked ? (
                    <div className="text-current">{achievement.icon}</div>
                  ) : (
                    <Lock className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <Badge variant="outline" className={`text-xs ${getRarityColor(achievement.rarity)}`}>
                  {achievement.rarity}
                </Badge>
              </div>

              {/* Achievement Info */}
              <div className="space-y-2">
                <h3 className="font-bold text-lg">{achievement.title}</h3>
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
              </div>

              {/* Progress */}
              {showProgress && achievement.progress !== undefined && achievement.maxProgress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {achievement.progress}/{achievement.maxProgress}
                    </span>
                  </div>
                  <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-2" />
                </div>
              )}

              {/* Unlock Date */}
              {achievement.unlocked && achievement.unlockedAt && (
                <div className="text-xs text-muted-foreground">Unlocked {achievement.unlockedAt}</div>
              )}

              {/* Share Button */}
              {showSharing && achievement.unlocked && (
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Achievement
                </Button>
              )}
            </CardContent>

            {/* Rarity Glow Effect */}
            {achievement.unlocked && achievement.rarity === "legendary" && (
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 pointer-events-none" />
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
