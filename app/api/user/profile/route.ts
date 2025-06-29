import { NextRequest, NextResponse } from 'next/server'
import { createDbConnection } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { isValidAvatarUrl } from '@/lib/avatars'
import { isDemoUser, getDemoUserData } from '@/lib/demo-data'

// Validation schema for profile updates
const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  avatar: z.string().optional()
}).refine((data) => {
  if (data.avatar && !isValidAvatarUrl(data.avatar)) {
    return false
  }
  return true
}, {
  message: "Invalid avatar URL",
  path: ["avatar"]
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: 'You must be logged in to view your profile'
      }, { status: 401 })
    }

    // Check if this is a demo user
    if (isDemoUser(session.user.id)) {
      const demoData = getDemoUserData(session)
      
      return NextResponse.json({
        success: true,
        user: {
          id: demoData.user.id,
          email: demoData.user.email,
          name: demoData.user.name,
          avatar: demoData.user.avatar,
          credits: demoData.user.credits,
          trustScore: demoData.user.trustScore,
          verificationTier: demoData.user.verificationTier,
          challengesCompleted: demoData.user.challengesCompleted,
          currentStreak: demoData.user.currentStreak,
          longestStreak: demoData.user.longestStreak,
          premiumSubscription: demoData.user.premiumSubscription,
          createdAt: demoData.user.memberSince
        }
      })
    }

    // For real database users, proceed with database queries
    const sql = await createDbConnection()
    
    const users = await sql`
      SELECT 
        id,
        email,
        name,
        avatar_url,
        credits,
        trust_score,
        verification_tier,
        challenges_completed,
        current_streak,
        longest_streak,
        premium_subscription,
        created_at
      FROM users 
      WHERE id = ${session.user.id}
      LIMIT 1
    `
    
    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        message: 'User profile could not be found'
      }, { status: 404 })
    }

    const user = users[0]

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar_url,
        credits: parseFloat(user.credits) || 0,
        trustScore: user.trust_score || 50,
        verificationTier: user.verification_tier || 'manual',
        challengesCompleted: user.challenges_completed || 0,
        currentStreak: user.current_streak || 0,
        longestStreak: user.longest_streak || 0,
        premiumSubscription: user.premium_subscription || false,
        createdAt: user.created_at
      }
    })

  } catch (error) {
    console.error('❌ Profile fetch failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Profile fetch failed',
      message: 'Unable to fetch user profile',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: 'You must be logged in to update your profile'
      }, { status: 401 })
    }

    // Check if this is a demo user
    if (isDemoUser(session.user.id)) {
      const body = await request.json()
      
      // Validate input
      const validationResult = profileUpdateSchema.safeParse(body)
      if (!validationResult.success) {
        return NextResponse.json({
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues
        }, { status: 400 })
      }

      const { name, avatar } = validationResult.data
      
      // For demo users, return mock success response
      const demoData = getDemoUserData(session)
      
      return NextResponse.json({
        success: true,
        user: {
          id: demoData.user.id,
          email: demoData.user.email,
          name: name,
          avatar: avatar || demoData.user.avatar,
          credits: demoData.user.credits,
          trustScore: demoData.user.trustScore,
          verificationTier: demoData.user.verificationTier,
          updatedAt: new Date()
        },
        message: 'Profile updated successfully!'
      })
    }

    const body = await request.json()
    
    // Validate input
    const validationResult = profileUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.issues
      }, { status: 400 })
    }

    const { name, avatar } = validationResult.data

    const sql = await createDbConnection()
    
    // Update user profile
    const updatedUsers = await sql`
      UPDATE users 
      SET 
        name = ${name},
        avatar_url = ${avatar || null},
        updated_at = NOW()
      WHERE id = ${session.user.id}
      RETURNING id, email, name, avatar_url, credits, trust_score, verification_tier, updated_at
    `

    if (updatedUsers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        message: 'User profile could not be updated'
      }, { status: 404 })
    }

    const updatedUser = updatedUsers[0]

    console.log('✅ Profile updated successfully for:', updatedUser.email)

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
        updatedAt: updatedUser.updated_at
      },
      message: 'Profile updated successfully!'
    })

  } catch (error) {
    console.error('❌ Profile update failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Profile update failed',
      message: 'Unable to update user profile',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
} 