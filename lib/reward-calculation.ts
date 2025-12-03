import { createDbConnection } from '@/lib/db'
import { notifyInsurancePayout, notifyBatchRewards } from '@/lib/notification-service'

type SqlTag = (strings: TemplateStringsArray, ...values: any[]) => Promise<any[]>

export type RewardDistributionMethod = 'winner-takes-all' | 'equal-split' | 'proportional'

export interface ChallengeStats {
  id: string
  title: string
  reward_distribution: RewardDistributionMethod
  failed_stake_cut: number
  host_contribution: number
  total_participants: number
  completed_participants: number
  failed_participants: number
  total_stakes: number
  failed_stakes: number
  completed_stakes: number
  completion_rate: number
}

export interface ParticipantReward {
  participant_id: string
  user_id: string
  original_stake: number
  reward_amount: number
  platform_cut: number
  net_reward: number
  reward_breakdown: {
    stake_return: number
    bonus_reward: number
    host_contribution_share: number
  }
}

export interface RewardDistributionResult {
  challenge_stats: ChallengeStats
  participant_rewards: ParticipantReward[]
  platform_revenue: {
    entry_fees: number
    failed_stake_cut: number
    total: number
  }
  summary: {
    total_distributed: number
    total_platform_cut: number
    average_reward: number
    max_reward: number
    min_reward: number
  }
}

/**
 * Calculate potential reward for a user considering joining a challenge
 */
export async function calculatePotentialReward(
  challengeId: string, 
  userStake: number, 
  pointsOnly: boolean = false
): Promise<number> {
  if (pointsOnly) return 0 // Points-only challenges have no monetary rewards

  const sql = await createDbConnection()

  // Get challenge and current stats
  const challengeData = await sql`
    SELECT 
      c.reward_distribution,
      c.failed_stake_cut,
      c.host_contribution,
      COUNT(cp.id) as current_participants,
      AVG(cp.stake_amount) as avg_stake,
      COUNT(CASE WHEN cp.completion_status = 'failed' THEN 1 END) as failed_count
    FROM challenges c
    LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
    WHERE c.id = ${challengeId}
    GROUP BY c.id, c.reward_distribution, c.failed_stake_cut, c.host_contribution
  `

  if (challengeData.length === 0) {
    throw new Error(`Challenge ${challengeId} not found`)
  }

  const challenge = challengeData[0]
  
  // Estimate potential reward based on current stats and distribution method
  const avgStake = parseFloat(challenge.avg_stake || userStake.toString())
  const estimatedTotalParticipants = parseInt(challenge.current_participants) + 1
  const estimatedFailedStakes = avgStake * estimatedTotalParticipants * 0.3 // Assume 30% failure rate
  const availablePool = estimatedFailedStakes * (1 - parseFloat(challenge.failed_stake_cut) / 100) + parseFloat(challenge.host_contribution)
  const estimatedCompleters = estimatedTotalParticipants * 0.7 // Assume 70% completion rate

  switch (challenge.reward_distribution as RewardDistributionMethod) {
    case 'winner-takes-all':
      // User gets their stake back + share of bonus pool
      return userStake + (availablePool / estimatedCompleters)
    
    case 'equal-split':
      // Total pool split equally (including user's own stake in the pool)
      const totalPool = (avgStake * estimatedTotalParticipants) + availablePool
      return totalPool / estimatedCompleters
    
    case 'proportional':
      // User gets stake back + proportional share of bonus pool
      const proportionalShare = userStake / (avgStake * estimatedCompleters)
      return userStake + (availablePool * proportionalShare)
    
    default:
      return userStake * 1.5 // Simple fallback
  }
}

/**
 * Calculate actual rewards for a completed challenge
 */
