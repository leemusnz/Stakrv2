import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { STORAGE_CONFIG } from '@/lib/storage'

export async function GET(request: NextRequest) {
  try {
    // Test authentication
    const session = await getServerSession(authOptions)
    
    // Test environment variables
    const envCheck = {
      hasAwsAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasAwsSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      awsRegion: process.env.AWS_REGION || 'Not set',
      awsBucket: process.env.AWS_BUCKET_NAME || 'Not set',
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      nextAuthUrl: process.env.NEXTAUTH_URL || 'Not set',
    }

    // Test storage config
    const storageCheck = {
      region: STORAGE_CONFIG.AWS_REGION,
      bucket: STORAGE_CONFIG.AWS_BUCKET_NAME,
      accessKeyConfigured: !!STORAGE_CONFIG.AWS_ACCESS_KEY_ID,
      secretKeyConfigured: !!STORAGE_CONFIG.AWS_SECRET_ACCESS_KEY,
      maxFileSize: STORAGE_CONFIG.MAX_FILE_SIZE,
      allowedImageTypes: STORAGE_CONFIG.ALLOWED_IMAGE_TYPES,
    }

    // Authentication check
    const authCheck = {
      isAuthenticated: !!session,
      userId: session?.user?.id || 'Not available',
      userEmail: session?.user?.email || 'Not available',
      hasValidSession: !!(session?.user?.id && session?.user?.email),
    }

    // Overall readiness
    const isReady = 
      envCheck.hasAwsAccessKey &&
      envCheck.hasAwsSecretKey &&
      envCheck.hasNextAuthSecret &&
      authCheck.hasValidSession

    return NextResponse.json({
      ready: isReady,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      storage: storageCheck,
      authentication: authCheck,
      recommendations: isReady ? [
        'All systems ready for file upload!'
      ] : [
        ...(!envCheck.hasAwsAccessKey ? ['Set AWS_ACCESS_KEY_ID environment variable'] : []),
        ...(!envCheck.hasAwsSecretKey ? ['Set AWS_SECRET_ACCESS_KEY environment variable'] : []),
        ...(!envCheck.hasNextAuthSecret ? ['Set NEXTAUTH_SECRET environment variable'] : []),
        ...(!authCheck.hasValidSession ? ['Sign in to test file upload'] : []),
      ]
    })

  } catch (error) {
    return NextResponse.json({
      ready: false,
      error: 'Debug check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Test POST endpoint to simulate upload request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - no valid session found',
        authStatus: 'No session'
      }, { status: 401 })
    }

    const { fileName, fileType, fileSize, challengeId } = await request.json()

    // Validate required fields
    if (!fileName || !fileType || !fileSize || !challengeId) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing required fields',
        received: { fileName: !!fileName, fileType: !!fileType, fileSize: !!fileSize, challengeId: !!challengeId }
      }, { status: 400 })
    }

    // Check AWS credentials
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json({ 
        success: false,
        error: 'AWS credentials not configured',
        awsCheck: {
          hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
          hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION,
          bucket: process.env.AWS_BUCKET_NAME
        }
      }, { status: 503 })
    }

    // If we get here, the basic upload request would succeed
    return NextResponse.json({
      success: true,
      message: 'Upload request validation passed',
      session: {
        userId: session.user.id,
        email: session.user.email
      },
      requestData: {
        fileName,
        fileType,
        fileSize,
        challengeId
      },
      awsConfig: {
        region: process.env.AWS_REGION,
        bucket: process.env.AWS_BUCKET_NAME,
        credentialsConfigured: true
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Debug upload test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
