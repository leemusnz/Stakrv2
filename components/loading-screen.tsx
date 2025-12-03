'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Logo } from './logo'

interface LoadingScreenProps {
  message?: string
  showLogo?: boolean
  className?: string
}

const loadingMessages = [
  "Initializing Core...",
  "Verifying Stakes...",
  "Syncing Challenges...",
  "Calibrating Rewards...",
  "Almost Ready..."
]

export function LoadingScreen({ 
  message = "Loading...", 
  showLogo = true,
  className = ""
}: LoadingScreenProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`flex items-center justify-center min-h-screen bg-background relative overflow-hidden ${className}`}>
      {/* Ambient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,96,54,0.05)_0%,transparent_70%)]" />
      
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Central Core Reactor */}
        <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
          {/* Pulsing Core */}
          <motion.div 
            className="absolute w-12 h-12 bg-[#F46036] rounded-full shadow-[0_0_30px_rgba(244,96,54,0.6)]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Inner Ring (Fast Spin) */}
          <motion.div 
            className="absolute w-16 h-16 border-2 border-[#F46036]/30 border-t-[#F46036] rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Outer Ring (Slow Counter-Spin) */}
          <motion.div 
            className="absolute w-24 h-24 border border-[#F46036]/10 border-b-[#F46036]/40 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />

          {/* Logo Overlay (Optional) */}
          {showLogo && (
            <div className="absolute inset-0 flex items-center justify-center opacity-20 scale-50">
              <Logo variant="icon" />
            </div>
          )}
        </div>

        {/* Tech Text */}
        <div className="space-y-2 text-center">
          <motion.p 
            key={currentMessageIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-[#F46036] font-mono text-sm font-bold tracking-widest uppercase"
          >
            {loadingMessages[currentMessageIndex]}
          </motion.p>
          
          <div className="h-1 w-32 bg-muted rounded-full overflow-hidden relative">
            <motion.div 
              className="absolute inset-y-0 left-0 bg-[#F46036] w-full"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Mobile-optimized version (just reuses main component with forced class)
export function MobileLoadingScreen(props: LoadingScreenProps) {
  return <LoadingScreen {...props} className="safe-area-top safe-area-bottom" />
}

// Splash screen for app launch - More dramatic
export function AppSplashScreen({ className = "" }: { className?: string }) {
  return <LoadingScreen className={className} />
}
