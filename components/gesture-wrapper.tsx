"use client"

import { ReactNode, useRef, useState, useEffect } from "react"
import { useEnhancedMobile, useSwipeGesture } from "@/hooks/use-enhanced-mobile"
import { cn } from "@/lib/utils"

interface SwipeAction {
  direction: "left" | "right" | "up" | "down"
  icon?: ReactNode
  label?: string
  color?: string
  onAction: () => void
  threshold?: number
}

interface GestureWrapperProps {
  children: ReactNode
  className?: string
  swipeActions?: SwipeAction[]
  onTap?: () => void
  onDoubleTap?: () => void
  onLongPress?: () => void
  enableFeedback?: boolean
  disabled?: boolean
}

export function GestureWrapper({
  children,
  className,
  swipeActions = [],
  onTap,
  onDoubleTap,
  onLongPress,
  enableFeedback = true,
  disabled = false
}: GestureWrapperProps) {
  const { isMobile, isTouchDevice } = useEnhancedMobile()
  const [isPressed, setIsPressed] = useState(false)
  const [lastTap, setLastTap] = useState(0)
  const [activeSwipeAction, setActiveSwipeAction] = useState<SwipeAction | null>(null)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  
  const { swipeDirection, onTouchStart, onTouchEnd, onTouchMove, clearSwipe } = useSwipeGesture(80, 300)

  // Handle swipe actions
  useEffect(() => {
    if (!swipeDirection || !swipeActions.length) return

    const { direction, distance } = swipeDirection
    const action = swipeActions.find(a => a.direction === direction)
    
    if (action && distance > (action.threshold || 120)) {
      // Haptic feedback
      if (enableFeedback && navigator.vibrate) {
        navigator.vibrate(50)
      }
      
      setActiveSwipeAction(action)
      
      // Execute action after animation
      setTimeout(() => {
        action.onAction()
        setActiveSwipeAction(null)
        clearSwipe()
      }, 200)
    }
  }, [swipeDirection, swipeActions, enableFeedback, clearSwipe])

  // Handle touch interactions
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return
    
    setIsPressed(true)
    
    // Long press detection
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        if (enableFeedback && navigator.vibrate) {
          navigator.vibrate([100, 50, 100])
        }
        onLongPress()
        setIsPressed(false)
      }, 500)
    }
    
    onTouchStart?.(e)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (disabled) return
    
    setIsPressed(false)
    
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    // Handle tap and double tap
    const now = Date.now()
    const timeDiff = now - lastTap
    
    if (timeDiff < 300 && onDoubleTap) {
      // Double tap
      if (enableFeedback && navigator.vibrate) {
        navigator.vibrate(30)
      }
      onDoubleTap()
      setLastTap(0)
    } else if (onTap) {
      // Single tap (delayed to allow for double tap detection)
      setTimeout(() => {
        if (Date.now() - now > 250) return // Double tap occurred
        if (enableFeedback && navigator.vibrate) {
          navigator.vibrate(10)
        }
        onTap()
      }, 300)
      setLastTap(now)
    }
    
    onTouchEnd?.(e)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled) return
    
    // Clear long press if user moves finger
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    
    onTouchMove?.(e)
  }

  // Calculate transform based on swipe
  let transform = ""
  let opacity = 1
  
  if (swipeDirection && swipeActions.length > 0) {
    const { direction, distance } = swipeDirection
    const action = swipeActions.find(a => a.direction === direction)
    
    if (action) {
      const maxDistance = 200
      const normalizedDistance = Math.min(distance, maxDistance)
      
      switch (direction) {
        case "left":
          transform = `translateX(-${normalizedDistance * 0.5}px) rotate(-${normalizedDistance * 0.1}deg)`
          break
        case "right":
          transform = `translateX(${normalizedDistance * 0.5}px) rotate(${normalizedDistance * 0.1}deg)`
          break
        case "up":
          transform = `translateY(-${normalizedDistance * 0.5}px)`
          break
        case "down":
          transform = `translateY(${normalizedDistance * 0.5}px)`
          break
      }
      
      opacity = 1 - (normalizedDistance / maxDistance) * 0.5
    }
  }

  if (!isTouchDevice) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      className={cn(
        "relative transition-all duration-200 ease-out",
        isPressed && "scale-95",
        activeSwipeAction && "opacity-50",
        className
      )}
      style={{ transform, opacity }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      {children}
      
      {/* Swipe Action Indicators */}
      {swipeDirection && swipeActions.length > 0 && (
        <SwipeActionIndicators 
          swipeDirection={swipeDirection}
          actions={swipeActions}
        />
      )}
    </div>
  )
}

