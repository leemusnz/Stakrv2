// Service Worker for Stakr PWA
// Auto-versioned to force cache invalidation on updates
const CACHE_NAME = 'stakr-v2.0.0-' + Date.now()
// Bump when cache policy changes (v3: never intercept /api — was caching /api/auth/session).
const STATIC_CACHE = 'stakr-static-v3'

const staticAssets = [
  '/manifest.json',
  '/logos/stakr-icon.png',
  '/logos/stakr-icon-white.png',
  '/logos/stakr-full.png',
  '/logos/stakr-full-white.png'
]

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...')
  // Skip waiting to activate immediately
  self.skipWaiting()
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching static assets')
        return cache.addAll(staticAssets)
      })
      .catch((error) => {
        console.error('❌ Failed to cache static assets:', error)
      })
  )
})

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated')
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      // Take control of all clients immediately
      clients.claim()
    ])
  )
})

// Fetch event - NETWORK FIRST for HTML, cache for assets
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  const pathname = new URL(event.request.url).pathname
  // Never intercept API traffic. Cache-first for /api/auth/session returned a stale
  // unauthenticated JSON body after login, breaking NextAuth getSession() on the client.
  if (pathname.startsWith('/api/')) {
    return
  }

  // NETWORK-FIRST for HTML documents (pages)
  if (event.request.destination === 'document' || 
      event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the fresh HTML for offline fallback
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
          return response
        })
        .catch(() => {
          // Offline: try cache, then fallback to root
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/')
          })
        })
    )
    return
  }

  // CACHE-FIRST for static assets (images, fonts, etc.)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response
        }
        // Not in cache: fetch from network and cache it
        return fetch(event.request).then((response) => {
          // Only cache successful responses
          if (response && response.status === 200) {
            const responseClone = response.clone()
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, responseClone)
            })
          }
          return response
        })
      })
  )
})

// Handle PWA install prompt
self.addEventListener('beforeinstallprompt', (event) => {
  console.log('📱 PWA install prompt triggered')
  // Prevent the mini-infobar from appearing on mobile
  event.preventDefault()
  
  // Store the event for later use
  self.deferredPrompt = event
  
  // Dispatch custom event to notify the app
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'PWA_INSTALL_PROMPT',
        event: 'beforeinstallprompt'
      })
    })
  })
})

// Handle PWA installed event
self.addEventListener('appinstalled', (event) => {
  console.log('🎉 PWA installed successfully!')
  
  // Clear the deferred prompt
  self.deferredPrompt = null
  
  // Notify the app
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'PWA_INSTALLED',
        event: 'appinstalled'
      })
    })
  })
})

// Handle messages from clients (e.g., SKIP_WAITING command)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏩ Client requested skip waiting - activating new service worker')
    self.skipWaiting()
  }
})
