"use client"

import { Heart, X, Bookmark, MessageCircle, Share2, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface SwipeIndicatorsProps {
  direction: 'left' | 'right' | 'up' | 'down' | null
  distance: number
  type?: 'discovery' | 'social' | 'navigation'
  className?: string
}

export function SwipeIndicators({ 
  direction, 
  distance, 
  type = 'discovery', 
  className 
}: SwipeIndicatorsProps) {
  const opacity = Math.min(Math.max(distance / 100, 0), 1)
  const scale = 0.8 + (opacity * 0.2) // Scale from 0.8 to 1.0
  
  const getIndicatorContent = (dir: string) => {
    switch (type) {
      case 'discovery':
        switch (dir) {
          case 'right':
            return {
              icon: <Heart className="w-6 h-6 text-white fill-white" />,
              bg: "bg-green-500",
              text: "Join Challenge"
            }
          case 'left':
            return {
              icon: <X className="w-6 h-6 text-white" />,
              bg: "bg-red-500", 
              text: "Pass"
            }
          case 'up':
            return {
              icon: <Bookmark className="w-6 h-6 text-white fill-white" />,
              bg: "bg-blue-500",
              text: "Bookmark"
            }
          default:
            return null
        }
      
      case 'social':
        switch (dir) {
          case 'right':
            return {
              icon: <Heart className="w-5 h-5 text-white fill-white" />,
              bg: "bg-red-500",
              text: "Like"
            }
          case 'left':
            return {
              icon: <MessageCircle className="w-5 h-5 text-white" />,
              bg: "bg-blue-500",
              text: "Comment"
            }
          default:
            return null
        }
      
      case 'navigation':
        switch (dir) {
          case 'left':
            return {
              icon: <ChevronRight className="w-6 h-6 text-white" />,
              bg: "bg-primary",
              text: "Next"
            }
          case 'right':
            return {
              icon: <ChevronLeft className="w-6 h-6 text-white" />,
              bg: "bg-muted-foreground",
              text: "Previous"
            }
          default:
            return null
        }
      
      default:
        return null
    }
  }

  const content = direction ? getIndicatorContent(direction) : null
  
  if (!content || !direction) return null

  const positionClasses = {
    right: "absolute right-4 top-1/2 -translate-y-1/2",
    left: "absolute left-4 top-1/2 -translate-y-1/2", 
    up: "absolute top-4 left-1/2 -translate-x-1/2",
    down: "absolute bottom-4 left-1/2 -translate-x-1/2"
  }

  return (
    <div 
      className={cn(
        positionClasses[direction],
        "transition-all duration-200 pointer-events-none z-10",
        className
      )}
      style={{ 
        opacity,
        transform: `${positionClasses[direction].includes('translate') ? '' : 'translate(-50%, -50%) '}scale(${scale})`
      }}
    >
      <div className={cn(
        "rounded-full p-3 shadow-lg backdrop-blur-sm",
        content.bg,
        "border-2 border-white/20"
      )}>
        {content.icon}
      </div>
      
      {/* Text label */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2">
        <div className="bg-black/80 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
          {content.text}
        </div>
      </div>
    </div>
  )
}

// Specialized swipe indicators for different contexts
export function DiscoverySwipeIndicators({ direction, distance }: { direction: string | null, distance: number }) {
  return (
    <SwipeIndicators 
      direction={direction as any}
      distance={distance}
      type="discovery"
    />
  )
}

export function SocialSwipeIndicators({ direction, distance }: { direction: string | null, distance: number }) {
  return (
    <SwipeIndicators 
      direction={direction as any}
      distance={distance}
      type="social"
    />
  )
}

export function NavigationSwipeIndicators({ direction, distance }: { direction: string | null, distance: number }) {
  return (
    <SwipeIndicators 
      direction={direction as any}
      distance={distance}
      type="navigation"
    />
  )
} 