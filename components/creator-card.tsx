"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, CheckCircle, UserPlus, UserCheck, Heart, MessageCircle, Share2 } from "lucide-react"

interface CreatorCardProps {
  creator: {
    id: string
    name: string
    username?: string
    avatar?: string
    bio: string
    followers: number
    challengesCreated?: number
    successRate: number
    totalEarnings: number
    isVerified?: boolean
    isFollowing?: boolean
    categories: string[]
    recentChallenge?: {
      title: string
      participants: number
    }
  }
}

export function CreatorCard({ creator }: CreatorCardProps) {
  const {
    id,
    name = "Unknown User",
    username,
    avatar,
    bio = "",
    followers = 0,
    challengesCreated = 0,
    successRate = 0,
    totalEarnings = 0,
    isVerified = false,
    isFollowing = false,
    categories = [],
    recentChallenge,
  } = creator

  const [following, setFollowing] = useState(isFollowing)
  const [followerCount, setFollowerCount] = useState(followers)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 50) + 10)

  const handleFollow = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setFollowing(!following)
    setFollowerCount((prev) => (following ? prev - 1 : prev + 1))

    // Here you would make an API call to follow/unfollow
    console.log(`${following ? "Unfollowed" : "Followed"} ${name}`)
  }

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsLiked(!isLiked)
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1))

    // Here you would make an API call to like/unlike
    console.log(`${isLiked ? "Unliked" : "Liked"} ${name}'s profile`)
  }

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Copy profile link to clipboard
    navigator.clipboard.writeText(`https://stakr.app/creator/${id}`)
    console.log(`Shared ${name}'s profile`)
  }

  // Generate initials safely
  const getInitials = (name: string) => {
    if (!name || typeof name !== "string") return "U"
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Link href={`/creator/${id}`}>
      <Card className="w-full max-w-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 cursor-pointer">
        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={avatar || "/placeholder.svg"} alt={name} />
                <AvatarFallback className="bg-primary text-white font-bold">{getInitials(name)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{name}</h3>
                  {isVerified && <CheckCircle className="w-4 h-4 text-blue-500" />}
                </div>
                {username && <p className="text-sm text-muted-foreground">@{username}</p>}
              </div>
            </div>

            {/* Follow Button */}
            <Button
              size="sm"
              variant={following ? "outline" : "default"}
              onClick={handleFollow}
              className={`transition-all ${
                following
                  ? "border-primary text-primary hover:bg-primary hover:text-white"
                  : "bg-primary hover:bg-primary/90"
              }`}
            >
              {following ? (
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

          {/* Bio */}
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{bio || "No bio available"}</p>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 3).map((category) => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
              {categories.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{categories.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-primary">{followerCount.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </div>
            <div>
              <div className="text-lg font-bold text-secondary">{challengesCreated}</div>
              <div className="text-xs text-muted-foreground">Challenges</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">{successRate}%</div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-500">${totalEarnings.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Earned</div>
            </div>
          </div>

          {/* Recent Challenge */}
          {recentChallenge && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Latest Challenge</div>
              <div className="font-medium text-sm">{recentChallenge.title}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Users className="w-3 h-3" />
                {recentChallenge.participants} participants
              </div>
            </div>
          )}

          {/* Social Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-muted">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`flex items-center gap-1 ${isLiked ? "text-red-500" : "text-muted-foreground"}`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                {likeCount}
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center gap-1 text-muted-foreground">
                <MessageCircle className="w-4 h-4" />
                Message
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={handleShare} className="text-muted-foreground">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
