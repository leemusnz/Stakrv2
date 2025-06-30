import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Missing',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Missing',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'Set' : 'Missing',
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Missing',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Missing',
      AWS_REGION: process.env.AWS_REGION || 'Not set',
      AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME || 'Not set',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing',
    }

    const missing = Object.entries(envCheck)
      .filter(([key, value]) => value === 'Missing')
      .map(([key]) => key)

    return NextResponse.json({
      success: missing.length === 0,
      environment: envCheck,
      missing: missing,
      message: missing.length === 0 
        ? 'All environment variables are set!' 
        : `Missing: ${missing.join(', ')}`
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check environment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 