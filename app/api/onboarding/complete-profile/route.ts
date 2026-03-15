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

    const sql = createDbConnection()
    
    // First, check if user has already completed onboarding to prevent duplicate XP
    const existingUser = await sql`
      SELECT id, email, name, avatar_url, credits, trust_score, verification_tier, 
             xp, level, onboarding_completed, created_at
      FROM users 
      WHERE id = ${session.user.id}
      LIMIT 1
    `
    
    if (existingUser.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        message: 'User profile could not be found'
      }, { status: 404 })
    }
    
    const user = existingUser[0]
    
    // Check if onboarding was already completed
    if (user.onboarding_completed) {
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar_url,
          credits: parseFloat(user.credits),
          trustScore: user.trust_score,
          verificationTier: user.verification_tier,
          xp: user.xp || 0,
          level: user.level || 1,
          onboardingCompleted: user.onboarding_completed,
          updatedAt: user.created_at
        },
        message: 'Onboarding already completed - no XP awarded to prevent duplicates'
      })
    }
    
    // Calculate XP to award (only if user hasn't completed onboarding)
    const xpToAward = xp || 300 // Default to full onboarding XP (50 + 100 + 150)
    
    
    // Use the safe XP awarding function to prevent duplicates
    const xpAwardResult = await sql`
      SELECT award_xp(
        ${session.user.id}::UUID,
        ${xpToAward}::INTEGER,
        'onboarding'::VARCHAR(50),
        NULL::UUID,
        'Onboarding completion reward'::TEXT
      ) as success
    `
    
    const xpAwarded = xpAwardResult[0]?.success
    
    if (!xpAwarded) {
    }
    
    // Update user profile with onboarding data (XP is handled by the function)
    const updatedUsers = await sql`
      UPDATE users 
      SET 
        name = ${name},
        avatar_url = ${avatar || null},
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
        xp: updatedUser.xp,
        level: updatedUser.level,
        onboardingCompleted: updatedUser.onboarding_completed,
        updatedAt: updatedUser.updated_at
      },
      onboardingData,
      xpAwarded: xpAwarded ? xpToAward : 0,
      message: xpAwarded 
        ? `Onboarding completed successfully! Welcome to Stakr! +${xpToAward} XP earned!`
        : 'Onboarding completed successfully! Welcome to Stakr! (XP already awarded)'
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
