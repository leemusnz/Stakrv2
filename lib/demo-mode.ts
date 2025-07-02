// Safe demo data access based on explicit intent, not user identity
import { NextRequest } from 'next/server'

export interface DemoModeOptions {
  allowDevelopment?: boolean
  allowAdminPreview?: boolean
  allowDemoRoutes?: boolean
}

/**
 * Determines if demo data should be shown based on explicit intent
 * This replaces the unsafe isDemoUser() pattern
 */
export function shouldUseDemoData(
  request: NextRequest, 
  session: any,
  options: DemoModeOptions = {}
): boolean {
  const {
    allowDevelopment = true,
    allowAdminPreview = true,
    allowDemoRoutes = true
  } = options

  const url = request.nextUrl
  const searchParams = url.searchParams
  const pathname = url.pathname

  // 1. Development environment with explicit demo parameter
  if (allowDevelopment && process.env.NODE_ENV === 'development') {
    if (searchParams.get('demo') === 'true') {
      return true
    }
  }

  // 2. Admin preview mode in any environment
  if (allowAdminPreview && session?.user?.isAdmin) {
    if (searchParams.get('preview') === 'demo') {
      return true
    }
  }

  // 3. Dedicated demo routes (always show demo data)
  if (allowDemoRoutes && pathname.startsWith('/demo/')) {
    return true
  }

  // 4. Never show demo data for normal user flows
  return false
}

/**
 * Gets demo mode context for responses
 */
export function getDemoModeContext(request: NextRequest, session: any) {
  const isDemoMode = shouldUseDemoData(request, session)
  
  return {
    isDemoMode,
    demoReason: isDemoMode ? getDemoReason(request, session) : null
  }
}

/**
 * Explains why demo mode is active (for debugging/transparency)
 */
function getDemoReason(request: NextRequest, session: any): string {
  const url = request.nextUrl
  const searchParams = url.searchParams
  const pathname = url.pathname

  if (pathname.startsWith('/demo/')) {
    return 'demo_route'
  }
  
  if (searchParams.get('demo') === 'true' && process.env.NODE_ENV === 'development') {
    return 'development_parameter'
  }
  
  if (searchParams.get('preview') === 'demo' && session?.user?.isAdmin) {
    return 'admin_preview'
  }
  
  return 'unknown'
}

/**
 * Creates a demo-aware API response
 */
export function createDemoResponse(data: any, request: NextRequest, session: any) {
  const { isDemoMode, demoReason } = getDemoModeContext(request, session)
  
  return {
    ...data,
    demo: isDemoMode,
    demoReason: process.env.NODE_ENV === 'development' ? demoReason : undefined
  }
}

/**
 * Legacy compatibility - marks functions that still use old demo user pattern
 * TODO: Replace all usages with shouldUseDemoData
 */
export function isDemoUser(userId: string): boolean {
  console.warn('⚠️ isDemoUser() is deprecated. Use shouldUseDemoData() instead.')
  
  // For now, maintain compatibility but log usage
  const demoUserIds = [
    'demo-user-1',
    'demo-user-2', 
    'demo-user-3',
    'demo-user-4'
  ]
  
  return demoUserIds.includes(userId)
}

/**
 * Component hook for demo mode detection
 */
export function useDemoMode() {
  // Check URL for demo indicators
  const url = typeof window !== 'undefined' ? window.location : null
  
  if (!url) return { isDemoMode: false, demoReason: null }
  
  const searchParams = new URLSearchParams(url.search)
  const pathname = url.pathname
  
  const isDemoMode = 
    pathname.startsWith('/demo/') ||
    searchParams.get('demo') === 'true' ||
    searchParams.get('preview') === 'demo'
  
  return {
    isDemoMode,
    demoReason: isDemoMode ? 'client_detected' : null
  }
} 