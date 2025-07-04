import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check critical NextAuth environment variables
    const envCheck = {
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
    }

    const missing = Object.entries(envCheck)
      .filter(([key, value]) => !value)
      .map(([key]) => key)

    const status = missing.length === 0 ? 'healthy' : 'missing_variables'

    return NextResponse.json({
      status,
      environment: process.env.NODE_ENV,
      envVariables: envCheck,
      missing,
      recommendations: missing.length > 0 ? [
        'Set missing environment variables in your deployment platform',
        'For v0.dev: Check if environment variables are properly configured',
        'For local dev: Create .env.local file with required variables',
        'Minimum required: NEXTAUTH_SECRET, NEXTAUTH_URL, DATABASE_URL'
      ] : ['All required environment variables are set'],
      nextAuthUrls: {
        expected: process.env.NEXTAUTH_URL || 'Not set',
        currentDomain: request.nextUrl.origin
      }
    })

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to check authentication configuration'
    }, { status: 500 })
  }
} 