"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Building2, CheckCircle, UserPlus, UserCheck, Heart, MessageCircle, Share2, Trophy, Users } from "lucide-react"

interface BrandCardProps {
  brand: {
    id: string
    name: string
    logo?: string
    description: string
    industry: string
    followers: number
    challengesSponsored: number
    totalRewards: number
    isVerified?: boolean
    isFollowing?: boolean
    categories: string[]
    featuredChallenge?: {
      title: string
      reward: number
      participants: number
    }
  }
}

export function BrandCard({ brand }: BrandCardProps) {
  const {
    id,
    name = "Unknown Brand",
    logo,
    description = "",
    industry = "",
    followers = 0,
    challengesSponsored = 0,
    totalRewards = 0,
    isVerified = false,
    isFollowing = false,
    categories = [],
    featuredChallenge,
  } = brand

  const [following, setFollowing] = useState(isFollowing)
  const [followerCount, setFollowerCount] = useState(followers)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 100) + 20)

  const handleFollow = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setFollowing(!following)
    setFollowerCount((prev) => (following ? prev - 1 : prev + 1))

    console.log(`${following ? "Unfollowed" : "Followed"} ${name}`)
  }

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsLiked(!isLiked)
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1))

    console.log(`${isLiked ? "Unliked" : "Liked"} ${name}`)
  }

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    navigator.clipboard.writeText(`https://stakr.app/brand/${id}`)
    console.log(`Shared ${name}'s profile`)
  }

  // Generate initials safely
  const getInitials = (name: string) => {
    if (!name || typeof name !== "string") return "B"
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Link href={`/brand/${id}`}>
      <Card className="w-full max-w-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 cursor-pointer">
        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={logo || "/placeholder.svg"} alt={name} />
                <AvatarFallback className="bg-secondary text-white font-bold">{getInitials(name)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{name}</h3>
                  {isVerified && <CheckCircle className="w-4 h-4 text-blue-500" />}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Building2 className="w-3 h-3" />
                  {industry || "Business"}
                </div>
              </div>
            </div>

            {/* Follow Button */}
            <Button
              size="sm"
              variant={following ? "outline" : "default"}
              onClick={handleFollow}
              className={`transition-all ${
                following
                  ? "border-secondary text-secondary hover:bg-secondary hover:text-white"
                  : "bg-secondary hover:bg-secondary/90"
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

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {description || "No description available"}
          </p>

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
              <div className="text-lg font-bold text-secondary">{followerCount.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary">{challengesSponsored}</div>
              <div className="text-xs text-muted-foreground">Sponsored</div>
            </div>
            <div className="col-span-2">
              <div className="text-lg font-bold text-green-600">${totalRewards.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total Rewards Given</div>
            </div>
          </div>

          {/* Featured Challenge */}
          {featuredChallenge && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Trophy className="w-3 h-3" />
                Featured Challenge
              </div>
              <div className="font-medium text-sm">{featuredChallenge.title}</div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {featuredChallenge.participants} participants
                </div>
                <div className="font-bold text-green-600">${featuredChallenge.reward}</div>
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
                Contact
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
