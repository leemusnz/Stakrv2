import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Add CORS headers for v0.dev compatibility
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  try {
    // Safely get environment variables
    const getEnvVar = (name: string) => {
      try {
        return typeof process !== 'undefined' && process.env ? process.env[name] : undefined
      } catch {
        return undefined
      }
    }

    // Check critical NextAuth environment variables
    const envCheck = {
      NEXTAUTH_SECRET: !!getEnvVar('NEXTAUTH_SECRET'),
      NEXTAUTH_URL: !!getEnvVar('NEXTAUTH_URL'),
      GOOGLE_CLIENT_ID: !!getEnvVar('GOOGLE_CLIENT_ID'),
      GOOGLE_CLIENT_SECRET: !!getEnvVar('GOOGLE_CLIENT_SECRET'),
      DATABASE_URL: !!getEnvVar('DATABASE_URL'),
      NODE_ENV: getEnvVar('NODE_ENV') || 'unknown'
    }

    const missing = Object.entries(envCheck)
      .filter(([key, value]) => key !== 'NODE_ENV' && !value)
      .map(([key]) => key)

    const status = missing.length === 0 ? 'healthy' : 'missing_variables'

    // Safely get request information
    let currentDomain = 'unknown'
    let hostname = 'unknown'
    try {
      currentDomain = request.nextUrl?.origin || 'unknown'
      hostname = request.nextUrl?.hostname || 'unknown'
    } catch (e) {
      console.error('Error getting request URL:', e)
    }

    const responseData = {
      status,
      timestamp: new Date().toISOString(),
      environment: envCheck.NODE_ENV,
      hostname,
      envVariables: envCheck,
      missing,
      recommendations: missing.length > 0 ? [
        'Set missing environment variables in your deployment platform',
        'For v0.dev: Check if environment variables are properly configured',
        'For local dev: Create .env.local file with required variables',
        'Minimum required: NEXTAUTH_SECRET, NEXTAUTH_URL, DATABASE_URL'
      ] : ['All required environment variables are set'],
      nextAuthUrls: {
        expected: getEnvVar('NEXTAUTH_URL') || 'Not set',
        currentDomain
      },
      debug: {
        hasProcess: typeof process !== 'undefined',
        hasProcessEnv: typeof process !== 'undefined' && !!process.env,
        userAgent: request.headers?.get('user-agent') || 'unknown'
      }
    }

    return new NextResponse(JSON.stringify(responseData), {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Auth debug endpoint error:', error)
    
    const errorResponse = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to check authentication configuration',
      timestamp: new Date().toISOString(),
      debug: {
        errorType: error?.constructor?.name || 'unknown',
        hasProcess: typeof process !== 'undefined'
      }
    }

    return new NextResponse(JSON.stringify(errorResponse), {
      status: 500,
      headers
    })
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
