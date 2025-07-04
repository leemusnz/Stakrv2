"use client"

import { ReactNode, useState, useRef, useEffect } from "react"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Haptic feedback utility
export const haptic = {
  light: () => {
    if (navigator.vibrate) navigator.vibrate(10)
  },
  medium: () => {
    if (navigator.vibrate) navigator.vibrate(50)
  },
  heavy: () => {
    if (navigator.vibrate) navigator.vibrate(100)
  },
  success: () => {
    if (navigator.vibrate) navigator.vibrate([50, 30, 50])
  },
  error: () => {
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100])
  },
  selection: () => {
    if (navigator.vibrate) navigator.vibrate(25)
  }
}

// Animated Button Component
interface AnimatedButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
  disabled?: boolean
  hapticType?: "light" | "medium" | "heavy" | "success" | "error"
  animationType?: "bounce" | "scale" | "pulse" | "shake" | "glow"
}

export function AnimatedButton({
  children,
  onClick,
  variant = "default",
  size = "default",
  className,
  disabled = false,
  hapticType = "light",
  animationType = "scale"
}: AnimatedButtonProps) {
  const { isMobile } = useEnhancedMobile()
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = () => {
    if (disabled) return

    // Haptic feedback
    if (isMobile) {
      haptic[hapticType]()
    }

    // Animation
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 200)

    // Execute callback
    onClick?.()
  }

  const getAnimationClass = () => {
    if (!isAnimating) return ""
    
    switch (animationType) {
      case "bounce":
        return "animate-bounce"
      case "scale":
        return "animate-pulse scale-95"
      case "pulse":
        return "animate-ping"
      case "shake":
        return "animate-shake"
      case "glow":
        return "animate-pulse shadow-lg shadow-primary/50"
      default:
        return "scale-95"
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "transition-all duration-200 touch-manipulation",
        isMobile && "min-h-[48px]",
        getAnimationClass(),
        className
      )}
    >
      {children}
    </Button>
  )
}

// Floating Action Button
interface FloatingActionButtonProps {
  icon: ReactNode
  onClick: () => void
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "primary" | "secondary" | "success" | "danger"
}

export function FloatingActionButton({
  icon,
  onClick,
  className,
  size = "md",
  variant = "primary"
}: FloatingActionButtonProps) {
  const { isMobile } = useEnhancedMobile()
  const [isPressed, setIsPressed] = useState(false)

  if (!isMobile) return null

  const handleTouchStart = () => {
    setIsPressed(true)
    haptic.medium()
  }

  const handleTouchEnd = () => {
    setIsPressed(false)
    onClick()
  }

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "h-12 w-12"
      case "md":
        return "h-14 w-14"
      case "lg":
        return "h-16 w-16"
      default:
        return "h-14 w-14"
    }
  }

  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return "bg-primary hover:bg-primary/90 text-primary-foreground"
      case "secondary":
        return "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
      case "success":
        return "bg-green-500 hover:bg-green-600 text-white"
      case "danger":
        return "bg-red-500 hover:bg-red-600 text-white"
      default:
        return "bg-primary hover:bg-primary/90 text-primary-foreground"
    }
  }

  return (
    <button
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={cn(
        "fixed bottom-20 right-4 z-50",
        "rounded-full shadow-lg",
        "flex items-center justify-center",
        "transition-all duration-200 ease-out",
        "touch-manipulation select-none",
        getSizeClasses(),
        getVariantClasses(),
        isPressed ? "scale-90 shadow-md" : "scale-100 shadow-lg hover:scale-105",
        className
      )}
    >
      {icon}
    </button>
  )
}

// Ripple Effect Component
export function RippleButton({
  children,
  onClick,
  className,
  ...props
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
  [key: string]: any
}) {
  const [ripples, setRipples] = useState<Array<{
    id: number
    x: number
    y: number
    size: number
  }>>([])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const size = Math.max(rect.width, rect.height)

    const newRipple = {
      id: Date.now(),
      x,
      y,
      size
    }

    setRipples(prev => [...prev, newRipple])

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
    }, 600)

    haptic.light()
    onClick?.()
  }

  return (
    <button
      {...props}
      onClick={handleClick}
      className={cn(
        "relative overflow-hidden touch-manipulation",
        "transition-all duration-200",
        className
      )}
    >
      {children}
      
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full pointer-events-none animate-ping"
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
            animationDuration: '600ms'
          }}
        />
      ))}
    </button>
  )
}

// Swipe Progress Indicator
export function SwipeProgressIndicator({
  progress,
  direction,
  threshold = 100,
  className
}: {
  progress: number
  direction: "left" | "right" | "up" | "down"
  threshold?: number
  className?: string
}) {
  const progressPercentage = Math.min((progress / threshold) * 100, 100)
  const isComplete = progress >= threshold

  return (
    <div className={cn(
      "fixed z-50 pointer-events-none",
      direction === "left" && "left-4 top-1/2 -translate-y-1/2",
      direction === "right" && "right-4 top-1/2 -translate-y-1/2",
      direction === "up" && "top-4 left-1/2 -translate-x-1/2",
      direction === "down" && "bottom-4 left-1/2 -translate-x-1/2",
      className
    )}>
      <div className={cn(
        "bg-background/90 backdrop-blur-sm rounded-full p-3 border shadow-lg",
        "transition-all duration-200",
        isComplete ? "scale-110 bg-primary/20 border-primary" : "scale-100"
      )}>
        <div className={cn(
          "w-12 h-12 rounded-full border-4 border-muted relative",
          "transition-all duration-200",
          isComplete && "border-primary"
        )}>
          <div
            className={cn(
              "absolute inset-0 rounded-full transition-all duration-200",
              isComplete ? "bg-primary" : "bg-muted"
            )}
            style={{
              clipPath: `conic-gradient(from 0deg, transparent ${progressPercentage}%, currentColor ${progressPercentage}%)`
            }}
          />
          <div className={cn(
            "absolute inset-2 rounded-full bg-background flex items-center justify-center",
            "text-xs font-bold transition-colors duration-200",
            isComplete ? "text-primary" : "text-muted-foreground"
          )}>
            {Math.round(progressPercentage)}%
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading Skeleton with Pulse Animation
export function MobileLoadingSkeleton({
  lines = 3,
  showAvatar = false,
  className
}: {
  lines?: number
  showAvatar?: boolean
  className?: string
}) {
  return (
    <div className={cn("animate-pulse space-y-3", className)}>
      <div className="flex items-start gap-3">
        {showAvatar && (
          <div className="w-10 h-10 bg-muted rounded-full" />
        )}
        <div className="flex-1 space-y-2">
          {Array.from({ length: lines }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-4 bg-muted rounded",
                i === lines - 1 ? "w-2/3" : "w-full"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Success Animation Component
export function SuccessAnimation({
  show,
  onComplete,
  message = "Success!"
}: {
  show: boolean
  onComplete?: () => void
  message?: string
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      haptic.success()
      
      const timer = setTimeout(() => {
        setIsVisible(false)
        onComplete?.()
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-lg p-8 text-center space-y-4 animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
          <span className="text-2xl text-white">✓</span>
        </div>
        <h3 className="text-lg font-medium">{message}</h3>
      </div>
    </div>
  )
}

// Custom CSS for shake animation
const shakeKeyframes = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}
`

// Inject custom animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = shakeKeyframes
  document.head.appendChild(style)
}
