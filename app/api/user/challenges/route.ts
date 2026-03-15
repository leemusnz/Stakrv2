import { NextRequest, NextResponse } from 'next/server'
import { createDbConnection } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  getMockUserChallenges 
} from '@/lib/demo-data'
import { shouldUseDemoData, createDemoResponse } from '@/lib/demo-mode'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    // Hybrid demo system: new demo mode only
    if (shouldUseDemoData(request, session)) {
      const mockChallenges = getMockUserChallenges(session.user.id)
      
      let filteredChallenges = mockChallenges
      if (status !== 'all') {
        filteredChallenges = mockChallenges.filter(challenge => challenge.completionStatus === status)
      }

      return NextResponse.json(createDemoResponse({
        success: true,
        challenges: filteredChallenges,
        totalCount: filteredChallenges.length
      }, request, session))
    }

    // For real users, query the database
    const sql = createDbConnection()

    let challenges
    if (status !== 'all') {
      challenges = await sql`
        SELECT 
          c.id,
          c.title,
          c.description,
          c.category,
          cp.stake_amount,
          c.duration,
          c.start_date,
          c.end_date,
          cp.completion_status,
          0 as progress,
          0 as current_streak,
          cp.joined_at,
          cp.completed_at,
          NULL as failed_at,
          c.proof_requirements as verification_requirements,
          c.verification_type as primary_verification_type,
          (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = c.id) as total_participants,
          (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = c.id AND completion_status = 'completed') as successful_participants
        FROM challenges c
        JOIN challenge_participants cp ON c.id = cp.challenge_id
        WHERE cp.user_id = ${session.user.id} AND cp.completion_status = ${status}
        ORDER BY 
          CASE cp.completion_status 
            WHEN 'active' THEN 1 
            WHEN 'completed' THEN 2 
            WHEN 'failed' THEN 3 
          END,
          cp.joined_at DESC
      `
    } else {
      challenges = await sql`
        SELECT 
          c.id,
          c.title,
          c.description,
          c.category,
          cp.stake_amount,
          c.duration,
          c.start_date,
          c.end_date,
          cp.completion_status,
          0 as progress,
          0 as current_streak,
          cp.joined_at,
          cp.completed_at,
          NULL as failed_at,
          c.proof_requirements as verification_requirements,
          c.verification_type as primary_verification_type,
          (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = c.id) as total_participants,
          (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = c.id AND completion_status = 'completed') as successful_participants
        FROM challenges c
        JOIN challenge_participants cp ON c.id = cp.challenge_id
        WHERE cp.user_id = ${session.user.id}
        ORDER BY 
          CASE cp.completion_status 
            WHEN 'active' THEN 1 
            WHEN 'completed' THEN 2 
            WHEN 'failed' THEN 3 
          END,
          cp.joined_at DESC
      `
    }

    // For each failed challenge, check if there are rejected verifications
    const challengesWithVerifications = await Promise.all(
      challenges.map(async (challenge: any) => {
        if (challenge.completion_status === 'failed') {
          // Look for rejected proof submissions for this challenge and user
          const rejectedVerifications = await sql`
            SELECT id, admin_notes as reason, reviewed_at as rejected_at
            FROM proof_submissions 
            WHERE challenge_id = ${challenge.id} 
              AND user_id = ${session.user.id} 
              AND status = 'rejected'
            ORDER BY reviewed_at DESC
            LIMIT 1
          `

          if (rejectedVerifications.length > 0) {
            const verification = rejectedVerifications[0]
            
            // Check if user has already submitted an appeal
            const existingAppeal = await sql`
              SELECT id FROM verification_appeals 
              WHERE verification_id = ${verification.id} AND user_id = ${session.user.id}
            `

            challenge.rejectedVerification = {
              id: verification.id,
              reason: verification.reason,
              rejectedAt: verification.rejected_at,
              appealSubmitted: existingAppeal.length > 0
            }
          }
        }

        return {
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          category: challenge.category,
          stakeAmount: parseFloat(challenge.stake_amount),
          duration: challenge.duration,
          participants: challenge.total_participants,
          totalParticipants: challenge.total_participants,
          successfulParticipants: challenge.successful_participants,
          completionStatus: challenge.completion_status,
          progress: challenge.progress || 0,
          currentStreak: challenge.current_streak || 0,
          joinedAt: challenge.joined_at,
          completedAt: challenge.completed_at,
          failedAt: challenge.failed_at,
          rejectedVerification: challenge.rejectedVerification || null,
          // Add verification data for UI detection
          verificationType: challenge.primary_verification_type,
          verificationRequirements: challenge.verification_requirements
        }
      })
    )

    return NextResponse.json({
      success: true,
      challenges: challengesWithVerifications,
      totalCount: challengesWithVerifications.length
    })

  } catch (error) {
    console.error('User challenges fetch error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch user challenges',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
