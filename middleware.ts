import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { nextAuthSecret } from '@/lib/nextauth-secret'

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/my-challenges',
  '/my-active', 
  '/create-challenge',
  '/profile',
  '/settings',
  '/wallet',
  '/notifications',
  '/social',
  '/discover',
  '/challenge',
  '/creator',
  '/brand'
]

// Routes that don't require email verification (even when authenticated)
const verificationExemptRoutes = [
  '/auth/verify-email',
  '/auth/signin',
  '/auth/suspended',
  '/api/auth',
  '/onboarding'
]

// Routes that bypass the alpha gate
const alphaGateExemptRoutes = [
  '/alpha-gate',
  '/api/alpha-access',
  '/api/dev-bypass',
  '/api/auth',
  '/api/test', // AI system testing endpoints
  '/_next',
  '/favicon'
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
  }
  
  // Skip middleware for API routes, static files, and auth routes
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    if (process.env.NODE_ENV === 'development') {
    }
    return NextResponse.next()
  }

  // 🔒 ALPHA GATE ENFORCEMENT
  // Check if this route should bypass the alpha gate
  const isAlphaGateExempt = alphaGateExemptRoutes.some(route => 
    pathname.startsWith(route)
  )

  if (!isAlphaGateExempt) {
    // Check for alpha access cookie
    const alphaAccess = request.cookies.get('alpha_access')
    const hasAlphaAccess = alphaAccess?.value === 'true'

    if (!hasAlphaAccess) {
      const alphaGateUrl = new URL('/alpha-gate', request.url)
      return NextResponse.redirect(alphaGateUrl)
    }

    if (process.env.NODE_ENV === 'development') {
    }
  }

  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Get the user's session token for all routes (needed for onboarding redirect)
  const token = await getToken({
    req: request,
    secret: nextAuthSecret(),
  })

  // Redirect authenticated users who have completed onboarding away from onboarding to dashboard
  if (pathname.startsWith('/onboarding') && token && token.onboardingCompleted) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // If no token, redirect to sign in
  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Check if email verification is required and user is not verified
  const isVerificationExempt = verificationExemptRoutes.some(route =>
    pathname.startsWith(route)
  )

  // If user is not email verified and not on exempt route, redirect to verification
  if (!isVerificationExempt && !token.emailVerified) {
    const verifyUrl = new URL('/auth/verify-email', request.url)
    verifyUrl.searchParams.set('email', token.email as string)
    verifyUrl.searchParams.set('from', 'access-blocked')
    return NextResponse.redirect(verifyUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (All API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/|_next/static|_next/image|favicon.ico).*)',
  ],
}
