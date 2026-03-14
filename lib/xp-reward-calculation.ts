import { createDbConnection } from '@/lib/db'
import type { SqlTag } from 'drizzle-orm/neon-http'

export interface XPChallengeStats {
  id: string
  title: string
  difficulty: string
  duration: string
  total_participants: number
  completed_count: number
  failed_count: number
  completion_rate: number
}

export interface XPParticipantReward {
  participant_id: string
  user_id: string
  xp_earned: number
  completion_bonus: number
  difficulty_bonus: number
  streak_bonus: number
  total_xp: number
  new_level: number
}

export interface XPRewardDistributionResult {
  challenge_stats: XPChallengeStats
  participant_rewards: XPParticipantReward[]
  summary: {
    total_xp_awarded: number
    average_xp_per_participant: number
    completion_rate: number
  }
}

/**
 * Calculate XP rewards for XP-only challenges
 */
export async function calculateXPChallengeRewards(
  challengeId: string,
  sqlOverride?: SqlTag
): Promise<XPRewardDistributionResult> {
  const sql = sqlOverride || (await createDbConnection())
  
  console.log(`🎯 Calculating XP rewards for challenge: ${challengeId}`)

  // Get challenge stats
  const challengeStats = await sql`
    SELECT 
      c.id, c.title, c.difficulty, c.duration,
      COUNT(cp.id) as total_participants,
      COUNT(CASE WHEN cp.completion_status = 'completed' THEN 1 END) as completed_count,
      COUNT(CASE WHEN cp.completion_status = 'failed' THEN 1 END) as failed_count
    FROM challenges c
    LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
    WHERE c.id = ${challengeId}
    GROUP BY c.id, c.title, c.difficulty, c.duration
  `

  if (challengeStats.length === 0) {
    throw new Error(`Challenge ${challengeId} not found`)
  }

  const stats = challengeStats[0]
  const completionRate = stats.total_participants > 0 
    ? (parseInt(stats.completed_count) / parseInt(stats.total_participants)) * 100 
    : 0

  const challengeStatsFormatted: XPChallengeStats = {
    id: stats.id,
    title: stats.title,
    difficulty: stats.difficulty,
    duration: stats.duration,
    total_participants: parseInt(stats.total_participants),
    completed_count: parseInt(stats.completed_count),
    failed_count: parseInt(stats.failed_count),
    completion_rate: completionRate
  }

  // Get completed participants
  const completedParticipants = await sql`
    SELECT 
      cp.id as participant_id,
      cp.user_id,
      cp.completion_status,
      cp.completed_at,
      u.xp as current_xp,
      u.level as current_level
    FROM challenge_participants cp
    JOIN users u ON cp.user_id = u.id
    WHERE cp.challenge_id = ${challengeId}
      AND cp.completion_status = 'completed'
  `

  // Calculate XP rewards for each participant
  const participantRewards: XPParticipantReward[] = completedParticipants.map((participant: any) => {
    const baseXP = calculateBaseXP(stats.difficulty, stats.duration)
    const completionBonus = calculateCompletionBonus(completionRate)
    const difficultyBonus = calculateDifficultyBonus(stats.difficulty)
    const streakBonus = 0 // TODO: Implement streak calculation
    
    const totalXP = baseXP + completionBonus + difficultyBonus + streakBonus
    const newLevel = Math.floor((participant.current_xp + totalXP) / 200) + 1

    return {
      participant_id: participant.participant_id,
      user_id: participant.user_id,
      xp_earned: baseXP,
      completion_bonus: completionBonus,
      difficulty_bonus: difficultyBonus,
      streak_bonus: streakBonus,
      total_xp: totalXP,
      new_level: newLevel
    }
  })

  const totalXPAwarded = participantRewards.reduce((sum, reward) => sum + reward.total_xp, 0)
  const averageXPPerParticipant = participantRewards.length > 0 
    ? totalXPAwarded / participantRewards.length 
    : 0

  return {
    challenge_stats: challengeStatsFormatted,
    participant_rewards: participantRewards,
    summary: {
      total_xp_awarded: totalXPAwarded,
      average_xp_per_participant: averageXPPerParticipant,
      completion_rate: completionRate
    }
  }
}

/**
 * Calculate base XP based on challenge difficulty and duration
 */
function calculateBaseXP(difficulty: string, duration: string): number {
  const difficultyMultipliers = {
    'easy': 1.0,
    'medium': 1.5,
    'hard': 2.0,
    'expert': 2.5
  }

  const durationMultipliers = {
    '1': 0.5,
    '3': 0.8,
    '7': 1.0,
    '14': 1.3,
    '21': 1.6,
    '30': 2.0
  }

  const baseXP = 100 // Base XP for completing any challenge
  const difficultyMultiplier = difficultyMultipliers[difficulty as keyof typeof difficultyMultipliers] || 1.0
  const durationMultiplier = durationMultipliers[duration as keyof typeof durationMultipliers] || 1.0

  return Math.round(baseXP * difficultyMultiplier * durationMultiplier)
}

