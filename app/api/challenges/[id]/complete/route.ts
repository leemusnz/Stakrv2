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
    if (challenge.allow_points_only) {
      // XP Challenge - distribute XP rewards
      rewardResult = await distributeXPRewards(challengeId)
    } else {
      // Cash Challenge - distribute money rewards
      rewardResult = await distributeRewards(challengeId)
    }

    systemLogger.info('Challenge completed with reward distribution', 'admin', {
      challengeId,
      challengeTitle: challenge.title,
      challengeType: challenge.allow_points_only ? 'XP Challenge' : 'Cash Challenge',
      totalParticipants: rewardResult.challenge_stats.total_participants,
      completedParticipants: rewardResult.challenge_stats.completed_participants,
      totalDistributed: challenge.allow_points_only 
        ? rewardResult.summary.total_xp_awarded 
        : rewardResult.summary.total_distributed,
      platformRevenue: challenge.allow_points_only ? 0 : rewardResult.platform_revenue?.total || 0,
      distributionMethod: challenge.allow_points_only ? 'XP-based' : rewardResult.challenge_stats.reward_distribution
    })

    return NextResponse.json({
      success: true,
      message: 'Challenge completed and rewards distributed',
      challengeId,
      challenge_type: challenge.allow_points_only ? 'XP Challenge' : 'Cash Challenge',
      reward_summary: {
        total_distributed: challenge.allow_points_only 
          ? rewardResult.summary.total_xp_awarded 
          : rewardResult.summary.total_distributed,
        platform_revenue: challenge.allow_points_only ? 0 : rewardResult.platform_revenue?.total || 0,
        participants_rewarded: rewardResult.participant_rewards.length,
        distribution_method: challenge.allow_points_only ? 'XP-based' : rewardResult.challenge_stats.reward_distribution,
        completion_rate: `${rewardResult.challenge_stats.completed_participants}/${rewardResult.challenge_stats.total_participants} (${rewardResult.challenge_stats.completion_rate.toFixed(1)}%)`,
        average_reward: challenge.allow_points_only 
          ? rewardResult.summary.average_xp_per_participant 
          : rewardResult.summary.average_reward
      }
    })

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
    if (challengeType[0].allow_points_only) {
      // XP Challenge
      rewardResult = await calculateXPChallengeRewards(challengeId)
    } else {
      // Cash Challenge
      rewardResult = await calculateChallengeRewards(challengeId)
    }

    return NextResponse.json({
      success: true,
      message: 'Challenge completion preview (no rewards distributed)',
      preview: true,
      challenge_stats: rewardResult.challenge_stats,
      reward_summary: {
        total_to_distribute: rewardResult.summary.total_distributed,
        platform_revenue: rewardResult.platform_revenue.total,
        participants_to_reward: rewardResult.participant_rewards.length,
        distribution_method: rewardResult.challenge_stats.reward_distribution,
        completion_rate: `${rewardResult.challenge_stats.completed_participants}/${rewardResult.challenge_stats.total_participants} (${rewardResult.challenge_stats.completion_rate.toFixed(1)}%)`,
        average_reward: rewardResult.summary.average_reward,
        reward_range: `${rewardResult.summary.min_reward} - ${rewardResult.summary.max_reward}`
      },
      participant_rewards: rewardResult.participant_rewards.map(reward => ({
        participant_id: reward.participant_id,
        user_id: reward.user_id,
        original_stake: reward.original_stake,
        net_reward: reward.net_reward,
        reward_breakdown: reward.reward_breakdown
      }))
    })

  } catch (error) {
    console.error('❌ Challenge completion preview error:', error)

    return NextResponse.json({
      error: 'Failed to preview challenge completion',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
