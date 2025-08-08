"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useEnhancedMobile } from '@/hooks/use-enhanced-mobile'
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

// Simple card component
export function SwipeCard({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  onSwipeUp, 
  onSwipeDown,
  className,
  disabled = false
}: SwipeCardProps) {
  const { isMobile } = useEnhancedMobile()

  return (
    <Card className={cn("transition-all duration-200", className)}>
      {children}
    </Card>
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
