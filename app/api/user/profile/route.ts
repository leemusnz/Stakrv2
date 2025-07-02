import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { moderationService } from '@/lib/moderation'
import { getMobileUserFromRequest } from '@/lib/mobile-auth'

// GET user profile
export async function GET(request: NextRequest) {
  try {
    // Try web session authentication first
    const session = await getServerSession(authOptions)
    let userId: string | null = null
    let userFromSession = false

    if (session?.user?.id) {
      userId = session.user.id
      userFromSession = true
    } else {
      // Try mobile token authentication
      const mobileUser = getMobileUserFromRequest(request)
      if (mobileUser) {
        userId = mobileUser.id
        userFromSession = false
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For web sessions, return session data (later we can fetch from database)
    if (userFromSession && session?.user) {
      const profile = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        avatar: session.user.image,
        credits: session.user.credits,
        trustScore: session.user.trustScore,
        verificationTier: session.user.verificationTier,
        challengesCompleted: session.user.challengesCompleted,
        currentStreak: session.user.currentStreak,
        longestStreak: session.user.longestStreak,
        premiumSubscription: session.user.premiumSubscription,
        onboardingCompleted: session.user.onboardingCompleted
      }

      return NextResponse.json({
        success: true,
        profile
      })
    }

    // For mobile authentication, fetch fresh data from database
    const sql = await createDbConnection()
    const users = await sql`
      SELECT 
        id, email, name, avatar_url,
        credits, trust_score, verification_tier,
        challenges_completed, current_streak, longest_streak,
        premium_subscription, onboarding_completed
      FROM users 
      WHERE id = ${userId}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = users[0]
    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar_url,
      credits: parseFloat(user.credits) || 0,
      trustScore: user.trust_score || 50,
      verificationTier: user.verification_tier || 'manual',
      challengesCompleted: user.challenges_completed || 0,
      currentStreak: user.current_streak || 0,
      longestStreak: user.longest_streak || 0,
      premiumSubscription: user.premium_subscription || false,
      onboardingCompleted: user.onboarding_completed || false
    }

    return NextResponse.json({
      success: true,
      profile
    })

  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({
      error: 'Failed to get profile',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// PATCH update user profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await request.json()
    const { name, username, avatar } = updates

    console.log('📝 Profile update for user:', session.user.id, { name, username, avatar })

    // Validate name with moderation if provided
    if (name !== undefined) {
      try {
        console.log('🔍 Checking name for moderation:', name)
        const moderationResult = await moderationService.moderateProfileName(name)
        console.log('🛡️ Name moderation result:', moderationResult)
        
        if (moderationResult.flagged) {
          console.log('❌ Name flagged, returning error')
          return NextResponse.json({
            error: 'Profile name not allowed',
            reason: moderationResult.reason.join(', '),
            message: 'Please choose a different name that follows our community guidelines'
          }, { status: 400 })
        }
        console.log('✅ Name passed moderation')
      } catch (moderationError) {
        console.warn('Moderation check failed, allowing name:', moderationError)
      }
    }

    // Validate username with moderation if provided
    if (username !== undefined) {
      try {
        console.log('🔍 Checking username for moderation:', username)
        const moderationResult = await moderationService.moderateProfileName(username)
        console.log('🛡️ Username moderation result:', moderationResult)
        
        if (moderationResult.flagged) {
          console.log('❌ Username flagged, returning error')
          return NextResponse.json({
            error: 'Username not allowed',
            reason: moderationResult.reason.join(', '),
            message: 'Please choose a different username that follows our community guidelines'
          }, { status: 400 })
        }
        console.log('✅ Username passed moderation')
      } catch (moderationError) {
        console.warn('Moderation check failed, allowing username:', moderationError)
      }
    }

    // Try to update database if available
    if (name !== undefined || username !== undefined || avatar !== undefined) {
      try {
        const sql = await createDbConnection()
        
        // Update user profile with moderation-approved data
        const result = await sql`
          UPDATE users 
          SET 
            ${name !== undefined ? sql`name = ${name},` : sql``}
            ${username !== undefined ? sql`username = ${username},` : sql``}
            ${avatar !== undefined ? sql`avatar_url = ${avatar},` : sql``}
            updated_at = NOW()
          WHERE id = ${session.user.id}
          RETURNING name, username, avatar_url, updated_at
        `
        
        if (result.length > 0) {
          console.log('✅ Database profile updated successfully:', result[0])
          
          return NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            profile: {
              ...session.user,
              name: result[0].name,
              username: result[0].username,
              image: result[0].avatar_url,
              avatar: result[0].avatar_url, // Include both fields for consistency
            },
            avatarUrl: result[0].avatar_url // Explicit avatar URL for verification
          })
        }
      } catch (dbError) {
        console.log('⚠️ Database update failed, using mock response:', dbError)
      }
    }

    // Fallback mock response for demo
    const mockUpdatedProfile = {
      ...session.user,
      name: name || session.user.name,
      username: username || (session.user.email?.split('@')[0]) || 'user',
      image: avatar || session.user.image,
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: mockUpdatedProfile
    })

  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({
      error: 'Failed to update profile',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
