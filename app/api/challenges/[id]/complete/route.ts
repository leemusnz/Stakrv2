import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { calculateChallengeRewards, distributeRewards } from '@/lib/reward-calculation'
import { calculateXPChallengeRewards, distributeXPRewards } from '@/lib/xp-reward-calculation'
import { systemLogger } from '@/lib/system-logger'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// COMPLETE a challenge (admin/system endpoint)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Only allow admins or system to complete challenges
    if (!session.user.isAdmin) {
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        message: 'Only administrators can complete challenges'
      }, { status: 403 })
    }

    const { id: challengeId } = await params
    const sql = await createDbConnection()

    // Check if challenge exists and is eligible for completion
    const challengeCheck = await sql`
      SELECT 
        id, title, status, end_date, allow_points_only,
        COUNT(cp.id) as total_participants,
        COUNT(CASE WHEN cp.completion_status = 'completed' THEN 1 END) as completed_count
      FROM challenges c
      LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
      WHERE c.id = ${challengeId}
      GROUP BY c.id, c.title, c.status, c.end_date, c.allow_points_only
    `

    if (challengeCheck.length === 0) {
      return NextResponse.json({
        error: 'Challenge not found',
        challengeId
      }, { status: 404 })
    }

    const challenge = challengeCheck[0]

    if (challenge.status === 'rewards_distributed') {
      return NextResponse.json({
        error: 'Challenge rewards already distributed',
        challengeId,
        status: challenge.status
      }, { status: 400 })
    }

    if (challenge.total_participants === 0) {
      return NextResponse.json({
        error: 'Cannot complete challenge with no participants',
        challengeId
      }, { status: 400 })
    }

    // Distribute rewards based on challenge type
    console.log(`🏁 Completing challenge: ${challenge.title} (${challengeId})`)
    console.log(`📊 Stats: ${challenge.completed_count}/${challenge.total_participants} completed`)
    console.log(`🎯 Challenge type: ${challenge.allow_points_only ? 'XP Challenge' : 'Cash Challenge'}`)

    let rewardResult
    let isXPChallenge = challenge.allow_points_only
    
    if (isXPChallenge) {
      // XP Challenge - distribute XP rewards
      rewardResult = await distributeXPRewards(challengeId)
    } else {
      // Cash Challenge - distribute money rewards
      rewardResult = await distributeRewards(challengeId)
    }

    // Type narrowing: safely access properties based on challenge type
    if (isXPChallenge) {
      const xpResult = rewardResult as Awaited<ReturnType<typeof distributeXPRewards>>
      
      systemLogger.info('Challenge completed with reward distribution', 'admin', {
        challengeId,
        challengeTitle: challenge.title,
        challengeType: 'XP Challenge',
        totalParticipants: xpResult.challenge_stats.total_participants,
        completedParticipants: xpResult.challenge_stats.completed_count,
        totalDistributed: xpResult.summary.total_xp_awarded,
        platformRevenue: 0,
        distributionMethod: 'XP-based'
      })

      return NextResponse.json({
        success: true,
        message: 'Challenge completed and rewards distributed',
        challengeId,
        challenge_type: 'XP Challenge',
        reward_summary: {
          total_distributed: xpResult.summary.total_xp_awarded,
          platform_revenue: 0,
          participants_rewarded: xpResult.participant_rewards.length,
          distribution_method: 'XP-based',
          completion_rate: `${xpResult.challenge_stats.completed_count}/${xpResult.challenge_stats.total_participants} (${xpResult.challenge_stats.completion_rate.toFixed(1)}%)`,
          average_reward: xpResult.summary.average_xp_per_participant
        }
      })
    } else {
      const cashResult = rewardResult as Awaited<ReturnType<typeof distributeRewards>>
      
      systemLogger.info('Challenge completed with reward distribution', 'admin', {
        challengeId,
        challengeTitle: challenge.title,
        challengeType: 'Cash Challenge',
        totalParticipants: cashResult.challenge_stats.total_participants,
        completedParticipants: cashResult.challenge_stats.completed_participants,
        totalDistributed: cashResult.summary.total_distributed,
        platformRevenue: cashResult.platform_revenue.total,
        distributionMethod: cashResult.challenge_stats.reward_distribution
      })

      return NextResponse.json({
        success: true,
        message: 'Challenge completed and rewards distributed',
        challengeId,
        challenge_type: 'Cash Challenge',
        reward_summary: {
          total_distributed: cashResult.summary.total_distributed,
          platform_revenue: cashResult.platform_revenue.total,
          participants_rewarded: cashResult.participant_rewards.length,
          distribution_method: cashResult.challenge_stats.reward_distribution,
          completion_rate: `${cashResult.challenge_stats.completed_participants}/${cashResult.challenge_stats.total_participants} (${cashResult.challenge_stats.completion_rate.toFixed(1)}%)`,
          average_reward: cashResult.summary.average_reward
        }
      })
    }

  } catch (error) {
    console.error('❌ Challenge completion error:', error)
    systemLogger.error('Challenge completion failed', 'admin', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json({
      error: 'Failed to complete challenge',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET challenge completion preview (dry run)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!session.user.isAdmin) {
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        message: 'Only administrators can preview challenge completion'
      }, { status: 403 })
    }

    const { id: challengeId } = await params
    const sql = await createDbConnection()

    // Check challenge type first
    const challengeType = await sql`
      SELECT allow_points_only FROM challenges WHERE id = ${challengeId}
    `

    if (challengeType.length === 0) {
      return NextResponse.json({
        error: 'Challenge not found',
        challengeId
      }, { status: 404 })
    }

    // Calculate rewards without distributing them
    let rewardResult
    const isXPChallenge = challengeType[0].allow_points_only
    
    if (isXPChallenge) {
      // XP Challenge
      rewardResult = await calculateXPChallengeRewards(challengeId)
    } else {
      // Cash Challenge
      rewardResult = await calculateChallengeRewards(challengeId)
    }

    // Type narrowing: safely construct response based on challenge type
    if (isXPChallenge) {
      const xpResult = rewardResult as Awaited<ReturnType<typeof calculateXPChallengeRewards>>
      
      return NextResponse.json({
        success: true,
        message: 'Challenge completion preview (no rewards distributed)',
        preview: true,
        challenge_stats: xpResult.challenge_stats,
        reward_summary: {
          total_to_distribute: xpResult.summary.total_xp_awarded,
          platform_revenue: 0,
          participants_to_reward: xpResult.participant_rewards.length,
          distribution_method: 'XP-based',
          completion_rate: `${xpResult.challenge_stats.completed_count}/${xpResult.challenge_stats.total_participants} (${xpResult.challenge_stats.completion_rate.toFixed(1)}%)`,
          average_reward: xpResult.summary.average_xp_per_participant
        },
        participant_rewards: xpResult.participant_rewards.map(reward => ({
          participant_id: reward.participant_id,
          user_id: reward.user_id,
          xp_earned: reward.xp_earned,
          total_xp: reward.total_xp
        }))
      })
    } else {
      const cashResult = rewardResult as Awaited<ReturnType<typeof calculateChallengeRewards>>
      
      return NextResponse.json({
        success: true,
        message: 'Challenge completion preview (no rewards distributed)',
        preview: true,
        challenge_stats: cashResult.challenge_stats,
        reward_summary: {
          total_to_distribute: cashResult.summary.total_distributed,
          platform_revenue: cashResult.platform_revenue.total,
          participants_to_reward: cashResult.participant_rewards.length,
          distribution_method: cashResult.challenge_stats.reward_distribution,
          completion_rate: `${cashResult.challenge_stats.completed_participants}/${cashResult.challenge_stats.total_participants} (${cashResult.challenge_stats.completion_rate.toFixed(1)}%)`,
          average_reward: cashResult.summary.average_reward,
          reward_range: `${cashResult.summary.min_reward} - ${cashResult.summary.max_reward}`
        },
        participant_rewards: cashResult.participant_rewards.map(reward => ({
          participant_id: reward.participant_id,
          user_id: reward.user_id,
          original_stake: reward.original_stake,
          net_reward: reward.net_reward,
          reward_breakdown: reward.reward_breakdown
        }))
      })
    }

  } catch (error) {
    console.error('❌ Challenge completion preview error:', error)

    return NextResponse.json({
      error: 'Failed to preview challenge completion',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
