import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { moderationService, ContentToModerate } from '@/lib/moderation'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { content, context, contentId } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Prepare content for moderation
    const contentToModerate: ContentToModerate = {
      text: content.text,
      images: content.images,
      videos: content.videos,
      context: context || 'general',
      userId: session.user.id,
      contentId: contentId
    }

    // Run moderation
    const moderationResult = await moderationService.moderateContent(contentToModerate)

    return NextResponse.json({
      success: true,
      moderation: moderationResult,
      allowed: moderationResult.action === 'approve'
    })

  } catch (error) {
    console.error('Moderation API error:', error)
    return NextResponse.json({
      error: 'Moderation check failed',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// GET endpoint to check profile names
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const profileName = searchParams.get('profileName')

    if (!profileName) {
      return NextResponse.json({ error: 'Profile name is required' }, { status: 400 })
    }

    // Check profile name
    const moderationResult = await moderationService.moderateProfileName(profileName)

    return NextResponse.json({
      success: true,
      moderation: moderationResult,
      allowed: moderationResult.action === 'approve',
      message: moderationResult.flagged 
        ? `Profile name not allowed: ${moderationResult.reason.join(', ')}`
        : 'Profile name is acceptable'
    })

  } catch (error) {
    console.error('Profile name moderation error:', error)
    return NextResponse.json({
      error: 'Profile name check failed',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
} 