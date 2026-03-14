import { NextRequest, NextResponse } from 'next/server'
import { createDbConnection } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
 
  getDemoUserData, 
  getDemoActiveChallenges, 
  getDemoCompletedChallenges, 
  getDemoTransactions, 
  getDemoNotifications 
} from '@/lib/demo-data'

export async function GET(request: NextRequest) {
  try {
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: 'You must be logged in to view your dashboard'
      }, { status: 401 })
    }


    const sql = await createDbConnection()
    
    // QUICK FIX: Handle UUID format issue
    // The session.user.id might be a numeric string from Google OAuth
    // but the database expects UUID format. Use email lookup as fallback.
    
    let userProfile = []
    let actualUserId: string
    
    // Try user ID first, fallback to email if UUID format issue
    try {
      userProfile = await sql`
        SELECT 
          id,
          email,
          name,
          avatar_url,
          credits,
          trust_score,
          verification_tier,
          challenges_completed,
          false_claims,
          current_streak,
          longest_streak,
          premium_subscription,
          premium_expires_at,
          is_dev,
          dev_mode_enabled,
          xp,
          level,
          created_at
        FROM users 
        WHERE id = ${session.user.id}
        LIMIT 1
      `
    } catch (idError) {
      
      try {
        userProfile = await sql`
          SELECT 
            id,
            email,
            name,
            avatar_url,
            credits,
            trust_score,
            verification_tier,
            challenges_completed,
            false_claims,
            current_streak,
            longest_streak,
            premium_subscription,
            premium_expires_at,
            is_dev,
            dev_mode_enabled,
            xp,
            level,
            created_at
          FROM users 
          WHERE email = ${session.user.email}
          LIMIT 1
        `
      } catch (emailError) {
        throw emailError
      }
    }
    
    
    if (userProfile.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        message: 'User profile could not be found'
      }, { status: 404 })
    }

    const user = userProfile[0]
    actualUserId = user.id // Use the actual UUID from database
    

    // Get user's active challenges (using actual UUID)
    const activeChallenges = await sql`
      SELECT 
        c.id,
        c.title,
        c.description,
        c.category,
        c.duration,
        c.start_date,
        c.end_date,
        c.status,
        cp.stake_amount,
        cp.completion_status,
        cp.proof_submitted,
        cp.verification_status,
        cp.joined_at
      FROM challenges c
      JOIN challenge_participants cp ON c.id = cp.challenge_id
      WHERE cp.user_id = ${actualUserId}
        AND cp.completion_status IN ('active', 'pending_verification')
      ORDER BY c.start_date DESC
      LIMIT 5
    `

    // Get user's completed challenges (using actual UUID)
    const completedChallenges = await sql`
      SELECT 
        c.id,
        c.title,
        c.category,
        c.end_date,
        cp.stake_amount,
        cp.reward_earned,
        cp.completed_at
      FROM challenges c
      JOIN challenge_participants cp ON c.id = cp.challenge_id
      WHERE cp.user_id = ${actualUserId}
        AND cp.completion_status = 'completed'
      ORDER BY cp.completed_at DESC
      LIMIT 10
    `

    // Get recent transactions (using actual UUID)
    const recentTransactions = await sql`
      SELECT 
        id,
        transaction_type,
        amount,
        status,
        created_at
      FROM transactions
      WHERE user_id = ${actualUserId}
      ORDER BY created_at DESC
      LIMIT 10
    `

    // Get notifications (using actual UUID)
    const notifications = await sql`
      SELECT 
        id,
        type,
        title,
        message,
        action_url,
        read,
        created_at
      FROM notifications
      WHERE user_id = ${actualUserId}
        AND read = false
      ORDER BY created_at DESC
      LIMIT 5
    `

    // Calculate stats
    const totalEarnings = completedChallenges.reduce((sum: number, challenge: any) => 
      sum + parseFloat(challenge.reward_earned || 0), 0
    )

    const currentBalance = parseFloat(user.credits) || 0
    const activeStakes = activeChallenges.reduce((sum: number, challenge: any) => 
      sum + parseFloat(challenge.stake_amount || 0), 0
    )


    return NextResponse.json({
      success: true,
      dashboard: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar_url,
          credits: currentBalance,
          trustScore: user.trust_score || 50,
          verificationTier: user.verification_tier || 'manual',
          challengesCompleted: user.challenges_completed || 0,
          falseClaims: user.false_claims || 0,
          currentStreak: user.current_streak || 0,
          longestStreak: user.longest_streak || 0,
          premiumSubscription: user.premium_subscription || false,
          premiumExpiresAt: user.premium_expires_at,
          memberSince: user.created_at,
          isDev: user.is_dev || false,
          devModeEnabled: user.dev_mode_enabled || false,
          xp: user.xp || 0,
          level: user.level || 1
        },
        stats: {
          totalEarnings,
          currentBalance,
          activeStakes,
          activeChallengesCount: activeChallenges.length,
          completedChallengesCount: completedChallenges.length,
          successRate: user.challenges_completed > 0 
            ? Math.round(((user.challenges_completed - user.false_claims) / user.challenges_completed) * 100)
            : 100
        },
        activeChallenges: activeChallenges.map((challenge: any) => ({
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          category: challenge.category,
          duration: challenge.duration,
          startDate: challenge.start_date,
          endDate: challenge.end_date,
          status: challenge.status,
          stakeAmount: parseFloat(challenge.stake_amount),
          completionStatus: challenge.completion_status,
          proofSubmitted: challenge.proof_submitted,
          verificationStatus: challenge.verification_status,
          joinedAt: challenge.joined_at,
          daysRemaining: Math.max(0, Math.ceil((new Date(challenge.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        })),
        completedChallenges: completedChallenges.map((challenge: any) => ({
          id: challenge.id,
          title: challenge.title,
          category: challenge.category,
          endDate: challenge.end_date,
          stakeAmount: parseFloat(challenge.stake_amount),
          rewardEarned: parseFloat(challenge.reward_earned),
          completedAt: challenge.completed_at
        })),
        recentTransactions: recentTransactions.map((transaction: any) => ({
          id: transaction.id,
          type: transaction.transaction_type,
          amount: parseFloat(transaction.amount),
          status: transaction.status,
          createdAt: transaction.created_at
        })),
        notifications: notifications.map((notification: any) => ({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          actionUrl: notification.action_url,
          createdAt: notification.created_at
        }))
      }
    })

  } catch (error) {
    console.error('❌ Dashboard data fetch failed:', error)
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json({
      success: false,
      error: 'Dashboard data fetch failed',
      message: 'Unable to load dashboard data',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
