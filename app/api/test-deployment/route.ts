import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Set' : 'Missing',
    }

    const missing = Object.entries(envCheck)
      .filter(([key, value]) => value === 'Missing')
      .map(([key]) => key)

    // Test authentication
    let authStatus = 'Not tested'
    try {
      const session = await getServerSession(authOptions)
      authStatus = session ? `Working (User: ${session.user?.email})` : 'No active session'
    } catch (authError) {
      authStatus = `Error: ${authError instanceof Error ? authError.message : 'Unknown auth error'}`
    }

    // Specific checks for file upload issues
    const fileUploadChecks = {
      awsCredentialsConfigured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      awsRegionSet: !!process.env.AWS_REGION,
      awsBucketSet: !!process.env.AWS_BUCKET_NAME,
      authenticationWorking: authStatus.includes('Working'),
    }

    const fileUploadReady = Object.values(fileUploadChecks).every(check => check)

    return NextResponse.json({
      success: missing.length === 0,
      environment: envCheck,
      missing: missing,
      authStatus,
      fileUploadChecks,
      fileUploadReady,
      message: missing.length === 0 
        ? 'All environment variables are set!' 
        : `Missing: ${missing.join(', ')}`,
      recommendations: missing.length > 0 ? [
        ...(missing.includes('AWS_ACCESS_KEY_ID') || missing.includes('AWS_SECRET_ACCESS_KEY') 
          ? ['Set up AWS S3 credentials for file uploads to work'] : []),
        ...(missing.includes('NEXTAUTH_SECRET') 
          ? ['Set NEXTAUTH_SECRET for authentication'] : []),
        ...(missing.includes('DATABASE_URL') 
          ? ['Configure Neon PostgreSQL database connection'] : []),
        ...(missing.includes('OPENAI_API_KEY') 
          ? ['Set OpenAI API key for image moderation (optional but recommended)'] : []),
      ] : [
        'Environment looks good!',
        ...(fileUploadReady ? [] : ['File upload system may have issues - check AWS configuration'])
      ]
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check environment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