export async function calculateChallengeRewards(
  challengeId: string,
  sqlOverride?: SqlTag
): Promise<RewardDistributionResult> {
  const sql = sqlOverride || (await createDbConnection())

  // Get challenge data with participant statistics
  const challengeData = await sql`
    SELECT 
      c.id,
      c.title,
      c.reward_distribution,
      c.failed_stake_cut,
      c.host_contribution,
      COUNT(cp.id) as total_participants,
      COUNT(CASE WHEN cp.completion_status = 'completed' THEN 1 END) as completed_participants,
      COUNT(CASE WHEN cp.completion_status = 'failed' THEN 1 END) as failed_participants,
      SUM(cp.stake_amount) as total_stakes,
      SUM(CASE WHEN cp.completion_status = 'failed' THEN cp.stake_amount ELSE 0 END) as failed_stakes,
      SUM(CASE WHEN cp.completion_status = 'completed' THEN cp.stake_amount ELSE 0 END) as completed_stakes,
      SUM(cp.entry_fee_paid) as total_entry_fees
    FROM challenges c
    LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
    WHERE c.id = ${challengeId}
    GROUP BY c.id, c.title, c.reward_distribution, c.failed_stake_cut, c.host_contribution
  `

  if (challengeData.length === 0) {
    throw new Error(`Challenge ${challengeId} not found`)
  }

  const challenge = challengeData[0]

  // Build challenge stats
  const challengeStats: ChallengeStats = {
    id: challenge.id,
    title: challenge.title,
    reward_distribution: (challenge.reward_distribution || 'equal-split') as RewardDistributionMethod,
    failed_stake_cut: parseFloat(challenge.failed_stake_cut || '20'),
    host_contribution: parseFloat(challenge.host_contribution || '0'),
    total_participants: parseInt(challenge.total_participants || '0'),
    completed_participants: parseInt(challenge.completed_participants || '0'),
    failed_participants: parseInt(challenge.failed_participants || '0'),
    total_stakes: parseFloat(challenge.total_stakes || '0'),
    failed_stakes: parseFloat(challenge.failed_stakes || '0'),
    completed_stakes: parseFloat(challenge.completed_stakes || '0'),
    completion_rate: challenge.total_participants > 0 ? (challenge.completed_participants / challenge.total_participants) * 100 : 0
  }

  // Get completed participants
  const completedParticipants = await sql`
    SELECT 
      cp.id as participant_id,
      cp.user_id,
      cp.stake_amount,
      cp.entry_fee_paid
    FROM challenge_participants cp
    WHERE cp.challenge_id = ${challengeId} 
      AND cp.completion_status = 'completed'
    ORDER BY cp.stake_amount DESC
  `

  if (completedParticipants.length === 0) {
    throw new Error('No completed participants found for reward calculation')
  }

  // Calculate platform revenue
  // Platform takes failed_stake_cut % (default 20%) from failed stakes
  // The remaining (100 - failed_stake_cut)% goes to the bonus pool for winners
  const platformRevenue = {
    entry_fees: parseFloat(challenge.total_entry_fees || '0'),
    failed_stake_cut: challengeStats.failed_stakes * (challengeStats.failed_stake_cut / 100),
    total: 0
  }
  platformRevenue.total = platformRevenue.entry_fees + platformRevenue.failed_stake_cut

  // Calculate the amount that goes to winners (remainder after platform cut)
  const failedStakesForWinners = challengeStats.failed_stakes - platformRevenue.failed_stake_cut

  // Calculate rewards based on distribution method
  const participantRewards = calculateRewardDistribution(
    challengeStats,
    completedParticipants,
    failedStakesForWinners
  )

  // Calculate summary
  const totalDistributed = participantRewards.reduce((sum, r) => sum + r.net_reward, 0)
  const summary = {
    total_distributed: totalDistributed,
    total_platform_cut: platformRevenue.total,
    average_reward: participantRewards.length > 0 ? totalDistributed / participantRewards.length : 0,
    max_reward: participantRewards.length > 0 ? Math.max(...participantRewards.map(r => r.net_reward)) : 0,
    min_reward: participantRewards.length > 0 ? Math.min(...participantRewards.map(r => r.net_reward)) : 0
  }

  return {
    challenge_stats: challengeStats,
    participant_rewards: participantRewards,
    platform_revenue: platformRevenue,
    summary
  }
}

/**
 * Calculate reward distribution based on the challenge's reward method
 */
