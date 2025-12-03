"use client"

import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  text?: string
  fullScreen?: boolean
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
}

export function LoadingSpinner({ 
  size = "md", 
  className,
  text,
  fullScreen = false 
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeMap[size])} />
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinner}
      </div>
    )
  }

  return spinner
}

/**
 * Loading overlay that covers a specific area
 */
export function LoadingOverlay({ 
  isLoading, 
  text,
  className 
}: { 
  isLoading: boolean
  text?: string
  className?: string 
}) {
  if (!isLoading) return null

  return (
    <div className={cn(
      "absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg",
      className
    )}>
      <LoadingSpinner text={text} />
    </div>
  )
}

/**
 * Skeleton loader for content placeholders
 */
export function SkeletonLoader({ 
  className,
  count = 1 
}: { 
  className?: string
  count?: number 
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse rounded-md bg-muted",
            className
          )}
        />
      ))}
    </>
  )
}

/**
 * Button with loading state
 */
export function LoadingButton({
  loading,
  children,
  className,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean
}) {
  return (
    <button
      className={className}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  )
}

