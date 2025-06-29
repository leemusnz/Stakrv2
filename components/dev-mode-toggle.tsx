"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Settings,
  Bug,
  Code,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wrench,
  RefreshCw
} from "lucide-react"

interface DevModeToggleProps {
  className?: string
}

export function DevModeToggle({ className }: DevModeToggleProps) {
  const { data: session, status } = useSession()
  const [isDevMode, setIsDevMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if user has dev access
  const hasDevAccess = session?.user?.isDev || false
  const isAuthenticated = status === "authenticated"

  useEffect(() => {
    // Initialize dev mode state from session
    if (session?.user?.devModeEnabled) {
      setIsDevMode(session.user.devModeEnabled)
    }
  }, [session])

  const toggleDevMode = async () => {
    if (!hasDevAccess) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/user/dev-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: !isDevMode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle dev mode')
      }

      setIsDevMode(data.user.devModeEnabled)
      
      // Force session update
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle dev mode')
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return null
  }

  // Don't render anything if user doesn't have dev access
  if (!hasDevAccess) {
    return null
  }

  return (
    <Card className={`border-blue-200 bg-blue-50/50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-blue-700">
          <Wrench className="w-5 h-5" />
          🛠️ Developer Mode
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="dev-mode" className="text-sm font-medium">
              Dev Mode Status
            </Label>
            <Badge variant={isDevMode ? "default" : "secondary"} className="flex items-center gap-1">
              {isDevMode ? (
                <>
                  <CheckCircle className="w-3 h-3" />
                  Enabled
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3" />
                  Disabled
                </>
              )}
            </Badge>
          </div>
          
          <Switch
            id="dev-mode"
            checked={isDevMode}
            onCheckedChange={toggleDevMode}
            disabled={isLoading}
          />
        </div>

        <Separator />

        {/* Features When Enabled */}
        {isDevMode && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Active Dev Features
            </h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-3 h-3" />
                <span>Verification Testing Panel</span>
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-3 h-3" />
                <span>Mock Data Toggle</span>
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-3 h-3" />
                <span>API Debug Console</span>
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-3 h-3" />
                <span>Database Testing Tools</span>
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-3 h-3" />
                <span>Component State Inspector</span>
              </div>
            </div>
          </div>
        )}

        {/* Dev Access Info */}
        <Alert>
          <Bug className="h-4 w-4" />
          <AlertDescription className="text-xs">
            You have developer access. Use dev mode to access testing tools and debugging features.
            {!isDevMode && " Toggle on to enable dev tools throughout the app."}
          </AlertDescription>
        </Alert>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Button */}
        <Button
          onClick={toggleDevMode}
          disabled={isLoading}
          variant={isDevMode ? "outline" : "default"}
          className="w-full flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              {isDevMode ? "Disabling..." : "Enabling..."}
            </>
          ) : (
            <>
              <Code className="w-4 h-4" />
              {isDevMode ? "Disable Dev Mode" : "Enable Dev Mode"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// Hook to check if dev mode is enabled
export function useDevMode() {
  const { data: session } = useSession()
  
  return {
    hasDevAccess: session?.user?.isDev || false,
    isDevModeEnabled: session?.user?.devModeEnabled || false,
    isDevUser: session?.user?.isDev || false
  }
} 