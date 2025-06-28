"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Filter, X } from "lucide-react"

interface FloatingFilterButtonProps {
  filterCount: number
  onOpenFilters: () => void
  activeFilters: Array<{ id: string; label: string; onRemove: () => void }>
}

export function FloatingFilterButton({ filterCount, onOpenFilters, activeFilters }: FloatingFilterButtonProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show floating button after scrolling past 200px (earlier than before)
      setIsVisible(window.scrollY > 200)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Always show if there are active filters, regardless of scroll position
  const shouldShow = isVisible || filterCount > 0

  if (!shouldShow) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3">
      {/* Active Filter Pills */}
      {activeFilters.length > 0 && (
        <div className="flex flex-col gap-2 items-end max-w-xs">
          {activeFilters.slice(0, 3).map((filter) => (
            <Badge
              key={filter.id}
              variant="secondary"
              className="flex items-center gap-1 bg-background/95 backdrop-blur-sm text-primary border-primary/20 shadow-lg animate-in slide-in-from-right-4"
            >
              {filter.label}
              <X
                className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors"
                onClick={filter.onRemove}
              />
            </Badge>
          ))}
          {activeFilters.length > 3 && (
            <Badge
              variant="outline"
              className="bg-background/95 backdrop-blur-sm text-muted-foreground border-muted-foreground/20 shadow-lg"
            >
              +{activeFilters.length - 3} more
            </Badge>
          )}
        </div>
      )}

      {/* Floating Filter Button */}
      <Button
        onClick={onOpenFilters}
        className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 relative group"
        size="lg"
      >
        <Filter className="w-6 h-6 group-hover:animate-pulse" />
        {filterCount > 0 && (
          <Badge className="absolute -top-2 -right-2 w-6 h-6 p-0 flex items-center justify-center bg-destructive text-white text-xs font-bold animate-pulse">
            {filterCount}
          </Badge>
        )}
      </Button>
    </div>
  )
}
