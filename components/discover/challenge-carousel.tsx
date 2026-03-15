"use client"

import { useState, useRef, useEffect } from "react"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ChevronLeft, ChevronRight, Users, DollarSign, Calendar, Trophy, Shield, Watch, Activity, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChallengeCarouselProps {
  challenges: any[]
  onJoin: (challenge: any) => void
  onViewDetails: (challenge: any) => void
  className?: string
}

export function ChallengeCarousel({
  challenges,
  onJoin,
  onViewDetails,
  className
}: ChallengeCarouselProps) {
  const { isMobile } = useEnhancedMobile()
  const [currentIndex, setCurrentIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const goToPrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex(prev => Math.min(challenges.length - 1, prev + 1))
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  if (!challenges.length) {
    return (
      <div className={cn("text-center py-12", className)}>
        <p className="text-muted-foreground">No challenges available</p>
      </div>
    )
  }

  if (!isMobile) {
    // Desktop: Show 3-column grid
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
        {challenges.map((challenge, index) => (
          <ChallengeCard
            key={challenge.id || index}
            challenge={challenge}
            onJoin={onJoin}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    )
  }

  // Mobile: Show swipeable carousel
  return (
    <div className={cn("relative", className)}>
      {/* Navigation instruction */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Discover Challenges</h2>
        <p className="text-muted-foreground">
          Use arrows to browse • Tap to join challenges
        </p>
      </div>

      {/* Carousel container */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl"
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`
          }}
        >
          {challenges.map((challenge, index) => (
            <div key={challenge.id || index} className="w-full flex-shrink-0 px-2">
              <ChallengeCard
                challenge={challenge}
                onJoin={onJoin}
                onViewDetails={onViewDetails}
                isFocused={index === currentIndex}
              />
            </div>
          ))}
        </div>

        {/* Navigation arrows */}
        {currentIndex > 0 && (
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous challenge"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm"
            onClick={goToPrevious}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
        
        {currentIndex < challenges.length - 1 && (
          <Button
            variant="outline"
            size="icon"
            aria-label="Next challenge"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm"
            onClick={goToNext}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center mt-6 gap-2">
        {challenges.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            aria-label={`Go to challenge ${index + 1}`}
            aria-current={index === currentIndex ? "page" : undefined}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-200",
              index === currentIndex
                ? "bg-primary w-6"
                : "bg-muted hover:bg-muted-foreground/50"
            )}
          />
        ))}
      </div>

      {/* Progress indicator */}
      <div className="text-center mt-4">
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} of {challenges.length}
        </span>
      </div>
    </div>
  )
}

function ChallengeCard({
  challenge,
  onJoin,
  onViewDetails,
  isFocused = false
}: {
  challenge: any
  onJoin: (challenge: any) => void
  onViewDetails: (challenge: any) => void
  isFocused?: boolean
}) {
  const getVerificationBadges = (proofTypes: string[] = []) => {
    const badges = []
    
    // Check for smart integrations
    if (proofTypes.includes('wearable')) {
      badges.push({
        text: 'Smart Wearables',
        icon: Watch,
        color: 'bg-blue-50 text-blue-700 border-blue-200'
      })
    }
    
    if (proofTypes.includes('fitness_apps')) {
      badges.push({
        text: 'Fitness Apps',
        icon: Activity,
        color: 'bg-green-50 text-green-700 border-green-200'
      })
    }
    
    if (proofTypes.includes('learning_apps')) {
      badges.push({
        text: 'Learning Apps',
        icon: Zap,
        color: 'bg-purple-50 text-purple-700 border-purple-200'
      })
    }
    
    // If any smart verification exists
    if (badges.length > 0) {
      return badges.slice(0, 1) // Show only one badge to save space
    }
    
    // Fall back to manual verification indicator
    return [{
      text: 'Manual',
      icon: Shield,
      color: 'bg-gray-50 text-gray-700 border-gray-200'
    }]
  }
  return (
    <Card className={cn(
      "h-[500px] transition-all duration-200 overflow-hidden",
      isFocused && "ring-2 ring-primary/20 shadow-lg scale-[1.02]"
    )}>
      {/* Thumbnail Image */}
      {challenge.thumbnail_url && (
        <div className="relative w-full h-48 bg-gradient-to-br from-blue-50 to-purple-50">
          <img
            src={challenge.thumbnail_url.includes('stakr-verification-files.s3') 
              ? `/api/image-proxy?url=${encodeURIComponent(challenge.thumbnail_url)}&v=${challenge.thumbnail_url.split('/').pop()?.split('-')[0] || 'default'}`
              : challenge.thumbnail_url
            }
            alt={challenge.title}
            className="w-full h-full object-cover"
            onLoad={() => {
              console.log('✅ Carousel thumbnail loaded successfully:', challenge.thumbnail_url)
            }}
            onError={(e) => {
              console.log('❌ Carousel thumbnail failed to load:', challenge.thumbnail_url)
              // Hide image if it fails to load
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )}
      
      <CardContent className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2 line-clamp-2">{challenge.title}</h3>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge variant="secondary">{challenge.category}</Badge>
              <Badge variant="outline">{challenge.difficulty}</Badge>
              {getVerificationBadges(challenge.proof_types || challenge.selectedProofTypes).map((badge, index) => {
                const Icon = badge.icon
                return (
                  <Badge 
                    key={index}
                    variant="outline" 
                    className={`text-xs flex items-center gap-1 ${badge.color}`}
                  >
                    <Icon className="w-3 h-3" />
                    {badge.text}
                  </Badge>
                )
              })}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-muted-foreground mb-6 line-clamp-3 flex-1">
          {challenge.description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span>{challenge.duration}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-green-500" />
            <span>{challenge.participants_count} joined</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-orange-500" />
            <span>${challenge.min_stake} - ${challenge.max_stake}</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-purple-500" />
            <span>${challenge.total_stake_pool} pool</span>
          </div>
        </div>

        {/* Host */}
        <div className="flex items-center gap-3 mb-6 p-3 bg-muted/50 rounded-lg">
          <Avatar className="w-10 h-10">
            <AvatarImage src={challenge.host_avatar_url} />
            <AvatarFallback>{challenge.host_name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{challenge.host_name}</p>
            <p className="text-xs text-muted-foreground">Challenge Host</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-auto">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onViewDetails(challenge)}
          >
            View Details
          </Button>
          <Button
            className="flex-1"
            onClick={() => onJoin(challenge)}
          >
            Join Challenge
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
