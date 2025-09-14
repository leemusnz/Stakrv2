'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { X, Download, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
        return true
      }
      
      // Check for iOS Safari
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true)
        return true
      }
      
      return false
    }

    // Check if already installed
    if (checkIfInstalled()) {
      return
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('📱 PWA install prompt received')
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      console.log('🎉 PWA installed!')
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    // Listen for service worker messages
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data.type === 'PWA_INSTALL_PROMPT') {
        setShowPrompt(true)
      } else if (event.data.type === 'PWA_INSTALLED') {
        setIsInstalled(true)
        setShowPrompt(false)
      }
    }

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    
    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)
    }

    // Show prompt after a delay if not already installed
    const timer = setTimeout(() => {
      if (!checkIfInstalled() && !showPrompt) {
        // For iOS Safari, show custom install instructions
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
        
        if (isIOS && isSafari) {
          setShowPrompt(true)
        }
      }
    }, 3000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage)
      }
      clearTimeout(timer)
    }
  }, [showPrompt])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      // Show the install prompt
      await deferredPrompt.prompt()
      
      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice
      
      console.log(`📱 User ${outcome} the install prompt`)
      
      // Clear the deferred prompt
      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error('❌ Error showing install prompt:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDeferredPrompt(null)
  }

  // Don't show if already installed
  if (isInstalled) {
    return null
  }

  // Don't show if prompt is dismissed
  if (!showPrompt) {
    return null
  }

  // Check if it's iOS Safari (show custom instructions)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
  const isIOSSafari = isIOS && isSafari

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-background border border-border rounded-lg shadow-lg p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-sm">Install Stakr</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {isIOSSafari ? (
              <>
                Add Stakr to your home screen for quick access and a better experience.
              </>
            ) : (
              <>
                Install Stakr as an app for quick access and offline functionality.
              </>
            )}
          </p>

          {isIOSSafari ? (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>1. Tap the share button <span className="inline-block">📤</span></p>
              <p>2. Scroll down and tap "Add to Home Screen"</p>
              <p>3. Tap "Add" to install</p>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              Get the full app experience with notifications and offline access.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {!isIOSSafari && deferredPrompt && (
            <Button
              onClick={handleInstall}
              size="sm"
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Install
            </Button>
          )}
          <Button
            onClick={handleDismiss}
            variant="outline"
            size="sm"
            className={cn(deferredPrompt && !isIOSSafari ? "flex-1" : "w-full")}
          >
            {isIOSSafari ? "Got it" : "Not now"}
          </Button>
        </div>
      </div>
    </div>
  )
}