/**
 * Calculate completion bonus based on challenge completion rate
 */
function calculateCompletionBonus(completionRate: number): number {
  // Higher completion rate = lower bonus (challenge was easier)
  // Lower completion rate = higher bonus (challenge was harder)
  if (completionRate >= 90) return 0
  if (completionRate >= 80) return 10
  if (completionRate >= 70) return 25
  if (completionRate >= 60) return 50
  if (completionRate >= 50) return 75
  return 100 // Very difficult challenge
}

/**
 * Calculate difficulty bonus
 */
function calculateDifficultyBonus(difficulty: string): number {
  const difficultyBonuses = {
    'easy': 0,
    'medium': 25,
    'hard': 50,
    'expert': 100
  }

  return difficultyBonuses[difficulty as keyof typeof difficultyBonuses] || 0
}

/**
 * Distribute XP rewards to participants
 */
export async function distributeXPRewards(
  challengeId: string,
  sqlOverride?: SqlTag
): Promise<XPRewardDistributionResult> {
  console.log(`🎯 Starting XP reward distribution for challenge: ${challengeId}`)
  
  const sql = sqlOverride || (await createDbConnection())
  const rewardResult = await calculateXPChallengeRewards(challengeId, sql)

  try {
    // Check if rewards already distributed
    const statusRows = await sql`
      SELECT status FROM challenges WHERE id = ${challengeId}
    `
    if (statusRows.length > 0 && statusRows[0].status === 'rewards_distributed') {
      console.log('ℹ️ XP rewards already distributed – idempotent return')
      return rewardResult
    }

    // Begin transaction for atomic XP distribution
    await sql`BEGIN`
    console.log('🔒 Transaction started for XP reward distribution')

    // Award XP to each participant
    for (const reward of rewardResult.participant_rewards) {
      // Use the safe XP awarding function
      const xpAwardResult = await sql`
        SELECT award_xp(
          ${reward.user_id}::UUID,
          ${reward.total_xp}::INTEGER,
          'challenge_completion'::VARCHAR(50),
          ${challengeId}::UUID,
          'Challenge completion reward: ${rewardResult.challenge_stats.title}'::TEXT
        ) as success
      `
      
      const xpAwarded = xpAwardResult[0]?.success
      
      if (xpAwarded) {
        console.log(`✅ Awarded ${reward.total_xp} XP to user ${reward.user_id}`)
        
        // Update participant record with XP earned
        await sql`
          UPDATE challenge_participants 
          SET 
            xp_earned = ${reward.total_xp},
            updated_at = NOW()
          WHERE id = ${reward.participant_id}
        `
      } else {
        console.log(`⚠️ XP already awarded to user ${reward.user_id} for this challenge`)
      }
    }

    // Update challenge status
    await sql`
      UPDATE challenges 
      SET 
        status = 'rewards_distributed',
        updated_at = NOW()
      WHERE id = ${challengeId}
    `

    // Commit transaction
    await sql`COMMIT`
    console.log('✅ Transaction committed successfully')

    console.log(`🎉 XP reward distribution completed for challenge: ${challengeId}`)
    console.log(`📊 Summary:`, {
      totalParticipants: rewardResult.challenge_stats.total_participants,
      completedParticipants: rewardResult.challenge_stats.completed_count,
      totalXPAwarded: rewardResult.summary.total_xp_awarded,
      averageXPPerParticipant: rewardResult.summary.average_xp_per_participant
    })

    return rewardResult

  } catch (error) {
    console.error('❌ Error distributing XP rewards:', error)
    
    // Rollback transaction to prevent partial updates
    try {
      await sql`ROLLBACK`
      console.log('🔄 Transaction rolled back successfully')
    } catch (rollbackError) {
      console.error('❌ Rollback failed:', rollbackError)
    }
    
    throw error
  }
}

/**
 * Calculate potential XP reward for a user considering joining an XP-only challenge
 */
export async function calculatePotentialXPReward(
  challengeId: string,
  userId: string
): Promise<number> {
  const sql = await createDbConnection()

  // Get challenge details
  const challengeData = await sql`
    SELECT 
      c.difficulty, c.duration,
      COUNT(cp.id) as current_participants,
      COUNT(CASE WHEN cp.completion_status = 'completed' THEN 1 END) as completed_count
    FROM challenges c
    LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
    WHERE c.id = ${challengeId}
    GROUP BY c.id, c.difficulty, c.duration
  `

  if (challengeData.length === 0) {
    throw new Error(`Challenge ${challengeId} not found`)
  }

  const challenge = challengeData[0]
  const estimatedCompletionRate = 70 // Assume 70% completion rate
  
  const baseXP = calculateBaseXP(challenge.difficulty, challenge.duration)
  const completionBonus = calculateCompletionBonus(estimatedCompletionRate)
  const difficultyBonus = calculateDifficultyBonus(challenge.difficulty)
  
  return baseXP + completionBonus + difficultyBonus
}
