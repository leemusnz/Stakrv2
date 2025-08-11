"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Clock,
  Users,
  Trophy,
  Bookmark,
  BookmarkCheck,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Zap,
  Target,
  TrendingUp,
  Shield,
  Watch,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface YouTubeStyleChallengeCardProps {
  id: string
  title: string
  description: string
  category: string
  duration: string
  participants: number
  minStake: number
  maxStake: number
  difficulty: "Easy" | "Medium" | "Hard"
  thumbnailUrl?: string
  hostName: string
  hostAvatar?: string
  totalPot?: number
  completionRate?: number
  isJoined?: boolean
  progress?: number
  isActive?: boolean
  likes?: number
  views?: number
  isLiked?: boolean
  isSaved?: boolean
  startDate?: string
  endDate?: string
  proofTypes?: string[]
  className?: string
}

export function YouTubeStyleChallengeCard({
  id,
  title,
  description,
  category,
  duration,
  participants,
  minStake,
  maxStake,
  difficulty,
  thumbnailUrl,
  hostName,
  hostAvatar,
  totalPot = 0,
  completionRate = 85,
  isJoined = false,
  progress = 0,
  isActive = false,
  likes = Math.floor(Math.random() * 100) + 20,
  views = Math.floor(Math.random() * 500) + 100,
  isLiked = false,
  isSaved = false,
  startDate,
  endDate,
  proofTypes = [],
  className,
}: YouTubeStyleChallengeCardProps) {
  const [liked, setLiked] = useState(isLiked)
  const [saved, setSaved] = useState(isSaved)
  const [likeCount, setLikeCount] = useState(likes)

  // Verification badges function
  const getVerificationBadges = (proofTypes: string[] = []) => {
    const badges = []
    
    // Count smart verification methods
    const smartMethods = proofTypes.filter(type => 
      ['wearable', 'fitness_apps', 'learning_apps'].includes(type)
    ).length
    
    // Count manual verification methods
    const manualMethods = proofTypes.filter(type => 
      ['photo', 'video', 'text', 'file'].includes(type)
    ).length
    
    // If multiple smart methods, show combined badge
    if (smartMethods >= 2) {
      badges.push({
        text: `${smartMethods} Smart Methods`,
        icon: Zap,
        color: 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200'
      })
    } else {
      // Show individual smart method badges
      if (proofTypes.includes('wearable')) {
        badges.push({
          text: 'Apple Watch + Wearables',
          icon: Watch,
          color: 'bg-blue-50 text-blue-700 border-blue-200'
        })
      }
      
      if (proofTypes.includes('fitness_apps')) {
        badges.push({
          text: 'MyFitnessPal + Fitness',
          icon: Activity,
          color: 'bg-green-50 text-green-700 border-green-200'
        })
      }
      
      if (proofTypes.includes('learning_apps')) {
        badges.push({
          text: 'Duolingo + Learning',
          icon: Zap,
          color: 'bg-purple-50 text-purple-700 border-purple-200'
        })
      }
    }
    
    // Add manual verification indicator
    if (manualMethods > 0 && smartMethods > 0) {
      badges.push({
        text: 'Manual + Smart',
        icon: Shield,
        color: 'bg-amber-50 text-amber-700 border-amber-200'
      })
    } else if (manualMethods > 0 && smartMethods === 0) {
      badges.push({
        text: 'Manual Verification',
        icon: Shield,
        color: 'bg-gray-50 text-gray-700 border-gray-200'
      })
    }

    // If no verification methods specified, default to manual
    if (badges.length === 0) {
      badges.push({
        text: 'Manual Verification',
        icon: Shield,
        color: 'bg-gray-50 text-gray-700 border-gray-200'
      })
    }

    return badges
  }

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLiked(!liked)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
  }

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSaved(!saved)
  }

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(`https://stakr.app/challenge/${id}`)
  }

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "Easy":
        return "bg-green-500"
      case "Medium":
        return "bg-yellow-500"
      case "Hard":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getCategoryGradient = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "mindfulness":
        return "from-purple-500/80 to-blue-500/80"
      case "fitness":
        return "from-red-500/80 to-orange-500/80"
      case "learning":
        return "from-blue-500/80 to-cyan-500/80"
      case "digital wellness":
        return "from-green-500/80 to-teal-500/80"
      case "wellness":
        return "from-pink-500/80 to-rose-500/80"
      case "productivity":
        return "from-indigo-500/80 to-purple-500/80"
      default:
        return "from-gray-500/80 to-gray-600/80"
    }
  }

  const formatStakeRange = () => {
    if (minStake === 0 && maxStake === 0) return "Free"
    if (minStake === maxStake) return `$${minStake}`
    return `$${minStake}-$${maxStake}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
    return num.toString()
  }

  return (
    <Link href={`/challenge/${id}`}>
      <Card
        className={cn(
          "group overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer",
          isActive && "ring-2 ring-primary shadow-lg",
          className,
        )}
      >
        {/* Thumbnail Section */}
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-muted to-muted/50">
          {/* Background Image/Gradient */}
          <div className={cn("absolute inset-0 bg-gradient-to-br", getCategoryGradient(category))}>
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl.includes('stakr-verification-files.s3') 
                  ? `/api/image-proxy?url=${encodeURIComponent(thumbnailUrl)}&v=${thumbnailUrl.split('/').pop()?.split('-')[0] || 'default'}`
                  : thumbnailUrl
                }
                alt={title}
                className="w-full h-full object-cover mix-blend-overlay"
                onLoad={() => {
                  console.log('✅ YouTube-style thumbnail loaded successfully:', thumbnailUrl)
                }}
                onError={(e) => {
                  console.log('❌ YouTube-style thumbnail failed to load:', thumbnailUrl)
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Target className="w-16 h-16 text-white/30" />
              </div>
            )}
          </div>

          {/* Overlay Content */}
          <div className="absolute inset-0 bg-black/20">
            {/* Top Row - Category & Difficulty */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
              <Badge className="bg-white/90 text-black font-bold text-xs">{category.toUpperCase()}</Badge>
              <div className="flex gap-2">
                <div className={cn("w-3 h-3 rounded-full", getDifficultyColor(difficulty))} />
                {isJoined && <Badge className="bg-success text-white font-bold text-xs">JOINED</Badge>}
              </div>
            </div>

            {/* Verification Methods - Bottom Left */}
            <div className="absolute bottom-3 left-3 flex gap-1 flex-wrap max-w-[60%]">
              {getVerificationBadges(proofTypes).slice(0, 2).map((badge, index) => {
                const Icon = badge.icon
                return (
                  <Badge 
                    key={index}
                    variant="outline" 
                    className={`text-xs flex items-center gap-1 bg-white/90 text-black border-white/50 ${badge.color}`}
                  >
                    <Icon className="w-3 h-3" />
                    {badge.text}
                  </Badge>
                )
              })}
              {getVerificationBadges(proofTypes).length > 2 && (
                <Badge 
                  variant="outline" 
                  className="text-xs bg-white/90 text-black border-white/50"
                >
                  +{getVerificationBadges(proofTypes).length - 2}
                </Badge>
              )}
            </div>

            {/* Center - Play Button (on hover) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                <Eye className="w-8 h-8 text-primary ml-1" />
              </div>
            </div>

            {/* Bottom Row - Key Stats */}
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-end justify-between text-white">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 text-sm font-medium">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{formatNumber(participants)}</span>
                    </div>
                  </div>
                  {isJoined && progress > 0 && (
                    <div className="w-24">
                      <Progress value={progress} className="h-1 bg-white/30" />
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{formatStakeRange()}</div>
                  {totalPot > 0 && <div className="text-xs opacity-90">${formatNumber(totalPot)} pool</div>}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/70"
            >
              {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Content Section */}
        <CardContent className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>

          {/* Host Info */}
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={hostAvatar || "/placeholder.svg"} />
              <AvatarFallback className="text-xs">{hostName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground truncate">{hostName}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formatNumber(views)} views</span>
                <span>•</span>
                <span>{completionRate}% completion rate</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-muted">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={cn(
                  "flex items-center gap-1 text-sm transition-colors hover:text-primary",
                  liked ? "text-red-500" : "text-muted-foreground",
                )}
              >
                <Heart className={cn("w-4 h-4", liked && "fill-current")} />
                <span>{formatNumber(likeCount)}</span>
              </button>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MessageCircle className="w-4 h-4" />
                <span>{Math.floor(Math.random() * 20) + 5}</span>
              </div>
            </div>
            <button onClick={handleShare} className="text-muted-foreground hover:text-primary transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Bar for Joined Challenges */}
          {isJoined && progress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Your Progress</span>
                <span className="text-primary font-bold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              {isActive && (
                <div className="flex items-center gap-1 text-xs text-primary">
                  <Zap className="w-3 h-3" />
                  <span>Active challenge</span>
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          {/* CTA reflects started state */}
          {!isJoined && startDate && new Date(startDate) > new Date() ? (
            <Button className="w-full font-bold" size="lg">
              Join Challenge
            </Button>
          ) : progress === 100 ? (
            <Button className="w-full font-bold bg-success hover:bg-success/90" size="lg">
              <Trophy className="w-4 h-4 mr-2" />
              Completed! 🎉
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full font-bold border-2 border-success text-success hover:bg-success/10 bg-transparent"
              size="lg"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Challenge
            </Button>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
