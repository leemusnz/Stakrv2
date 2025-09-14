'use client'

import { useEffect } from 'react'

export function PWARegistration() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered successfully:', registration.scope)
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error)
        })
    }

    // Check for updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker updated')
        // Optionally reload the page to get the new version
        // window.location.reload()
      })
    }
  }, [])

  return null
}