function calculateRewardDistribution(
  challengeStats: ChallengeStats,
  participants: any[],
  failedStakesForWinners: number
): ParticipantReward[] {
  const { reward_distribution, failed_stakes, host_contribution } = challengeStats
  
  // Available bonus pool (failed stakes allocated for winners + host contribution)
  // Note: Platform has already taken its cut (e.g., 20%) before this amount is passed
  const bonusPool = failedStakesForWinners + host_contribution

  console.log(`🎯 Calculating ${reward_distribution} rewards:`, {
    totalFailedStakes: failed_stakes,
    failedStakesForWinners: failedStakesForWinners,
    hostContribution: host_contribution,
    bonusPool: bonusPool,
    participants: participants.length
  })

  switch (reward_distribution) {
    case 'winner-takes-all':
      return calculateWinnerTakesAll(participants, bonusPool, host_contribution)
    
    case 'equal-split':
      return calculateEqualSplit(participants, bonusPool, host_contribution, challengeStats)
    
    case 'proportional':
      return calculateProportional(participants, bonusPool, host_contribution)
    
    default:
      throw new Error(`Unknown reward distribution method: ${reward_distribution}`)
  }
}

/**
 * Winner Takes All: Each completer gets their stake back + equal share of bonus pool
 */
function calculateWinnerTakesAll(
  participants: any[],
  bonusPool: number,
  hostContribution: number
): ParticipantReward[] {
  const bonusPerParticipant = participants.length > 0 ? bonusPool / participants.length : 0
  const hostContributionShare = participants.length > 0 ? hostContribution / participants.length : 0

  return participants.map(participant => {
    const originalStake = parseFloat(participant.stake_amount)
    const stakeReturn = originalStake
    const bonusReward = bonusPerParticipant - hostContributionShare
    const totalReward = stakeReturn + bonusPerParticipant

    return {
      participant_id: participant.participant_id,
      user_id: participant.user_id,
      original_stake: originalStake,
      reward_amount: totalReward,
      platform_cut: 0,
      net_reward: totalReward,
      reward_breakdown: {
        stake_return: stakeReturn,
        bonus_reward: bonusReward,
        host_contribution_share: hostContributionShare
      }
    }
  })
}

/**
 * Equal Split: Total pool (including all stakes) split equally among completers
 */
function calculateEqualSplit(
  participants: any[],
  bonusPool: number,
  hostContribution: number,
  challengeStats: ChallengeStats
): ParticipantReward[] {
  // In equal split, we pool ALL stakes from completers + bonus pool
  const totalStakesFromCompleters = participants.reduce((sum, p) => sum + parseFloat(p.stake_amount), 0)
  const totalPool = totalStakesFromCompleters + bonusPool
  const rewardPerParticipant = participants.length > 0 ? totalPool / participants.length : 0
  const hostContributionShare = participants.length > 0 ? hostContribution / participants.length : 0

  return participants.map(participant => {
    const originalStake = parseFloat(participant.stake_amount)
    const totalReward = rewardPerParticipant

    return {
      participant_id: participant.participant_id,
      user_id: participant.user_id,
      original_stake: originalStake,
      reward_amount: totalReward,
      platform_cut: 0,
      net_reward: totalReward,
      reward_breakdown: {
        stake_return: 0, // In equal split, stake is pooled
        bonus_reward: totalReward - hostContributionShare,
        host_contribution_share: hostContributionShare
      }
    }
  })
}

/**
 * Proportional: Rewards distributed proportional to stake amount
 */
