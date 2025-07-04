import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ContentModerationService } from '@/lib/moderation'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { imageUrl } = await request.json()
    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 })
    }

    console.log('🧪 DIAGNOSTIC: Testing moderation for:', imageUrl)
    console.log('🧪 Environment:', process.env.NODE_ENV)
    console.log('🧪 AWS credentials:', {
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION
    })
    console.log('🧪 OpenAI key:', !!process.env.OPENAI_API_KEY)

    const moderationService = ContentModerationService.getInstance()
    const result = await moderationService.moderateImage(imageUrl, 'profile_picture')

    console.log('🧪 DIAGNOSTIC: Moderation result:', JSON.stringify(result, null, 2))

    return NextResponse.json({
      success: true,
      imageUrl,
      moderationResult: result,
      environment: process.env.NODE_ENV,
      awsConfigured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      openaiConfigured: !!process.env.OPENAI_API_KEY
    })

  } catch (error) {
    console.error('🧪 DIAGNOSTIC: Moderation test failed:', error)
    return NextResponse.json({
      error: 'Moderation test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 