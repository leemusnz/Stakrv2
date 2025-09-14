'use client'

import { useEffect } from 'react'

export function MobileAppOptimizer() {
  useEffect(() => {
    // Prevent zoom on form focus (iOS Safari)
    const preventZoom = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        const viewport = document.querySelector('meta[name="viewport"]')
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
        }
      }
    }

    // Restore zoom capability when not focused on form elements
    const restoreZoom = () => {
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes')
      }
    }

    // Add event listeners
    document.addEventListener('focusin', preventZoom)
    document.addEventListener('focusout', restoreZoom)

    // Set proper viewport height for mobile browsers
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    setViewportHeight()
    window.addEventListener('resize', setViewportHeight)
    window.addEventListener('orientationchange', setViewportHeight)

    // Cleanup
    return () => {
      document.removeEventListener('focusin', preventZoom)
      document.removeEventListener('focusout', restoreZoom)
      window.removeEventListener('resize', setViewportHeight)
      window.removeEventListener('orientationchange', setViewportHeight)
    }
  }, [])

  return null
}

// CSS-in-JS styles for mobile app optimization
export const mobileAppStyles = `
  /* Ensure proper mobile viewport handling */
  :root {
    --vh: 1vh;
  }

  /* Use dynamic viewport height */
  .min-h-screen {
    min-height: 100vh;
    min-height: calc(var(--vh, 1vh) * 100);
  }

  /* Prevent text selection on UI elements */
  .no-select {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  /* Improve touch targets */
  .touch-target {
    min-height: 44px;
    min-width: 44px;
    touch-action: manipulation;
  }

  /* Prevent bounce scrolling on iOS */
  .no-bounce {
    overscroll-behavior: none;
    -webkit-overflow-scrolling: touch;
  }

  /* Smooth scrolling for mobile */
  .smooth-scroll {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }

  /* Safe area handling */
  .safe-area-inset {
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }

  /* App-like appearance */
  .app-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
  }

  /* Loading screen optimizations */
  .loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Prevent flash of unstyled content */
  .app-loading {
    visibility: hidden;
  }

  .app-loaded {
    visibility: visible;
  }
`