function calculateProportional(
  participants: any[],
  bonusPool: number,
  hostContribution: number
): ParticipantReward[] {
  const totalStakesFromCompleters = participants.reduce((sum, p) => sum + parseFloat(p.stake_amount), 0)
  
  if (totalStakesFromCompleters === 0) {
    return participants.map(p => ({
      participant_id: p.participant_id,
      user_id: p.user_id,
      original_stake: 0,
      reward_amount: 0,
      platform_cut: 0,
      net_reward: 0,
      reward_breakdown: { stake_return: 0, bonus_reward: 0, host_contribution_share: 0 }
    }))
  }

  return participants.map(participant => {
    const originalStake = parseFloat(participant.stake_amount)
    const stakePercentage = originalStake / totalStakesFromCompleters
    
    // Each participant gets their stake back + proportional share of bonus pool
    const stakeReturn = originalStake
    const bonusReward = bonusPool * stakePercentage
    const hostContributionShare = hostContribution * stakePercentage
    const totalReward = stakeReturn + bonusReward

    return {
      participant_id: participant.participant_id,
      user_id: participant.user_id,
      original_stake: originalStake,
      reward_amount: totalReward,
      platform_cut: 0,
      net_reward: totalReward,
      reward_breakdown: {
        stake_return: stakeReturn,
        bonus_reward: bonusReward - hostContributionShare,
        host_contribution_share: hostContributionShare
      }
    }
  })
}

/**
 * Distribute calculated rewards to participants
 */
