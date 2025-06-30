import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { isDemoUser } from '@/lib/demo-data'

interface RouteParams {
  params: {
    id: string
  }
}

interface TeamData {
  id: string
  current_members: number
  max_members: number
}

// JOIN a challenge
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const challengeId = params.id
    const body = await request.json()
    const { 
      stakeAmount, 
      insurancePurchased = false, 
      referralCode,
      teamPreference,
      pointsOnly = false 
    } = body
    
    // Validate required fields for money challenges
    if (!pointsOnly && !stakeAmount) {
      return NextResponse.json({
        error: 'Stake amount is required for money challenges'
      }, { status: 400 })
    }
    
    // Demo user handling
    if (isDemoUser(session.user.id)) {
      return handleDemoJoin(challengeId, session.user, body)
    }

    // Real user handling
    const sql = await createDbConnection()
    
    // Get challenge details
    const challenge = await sql`
      SELECT 
        c.*,
        u.name as host_name,
        COUNT(cp.id) as current_participants
      FROM challenges c
      LEFT JOIN users u ON c.host_id = u.id
      LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
      WHERE c.id = ${challengeId}
      GROUP BY c.id, u.name
    `
    
    if (challenge.length === 0) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }
    
    const challengeData = challenge[0]
    
    // Validate challenge status
    if (challengeData.status !== 'active' && challengeData.status !== 'pending') {
      return NextResponse.json({ 
        error: 'This challenge is no longer accepting participants' 
      }, { status: 400 })
    }
    
    // Check capacity
    if (challengeData.max_participants && challengeData.current_participants >= challengeData.max_participants) {
      return NextResponse.json({ 
        error: 'Challenge is full' 
      }, { status: 400 })
    }
    
    // Check if user already joined
    const existingParticipation = await sql`
      SELECT id FROM challenge_participants 
      WHERE challenge_id = ${challengeId} AND user_id = ${session.user.id}
    `
    
    if (existingParticipation.length > 0) {
      return NextResponse.json({ 
        error: 'You have already joined this challenge' 
      }, { status: 400 })
    }
    
    // Validate stake amount
    let stake = 0
    if (!challengeData.allow_points_only || !pointsOnly) {
      stake = parseFloat(stakeAmount)
      if (stake < challengeData.min_stake || stake > challengeData.max_stake) {
        return NextResponse.json({
          error: `Stake amount must be between $${challengeData.min_stake} and $${challengeData.max_stake}`
        }, { status: 400 })
      }
    }
    
    // Calculate fees
    const entryFee = stake * (challengeData.entry_fee_percentage / 100)
    const insuranceFee = insurancePurchased ? 1.00 : 0.00
    const totalCost = stake + entryFee + insuranceFee
    
    // Get user credits
    const userData = await sql`
      SELECT credits FROM users WHERE id = ${session.user.id}
    `
    
    if (userData.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Check sufficient credits for money challenges
    if (!pointsOnly && userData[0].credits < totalCost) {
      return NextResponse.json({
        error: `Insufficient credits. You need $${totalCost.toFixed(2)} but only have $${userData[0].credits.toFixed(2)}`,
        details: {
          required: totalCost,
          available: userData[0].credits,
          shortfall: totalCost - userData[0].credits
        }
      }, { status: 400 })
    }
    
    // Handle team assignment for team challenges
    let assignedTeamId = null
    if (challengeData.enable_team_mode) {
      assignedTeamId = await assignUserToTeam(sql, challengeId, challengeData, teamPreference)
    }
    
    // Handle referral if provided
    let referrerId = null
    if (referralCode) {
      referrerId = await processReferral(sql, challengeId, referralCode, session.user.id)
    }
    
    // Create participation record
    const participation = await sql`
      INSERT INTO challenge_participants (
        challenge_id, user_id, stake_amount, entry_fee_paid, 
        insurance_purchased, insurance_fee_paid, team_id,
        completion_status, joined_at
      ) VALUES (
        ${challengeId}, ${session.user.id}, ${stake}, ${entryFee},
        ${insurancePurchased}, ${insuranceFee}, ${assignedTeamId},
        'active', NOW()
      )
      RETURNING id, joined_at
    `
    
    // Deduct credits for money challenges
    if (!pointsOnly) {
      await sql`
        UPDATE users 
        SET credits = credits - ${totalCost}
        WHERE id = ${session.user.id}
      `
      
      // Record transaction
      await sql`
        INSERT INTO credit_transactions (
          user_id, amount, transaction_type, related_challenge_id, description, created_at
        ) VALUES (
          ${session.user.id}, ${-totalCost}, 'challenge_join', ${challengeId},
          'Joined challenge: ${challengeData.title}', NOW()
        )
      `
    }
    
    // Create referral record if applicable
    if (referrerId) {
      await sql`
        INSERT INTO challenge_referrals (
          challenge_id, referrer_id, referred_id, created_at
        ) VALUES (
          ${challengeId}, ${referrerId}, ${session.user.id}, NOW()
        )
      `
    }
    
    // Calculate potential rewards
    const newParticipantCount = challengeData.current_participants + 1
    const potentialReward = calculatePotentialReward(challengeData, stake, newParticipantCount)
    
    return NextResponse.json({
      success: true,
      message: 'Successfully joined challenge!',
      participation: {
        id: participation[0].id,
        challenge_id: challengeId,
        user_id: session.user.id,
        stake_amount: stake,
        total_cost: totalCost,
        team_id: assignedTeamId,
        joined_at: participation[0].joined_at
      },
      financial_breakdown: {
        stake_amount: stake,
        entry_fee: entryFee,
        insurance_fee: insuranceFee,
        total_cost: totalCost,
        remaining_credits: userData[0].credits - totalCost,
        potential_reward: potentialReward
      },
      challenge_info: {
        title: challengeData.title,
        total_participants: newParticipantCount,
        host_name: challengeData.host_name,
        start_date: challengeData.start_date,
        end_date: challengeData.end_date,
        has_teams: challengeData.enable_team_mode,
        team_assigned: assignedTeamId
      },
      next_steps: challengeData.enable_team_mode ? [
        'Meet your teammates in the challenge chat',
        'Review daily requirements and proof instructions', 
        'Start completing daily tasks when challenge begins',
        'Submit proof of completion each day'
      ] : [
        'Review daily requirements and proof instructions',
        'Start completing daily tasks when challenge begins', 
        'Submit proof of completion each day',
        'Earn rewards upon successful completion'
      ]
    }, { status: 201 })
    
  } catch (error) {
    console.error('Challenge join error:', error)
    return NextResponse.json({
      error: 'Failed to join challenge',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// Handle demo user joins
function handleDemoJoin(challengeId: string, user: any, body: any) {
  const { stakeAmount = 50, insurancePurchased = false, pointsOnly = false } = body
  
  const stake = pointsOnly ? 0 : parseFloat(stakeAmount)
  const entryFee = stake * 0.05
  const insuranceFee = insurancePurchased ? 1.00 : 0.00
  const totalCost = stake + entryFee + insuranceFee
  
  return NextResponse.json({
    success: true,
    message: 'Successfully joined challenge! (Demo Mode)',
    participation: {
      id: `demo-participation-${Date.now()}`,
      challenge_id: challengeId,
      user_id: user.id,
      stake_amount: stake,
      total_cost: totalCost,
      team_id: Math.random() > 0.5 ? `demo-team-${Math.floor(Math.random() * 3) + 1}` : null,
      joined_at: new Date().toISOString()
    },
    financial_breakdown: {
      stake_amount: stake,
      entry_fee: entryFee,
      insurance_fee: insuranceFee,
      total_cost: totalCost,
      remaining_credits: 247.50 - totalCost,
      potential_reward: stake * 1.8
    },
    challenge_info: {
      title: 'Demo Challenge',
      total_participants: 24,
      host_name: 'Demo Host',
      start_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
      has_teams: Math.random() > 0.5,
      team_assigned: Math.random() > 0.5 ? `demo-team-${Math.floor(Math.random() * 3) + 1}` : null
    }
  }, { status: 201 })
}

// Assign user to team based on challenge settings
async function assignUserToTeam(sql: any, challengeId: string, challengeData: any, teamPreference?: string): Promise<string | null> {
  if (!challengeData.enable_team_mode) return null
  
  // Get existing teams
  const teams: TeamData[] = await sql`
    SELECT id, current_members, max_members 
    FROM challenge_teams 
    WHERE challenge_id = ${challengeId}
    ORDER BY current_members ASC
  `
  
  if (teams.length === 0) {
    // Create teams if they don't exist
    await sql`SELECT create_challenge_teams(${challengeId}, ${challengeData.number_of_teams || 2})`
    
    // Re-fetch teams
    const newTeams = await sql`
      SELECT id FROM challenge_teams 
      WHERE challenge_id = ${challengeId}
      ORDER BY created_at ASC
      LIMIT 1
    `
    return newTeams[0]?.id || null
  }
  
  // Auto-balance assignment (assign to team with fewest members)
  const availableTeam = teams.find((team: TeamData) => team.current_members < team.max_members)
  
  if (availableTeam) {
    // Update team member count
    await sql`
      UPDATE challenge_teams 
      SET current_members = current_members + 1 
      WHERE id = ${availableTeam.id}
    `
    return availableTeam.id
  }
  
  return null // All teams full
}

// Process referral code
async function processReferral(sql: any, challengeId: string, referralCode: string, userId: string): Promise<string | null> {
  // For now, treat referralCode as a user ID or email
  const referrer = await sql`
    SELECT id FROM users 
    WHERE id = ${referralCode} OR email = ${referralCode}
    LIMIT 1
  `
  
  return referrer.length > 0 ? referrer[0].id : null
}

// Calculate potential reward based on challenge settings
function calculatePotentialReward(challengeData: any, userStake: number, totalParticipants: number): number {
  if (challengeData.allow_points_only && userStake === 0) {
    return 0 // Points-only challenges don't have monetary rewards
  }
  
  // Simplified calculation - in reality this would be more complex
  const averageStake = userStake // Assuming similar stakes
  const totalPool = averageStake * totalParticipants
  const platformCut = totalPool * (challengeData.failed_stake_cut / 100)
  const rewardPool = totalPool - platformCut
  
  // Assume 70% completion rate for estimation
  const estimatedCompleters = Math.ceil(totalParticipants * 0.7)
  
  return rewardPool / estimatedCompleters
}

// GET challenge participation status
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const challengeId = params.id
    
    // Demo user handling
    if (isDemoUser(session.user.id)) {
      const mockParticipation = {
        id: `demo-participation-${challengeId}`,
        challenge_id: challengeId,
        user_id: session.user.id,
        stake_amount: 50.00,
        entry_fee_paid: 2.50,
        insurance_purchased: false,
        total_cost: 52.50,
        completion_status: 'active',
        joined_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        progress: {
          days_completed: 5,
          total_days: 30,
          success_rate: 100,
          current_streak: 5,
          last_submission: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          next_deadline: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString()
        },
        team: Math.random() > 0.5 ? {
          id: 'demo-team-1',
          name: 'Team Alpha',
          color: 'blue',
          emoji: '🏆',
          members: 5,
          completion_rate: 85
        } : null
      }
      
      return NextResponse.json({
        success: true,
        participation: mockParticipation,
        isParticipant: true
      })
    }
    
    // Real user handling
    const sql = await createDbConnection()
    
    const participation = await sql`
      SELECT 
        cp.*,
        ct.team_name, ct.team_color, ct.team_emoji, ct.current_members, ct.completion_rate as team_completion_rate,
        (
          SELECT COUNT(*) 
          FROM daily_checkins dc 
          WHERE dc.participant_id = cp.id AND dc.completed = true
        ) as days_completed,
        (
          SELECT MAX(checkin_date) 
          FROM daily_checkins dc 
          WHERE dc.participant_id = cp.id AND dc.completed = true
        ) as last_completion_date
      FROM challenge_participants cp
      LEFT JOIN challenge_teams ct ON cp.team_id = ct.id
      WHERE cp.challenge_id = ${challengeId} AND cp.user_id = ${session.user.id}
    `
    
    if (participation.length === 0) {
      return NextResponse.json({
        success: true,
        participation: null,
        isParticipant: false
      })
    }
    
    const participationData = participation[0]
    
    return NextResponse.json({
      success: true,
      participation: {
        ...participationData,
        team: participationData.team_name ? {
          id: participationData.team_id,
          name: participationData.team_name,
          color: participationData.team_color,
          emoji: participationData.team_emoji,
          members: participationData.current_members,
          completion_rate: participationData.team_completion_rate
        } : null
      },
      isParticipant: true
    })
    
  } catch (error) {
    console.error('Get participation error:', error)
    return NextResponse.json({
      error: 'Failed to get participation status',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
} 