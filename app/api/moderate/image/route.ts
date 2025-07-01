import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { moderationService } from '@/lib/moderation'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { imageUrl, context = 'profile_picture' } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 })
    }

    console.log('🔍 Server-side image moderation request:', imageUrl)

    // Moderate the image using OpenAI Vision API
    const moderationResult = await moderationService.moderateImage(imageUrl, context)
    
    console.log('🛡️ Server-side moderation result:', moderationResult)

    return NextResponse.json({
      success: true,
      moderation: moderationResult
    })

  } catch (error) {
    console.error('Image moderation API error:', error)
    return NextResponse.json({
      error: 'Moderation failed',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
} 