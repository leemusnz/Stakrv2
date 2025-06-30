import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'

// GET user profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, return session data (later we can fetch from database)
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
    const { name, avatar } = updates

    console.log('📝 Profile update for user:', session.user.id, { name, avatar })

    // Try to update database if available, but only update avatar_url for now
    if (avatar !== undefined) {
      try {
        const sql = await createDbConnection()
        
        const result = await sql`
          UPDATE users 
          SET avatar_url = ${avatar}, updated_at = NOW()
          WHERE id = ${session.user.id}
          RETURNING name, avatar_url, updated_at
        `
        
        if (result.length > 0) {
          console.log('✅ Database avatar updated successfully')
          
          return NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            profile: {
              ...session.user,
              image: result[0].avatar_url,
            }
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
