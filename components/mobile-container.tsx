"use client"

import { ReactNode } from "react"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { cn } from "@/lib/utils"

interface MobileContainerProps {
  children: ReactNode
  className?: string
  variant?: "default" | "full-width" | "card" | "modal"
  enableSwipe?: boolean
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}

export function MobileContainer({ 
  children, 
  className, 
  variant = "default",
  enableSwipe = false,
  onSwipeLeft,
  onSwipeRight
}: MobileContainerProps) {
  const { isMobile, isTouchDevice } = useEnhancedMobile()

  const getVariantClasses = () => {
    switch (variant) {
      case "full-width":
        return isMobile ? "px-0 py-0" : "container mx-auto px-6 py-8"
      case "card":
        return isMobile 
          ? "px-4 py-4 mx-2 bg-background rounded-lg" 
          : "container mx-auto px-6 py-8"
      case "modal":
        return isMobile 
          ? "px-4 py-4 max-w-[calc(100vw-2rem)] mx-auto" 
          : "max-w-2xl mx-auto px-6 py-4"
      case "default":
      default:
        return isMobile 
          ? "px-4 py-2 mobile-safe-width" 
          : "container mx-auto px-6 py-8"
    }
  }

  return (
    <div 
      className={cn(
        "w-full",
        getVariantClasses(),
        enableSwipe && isTouchDevice && "touch-manipulation select-none",
        className
      )}
    >
      {children}
    </div>
  )
}

// Specialized containers for common use cases
export function MobilePageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <MobileContainer variant="default" className={cn("min-h-screen", className)}>
      {children}
    </MobileContainer>
  )
}

export function MobileCardContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <MobileContainer 
      variant="card" 
      className={cn("shadow-sm border border-border", className)}
    >
      {children}
    </MobileContainer>
  )
}

export function MobileModalContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <MobileContainer 
      variant="modal" 
      className={cn("bg-background rounded-lg shadow-lg", className)}
    >
      {children}
    </MobileContainer>
  )
}

// Wrapper for sections that need mobile-optimized spacing
export function MobileSectionWrapper({ 
  children, 
  className, 
  title, 
  subtitle 
}: { 
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
}) {
  const { isMobile } = useEnhancedMobile()
  
  return (
    <section className={cn(
      "w-full",
      isMobile ? "space-y-4 mb-6" : "space-y-6 mb-8",
      className
    )}>
      {(title || subtitle) && (
        <div className={cn(
          "space-y-1",
          isMobile ? "px-4" : "px-0"
        )}>
          {title && (
            <h2 className={cn(
              "font-bold",
              isMobile ? "text-xl" : "text-2xl"
            )}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p className={cn(
              "text-muted-foreground",
              isMobile ? "text-sm" : "text-base"
            )}>
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className={cn(
        isMobile ? "px-4" : "px-0"
      )}>
        {children}
      </div>
    </section>
  )
} 