// Swipe Action Indicators Component
function SwipeActionIndicators({
  swipeDirection,
  actions
}: {
  swipeDirection: any
  actions: SwipeAction[]
}) {
  const { direction, distance } = swipeDirection
  const action = actions.find(a => a.direction === direction)
  
  if (!action || distance < 50) return null

  const isActive = distance > (action.threshold || 120)
  
  return (
    <div className={cn(
      "absolute inset-0 flex items-center justify-center",
      "pointer-events-none z-10",
      direction === "left" && "justify-start pl-4",
      direction === "right" && "justify-end pr-4"
    )}>
      <div className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full",
        "bg-background/90 backdrop-blur-sm border shadow-lg",
        "transition-all duration-200",
        isActive ? "scale-110 bg-primary text-primary-foreground" : "scale-100"
      )}>
        {action.icon && (
          <span className="text-lg">{action.icon}</span>
        )}
        {action.label && (
          <span className="text-sm font-medium">{action.label}</span>
        )}
      </div>
    </div>
  )
}

// Swipeable List Item Component
export function SwipeableListItem({
  children,
  onEdit,
  onDelete,
  onArchive,
  onShare,
  className
}: {
  children: ReactNode
  onEdit?: () => void
  onDelete?: () => void
  onArchive?: () => void
  onShare?: () => void
  className?: string
}) {
  const swipeActions: SwipeAction[] = []
  
  if (onDelete) {
    swipeActions.push({
      direction: "left",
      icon: "🗑️",
      label: "Delete",
      color: "red",
      onAction: onDelete,
      threshold: 100
    })
  }
  
  if (onEdit) {
    swipeActions.push({
      direction: "right",
      icon: "✏️",
      label: "Edit",
      color: "blue",
      onAction: onEdit,
      threshold: 100
    })
  }
  
  if (onArchive) {
    swipeActions.push({
      direction: "up",
      icon: "📦",
      label: "Archive",
      color: "gray",
      onAction: onArchive,
      threshold: 80
    })
  }
  
  if (onShare) {
    swipeActions.push({
      direction: "down",
      icon: "📤",
      label: "Share",
      color: "green",
      onAction: onShare,
      threshold: 80
    })
  }

  return (
    <GestureWrapper
      swipeActions={swipeActions}
      className={cn(
        "bg-background border rounded-lg overflow-hidden",
        "touch-manipulation select-none",
        className
      )}
    >
      {children}
    </GestureWrapper>
  )
}

// Interactive Card Component
export function InteractiveCard({
  children,
  onTap,
  onDoubleTap,
  onLongPress,
  swipeActions,
  className
}: {
  children: ReactNode
  onTap?: () => void
  onDoubleTap?: () => void
  onLongPress?: () => void
  swipeActions?: SwipeAction[]
  className?: string
}) {
  return (
    <GestureWrapper
      onTap={onTap}
      onDoubleTap={onDoubleTap}
      onLongPress={onLongPress}
      swipeActions={swipeActions}
      className={cn(
        "bg-background border rounded-lg overflow-hidden",
        "touch-manipulation select-none cursor-pointer",
        "transition-all duration-200 hover:shadow-md",
        className
      )}
    >
      {children}
    </GestureWrapper>
  )
}
