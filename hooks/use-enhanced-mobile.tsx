"use client"

import { useState, useEffect, useCallback } from 'react'

// Mobile breakpoints
const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

interface MobileDetection {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouchDevice: boolean
  isIOS: boolean
  isAndroid: boolean
  orientation: 'portrait' | 'landscape'
  screenSize: {
    width: number
    height: number
  }
}

interface SwipeDirection {
  deltaX: number
  deltaY: number
  direction: 'left' | 'right' | 'up' | 'down' | null
  distance: number
}

// Enhanced mobile detection hook
export function useEnhancedMobile(): MobileDetection {
  const [detection, setDetection] = useState<MobileDetection>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    isIOS: false,
    isAndroid: false,
    orientation: 'landscape',
    screenSize: { width: 0, height: 0 }
  })

  const updateDetection = useCallback(() => {
    if (typeof window === 'undefined') return

    const width = window.innerWidth
    const height = window.innerHeight
    const userAgent = navigator.userAgent.toLowerCase()
    
    // Screen size detection
    const isMobile = width < MOBILE_BREAKPOINT
    const isTablet = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT
    const isDesktop = width >= TABLET_BREAKPOINT

    // Touch detection
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    // Platform detection
    const isIOS = /ipad|iphone|ipod/.test(userAgent)
    const isAndroid = /android/.test(userAgent)

    // Orientation detection
    const orientation = height > width ? 'portrait' : 'landscape'

    setDetection({
      isMobile,
      isTablet,
      isDesktop,
      isTouchDevice,
      isIOS,
      isAndroid,
      orientation,
      screenSize: { width, height }
    })
  }, [])

  useEffect(() => {
    updateDetection()
    
    const handleResize = () => updateDetection()
    const handleOrientationChange = () => {
      // Delay to ensure accurate measurements after orientation change
      setTimeout(updateDetection, 100)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [updateDetection])

  return detection
}

// Swipe gesture detection hook
export function useSwipeGesture(
  threshold: number = 50,
  timeout: number = 300
) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null)
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection | null>(null)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    })
    setSwipeDirection(null)
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStart.x
    const deltaY = touch.clientY - touchStart.y
    const deltaTime = Date.now() - touchStart.time
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // Check if swipe meets threshold and timing requirements
    if (distance > threshold && deltaTime < timeout) {
      let direction: 'left' | 'right' | 'up' | 'down' | null = null

      // Determine primary direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left'
      } else {
        direction = deltaY > 0 ? 'down' : 'up'
      }

      setSwipeDirection({
        deltaX,
        deltaY,
        direction,
        distance
      })
    }

    setTouchStart(null)
  }, [touchStart, threshold, timeout])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    // Prevent default to avoid scrolling during swipe
    e.preventDefault()
  }, [])

  return {
    swipeDirection,
    onTouchStart,
    onTouchEnd,
    onTouchMove,
    clearSwipe: () => setSwipeDirection(null)
  }
}

// Device-specific utilities
export function getDeviceInfo() {
  if (typeof window === 'undefined') return null

  const userAgent = navigator.userAgent
  
  // Detect specific devices/browsers
  const isChrome = /chrome/i.test(userAgent)
  const isSafari = /safari/i.test(userAgent) && !/chrome/i.test(userAgent)
  const isFirefox = /firefox/i.test(userAgent)
  const isEdge = /edge/i.test(userAgent)

  // Detect PWA mode (Safari standalone mode)
  const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true

  return {
    browser: isChrome ? 'chrome' : isSafari ? 'safari' : isFirefox ? 'firefox' : isEdge ? 'edge' : 'unknown',
    isPWA,
    userAgent
  }
}

// Responsive design utilities
export function useResponsiveValue<T>(
  mobileValue: T,
  tabletValue: T,
  desktopValue: T
): T {
  const { isMobile, isTablet } = useEnhancedMobile()
  
  if (isMobile) return mobileValue
  if (isTablet) return tabletValue
  return desktopValue
}
