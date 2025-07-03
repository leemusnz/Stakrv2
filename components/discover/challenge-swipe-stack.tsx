"use client"

import { useState, useEffect } from "react"
import { SwipeableChallengeCard } from "./swipeable-challenge-card"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { Button } from "@/components/ui/button"
import { RefreshCw, Heart, X, Bookmark } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChallengeSwipeStackProps {
  challenges: any[]
  onLike: (challenge: any) => void
  onPass: (challenge: any) => void
  onBookmark: (challenge: any) => void
  onJoin: (challenge: any) => void
  onLoadMore?: () => void
  className?: string
}

export function ChallengeSwipeStack({
  challenges,
  onLike,
  onPass,
  onBookmark,
  onJoin,
  onLoadMore,
  className
}: ChallengeSwipeStackProps) {
  const { isMobile } = useEnhancedMobile()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [animatingCards, setAnimatingCards] = useState<Set<number>>(new Set())

  // Auto-load more when approaching end
  useEffect(() => {
    if (currentIndex >= challenges.length - 2 && onLoadMore) {
      onLoadMore()
    }
  }, [currentIndex, challenges.length, onLoadMore])

  const handleAction = (action: 'like' | 'pass' | 'bookmark', challenge: any) => {
    const cardIndex = currentIndex
    
    // Add to animating set
    setAnimatingCards(prev => new Set(prev).add(cardIndex))
    
    // Execute action
    switch (action) {
      case 'like':
        onLike(challenge)
        break
      case 'pass':
        onPass(challenge)
        break
      case 'bookmark':
        onBookmark(challenge)
        break
    }

    // Move to next card after animation
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setAnimatingCards(prev => {
        const newSet = new Set(prev)
        newSet.delete(cardIndex)
        return newSet
      })
    }, 300)
  }

  const getCurrentChallenge = () => challenges[currentIndex]
  const hasMoreChallenges = currentIndex < challenges.length

  if (!isMobile) {
    // Desktop fallback - show grid
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
        {challenges.map((challenge, index) => (
          <SwipeableChallengeCard
            key={challenge.id || index}
            challenge={challenge}
            onLike={onLike}
            onPass={onPass}
            onBookmark={onBookmark}
            onJoin={onJoin}
          />
        ))}
      </div>
    )
  }

  if (!hasMoreChallenges) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-[500px] text-center", className)}>
        <div className="mb-6">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4 mx-auto">
            <Heart className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">You've seen all challenges!</h3>
          <p className="text-muted-foreground mb-6">
            Check back later for new challenges or adjust your filters
          </p>
        </div>
        
        {onLoadMore && (
          <Button onClick={onLoadMore} variant="outline" size="lg">
            <RefreshCw className="w-5 h-5 mr-2" />
            Load More Challenges
          </Button>
        )}
      </div>
    )
  }

  const visibleCards = challenges.slice(currentIndex, currentIndex + 3)

  return (
    <div className={cn("relative w-full h-[500px]", className)}>
      {/* Card Stack */}
      <div className="relative w-full h-full">
        {visibleCards.map((challenge, stackIndex) => {
          const actualIndex = currentIndex + stackIndex
          const isTop = stackIndex === 0
          const isAnimating = animatingCards.has(actualIndex)
          
          return (
            <div
              key={challenge.id || actualIndex}
              className={cn(
                "absolute inset-0 transition-all duration-300",
                isAnimating && "opacity-0 scale-95"
              )}
              style={{
                zIndex: visibleCards.length - stackIndex,
                transform: `translateY(${stackIndex * 4}px) scale(${1 - stackIndex * 0.02})`,
                opacity: 1 - stackIndex * 0.1
              }}
            >
              <SwipeableChallengeCard
                challenge={challenge}
                onLike={(challenge) => handleAction('like', challenge)}
                onPass={(challenge) => handleAction('pass', challenge)}
                onBookmark={(challenge) => handleAction('bookmark', challenge)}
                onJoin={onJoin}
                className={cn(
                  !isTop && "pointer-events-none",
                  "shadow-lg"
                )}
              />
            </div>
          )
        })}
      </div>

      {/* Stack Progress Indicator */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <div className="flex gap-1">
          {Array.from({ length: Math.min(challenges.length, 10) }, (_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                i === currentIndex % 10 ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-2">
          {currentIndex + 1} / {challenges.length}
        </span>
      </div>

      {/* Action Buttons for Current Card */}
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex gap-4">
        <Button
          variant="outline"
          size="icon"
          className="w-14 h-14 rounded-full border-red-200 text-red-600 hover:bg-red-50"
          onClick={() => handleAction('pass', getCurrentChallenge())}
        >
          <X className="w-6 h-6" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="w-12 h-12 rounded-full border-blue-200 text-blue-600 hover:bg-blue-50"
          onClick={() => handleAction('bookmark', getCurrentChallenge())}
        >
          <Bookmark className="w-5 h-5" />
        </Button>
        
        <Button
          size="icon"
          className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600"
          onClick={() => handleAction('like', getCurrentChallenge())}
        >
          <Heart className="w-6 h-6 text-white" />
        </Button>
      </div>
    </div>
  )
}
