'use client'

import { Logo } from './logo'

interface LoadingScreenProps {
  message?: string
  showLogo?: boolean
  className?: string
}

export function LoadingScreen({ 
  message = "Loading...", 
  showLogo = true,
  className = ""
}: LoadingScreenProps) {
  return (
    <div className={`flex items-center justify-center min-h-screen bg-background ${className}`}>
      <div className="text-center space-y-6 px-4">
        {showLogo && (
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Logo with subtle animation */}
              <div className="animate-pulse">
                <Logo variant="full" size="lg" theme="dark" />
              </div>
              {/* Spinning ring around logo */}
              <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin"></div>
            </div>
          </div>
        )}
        
        {/* Loading message */}
        <div className="space-y-2">
          <p className="text-lg font-medium text-foreground">{message}</p>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Mobile-optimized loading screen with proper centering
export function MobileLoadingScreen({ 
  message = "Loading...", 
  showLogo = true,
  className = ""
}: LoadingScreenProps) {
  return (
    <div className={`flex items-center justify-center min-h-screen bg-background safe-area-top safe-area-bottom ${className}`}>
      <div className="text-center space-y-6 px-6 max-w-sm mx-auto">
        {showLogo && (
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Optimized logo size for mobile */}
              <div className="animate-pulse">
                <Logo variant="icon" size="xl" theme="dark" />
              </div>
              {/* Subtle loading indicator */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary/30 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Mobile-optimized loading message */}
        <div className="space-y-3">
          <p className="text-base font-medium text-foreground leading-relaxed">{message}</p>
          <div className="flex justify-center">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Splash screen for app launch
export function AppSplashScreen({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 ${className}`}>
      <div className="text-center space-y-8 px-6">
        {/* Large centered logo */}
        <div className="flex justify-center">
          <div className="relative">
            <Logo variant="full" size="xl" theme="dark" />
            {/* Subtle glow effect */}
            <div className="absolute inset-0 rounded-lg bg-primary/10 blur-xl scale-110"></div>
          </div>
        </div>
        
        {/* App tagline */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Challenge-Based Self-Improvement</h1>
          <p className="text-muted-foreground">Build better habits through accountable challenges</p>
        </div>
        
        {/* Loading indicator */}
        <div className="flex justify-center">
          <div className="w-12 h-1 bg-primary/20 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
