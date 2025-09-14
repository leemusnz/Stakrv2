// Service Worker for Stakr PWA
const CACHE_NAME = 'stakr-v1.0.0'
const urlsToCache = [
  '/',
  '/manifest.json',
  '/logos/stakr-icon.png',
  '/logos/stakr-icon-white.png',
  '/logos/stakr-full.png',
  '/logos/stakr-full-white.png'
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching app resources')
        return cache.addAll(urlsToCache)
      })
      .catch((error) => {
        console.error('❌ Failed to cache resources:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
      .catch((error) => {
        console.error('❌ Fetch failed:', error)
        // Return offline page for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/')
        }
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
