"use client"

import { useDemoMode } from '@/lib/demo-mode'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, AlertTriangle, ExternalLink } from 'lucide-react'

interface DemoModeIndicatorProps {
  variant?: 'banner' | 'inline' | 'badge'
  showActions?: boolean
  className?: string
}

export function DemoModeIndicator({ 
  variant = 'banner', 
  showActions = true,
  className = '' 
}: DemoModeIndicatorProps) {
  const { isDemoMode, demoReason } = useDemoMode()

  if (!isDemoMode) return null

  // Badge variant - minimal indicator
  if (variant === 'badge') {
    return (
      <Badge variant="outline" className={`bg-blue-50 text-blue-700 ${className}`}>
        <Eye className="w-3 h-3 mr-1" />
        Demo
      </Badge>
    )
  }

  // Inline variant - subtle warning
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-sm text-blue-600 ${className}`}>
        <Eye className="w-4 h-4" />
        <span>Viewing sample data</span>
        {showActions && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => window.location.href = window.location.pathname}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Real data
          </Button>
        )}
      </div>
    )
  }

  // Banner variant - full prominent indicator
  return (
    <Alert className={`border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 ${className}`}>
      <Eye className="h-4 w-4 text-blue-600" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-blue-900">
              🎭 Demo Mode Active
            </span>
            <Badge variant="secondary">Sample Data</Badge>
          </div>
          {showActions && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  const currentUrl = new URL(window.location.href)
                  currentUrl.searchParams.delete('demo')
                  currentUrl.searchParams.delete('preview')
                  window.location.href = currentUrl.toString()
                }}
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                Exit Demo
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.open('/discover', '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Browse Real
              </Button>
            </div>
          )}
        </div>
        <p className="text-sm text-blue-700 mt-2">
          You're viewing populated sample data for demonstration. 
          Real users will see their actual data and empty states when appropriate.
        </p>
      </AlertDescription>
    </Alert>
  )
}
