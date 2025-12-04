"use client"

import { useState, useEffect, ReactNode } from "react"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
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
  showNextButton?: boolean // New prop to control Next button visibility
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
  showNextButton = true, // Default to true for backward compatibility
  className
}: SwipeableOnboardingLayoutProps) {
  const { isMobile } = useEnhancedMobile()
  const [isAnimating, setIsAnimating] = useState(false)

  const progressPercentage = ((currentStep + 1) / totalSteps) * 100

  return (
    <div
      className={cn("min-h-screen bg-background flex flex-col", className)}
      style={{
        paddingBottom: "calc(var(--bottom-nav-safe-space, 0px) + 80px)", // Add extra space for the navigation footer
        ['--bottom-cta-height' as any]: '80px',
      }}
    >
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

                        {/* Main Content */}
                  <div className="flex-1 relative">
                    {/* Content Container */}
                    <div className="max-w-2xl mx-auto px-4 py-8">
                      {children}
                    </div>
                  </div>

      {/* Navigation Footer */}
      <div
        className="bg-background/95 backdrop-blur border-t"
        style={{
          position: isMobile ? 'fixed' as const : 'sticky' as const,
          left: isMobile ? 0 : undefined,
          right: isMobile ? 0 : undefined,
          bottom: isMobile ? 'var(--bottom-nav-safe-space, 0px)' : undefined,
          marginTop: !isMobile ? 'auto' : undefined,
          zIndex: 60,
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
        }}
      >
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

            {/* Next Button - Only show if showNextButton is true */}
            {showNextButton ? (
              <Button
                onClick={onNext}
                disabled={!canGoNext || isAnimating}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <div /> // Spacer when Next button is hidden
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
