"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSwipeGesture, useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { SocialSwipeIndicators } from "@/components/ui/swipe-indicators"
import { cn } from "@/lib/utils"
import {
  Heart,
  MessageCircle,
  Share2,
  Trophy,
  Zap,
  Target,
  Users,
  TrendingUp,
  Clock,
  UserPlus,
  UserCheck,
  MoreHorizontal
} from "lucide-react"

interface FeedItem {
  id: string
  type: "achievement" | "challenge_completion" | "challenge_join" | "streak_milestone" | "friend_activity" | "challenge_created"
  user: {
    id: string
    name: string
    avatar?: string
    verified?: boolean
    isFollowing?: boolean
  }
  timestamp: string
  content: {
    title: string
    description?: string
    challenge?: string
    amount?: number
    streak?: number
    participants?: number
    image?: string
  }
  engagement: {
    likes: number
    comments: number
    shares: number
    liked?: boolean
  }
  trending?: boolean
}

interface SwipeableFeedItemProps {
  post: FeedItem
  onLike: (postId: string) => void
  onComment: (postId: string) => void
  onShare: (postId: string) => void
  onFollow: (userId: string) => void
  className?: string
}

export function SwipeableFeedItem({
  post,
  onLike,
  onComment,
  onShare,
  onFollow,
  className
}: SwipeableFeedItemProps) {
  const { isMobile } = useEnhancedMobile()
  const { swipeDirection, onTouchStart, onTouchEnd, onTouchMove } = useSwipeGesture(60, 400)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [actionFeedback, setActionFeedback] = useState<'like' | 'comment' | null>(null)

  useEffect(() => {
    if (!swipeDirection || !isMobile) return

    const { direction, distance } = swipeDirection
    
    if (distance > 80) {
      setIsAnimating(true)
      
      if (direction === 'right') {
        setActionFeedback('like')
        setTimeout(() => {
          onLike(post.id)
          setActionFeedback(null)
          setIsAnimating(false)
        }, 200)
      } else if (direction === 'left') {
        setActionFeedback('comment')
        setTimeout(() => {
          onComment(post.id)
          setActionFeedback(null)
          setIsAnimating(false)
        }, 200)
      } else {
        setIsAnimating(false)
      }
    }
  }, [swipeDirection, isMobile, post.id, onLike, onComment])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "achievement":
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case "challenge_completion":
        return <Target className="w-5 h-5 text-success" />
      case "challenge_join":
        return <Users className="w-5 h-5 text-primary" />
      case "streak_milestone":
        return <Zap className="w-5 h-5 text-orange-500" />
      case "challenge_created":
        return <TrendingUp className="w-5 h-5 text-secondary" />
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "achievement":
        return "bg-yellow-500/10 border-yellow-500/20"
      case "challenge_completion":
        return "bg-success/10 border-success/20"
      case "challenge_join":
        return "bg-primary/10 border-primary/20"
      case "streak_milestone":
        return "bg-orange-500/10 border-orange-500/20"
      case "challenge_created":
        return "bg-secondary/10 border-secondary/20"
      default:
        return "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10"
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const postTime = new Date(timestamp)
    const diffMs = now.getTime() - postTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return postTime.toLocaleDateString()
  }

  if (!isMobile) {
    // Desktop version - regular feed item
    return (
      <Card className={cn("hover:shadow-md transition-shadow", className)}>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Activity Icon */}
              <div className={cn("p-2 rounded-full border", getActivityColor(post.type))}>
                {getActivityIcon(post.type)}
              </div>
              
              {/* User Info */}
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={post.user.avatar} />
                  <AvatarFallback>{post.user.name[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{post.user.name}</p>
                    {post.user.verified && <Badge variant="secondary" className="text-xs">Verified</Badge>}
                    {post.trending && <Badge variant="destructive" className="text-xs">Trending</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{formatTimeAgo(post.timestamp)}</p>
                </div>
              </div>
            </div>

            {/* Action Menu */}
            <div className="flex items-center gap-2">
              {!post.user.isFollowing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFollow(post.user.id)}
                  className="flex items-center gap-1"
                >
                  <UserPlus className="w-4 h-4" />
                  Follow
                </Button>
              )}
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3 mb-4">
            <h3 className="font-bold text-lg">{post.content.title}</h3>
            {post.content.description && <p className="text-muted-foreground">{post.content.description}</p>}

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              {post.content.amount && (
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-success" />
                  <span className="font-medium text-success">${post.content.amount}</span>
                </div>
              )}
              {post.content.streak && (
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span className="font-medium">{post.content.streak} days</span>
                </div>
              )}
              {post.content.challenge && (
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="font-medium text-primary">{post.content.challenge}</span>
                </div>
              )}
              {post.content.participants && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-secondary" />
                  <span className="font-medium">{post.content.participants} joined</span>
                </div>
              )}
            </div>
          </div>

          {/* Engagement */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLike(post.id)}
                className={cn(
                  "flex items-center gap-2",
                  post.engagement.liked ? "text-red-500" : "text-muted-foreground"
                )}
              >
                <Heart className={cn("w-4 h-4", post.engagement.liked && "fill-current")} />
                {post.engagement.likes}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onComment(post.id)}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <MessageCircle className="w-4 h-4" />
                {post.engagement.comments}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShare(post.id)}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <Share2 className="w-4 h-4" />
                {post.engagement.shares}
              </Button>
            </div>

            {/* Join/View Challenge Button */}
            {post.content.challenge && (
              <Button size="sm" variant="outline" className="bg-transparent">
                {post.type === "challenge_created" ? "Join Challenge" : "View Challenge"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Mobile version - swipeable
  return (
    <div 
      className={cn(
        "relative overflow-hidden",
        isAnimating && "pointer-events-none",
        className
      )}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchMove}
    >
      {/* Swipe Action Backgrounds */}
      <div className="absolute left-0 top-0 h-full w-20 bg-red-500 flex items-center justify-center z-0">
        <Heart className="w-6 h-6 text-white" />
      </div>
      <div className="absolute right-0 top-0 h-full w-20 bg-blue-500 flex items-center justify-center z-0">
        <MessageCircle className="w-6 h-6 text-white" />
      </div>

      {/* Swipe Indicators */}
      {swipeDirection && (
        <SocialSwipeIndicators 
          direction={swipeDirection.direction} 
          distance={swipeDirection.distance} 
        />
      )}

      {/* Action Feedback */}
      {actionFeedback && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className={cn(
            "px-4 py-2 rounded-full text-white font-medium shadow-lg",
            actionFeedback === 'like' ? "bg-red-500" : "bg-blue-500"
          )}>
            {actionFeedback === 'like' ? '❤️ Liked!' : '💬 Opening comments...'}
          </div>
        </div>
      )}

      {/* Main Content */}
      <Card 
        className={cn(
          "relative z-10 bg-background border transition-transform",
          isAnimating && "scale-95 opacity-80"
        )}
        style={{ transform: `translateX(${swipeOffset}px)` }}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Activity Icon */}
              <div className={cn("p-2 rounded-full border", getActivityColor(post.type))}>
                {getActivityIcon(post.type)}
              </div>
              
              {/* User Info */}
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{post.user.name}</p>
                  {post.user.verified && <Badge variant="secondary" className="text-xs">✓</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{formatTimeAgo(post.timestamp)}</p>
              </div>
            </div>

            {/* Follow Button */}
            {!post.user.isFollowing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFollow(post.user.id)}
                className="text-xs px-2 py-1 h-auto"
              >
                Follow
              </Button>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2 mb-3">
            <h3 className="font-bold">{post.content.title}</h3>
            {post.content.description && <p className="text-sm text-muted-foreground line-clamp-2">{post.content.description}</p>}
          </div>

          {/* Stats - Mobile Compact */}
          <div className="flex flex-wrap gap-2 mb-3 text-xs">
            {post.content.amount && (
              <Badge variant="outline" className="bg-green-50">
                <Trophy className="w-3 h-3 mr-1" />
                ${post.content.amount}
              </Badge>
            )}
            {post.content.streak && (
              <Badge variant="outline" className="bg-orange-50">
                <Zap className="w-3 h-3 mr-1" />
                {post.content.streak} days
              </Badge>
            )}
          </div>

          {/* Engagement - Mobile */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onLike(post.id)}
                className={cn(
                  "flex items-center gap-1 text-sm",
                  post.engagement.liked ? "text-red-500" : "text-muted-foreground"
                )}
              >
                <Heart className={cn("w-4 h-4", post.engagement.liked && "fill-current")} />
                {post.engagement.likes}
              </button>
              <button 
                onClick={() => onComment(post.id)}
                className="flex items-center gap-1 text-sm text-muted-foreground"
              >
                <MessageCircle className="w-4 h-4" />
                {post.engagement.comments}
              </button>
            </div>
            
            {/* Challenge Action */}
            {post.content.challenge && (
              <Button size="sm" variant="outline" className="text-xs h-auto py-1">
                View
              </Button>
            )}
          </div>

          {/* Mobile Swipe Hint */}
          <div className="text-center mt-3">
            <p className="text-xs text-muted-foreground">
              💡 Swipe right to like • Swipe left to comment
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
