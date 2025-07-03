"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useEnhancedMobile, useSwipeGesture } from '@/hooks/use-enhanced-mobile'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Heart, X, Star, ChevronLeft, ChevronRight } from 'lucide-react'

interface SwipeCardProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  className?: string
  disabled?: boolean
}

// Individual swipe card component
export function SwipeCard({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  onSwipeUp, 
  onSwipeDown,
  className,
  disabled = false
}: SwipeCardProps) {
  const { isMobile, isTouchDevice } = useEnhancedMobile()
  const { swipeDirection, onTouchStart, onTouchEnd, onTouchMove, clearSwipe } = useSwipeGesture()
  const [isDragging, setIsDragging] = useState(false)
  const [transform, setTransform] = useState({ x: 0, y: 0, rotation: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  // Handle swipe completion
  useEffect(() => {
    if (!swipeDirection || disabled) return

    const { direction, distance } = swipeDirection

    if (distance > 100) { // Minimum distance for action
      switch (direction) {
        case 'left':
          onSwipeLeft?.()
          break
        case 'right':
          onSwipeRight?.()
          break
        case 'up':
          onSwipeUp?.()
          break
        case 'down':
          onSwipeDown?.()
          break
      }
    }

    // Reset position after swipe
    setTransform({ x: 0, y: 0, rotation: 0 })
    setIsDragging(false)
    clearSwipe()
  }, [swipeDirection, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, clearSwipe, disabled])

  // Mouse events for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isMobile && !disabled) {
      setIsDragging(true)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && !disabled) {
      const rect = cardRef.current?.getBoundingClientRect()
      if (rect) {
        const x = e.clientX - rect.left - rect.width / 2
        const y = e.clientY - rect.top - rect.height / 2
        const rotation = x * 0.1 // Subtle rotation effect
        setTransform({ x, y, rotation })
      }
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false)
      setTransform({ x: 0, y: 0, rotation: 0 })
    }
  }

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative select-none transition-transform duration-200",
        isDragging && "cursor-grabbing",
        !isDragging && "cursor-grab",
        className
      )}
      style={{
        transform: `translate(${transform.x}px, ${transform.y}px) rotate(${transform.rotation}deg)`,
      }}
      onTouchStart={isTouchDevice ? onTouchStart : undefined}
      onTouchEnd={isTouchDevice ? onTouchEnd : undefined}
      onTouchMove={isTouchDevice ? onTouchMove : undefined}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {children}
      
      {/* Swipe indicators for mobile */}
      {isMobile && !disabled && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Left swipe indicator */}
          <div className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 bg-red-500 text-white p-2 rounded-full opacity-0 transition-opacity",
            transform.x < -50 && "opacity-100"
          )}>
            <X className="w-4 h-4" />
          </div>
          
          {/* Right swipe indicator */}
          <div className={cn(
            "absolute right-4 top-1/2 -translate-y-1/2 bg-green-500 text-white p-2 rounded-full opacity-0 transition-opacity",
            transform.x > 50 && "opacity-100"
          )}>
            <Heart className="w-4 h-4" />
          </div>
        </div>
      )}
    </div>
  )
}

interface SwipeStackProps<T> {
  items: T[]
  renderCard: (item: T, index: number) => React.ReactNode
  onSwipeLeft?: (item: T, index: number) => void
  onSwipeRight?: (item: T, index: number) => void
  maxVisible?: number
  className?: string
}

// Stack of swipeable cards
export function SwipeStack<T>({ 
  items, 
  renderCard, 
  onSwipeLeft, 
  onSwipeRight, 
  maxVisible = 3,
  className 
}: SwipeStackProps<T>) {
  const { isMobile } = useEnhancedMobile()
  const [currentIndex, setCurrentIndex] = useState(0)

  const handleSwipeLeft = () => {
    const item = items[currentIndex]
    onSwipeLeft?.(item, currentIndex)
    setCurrentIndex(prev => Math.min(prev + 1, items.length - 1))
  }

  const handleSwipeRight = () => {
    const item = items[currentIndex]
    onSwipeRight?.(item, currentIndex)
    setCurrentIndex(prev => Math.min(prev + 1, items.length - 1))
  }

  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0))
  }

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(prev + 1, items.length - 1))
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No items to display</p>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      {/* Card Stack */}
      <div className="relative h-96 w-full">
        {items.slice(currentIndex, currentIndex + maxVisible).map((item, index) => {
          const actualIndex = currentIndex + index
          const isTop = index === 0
          
          return (
            <div
              key={actualIndex}
              className="absolute inset-0"
              style={{
                zIndex: maxVisible - index,
                transform: `scale(${1 - index * 0.05}) translateY(${index * 8}px)`,
                opacity: 1 - index * 0.2
              }}
            >
              {isTop ? (
                <SwipeCard
                  onSwipeLeft={handleSwipeLeft}
                  onSwipeRight={handleSwipeRight}
                  disabled={!isMobile}
                >
                  {renderCard(item, actualIndex)}
                </SwipeCard>
              ) : (
                renderCard(item, actualIndex)
              )}
            </div>
          )
        })}
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center mt-4 space-x-2">
        {items.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              index === currentIndex ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Desktop navigation buttons */}
      {!isMobile && (
        <div className="flex justify-center space-x-4 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentIndex >= items.length - 1}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Mobile action buttons */}
      {isMobile && (
        <div className="flex justify-center space-x-8 mt-6">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-14 h-14 p-0 border-red-200 hover:bg-red-50"
            onClick={handleSwipeLeft}
            disabled={currentIndex >= items.length - 1}
          >
            <X className="w-6 h-6 text-red-500" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-14 h-14 p-0 border-green-200 hover:bg-green-50"
            onClick={handleSwipeRight}
            disabled={currentIndex >= items.length - 1}
          >
            <Heart className="w-6 h-6 text-green-500" />
          </Button>
        </div>
      )}
    </div>
  )
}

// Challenge card example component
export function ChallengeSwipeCard({ challenge }: { challenge: any }) {
  const { isMobile } = useEnhancedMobile()
  
  return (
    <Card className="w-full h-full">
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="secondary">{challenge.category}</Badge>
          <Badge variant="outline">{challenge.difficulty}</Badge>
        </div>
        
        <h3 className={cn(
          "font-bold mb-2",
          isMobile ? "text-xl" : "text-lg"
        )}>
          {challenge.title}
        </h3>
        
        <p className={cn(
          "text-muted-foreground flex-1",
          isMobile ? "text-base" : "text-sm"
        )}>
          {challenge.description}
        </p>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm">{challenge.participants} joined</span>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Stake</p>
            <p className="font-bold">${challenge.minStake} - ${challenge.maxStake}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Mobile-optimized grid component
export function ResponsiveGrid({ 
  children, 
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  className 
}: {
  children: React.ReactNode
  cols?: { mobile: number; tablet: number; desktop: number }
  className?: string
}) {
  const { isMobile, isTablet } = useEnhancedMobile()
  
  const gridCols = isMobile ? cols.mobile : isTablet ? cols.tablet : cols.desktop
  
  return (
    <div 
      className={cn(
        "grid gap-4",
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`
      }}
    >
      {children}
    </div>
  )
} 