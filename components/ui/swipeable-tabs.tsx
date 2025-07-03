"use client"

import { useState, useEffect, ReactNode } from "react"
import { useSwipeGesture, useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface SwipeableTab {
  value: string
  label: string
  content: ReactNode
  disabled?: boolean
}

interface SwipeableTabsProps {
  tabs: SwipeableTab[]
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  tabsListClassName?: string
  contentClassName?: string
  orientation?: "horizontal" | "vertical"
}

export function SwipeableTabs({
  tabs,
  defaultValue,
  value,
  onValueChange,
  className,
  tabsListClassName,
  contentClassName,
  orientation = "horizontal"
}: SwipeableTabsProps) {
  const { isMobile } = useEnhancedMobile()
  const { swipeDirection, onTouchStart, onTouchEnd, onTouchMove } = useSwipeGesture(100, 400)
  const [currentTab, setCurrentTab] = useState(value || defaultValue || tabs[0]?.value)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (value !== undefined) {
      setCurrentTab(value)
    }
  }, [value])

  useEffect(() => {
    if (!swipeDirection || !isMobile || isAnimating) return

    const { direction, distance } = swipeDirection
    const currentIndex = tabs.findIndex(tab => tab.value === currentTab)
    
    if (distance > 120) {
      setIsAnimating(true)
      
      let newIndex = currentIndex
      
      if (direction === 'left' && currentIndex < tabs.length - 1) {
        // Swipe left = next tab
        newIndex = currentIndex + 1
      } else if (direction === 'right' && currentIndex > 0) {
        // Swipe right = previous tab
        newIndex = currentIndex - 1
      }
      
      if (newIndex !== currentIndex && !tabs[newIndex]?.disabled) {
        const newValue = tabs[newIndex].value
        setCurrentTab(newValue)
        onValueChange?.(newValue)
      }
      
      setTimeout(() => setIsAnimating(false), 300)
    }
  }, [swipeDirection, isMobile, currentTab, tabs, onValueChange, isAnimating])

  const handleTabChange = (newValue: string) => {
    if (!tabs.find(tab => tab.value === newValue)?.disabled) {
      setCurrentTab(newValue)
      onValueChange?.(newValue)
    }
  }

  const currentIndex = tabs.findIndex(tab => tab.value === currentTab)

  return (
    <Tabs 
      value={currentTab} 
      onValueChange={handleTabChange}
      orientation={orientation}
      className={cn("w-full", className)}
    >
      {/* Tab List */}
      <TabsList className={cn("grid w-full", tabsListClassName)} style={{
        gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`
      }}>
        {tabs.map((tab) => (
          <TabsTrigger 
            key={tab.value} 
            value={tab.value}
            disabled={tab.disabled}
            className="relative"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Tab Content with Swipe Support */}
      <div 
        className={cn(
          "relative mt-4",
          isMobile && "touch-manipulation select-none",
          isAnimating && "pointer-events-none"
        )}
        onTouchStart={isMobile ? onTouchStart : undefined}
        onTouchEnd={isMobile ? onTouchEnd : undefined}
        onTouchMove={isMobile ? onTouchMove : undefined}
      >
        {tabs.map((tab) => (
          <TabsContent 
            key={tab.value} 
            value={tab.value}
            className={cn(
              "transition-opacity duration-200",
              contentClassName,
              isAnimating && "opacity-60"
            )}
          >
            {tab.content}
          </TabsContent>
        ))}

        {/* Mobile Swipe Indicators */}
        {isMobile && tabs.length > 1 && (
          <div className="flex justify-center mt-4 gap-2">
            {tabs.map((tab, index) => (
              <button
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                disabled={tab.disabled}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === currentIndex ? "bg-primary" : "bg-muted",
                  tab.disabled && "opacity-50 cursor-not-allowed"
                )}
              />
            ))}
          </div>
        )}

        {/* Mobile Swipe Hint */}
        {isMobile && tabs.length > 1 && currentIndex === 0 && (
          <div className="text-center mt-3">
            <p className="text-xs text-muted-foreground">
              💡 Swipe left for next tab • Tap to navigate
            </p>
          </div>
        )}
      </div>
    </Tabs>
  )
}

// Convenience hook for creating swipeable tabs
export function useSwipeableTabs(tabsData: SwipeableTab[], defaultValue?: string) {
  const [activeTab, setActiveTab] = useState(defaultValue || tabsData[0]?.value)
  
  return {
    activeTab,
    setActiveTab,
    tabs: tabsData
  }
}
