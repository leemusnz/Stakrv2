"use client"

import { useState, useEffect, ReactNode } from "react"
import { useSwipeGesture, useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { NavigationSwipeIndicators } from "@/components/ui/swipe-indicators"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface SwipeableOnboardingLayoutProps {
  children: ReactNode
  currentStep: number
  totalSteps: number
  stepId: string
  onNext: () => void
  onBack: () => void
  onSkip?: () => void
  canGoNext?: boolean
  canGoBack?: boolean
  showProgress?: boolean
  showBackButton?: boolean
  showSkipButton?: boolean
  className?: string
}

export function SwipeableOnboardingLayout({
  children,
  currentStep,
  totalSteps,
  stepId,
  onNext,
  onBack,
  onSkip,
  canGoNext = true,
  canGoBack = true,
  showProgress = true,
  showBackButton = true,
  showSkipButton = false,
  className
}: SwipeableOnboardingLayoutProps) {
  const { isMobile } = useEnhancedMobile()
  const { swipeDirection, onTouchStart, onTouchEnd, onTouchMove } = useSwipeGesture(100, 400)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (!swipeDirection || !isMobile) return

    const { direction, distance } = swipeDirection
    
    if (distance > 120) {
      setIsAnimating(true)
      
      if (direction === 'left' && canGoNext) {
        // Swipe left = go to next step
        setTimeout(() => {
          onNext()
          setIsAnimating(false)
        }, 150)
      } else if (direction === 'right' && canGoBack && currentStep > 0) {
        // Swipe right = go to previous step
        setTimeout(() => {
          onBack()
          setIsAnimating(false)
        }, 150)
      } else {
        setIsAnimating(false)
      }
    }
  }, [swipeDirection, isMobile, canGoNext, canGoBack, currentStep, onNext, onBack])

  const progressPercentage = ((currentStep + 1) / totalSteps) * 100

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Progress Header */}
      {showProgress && (
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {totalSteps}
              </span>
              {showSkipButton && onSkip && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSkip}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Skip
                </Button>
              )}
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      )}

      {/* Main Content with Swipe Support */}
      <div 
        className={cn(
          "flex-1 relative",
          isMobile && "touch-manipulation select-none",
          isAnimating && "pointer-events-none"
        )}
        onTouchStart={isMobile ? onTouchStart : undefined}
        onTouchEnd={isMobile ? onTouchEnd : undefined}
        onTouchMove={isMobile ? onTouchMove : undefined}
      >
        {/* Swipe Indicators for Mobile */}
        {isMobile && swipeDirection && (
          <NavigationSwipeIndicators 
            direction={swipeDirection.direction} 
            distance={swipeDirection.distance} 
          />
        )}

        {/* Content Container */}
        <div className={cn(
          "max-w-2xl mx-auto px-4 py-8",
          isAnimating && "transition-opacity duration-150 opacity-60"
        )}>
          {children}
        </div>

        {/* Mobile Swipe Hint */}
        {isMobile && currentStep === 0 && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30">
            <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm shadow-lg animate-pulse">
              💡 Swipe left for next step
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Back Button */}
            {showBackButton ? (
              <Button
                variant="outline"
                onClick={onBack}
                disabled={!canGoBack || currentStep === 0 || isAnimating}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
            ) : (
              <div /> // Spacer
            )}

            {/* Step Dots */}
            <div className="flex gap-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <button
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    i === currentStep ? "bg-primary" : "bg-muted",
                    i < currentStep && "bg-primary/60"
                  )}
                  onClick={() => {
                    // Allow jumping to completed steps
                    if (i < currentStep) {
                      const stepsBack = currentStep - i
                      for (let j = 0; j < stepsBack; j++) {
                        setTimeout(() => onBack(), j * 100)
                      }
                    }
                  }}
                />
              ))}
            </div>

            {/* Next Button */}
            <Button
              onClick={onNext}
              disabled={!canGoNext || isAnimating}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile Swipe Instructions */}
          {isMobile && (
            <div className="text-center mt-3">
              <p className="text-xs text-muted-foreground">
                Swipe left for next • Swipe right for previous
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
