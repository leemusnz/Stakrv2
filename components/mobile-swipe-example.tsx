"use client"

import { useState } from 'react'
import { useEnhancedMobile, useSwipeGesture } from '@/hooks/use-enhanced-mobile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Heart, X, Star, Users, Clock } from 'lucide-react'

// Example usage of enhanced mobile detection with swipe cards
export function MobileChallengeCards() {
  const { isMobile, isTablet, isTouchDevice, orientation } = useEnhancedMobile()
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // Sample challenge data
  const challenges = [
    {
      id: '1',
      title: '30-Day Fitness Challenge',
      description: 'Complete 30 minutes of exercise every day for 30 days',
      category: 'Fitness',
      difficulty: 'Medium',
      minStake: 25,
      maxStake: 100,
      participants: 156,
      duration: '30 days'
    },
    {
      id: '2', 
      title: 'Daily Meditation',
      description: 'Meditate for 10 minutes every morning',
      category: 'Wellness',
      difficulty: 'Easy',
      minStake: 10,
      maxStake: 50,
      participants: 89,
      duration: '21 days'
    },
    {
      id: '3',
      title: 'Learn Spanish',
      description: 'Practice Spanish for 30 minutes daily using Duolingo',
      category: 'Education',
      difficulty: 'Hard',
      minStake: 50,
      maxStake: 200,
      participants: 67,
      duration: '60 days'
    }
  ]

  const handleLike = (challenge: any) => {
    console.log('Liked challenge:', challenge.title)
    nextChallenge()
  }

  const handlePass = (challenge: any) => {
    console.log('Passed on challenge:', challenge.title)
    nextChallenge()
  }

  const nextChallenge = () => {
    setCurrentIndex(prev => (prev + 1) % challenges.length)
  }

  const currentChallenge = challenges[currentIndex]

  // Render mobile swipe interface
  if (isMobile) {
    return (
      <div className="p-4 max-w-sm mx-auto">
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold">Discover Challenges</h2>
          <p className="text-muted-foreground">Swipe right to join, left to pass</p>
        </div>

        <SwipeableCard
          challenge={currentChallenge}
          onSwipeRight={() => handleLike(currentChallenge)}
          onSwipeLeft={() => handlePass(currentChallenge)}
        />

        {/* Mobile action buttons */}
        <div className="flex justify-center space-x-8 mt-6">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-16 h-16 p-0 border-red-200 hover:bg-red-50"
            onClick={() => handlePass(currentChallenge)}
          >
            <X className="w-8 h-8 text-red-500" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-16 h-16 p-0 border-green-200 hover:bg-green-50"
            onClick={() => handleLike(currentChallenge)}
          >
            <Heart className="w-8 h-8 text-green-500" />
          </Button>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center mt-6 space-x-2">
          {challenges.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index === currentIndex ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // Render tablet/desktop grid interface
  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-center mb-8">Discover Challenges</h2>
      <div className={cn(
        "grid gap-6 max-w-6xl mx-auto",
        isTablet ? "grid-cols-2" : "grid-cols-3"
      )}>
        {challenges.map((challenge) => (
          <ChallengeCard 
            key={challenge.id} 
            challenge={challenge}
            onLike={() => handleLike(challenge)}
            onPass={() => handlePass(challenge)}
          />
        ))}
      </div>
    </div>
  )
}

// Swipeable card component for mobile
function SwipeableCard({ 
  challenge, 
  onSwipeLeft, 
  onSwipeRight 
}: { 
  challenge: any
  onSwipeLeft: () => void
  onSwipeRight: () => void 
}) {
  const { swipeDirection, onTouchStart, onTouchEnd, onTouchMove, clearSwipe } = useSwipeGesture(80, 500)
  const [transform, setTransform] = useState({ x: 0, rotation: 0, opacity: 1 })

  // Handle swipe completion
  React.useEffect(() => {
    if (!swipeDirection) return

    const { direction, distance } = swipeDirection
    
    if (distance > 80) {
      if (direction === 'left') {
        setTransform({ x: -300, rotation: -30, opacity: 0 })
        setTimeout(() => {
          onSwipeLeft()
          setTransform({ x: 0, rotation: 0, opacity: 1 })
          clearSwipe()
        }, 300)
      } else if (direction === 'right') {
        setTransform({ x: 300, rotation: 30, opacity: 0 })
        setTimeout(() => {
          onSwipeRight()
          setTransform({ x: 0, rotation: 0, opacity: 1 })
          clearSwipe()
        }, 300)
      }
    } else {
      setTransform({ x: 0, rotation: 0, opacity: 1 })
      clearSwipe()
    }
  }, [swipeDirection, onSwipeLeft, onSwipeRight, clearSwipe])

  return (
    <div
      className="relative w-full h-96 select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchMove}
      style={{
        transform: `translateX(${transform.x}px) rotate(${transform.rotation}deg)`,
        opacity: transform.opacity,
        transition: transform.x !== 0 ? 'transform 0.3s ease-out, opacity 0.3s ease-out' : 'none'
      }}
    >
      <ChallengeCard challenge={challenge} />
      
      {/* Swipe indicators */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 bg-red-500 text-white p-3 rounded-full transition-opacity",
          transform.x < -30 ? "opacity-100" : "opacity-0"
        )}>
          <X className="w-6 h-6" />
        </div>
        <div className={cn(
          "absolute right-4 top-1/2 -translate-y-1/2 bg-green-500 text-white p-3 rounded-full transition-opacity",
          transform.x > 30 ? "opacity-100" : "opacity-0"
        )}>
          <Heart className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

// Challenge card component
function ChallengeCard({ 
  challenge, 
  onLike, 
  onPass 
}: { 
  challenge: any
  onLike?: () => void
  onPass?: () => void 
}) {
  const { isMobile } = useEnhancedMobile()

  return (
    <Card className="w-full h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary">{challenge.category}</Badge>
          <Badge 
            variant={
              challenge.difficulty === 'Easy' ? 'default' : 
              challenge.difficulty === 'Medium' ? 'secondary' : 'destructive'
            }
          >
            {challenge.difficulty}
          </Badge>
        </div>
        <CardTitle className={cn(
          "line-clamp-2",
          isMobile ? "text-xl" : "text-lg"
        )}>
          {challenge.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex flex-col h-full">
        <p className={cn(
          "text-muted-foreground mb-4 flex-1 line-clamp-3",
          isMobile ? "text-base" : "text-sm"
        )}>
          {challenge.description}
        </p>
        
        <div className="space-y-3 mt-auto">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-primary" />
              <span>{challenge.participants} joined</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>{challenge.duration}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Stake Range</p>
              <p className="font-bold">${challenge.minStake} - ${challenge.maxStake}</p>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">4.8</span>
            </div>
          </div>
          
          {/* Desktop action buttons */}
          {!isMobile && onLike && onPass && (
            <div className="flex space-x-2 pt-2">
              <Button variant="outline" size="sm" onClick={onPass} className="flex-1">
                Pass
              </Button>
              <Button size="sm" onClick={onLike} className="flex-1">
                Join Challenge
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Device info display component for debugging
export function MobileDebugInfo() {
  const mobile = useEnhancedMobile()
  
  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs max-w-xs z-50">
      <h4 className="font-bold mb-2">Device Info</h4>
      <div className="space-y-1">
        <div>Mobile: {mobile.isMobile ? 'Yes' : 'No'}</div>
        <div>Tablet: {mobile.isTablet ? 'Yes' : 'No'}</div>
        <div>Touch: {mobile.isTouchDevice ? 'Yes' : 'No'}</div>
        <div>iOS: {mobile.isIOS ? 'Yes' : 'No'}</div>
        <div>Android: {mobile.isAndroid ? 'Yes' : 'No'}</div>
        <div>Orientation: {mobile.orientation}</div>
        <div>Size: {mobile.screenSize.width} x {mobile.screenSize.height}</div>
      </div>
    </div>
  )
} 