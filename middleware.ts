import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Skip middleware for certain paths that should always be accessible
  const { pathname } = request.nextUrl
  
  // Always allow these paths
  if (
    pathname === '/alpha-gate' ||
    pathname === '/api/alpha-access' ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/logos/') ||
    pathname.startsWith('/public/') ||
    pathname === '/manifest.json'
  ) {
    return NextResponse.next()
  }

  // Check for alpha access cookie
  const alphaAccess = request.cookies.get('alpha_access')
  
  // If no valid alpha access
  if (!alphaAccess || alphaAccess.value !== 'true') {
    // For API routes, return 401 instead of redirect
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Alpha access required' }, 
        { status: 401 }
      )
    }
    
    // For pages, redirect to alpha gate (preserve protocol and host)
    const url = new URL('/alpha-gate', request.url)
    return NextResponse.redirect(url)
  }

  // Allow access if they have the valid cookie
  return NextResponse.next()
}

export const config = {
  // Match all paths except static files and specific API routes
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 