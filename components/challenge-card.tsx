"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  Users,
  Zap,
  Book,
  Brain,
  Dumbbell,
  Smartphone,
  Heart,
  Briefcase,
  Flag,
  Target,
  Check,
  Eye,
  MessageCircle,
  Share2,
  Bookmark,
  BookmarkCheck,
} from "lucide-react"

interface ChallengeCardProps {
  id: string
  title: string
  description: string
  category: string
  duration: string
  participants: number
  minStake: number
  maxStake: number
  difficulty: "Easy" | "Medium" | "Hard"
  progress?: number
  isJoined?: boolean
  isActive?: boolean
  likes?: number
  comments?: number
  isLiked?: boolean
  isSaved?: boolean
  challenge?: any // For backward compatibility
}

export function ChallengeCard({
  id,
  title,
  description,
  category,
  duration,
  participants,
  minStake,
  maxStake,
  difficulty,
  progress,
  isJoined = false,
  isActive = false,
  likes = Math.floor(Math.random() * 50) + 5,
  comments = Math.floor(Math.random() * 20) + 2,
  isLiked = false,
  isSaved = false,
  challenge, // For backward compatibility
}: ChallengeCardProps) {
  // Use challenge prop if provided (for backward compatibility)
  const challengeData = challenge || {
    id,
    title,
    description,
    category,
    duration,
    participants,
    minStake,
    maxStake,
    difficulty,
    progress,
    isJoined,
    isActive,
  }

  const [stakeAmount, setStakeAmount] = useState(challengeData.minStake || minStake)
  const [liked, setLiked] = useState(isLiked)
  const [likeCount, setLikeCount] = useState(likes)
  const [saved, setSaved] = useState(isSaved)

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setLiked(!liked)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))

    // Here you would make an API call to like/unlike
    console.log(`${liked ? "Unliked" : "Liked"} challenge: ${challengeData.title || title}`)
  }

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setSaved(!saved)

    // Here you would make an API call to save/unsave
    console.log(`${saved ? "Unsaved" : "Saved"} challenge: ${challengeData.title || title}`)
  }

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Copy challenge link to clipboard
    navigator.clipboard.writeText(`https://stakr.app/challenge/${challengeData.id || id}`)
    console.log(`Shared challenge: ${challengeData.title || title}`)
  }

  const getDifficultyColor = (diff: string) => {
    if (!diff) return "bg-muted text-foreground border-muted"

    switch (diff) {
      case "Easy":
        return "bg-success/10 text-success border-success/20"
      case "Medium":
        return "bg-primary/10 text-primary border-primary/20"
      case "Hard":
        return "bg-destructive/10 text-destructive border-destructive/20"
      default:
        return "bg-muted text-foreground border-muted"
    }
  }

  const getCategoryIcon = (cat: string) => {
    const iconClass = "w-3 h-3"

    if (!cat || typeof cat !== "string") {
      return <Target className={iconClass} />
    }

    switch (cat.toLowerCase()) {
      case "mindfulness":
        return <Brain className={iconClass} />
      case "fitness":
        return <Dumbbell className={iconClass} />
      case "learning":
        return <Book className={iconClass} />
      case "digital wellness":
        return <Smartphone className={iconClass} />
      case "wellness":
        return <Heart className={iconClass} />
      case "productivity":
        return <Briefcase className={iconClass} />
      default:
        return <Target className={iconClass} />
    }
  }

  const renderProgressIndicator = () => {
    const currentProgress = challengeData.progress || progress
    const joined = challengeData.isJoined || isJoined

    if (!joined || typeof currentProgress !== "number") return null

    const progressPercentage = Math.min(currentProgress, 100)
    const isCompleted = currentProgress >= 100
    const active = challengeData.isActive || isActive

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Progress</span>
            {isCompleted && <Flag className="w-4 h-4 text-success" />}
          </div>
          <span className={`font-bold ${isCompleted ? "text-success" : "text-primary"}`}>{currentProgress}%</span>
        </div>

        {/* Custom Progress Bar with Glow Effect */}
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                isCompleted
                  ? "bg-success shadow-lg shadow-success/30"
                  : active
                    ? "bg-primary shadow-lg shadow-primary/30 animate-pulse-glow"
                    : "bg-primary"
              }`}
              style={{
                width: `${progressPercentage}%`,
                animation: "progressGrow 1.5s ease-out",
              }}
            />
          </div>

          {/* Milestone Dots */}
          <div className="absolute top-0 left-0 w-full h-3 flex items-center justify-between px-1">
            {[25, 50, 75].map((milestone) => (
              <div
                key={milestone}
                className={`w-2 h-2 rounded-full border-2 ${
                  currentProgress >= milestone ? "bg-white border-primary" : "bg-gray-200 border-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Streak Indicator for Active Challenges */}
        {active && (
          <div className="flex items-center gap-1 text-xs text-primary">
            <Zap className="w-3 h-3" />
            <span className="font-medium">Active streak!</span>
          </div>
        )}
      </div>
    )
  }

  const currentProgress = challengeData.progress || progress
  const isCompleted = currentProgress === 100
  const joined = challengeData.isJoined || isJoined
  const active = challengeData.isActive || isActive
  const challengeCategory = challengeData.category || category || "General"
  const challengeDifficulty = challengeData.difficulty || difficulty || "Medium"

  return (
    <Link href={`/challenge/${challengeData.id || id}`}>
      <Card
        className={`
          w-full max-w-sm transition-all duration-300 
          hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 
          relative cursor-pointer touch-manipulation
          ${active ? "ring-2 ring-primary shadow-lg" : "hover:shadow-lg"}
          ${joined && !active ? "opacity-90" : ""}
        `}
      >
        {/* Difficulty Corner Badge */}
        <div className="absolute top-3 right-3 z-10">
          <Badge className={`text-xs font-bold border ${getDifficultyColor(challengeDifficulty)}`}>
            {challengeDifficulty}
          </Badge>
        </div>

        {/* Save Button - Mobile optimized */}
        <div className="absolute top-3 left-3 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className={`
              p-2 h-10 w-10 rounded-full touch-manipulation
              ${saved ? "text-primary bg-primary/10" : "text-muted-foreground bg-background/80"}
              hover:bg-primary/20 active:scale-95
            `}
          >
            {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </Button>
        </div>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Header with proper spacing for badges */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              {/* Already Joined Indicator - moved to content area */}
              {joined && !active && (
                <Badge
                  variant="outline"
                  className="text-xs font-bold bg-success/10 text-success border-success/30 w-fit"
                >
                  ✓ JOINED
                </Badge>
              )}
              {/* Category Badge */}
              <Badge
                variant="secondary"
                className="text-xs font-bold flex items-center gap-1 bg-secondary/10 text-secondary border-secondary/20 w-fit"
              >
                {getCategoryIcon(challengeCategory)}
                {challengeCategory.toUpperCase()}
              </Badge>
            </div>
            {/* Space for difficulty badge */}
            <div className="w-16"></div>
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h3 className="font-bold text-lg leading-tight">{challengeData.title || title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{challengeData.description || description}</p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{challengeData.duration || duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{challengeData.participants || participants}</span>
            </div>
          </div>

          {/* Progress (if joined) */}
          {renderProgressIndicator()}

          {/* Stake Section */}
          {!joined && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm">STAKE TO JOIN</span>
              </div>

              {/* Improved Stake Amount Display */}
              <div className="space-y-3">
                <div className="text-center space-y-1">
                  <div className="text-xs text-muted-foreground">You're staking</div>
                  <div className="text-3xl font-bold text-primary">${stakeAmount}</div>
                  <div className="text-xs text-muted-foreground">
                    of ${challengeData.minStake || minStake}–${challengeData.maxStake || maxStake} range
                  </div>
                </div>

                <input
                  type="range"
                  min={challengeData.minStake || minStake}
                  max={challengeData.maxStake || maxStake}
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #F46036 0%, #F46036 ${((stakeAmount - (challengeData.minStake || minStake)) / ((challengeData.maxStake || maxStake) - (challengeData.minStake || minStake))) * 100}%, #e5e5e5 ${((stakeAmount - (challengeData.minStake || minStake)) / ((challengeData.maxStake || maxStake) - (challengeData.minStake || minStake))) * 100}%, #e5e5e5 100%)`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Social Actions - Mobile optimized */}
          <div className="flex items-center justify-between pt-2 border-t border-muted">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`
                  flex items-center gap-1 min-h-[44px] px-3 touch-manipulation
                  ${liked ? "text-red-500" : "text-muted-foreground"}
                  active:scale-95
                `}
              >
                <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                {likeCount}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-1 min-h-[44px] px-3 touch-manipulation text-muted-foreground active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                {comments}
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleShare} 
              className="min-h-[44px] px-3 touch-manipulation text-muted-foreground active:scale-95"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Action Button - Mobile optimized */}
          {joined ? (
            isCompleted ? (
              <Button
                className="
                  w-full font-bold text-sm py-4 min-h-[48px] 
                  bg-success hover:bg-success/90 text-white 
                  cursor-default relative overflow-hidden touch-manipulation
                "
                size="lg"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 animate-bounce" />
                  You did it! 🎉
                </div>
              </Button>
            ) : (
              <Button
                variant="outline"
                className="
                  w-full font-bold text-sm py-4 min-h-[48px]
                  border-2 border-success text-success 
                  hover:bg-success/10 hover:border-success hover:text-success 
                  transition-all bg-transparent cursor-pointer 
                  active:scale-95 group relative overflow-hidden touch-manipulation
                "
                size="lg"
              >
                <div className="flex items-center gap-2 relative z-10">
                  <Eye className="w-4 h-4 group-hover:animate-pulse" />
                  JOINED – VIEW
                </div>
                <div className="absolute inset-0 bg-success/5 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300" />
              </Button>
            )
          ) : (
            <Button
              className="
                w-full font-bold text-sm py-4 min-h-[48px]
                bg-primary hover:bg-primary/90 text-white 
                shadow-lg hover:shadow-xl transition-all 
                cursor-pointer active:scale-95 touch-manipulation
              "
              size="lg"
            >
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                VIEW DETAILS
              </div>
            </Button>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
