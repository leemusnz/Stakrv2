"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SwipeableFeedItem } from "./swipeable-feed-item"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { getProxiedAvatarUrl } from "@/lib/utils"
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
  ChevronDown,
  UserPlus,
  UserCheck,
} from "lucide-react"

interface FeedItem {
  id: string
  type:
    | "achievement"
    | "challenge_completion"
    | "challenge_join"
    | "streak_milestone"
    | "friend_activity"
    | "challenge_created"
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

interface SocialFeedProps {
  filter?: "all" | "friends" | "following" | "trending"
  showFilters?: boolean
}

// Real API data - no more mock data!

export function SocialFeed({ filter = "all", showFilters = true }: SocialFeedProps) {
  const { isMobile } = useEnhancedMobile()
  const [activeFilter, setActiveFilter] = useState(filter)
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  // Fetch feed data from API
  const fetchFeedData = async (filterType: string = activeFilter, pageNum: number = 1) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/social/feed?filter=${filterType}&page=${pageNum}&limit=20`)
      const data = await response.json()
      
      if (data.success) {
        if (pageNum === 1) {
          setFeedItems(data.items)
        } else {
          setFeedItems(prev => [...prev, ...data.items])
        }
        setHasMore(data.pagination.hasMore)
      } else {
        console.error('Failed to fetch feed:', data.error)
      }
    } catch (error) {
      console.error('Feed fetch error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load initial data
  useEffect(() => {
    fetchFeedData(activeFilter, 1)
    setPage(1)
  }, [activeFilter])

  // Handle filter change
  const handleFilterChange = (newFilter: "all" | "friends" | "following" | "trending") => {
    setActiveFilter(newFilter)
    setPage(1)
  }

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
        return "bg-muted border-muted"
    }
  }

  const handleLike = async (itemId: string) => {
    const item = feedItems.find(f => f.id === itemId)
    if (!item) return

    const action = item.engagement.liked ? 'unlike' : 'like'
    
    try {
      const response = await fetch('/api/social/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedItemId: itemId, action })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setFeedItems((items) =>
          items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  engagement: {
                    ...item.engagement,
                    liked: action === 'like',
                    likes: data.likesCount,
                  },
                }
              : item,
          ),
        )
      }
    } catch (error) {
      console.error('Like error:', error)
    }
  }

  const handleFollow = async (userId: string) => {
    const item = feedItems.find(f => f.user.id === userId)
    if (!item) return

    const action = item.user.isFollowing ? 'unfollow' : 'follow'
    
    try {
      const response = await fetch('/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId, action })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setFeedItems((items) =>
          items.map((item) =>
            item.user.id === userId
              ? {
                  ...item,
                  user: {
                    ...item.user,
                    isFollowing: action === 'follow',
                  },
                }
              : item,
          ),
        )
      }
    } catch (error) {
      console.error('Follow error:', error)
    }
  }

  const handleShare = (itemId: string) => {
    const item = feedItems.find((f) => f.id === itemId)
    if (item) {
      navigator.clipboard.writeText(`https://stakr.app/post/${itemId}`)
      console.log(`Shared post: ${item.content.title}`)
    }
  }

  // No need to filter on frontend since API handles filtering
  const filteredItems = feedItems

  const loadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchFeedData(activeFilter, nextPage)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Community Feed
          </h2>
          <p className="text-muted-foreground">See what the community is achieving</p>
        </div>

        {showFilters && (
          <div className="flex items-center gap-2">
            <Button
              variant={activeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("all")}
            >
              All
            </Button>
            <Button
              variant={activeFilter === "trending" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("trending")}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Trending
            </Button>
            <Button
              variant={activeFilter === "friends" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("friends")}
            >
              Friends
            </Button>
            <Button
              variant={activeFilter === "following" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("following")}
            >
              Following
            </Button>
          </div>
        )}
      </div>

      {/* Feed Items */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="space-y-4">
              <div className="text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium">Community Feed Coming Soon</h3>
                <p className="text-sm">
                  Start participating in challenges to see real community activity here!
                </p>
              </div>
            </div>
          </Card>
        ) : (
          filteredItems.map((item) => 
            isMobile ? (
              <SwipeableFeedItem
                key={item.id}
                post={item}
                onLike={handleLike}
                onComment={(postId) => console.log('Opening comments for:', postId)}
                onShare={handleShare}
                onFollow={handleFollow}
              />
            ) : (
              <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={getProxiedAvatarUrl(item.user.avatar)} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {item.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-background flex items-center justify-center ${getActivityColor(item.type)}`}
                      >
                        {getActivityIcon(item.type)}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{item.user.name}</span>
                        {item.user.verified && (
                          <Badge variant="secondary" className="text-xs">
                            Verified
                          </Badge>
                        )}
                        {item.trending && (
                          <Badge variant="outline" className="text-xs text-orange-500 border-orange-500/20">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Trending
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{item.timestamp}</p>
                    </div>

                    {/* Follow Button */}
                    <Button
                      size="sm"
                      variant={item.user.isFollowing ? "outline" : "default"}
                      onClick={() => handleFollow(item.user.id)}
                      className={`transition-all ${
                        item.user.isFollowing
                          ? "border-primary text-primary hover:bg-primary hover:text-white"
                          : "bg-primary hover:bg-primary/90"
                      }`}
                    >
                      {item.user.isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4 mr-1" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-1" />
                          Follow
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Content */}
                  <div className="space-y-3 mb-4">
                    <h3 className="font-bold text-lg">{item.content.title}</h3>
                    {item.content.description && <p className="text-muted-foreground">{item.content.description}</p>}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm">
                      {item.content.amount && (
                        <div className="flex items-center gap-1">
                          <Trophy className="w-4 h-4 text-success" />
                          <span className="font-medium text-success">${item.content.amount}</span>
                        </div>
                      )}
                      {item.content.streak && (
                        <div className="flex items-center gap-1">
                          <Zap className="w-4 h-4 text-orange-500" />
                          <span className="font-medium">{item.content.streak} days</span>
                        </div>
                      )}
                      {item.content.challenge && (
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4 text-primary" />
                          <span className="font-medium text-primary">{item.content.challenge}</span>
                        </div>
                      )}
                      {item.content.participants && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-secondary" />
                          <span className="font-medium">{item.content.participants} joined</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Engagement */}
                  <div className="flex items-center justify-between pt-4 border-t border-muted">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(item.id)}
                        className={`flex items-center gap-2 ${
                          item.engagement.liked ? "text-red-500" : "text-muted-foreground"
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${item.engagement.liked ? "fill-current" : ""}`} />
                        {item.engagement.likes}
                      </Button>
                      <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
                        <MessageCircle className="w-4 h-4" />
                        {item.engagement.comments}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(item.id)}
                        className="flex items-center gap-2 text-muted-foreground"
                      >
                        <Share2 className="w-4 h-4" />
                        {item.engagement.shares}
                      </Button>
                    </div>

                    {/* Join/View Challenge Button */}
                    {item.content.challenge && (
                      <Button size="sm" variant="outline" className="bg-transparent">
                        {item.type === "challenge_created" ? "Join Challenge" : "View Challenge"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          )
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 bg-transparent"
            onClick={loadMore}
            disabled={isLoading}
          >
            <ChevronDown className="w-4 h-4" />
            {isLoading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  )
}
