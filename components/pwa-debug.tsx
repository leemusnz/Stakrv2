'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export function PWADebug() {
  const [pwaStatus, setPwaStatus] = useState({
    hasServiceWorker: false,
    isPWA: false,
    hasManifest: false,
    hasInstallPrompt: false,
    canInstall: false,
    userAgent: '',
    displayMode: ''
  })

  useEffect(() => {
    const checkPWAStatus = async () => {
      const status = {
        hasServiceWorker: 'serviceWorker' in navigator,
        isPWA: window.matchMedia('(display-mode: standalone)').matches || 
               (window.navigator as any).standalone === true,
        hasManifest: document.querySelector('link[rel="manifest"]') !== null,
        hasInstallPrompt: false,
        canInstall: false,
        userAgent: navigator.userAgent,
        displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
      }

      // Check if install prompt is available
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration()
          status.hasServiceWorker = !!registration
        } catch (error) {
          console.error('Error checking service worker:', error)
        }
      }

      // Check if beforeinstallprompt event is available
      window.addEventListener('beforeinstallprompt', () => {
        status.hasInstallPrompt = true
        status.canInstall = true
        setPwaStatus({ ...status })
      })

      setPwaStatus(status)
    }

    checkPWAStatus()
  }, [])

  const triggerInstallPrompt = async () => {
    // This would normally be handled by the PWAInstallPrompt component
    console.log('Install prompt triggered')
  }

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card className="bg-background/95 backdrop-blur border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">PWA Debug Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span>Service Worker:</span>
            <Badge variant={pwaStatus.hasServiceWorker ? "default" : "destructive"}>
              {pwaStatus.hasServiceWorker ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Manifest:</span>
            <Badge variant={pwaStatus.hasManifest ? "default" : "destructive"}>
              {pwaStatus.hasManifest ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span>PWA Mode:</span>
            <Badge variant={pwaStatus.isPWA ? "default" : "secondary"}>
              {pwaStatus.displayMode}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Install Prompt:</span>
            <Badge variant={pwaStatus.hasInstallPrompt ? "default" : "secondary"}>
              {pwaStatus.hasInstallPrompt ? "Available" : "Not Available"}
            </Badge>
          </div>

          {pwaStatus.canInstall && (
            <Button onClick={triggerInstallPrompt} size="sm" className="w-full text-xs">
              Trigger Install
            </Button>
          )}

          <div className="text-xs text-muted-foreground">
            Browser: {pwaStatus.userAgent.includes('Chrome') ? 'Chrome' : 
                     pwaStatus.userAgent.includes('Safari') ? 'Safari' : 
                     pwaStatus.userAgent.includes('Firefox') ? 'Firefox' : 'Other'}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
