import { NextRequest, NextResponse } from 'next/server'
import { createDbConnection } from '@/lib/db'
import { calculatePotentialReward, calculateChallengeRewards } from '@/lib/reward-calculation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const challengeId = searchParams.get('challengeId')
    const testStake = parseFloat(searchParams.get('stake') || '25')
    const action = searchParams.get('action') || 'potential'

    if (!challengeId) {
      return NextResponse.json({
        error: 'Missing challengeId parameter',
        usage: '/api/test-reward-calculation?challengeId=uuid&stake=25&action=potential|actual'
      }, { status: 400 })
    }

    const sql = await createDbConnection()

    // Get challenge info for context
    const challengeInfo = await sql`
      SELECT 
        c.title,
        c.reward_distribution,
        c.failed_stake_cut,
        c.host_contribution,
        c.status,
        COUNT(cp.id) as total_participants,
        COUNT(CASE WHEN cp.completion_status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN cp.completion_status = 'failed' THEN 1 END) as failed_count,
        AVG(cp.stake_amount) as avg_stake
      FROM challenges c
      LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
      WHERE c.id = ${challengeId}
      GROUP BY c.id, c.title, c.reward_distribution, c.failed_stake_cut, c.host_contribution, c.status
    `

    if (challengeInfo.length === 0) {
      return NextResponse.json({
        error: 'Challenge not found',
        challengeId
      }, { status: 404 })
    }

    const challenge = challengeInfo[0]

    if (action === 'potential') {
      // Test potential reward calculation
      const potentialReward = await calculatePotentialReward(challengeId, testStake, false)
      
      return NextResponse.json({
        success: true,
        test_type: 'potential_reward',
        challenge: {
          id: challengeId,
          title: challenge.title,
          distribution_method: challenge.reward_distribution,
          failed_stake_cut: `${challenge.failed_stake_cut}%`,
          host_contribution: challenge.host_contribution,
          status: challenge.status
        },
        input: {
          user_stake: testStake,
          points_only: false
        },
        current_stats: {
          total_participants: parseInt(challenge.total_participants),
          completed: parseInt(challenge.completed_count),
          failed: parseInt(challenge.failed_count),
          average_stake: parseFloat(challenge.avg_stake || '0')
        },
        result: {
          potential_reward: potentialReward,
          potential_profit: potentialReward - testStake,
          potential_roi: testStake > 0 ? ((potentialReward - testStake) / testStake * 100).toFixed(2) + '%' : '0%'
        }
      })

    } else if (action === 'actual') {
      // Test actual reward calculation (if challenge has completed participants)
      if (parseInt(challenge.completed_count) === 0) {
        return NextResponse.json({
          error: 'No completed participants found for actual reward calculation',
          suggestion: 'Use action=potential or add completed participants to test'
        }, { status: 400 })
      }

      const rewardResult = await calculateChallengeRewards(challengeId)

      return NextResponse.json({
        success: true,
        test_type: 'actual_rewards',
        challenge: {
          id: challengeId,
          title: challenge.title,
          distribution_method: challenge.reward_distribution,
          status: challenge.status
        },
        challenge_stats: rewardResult.challenge_stats,
        platform_revenue: rewardResult.platform_revenue,
        summary: rewardResult.summary,
        participant_rewards: rewardResult.participant_rewards.map(reward => ({
          participant_id: reward.participant_id.substring(0, 8) + '...', // Truncate for privacy
          original_stake: reward.original_stake,
          net_reward: reward.net_reward,
          profit: reward.net_reward - reward.original_stake,
          roi: reward.original_stake > 0 ? ((reward.net_reward - reward.original_stake) / reward.original_stake * 100).toFixed(2) + '%' : '0%',
          breakdown: reward.reward_breakdown
        })),
        test_insights: {
          total_pool: rewardResult.challenge_stats.total_stakes,
          failed_pool: rewardResult.challenge_stats.failed_stakes,
          bonus_pool: rewardResult.challenge_stats.failed_stakes * (1 - rewardResult.challenge_stats.failed_stake_cut / 100) + rewardResult.challenge_stats.host_contribution,
          platform_cut_percentage: (rewardResult.platform_revenue.total / (rewardResult.challenge_stats.total_stakes + rewardResult.challenge_stats.host_contribution) * 100).toFixed(2) + '%'
        }
      })

    } else {
      return NextResponse.json({
        error: 'Invalid action parameter',
        valid_actions: ['potential', 'actual'],
        current_action: action
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Reward calculation test error:', error)
    
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    }, { status: 500 })
  }
}

// POST endpoint to create test data for reward calculation testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { challengeId, participants } = body

    if (!challengeId || !participants || !Array.isArray(participants)) {
      return NextResponse.json({
        error: 'Invalid request body',
        expected: {
          challengeId: 'string',
          participants: [
            {
              stake_amount: 'number',
              completion_status: 'completed|failed'
            }
          ]
        }
      }, { status: 400 })
    }

    const sql = await createDbConnection()

    // Verify challenge exists
    const challengeCheck = await sql`
      SELECT id, title FROM challenges WHERE id = ${challengeId}
    `

    if (challengeCheck.length === 0) {
      return NextResponse.json({
        error: 'Challenge not found',
        challengeId
      }, { status: 404 })
    }

    // Create test participants
    const createdParticipants = []
    
    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i]
      const entryFee = participant.stake_amount * 0.05 // 5% entry fee
      
      const result = await sql`
        INSERT INTO challenge_participants (
          challenge_id,
          user_id,
          stake_amount,
          entry_fee_paid,
          completion_status
        ) VALUES (
          ${challengeId},
          gen_random_uuid(), -- Generate random user ID for test
          ${participant.stake_amount},
          ${entryFee},
          ${participant.completion_status}
        )
        RETURNING id, user_id, stake_amount, completion_status
      `
      
      createdParticipants.push(result[0])
    }

    return NextResponse.json({
      success: true,
      message: 'Test participants created',
      challenge: challengeCheck[0],
      created_participants: createdParticipants,
      next_steps: [
        `GET /api/test-reward-calculation?challengeId=${challengeId}&action=potential&stake=25`,
        `GET /api/test-reward-calculation?challengeId=${challengeId}&action=actual`
      ]
    })

  } catch (error) {
    console.error('❌ Test data creation error:', error)
    
    return NextResponse.json({
      error: 'Failed to create test data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
