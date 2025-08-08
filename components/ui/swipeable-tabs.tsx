"use client"

import { useState, useEffect, ReactNode } from "react"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

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
  const [currentTab, setCurrentTab] = useState(value || defaultValue || tabs[0]?.value)

  useEffect(() => {
    if (value !== undefined) {
      setCurrentTab(value)
    }
  }, [value])

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

      {/* Tab Content */}
      <div className="relative mt-4">
        {tabs.map((tab) => (
          <TabsContent 
            key={tab.value} 
            value={tab.value}
            className={cn("transition-opacity duration-200", contentClassName)}
          >
            {tab.content}
          </TabsContent>
        ))}
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
