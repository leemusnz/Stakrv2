import { NextRequest, NextResponse } from 'next/server'
import { createDbConnection } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  isDemoUser, 
  getDemoActiveChallenges, 
  getDemoCompletedChallenges 
} from '@/lib/demo-data'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: 'You must be logged in to view your challenges'
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Check if this is a demo user
    if (isDemoUser(session.user.id)) {
      const isAdmin = session.user.isAdmin || session.user.email === 'alex@stakr.app'
      const activeChallenges = getDemoActiveChallenges(isAdmin)
      const completedChallenges = getDemoCompletedChallenges(isAdmin)
      
      let challenges: any[] = []
      
      if (status === 'all') {
        challenges = [...activeChallenges, ...completedChallenges]
      } else if (status === 'active') {
        challenges = activeChallenges
      } else if (status === 'completed') {
        challenges = completedChallenges
      }

      // Apply pagination
      const paginatedChallenges = challenges.slice(offset, offset + limit)
      
      return NextResponse.json({
        success: true,
        challenges: paginatedChallenges,
        pagination: {
          total: challenges.length,
          limit,
          offset,
          hasMore: offset + limit < challenges.length
        }
      })
    }

    // For real database users, proceed with database queries
    const sql = await createDbConnection()
    
    let whereClause = sql`WHERE cp.user_id = ${session.user.id}`
    if (status !== 'all') {
      whereClause = sql`WHERE cp.user_id = ${session.user.id} AND cp.completion_status = ${status}`
    }

    const userChallenges = await sql`
      SELECT 
        c.id,
        c.title,
        c.description,
        c.category,
        c.duration,
        c.difficulty,
        c.start_date,
        c.end_date,
        c.status as challenge_status,
        c.verification_type,
        cp.stake_amount,
        cp.entry_fee_paid,
        cp.insurance_purchased,
        cp.completion_status,
        cp.proof_submitted,
        cp.verification_status,
        cp.reward_earned,
        cp.joined_at,
        cp.completed_at,
        -- Calculate participants count
        (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = c.id) as total_participants,
        -- Calculate completers count
        (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = c.id AND completion_status = 'completed') as completers_count
      FROM challenges c
      JOIN challenge_participants cp ON c.id = cp.challenge_id
      ${whereClause}
      ORDER BY cp.joined_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `

    const totalCount = await sql`
      SELECT COUNT(*) as count
      FROM challenge_participants cp
      ${whereClause}
    `

    const challenges = userChallenges.map((challenge: any) => ({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      category: challenge.category,
      duration: challenge.duration,
      difficulty: challenge.difficulty,
      startDate: challenge.start_date,
      endDate: challenge.end_date,
      challengeStatus: challenge.challenge_status,
      verificationType: challenge.verification_type,
      stakeAmount: parseFloat(challenge.stake_amount),
      entryFeePaid: parseFloat(challenge.entry_fee_paid),
      insurancePurchased: challenge.insurance_purchased,
      completionStatus: challenge.completion_status,
      proofSubmitted: challenge.proof_submitted,
      verificationStatus: challenge.verification_status,
      rewardEarned: challenge.reward_earned ? parseFloat(challenge.reward_earned) : null,
      joinedAt: challenge.joined_at,
      completedAt: challenge.completed_at,
      totalParticipants: challenge.total_participants,
      completersCount: challenge.completers_count,
      daysRemaining: Math.max(0, Math.ceil((new Date(challenge.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    }))

    return NextResponse.json({
      success: true,
      challenges,
      pagination: {
        total: parseInt(totalCount[0].count),
        limit,
        offset,
        hasMore: offset + limit < parseInt(totalCount[0].count)
      }
    })

  } catch (error) {
    console.error('❌ User challenges fetch failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Challenges fetch failed',
      message: 'Unable to fetch user challenges',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
} 