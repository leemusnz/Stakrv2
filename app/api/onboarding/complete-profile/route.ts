import { NextRequest, NextResponse } from 'next/server'
import { createDbConnection } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { isValidAvatarUrl } from '@/lib/avatars'
import { moderationService } from '@/lib/moderation'

// Validation schema for onboarding profile completion
const onboardingProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  avatar: z.string().optional(),
  goals: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  experience: z.string().optional(),
  motivation: z.string().optional(),
  preferredStakeRange: z.string().optional(),
  xp: z.number().optional(),
  level: z.number().optional()
}).refine((data) => {
  if (data.avatar && !isValidAvatarUrl(data.avatar)) {
    return false
  }
  return true
}, {
  message: "Invalid avatar URL",
  path: ["avatar"]
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: 'You must be logged in to complete onboarding'
      }, { status: 401 })
    }

    const body = await request.json()
    
    // Log the received data for debugging
    console.log('📊 Onboarding completion request data:', {
      name: body.name,
      hasAvatar: !!body.avatar,
      goalsCount: body.goals?.length || 0,
      interestsCount: body.interests?.length || 0,
      hasExperience: !!body.experience,
      hasMotivation: !!body.motivation,
      hasStakeRange: !!body.preferredStakeRange,
      xp: body.xp,
      level: body.level
    })
    
    // Validate input
    const validationResult = onboardingProfileSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('❌ Onboarding validation failed:', validationResult.error.issues)
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.issues
      }, { status: 400 })
    }

    const { name, avatar, goals, interests, experience, motivation, preferredStakeRange, xp, level } = validationResult.data

    // Validate name with moderation service
    try {
      const moderationResult = await moderationService.moderateProfileName(name)
      if (moderationResult.flagged) {
        return NextResponse.json({
          success: false,
          error: 'Profile name not allowed',
          message: `Name contains inappropriate content: ${moderationResult.reason.join(', ')}. Please choose a different name.`
        }, { status: 400 })
      }
    } catch (moderationError) {
      console.warn('Moderation check failed during onboarding, allowing name:', moderationError)
    }

    const sql = await createDbConnection()
    
    // Update user profile with onboarding data including XP and level
    const updatedUsers = await sql`
      UPDATE users 
      SET 
        name = ${name},
        avatar_url = ${avatar || null},
        xp = ${xp || 0},
        level = ${level || 1},
        onboarding_completed = true,
        updated_at = NOW()
      WHERE id = ${session.user.id}
      RETURNING id, email, name, avatar_url, credits, trust_score, verification_tier, xp, level, onboarding_completed, updated_at
    `

    if (updatedUsers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        message: 'User profile could not be updated'
      }, { status: 404 })
    }

    const updatedUser = updatedUsers[0]

    // Store onboarding data for future use (could be in a separate onboarding_data table)
    const onboardingData = {
      goals: goals || [],
      interests: interests || [],
      experience: experience || '',
      motivation: motivation || '',
      preferredStakeRange: preferredStakeRange || ''
    }

    console.log('✅ Onboarding completed for:', updatedUser.email, onboardingData)

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatar: updatedUser.avatar_url,
        credits: parseFloat(updatedUser.credits),
        trustScore: updatedUser.trust_score,
        verificationTier: updatedUser.verification_tier,
        xp: updatedUser.xp || 0,
        level: updatedUser.level || 1,
        onboardingCompleted: updatedUser.onboarding_completed,
        updatedAt: updatedUser.updated_at
      },
      onboardingData,
      message: 'Onboarding completed successfully! Welcome to Stakr!'
    })

  } catch (error) {
    console.error('❌ Onboarding completion failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Onboarding completion failed',
      message: 'Unable to complete onboarding. Please try again.',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
