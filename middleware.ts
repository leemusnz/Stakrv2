import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // TEMPORARILY DISABLED - Testing SSL issue
  console.log('Middleware bypassed for SSL debugging')
  return NextResponse.next()
  
  /* COMMENTED OUT FOR SSL DEBUGGING
  // Check if this is the alpha gate page or alpha access API - always allow these
  if (
    request.nextUrl.pathname === '/alpha-gate' ||
    request.nextUrl.pathname === '/api/alpha-access'
  ) {
    return NextResponse.next()
  }

  // Allow static assets
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon') ||
    request.nextUrl.pathname.startsWith('/logos') ||
    request.nextUrl.pathname.startsWith('/public')
  ) {
    return NextResponse.next()
  }

  // Check for alpha access cookie
  const alphaAccess = request.cookies.get('alpha_access')
  
  if (!alphaAccess || alphaAccess.value !== 'true') {
    // For API routes, return 401 instead of redirect
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Alpha access required' }, 
        { status: 401 }
      )
    }
    
    // For pages, redirect to alpha gate
    return NextResponse.redirect(new URL('/alpha-gate', request.url))
  }

  // Allow access if they have the cookie
  return NextResponse.next()
  */
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