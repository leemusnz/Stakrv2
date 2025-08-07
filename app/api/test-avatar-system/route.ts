import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Test avatar system components
    const tests = {
      session: {
        userId: session.user.id,
        userEmail: session.user.email,
        sessionImage: session.user.image,
        sessionAvatar: session.user.avatar,
      },
      avatarSystem: {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasImage: !!session?.user?.image,
        imageUrl: session?.user?.image || 'null',
        isS3Url: session?.user?.image?.includes('stakr-verification-files.s3') || false,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasAwsCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
        awsRegion: process.env.AWS_REGION || 'ap-southeast-2',
        awsBucket: process.env.AWS_BUCKET_NAME || 'stakr-verification-files',
      }
    }

    // Test image proxy if session has an image
    if (session.user.image && session.user.image.includes('stakr-verification-files.s3')) {
      try {
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(session.user.image)}&v=test`
        const fullProxyUrl = `${request.nextUrl.origin}${proxyUrl}`
        
        const proxyResponse = await fetch(fullProxyUrl)
        tests.proxyTest = {
          success: proxyResponse.ok,
          status: proxyResponse.status,
          statusText: proxyResponse.statusText,
          contentType: proxyResponse.headers.get('content-type'),
          contentLength: proxyResponse.headers.get('content-length'),
        }
      } catch (proxyError) {
        tests.proxyTest = {
          success: false,
          error: proxyError instanceof Error ? proxyError.message : 'Unknown error'
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Avatar system test completed',
      timestamp: new Date().toISOString(),
      tests
    })

  } catch (error) {
    console.error('Avatar system test failed:', error)
    return NextResponse.json({
      error: 'Avatar system test failed',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
