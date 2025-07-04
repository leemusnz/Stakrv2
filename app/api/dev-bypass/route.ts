import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Only allow in development or preview environments
  const hostname = request.nextUrl.hostname
  const isDevEnvironment = 
    process.env.NODE_ENV === 'development' ||
    hostname.includes('v0.dev') ||
    hostname.includes('vercel.app') ||
    hostname.includes('localhost')

  if (!isDevEnvironment) {
    return NextResponse.json({ 
      error: 'This endpoint is only available in development/preview environments' 
    }, { status: 403 })
  }

  // Create response and set alpha access cookie
  const response = NextResponse.json({
    success: true,
    message: 'Alpha access granted for development/preview',
    environment: {
      hostname,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }
  })

  // Set the alpha access cookie
  response.cookies.set('alpha_access', 'true', {
    httpOnly: false,
    secure: hostname !== 'localhost',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  })

  return response
}

export async function POST(request: NextRequest) {
  return GET(request) // Same functionality
} 