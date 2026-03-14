'use client'

import { useEffect, useState } from 'react'
import { Button } from './ui/button'

export function PWARegistration() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('✅ Service Worker registered successfully:', reg.scope)
          setRegistration(reg)

          // Check for updates periodically (every 5 minutes)
          setInterval(() => {
            reg.update()
          }, 5 * 60 * 1000)

          // Listen for waiting service worker (new version available)
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                  console.log('🔄 New version available!')
                  setShowUpdatePrompt(true)
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error)
        })

      // Handle controller change (new SW took control)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker updated - reloading page')
        window.location.reload()
      })
    }
  }, [])

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Tell waiting SW to skip waiting and activate
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      setShowUpdatePrompt(false)
    }
  }

  if (!showUpdatePrompt) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 z-50 max-w-sm">
      <div className="bg-primary text-primary-foreground p-4 rounded-lg shadow-lg flex items-center justify-between gap-3">
        <div className="flex-1">
          <p className="font-semibold text-sm">Update Available</p>
          <p className="text-xs opacity-90">A new version of Stakr is ready!</p>
        </div>
        <Button 
          onClick={handleUpdate}
          variant="secondary"
          size="sm"
          className="shrink-0"
        >
          Update
        </Button>
      </div>
    </div>
  )
}
