"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSwipeGesture, useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { DiscoverySwipeIndicators } from "@/components/ui/swipe-indicators"
import { cn } from "@/lib/utils"
import {
  Calendar,
  Users,
  DollarSign,
  Trophy,
  Clock,
  Star,
  Heart,
  X,
  Bookmark,
  ArrowRight
} from "lucide-react"

interface SwipeableChallengeCardProps {
  challenge: any
  onLike: (challenge: any) => void
  onPass: (challenge: any) => void
  onBookmark: (challenge: any) => void
  onJoin: (challenge: any) => void
  className?: string
  style?: React.CSSProperties
}

export function SwipeableChallengeCard({
  challenge,
  onLike,
  onPass,
  onBookmark,
  onJoin,
  className,
  style
}: SwipeableChallengeCardProps) {
  const { isMobile } = useEnhancedMobile()
  const { swipeDirection, onTouchStart, onTouchEnd, onTouchMove } = useSwipeGesture(80, 400)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (!swipeDirection) return

    const { direction, distance } = swipeDirection
    
    if (distance > 100) {
      setIsAnimating(true)
      
      switch (direction) {
        case 'right':
          onLike(challenge)
          break
        case 'left':
          onPass(challenge)
          break
        case 'up':
          onBookmark(challenge)
          break
      }

      // Reset animation state after action
      setTimeout(() => setIsAnimating(false), 300)
    }
  }, [swipeDirection, challenge, onLike, onPass, onBookmark])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatStakeRange = (minStake: number, maxStake: number) => {
    if (minStake === maxStake) return `$${minStake}`
    return `$${minStake} - $${maxStake}`
  }

  if (!isMobile) {
    // Desktop version - regular challenge card
    return (
      <Card className={cn("h-full hover:shadow-lg transition-shadow", className)} style={style}>
        <CardContent className="p-6 h-full flex flex-col">
          {/* Challenge Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
                {challenge.title}
              </h3>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className={getDifficultyColor(challenge.difficulty)}>
                  {challenge.difficulty}
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {challenge.category}
                </Badge>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-muted-foreground mb-4 line-clamp-3 flex-1">
            {challenge.description}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{challenge.duration}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{challenge.participants_count || 0} joined</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span>{formatStakeRange(challenge.min_stake, challenge.max_stake)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-muted-foreground" />
              <span>${challenge.total_stake_pool || 0} pool</span>
            </div>
          </div>

          {/* Host Info */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-8 h-8">
              <AvatarImage src={challenge.host_avatar_url} />
              <AvatarFallback>{challenge.host_name?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{challenge.host_name}</p>
              <p className="text-xs text-muted-foreground">Challenge Host</p>
            </div>
          </div>

          {/* Action Button */}
          <Button onClick={() => onJoin(challenge)} className="w-full">
            Join Challenge
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Mobile version - swipeable card
  return (
    <div 
      className={cn(
        "relative w-full h-[500px] touch-manipulation select-none",
        isAnimating && "pointer-events-none",
        className
      )}
      style={style}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchMove}
    >
      <Card className="w-full h-full shadow-xl border-2">
        <CardContent className="p-6 h-full flex flex-col relative overflow-hidden">
          {/* Swipe Indicators */}
          {swipeDirection && (
            <DiscoverySwipeIndicators 
              direction={swipeDirection.direction} 
              distance={swipeDirection.distance} 
            />
          )}

          {/* Challenge Header */}
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-foreground mb-3 line-clamp-2">
              {challenge.title}
            </h2>
            <div className="flex justify-center gap-2 mb-3">
              <Badge variant="outline" className={getDifficultyColor(challenge.difficulty)}>
                {challenge.difficulty}
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {challenge.category}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <div className="flex-1 flex flex-col justify-center mb-6">
            <p className="text-lg text-center text-muted-foreground line-clamp-4 leading-relaxed">
              {challenge.description}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-sm font-medium">{challenge.duration}</p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-sm font-medium">{challenge.participants_count || 0}</p>
              <p className="text-xs text-muted-foreground">Participants</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <DollarSign className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-sm font-medium">{formatStakeRange(challenge.min_stake, challenge.max_stake)}</p>
              <p className="text-xs text-muted-foreground">Stake Range</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <Trophy className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-sm font-medium">${challenge.total_stake_pool || 0}</p>
              <p className="text-xs text-muted-foreground">Prize Pool</p>
            </div>
          </div>

          {/* Host Info */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <Avatar className="w-10 h-10">
              <AvatarImage src={challenge.host_avatar_url} />
              <AvatarFallback>{challenge.host_name?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="font-medium">{challenge.host_name}</p>
              <p className="text-sm text-muted-foreground">Challenge Host</p>
            </div>
          </div>

          {/* Mobile Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => onPass(challenge)}
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            >
              <X className="w-5 h-5 mr-2" />
              Pass
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onBookmark(challenge)}
              className="border-blue-200 text-blue-600 hover:bg-blue-50 px-4"
            >
              <Bookmark className="w-5 h-5" />
            </Button>
            <Button
              size="lg"
              onClick={() => onLike(challenge)}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              <Heart className="w-5 h-5 mr-2" />
              Join
            </Button>
          </div>

          {/* Swipe Hint */}
          <div className="text-center mt-4">
            <p className="text-xs text-muted-foreground">
              💡 Swipe right to join • Swipe left to pass • Swipe up to bookmark
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