export async function distributeRewards(
  challengeId: string,
  sqlOverride?: SqlTag
): Promise<RewardDistributionResult> {
  console.log(`💰 Starting reward distribution for challenge: ${challengeId}`)
  
  // Calculate the rewards
  const sql = sqlOverride || (await createDbConnection())
  const rewardResult = await calculateChallengeRewards(challengeId, sql)

  try {
    // Idempotency: if already distributed, return current calculation without changes
    const statusRows = await sql`
      SELECT status FROM challenges WHERE id = ${challengeId}
    `
    if (statusRows.length > 0 && statusRows[0].status === 'rewards_distributed') {
      console.log('ℹ️ Rewards already distributed – idempotent return')
      return rewardResult
    }

    // Begin transaction for atomic reward distribution
    await sql`BEGIN`
    console.log('🔒 Transaction started for reward distribution')

    // Update each participant's reward and user credits
    for (const reward of rewardResult.participant_rewards) {
      // Update participant reward amount
      await sql`
        UPDATE challenge_participants 
        SET 
          reward_earned = ${reward.net_reward},
          updated_at = NOW()
        WHERE id = ${reward.participant_id}
      `

      // Add credits to user account
      await sql`
        UPDATE users 
        SET 
          credits = credits + ${reward.net_reward},
          updated_at = NOW()
        WHERE id = ${reward.user_id}
      `

      // Record credit transaction
      await sql`
        INSERT INTO credit_transactions (
          user_id, amount, transaction_type, related_challenge_id, description, created_at
        ) VALUES (
          ${reward.user_id}, 
          ${reward.net_reward}, 
          'challenge_reward', 
          ${challengeId},
          'Challenge completion reward: ${rewardResult.challenge_stats.title}',
          NOW()
        )
      `
    }

    // Record platform revenue
    if (rewardResult.platform_revenue.failed_stake_cut > 0) {
      await sql`
        INSERT INTO platform_revenue (
          revenue_type, amount, challenge_id, created_at
        ) VALUES (
          'failed_stakes', 
          ${rewardResult.platform_revenue.failed_stake_cut}, 
          ${challengeId}, 
          NOW()
        )
      `
    }

    if (rewardResult.platform_revenue.entry_fees > 0) {
      await sql`
        INSERT INTO platform_revenue (
          revenue_type, amount, challenge_id, created_at
        ) VALUES (
          'entry_fee', 
          ${rewardResult.platform_revenue.entry_fees}, 
          ${challengeId}, 
          NOW()
        )
      `
    }

    // Create a settlements record if table exists
    try {
      await sql`
        INSERT INTO settlements (
          challenge_id,
          total_distributed,
          platform_revenue_total,
          revenue_entry_fees,
          revenue_failed_stakes_cut,
          participants_rewarded,
          reward_distribution_method,
          created_at
        ) VALUES (
          ${challengeId},
          ${rewardResult.summary.total_distributed},
          ${rewardResult.platform_revenue.total},
          ${rewardResult.platform_revenue.entry_fees},
          ${rewardResult.platform_revenue.failed_stake_cut},
          ${rewardResult.participant_rewards.length},
          ${rewardResult.challenge_stats.reward_distribution},
          NOW()
        )
      `
    } catch (e) {
      console.warn('ℹ️ settlements table not found; skipping settlements record')
    }

    // Process insurance refunds for failed participants
    console.log('🛡️ Processing insurance refunds...')
    const failedWithInsurance = await sql`
      SELECT 
        cp.id as participant_id,
        cp.user_id,
        cp.stake_amount,
        cp.insurance_fee_paid
      FROM challenge_participants cp
      WHERE cp.challenge_id = ${challengeId}
        AND cp.completion_status = 'failed'
        AND cp.insurance_purchased = true
        AND cp.insurance_fee_paid > 0
    `

    let totalInsurancePayouts = 0
    for (const participant of failedWithInsurance) {
      const refundAmount = parseFloat(participant.stake_amount)
      
      // Refund their stake (insurance fee is non-refundable)
      await sql`
        UPDATE users 
        SET 
          credits = credits + ${refundAmount},
          updated_at = NOW()
        WHERE id = ${participant.user_id}
      `
      
      // Record insurance payout transaction
      await sql`
        INSERT INTO credit_transactions (
          user_id, amount, transaction_type, related_challenge_id, description, created_at
        ) VALUES (
          ${participant.user_id}, 
          ${refundAmount}, 
          'insurance_payout', 
          ${challengeId},
          ${`Insurance payout for failed challenge: ${rewardResult.challenge_stats.title}`},
          NOW()
        )
      `
      
      // Record insurance revenue for the platform
      await sql`
        INSERT INTO platform_revenue (
          revenue_type, amount, user_id, challenge_id, created_at
        ) VALUES (
          'insurance', 
          ${parseFloat(participant.insurance_fee_paid)}, 
          ${participant.user_id},
          ${challengeId},
          NOW()
        )
      `
      
      totalInsurancePayouts += refundAmount
      console.log(`✅ Insurance payout: $${refundAmount} to user ${participant.user_id}`)
      
      // Send insurance payout notification
      await notifyInsurancePayout(
        participant.user_id,
        rewardResult.challenge_stats.title,
        refundAmount,
        challengeId,
        sql
      ).catch(error => {
        console.error('Failed to send insurance notification:', error)
        // Don't fail reward distribution if notification fails
      })
    }

    if (failedWithInsurance.length > 0) {
      console.log(`🛡️ Total insurance payouts: $${totalInsurancePayouts} to ${failedWithInsurance.length} participants`)
    }

    // Mark challenge as rewards distributed
    await sql`
      UPDATE challenges 
      SET 
        status = 'rewards_distributed',
        updated_at = NOW()
      WHERE id = ${challengeId}
    `

    // Send reward notifications to all winners
    console.log('📬 Sending reward notifications to winners...')
    const rewardsToNotify = rewardResult.participant_rewards.map(reward => ({
      user_id: reward.user_id,
      challenge_title: rewardResult.challenge_stats.title,
      challenge_id: challengeId,
      net_reward: reward.net_reward,
      reward_breakdown: reward.reward_breakdown
    }))
    
    await notifyBatchRewards(rewardsToNotify, sql).catch(error => {
      console.error('Failed to send reward notifications:', error)
      // Don't fail reward distribution if notifications fail
    })

    // Commit transaction
    await sql`COMMIT`
    console.log('✅ Transaction committed successfully')

    console.log('✅ Rewards distributed successfully for challenge:', challengeId)
    console.log('💰 Total distributed:', rewardResult.summary.total_distributed)
    console.log('📊 Platform revenue:', rewardResult.platform_revenue.total)
    console.log('🛡️ Insurance payouts:', totalInsurancePayouts)

    return rewardResult

  } catch (error) {
    console.error('❌ Reward distribution failed:', error)
    
    // Rollback transaction to prevent partial updates
    try {
      await sql`ROLLBACK`
      console.log('🔄 Transaction rolled back successfully')
    } catch (rollbackError) {
      console.error('❌ Rollback failed:', rollbackError)
    }
    
    throw new Error(`Failed to distribute rewards: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
