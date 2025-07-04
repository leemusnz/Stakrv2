import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check moderation service configuration
    const diagnostics = {
      environment: process.env.NODE_ENV,
      openaiApiKeyConfigured: !!process.env.OPENAI_API_KEY,
      openaiApiKeyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) + '...' : 'Not set',
      databaseUrlConfigured: !!process.env.DATABASE_URL,
      awsConfigured: {
        accessKey: !!process.env.AWS_ACCESS_KEY_ID,
        secretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'Not set',
        bucket: process.env.AWS_BUCKET_NAME || 'Not set'
      },
      timestamp: new Date().toISOString(),
      userId: session.user.id,
      userEmail: session.user.email
    }

    console.log('🔍 Moderation diagnostics:', diagnostics)

    return NextResponse.json({
      success: true,
      diagnostics
    })

  } catch (error) {
    console.error('Diagnostics error:', error)
    return NextResponse.json({
      error: 'Failed to get diagnostics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
