import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: {
    id: string
  }
}

// JOIN a challenge
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const challengeId = params.id
    const body = await request.json()
    const { userId, stakeAmount, insurancePurchased = false } = body
    
    // Validate required fields
    if (!userId || !stakeAmount) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: userId, stakeAmount'
      }, { status: 400 })
    }
    
    // Validate stake amount
    const stake = parseFloat(stakeAmount)
    if (stake < 10 || stake > 2000) {
      return NextResponse.json({
        success: false,
        error: 'Stake amount must be between $10 and $2000'
      }, { status: 400 })
    }
    
    // Calculate fees (using Stakr's business model)
    const entryFeePercentage = 5.0
    const entryFee = stake * (entryFeePercentage / 100)
    const insuranceFee = insurancePurchased ? 1.00 : 0.00
    const totalCost = stake + entryFee + insuranceFee
    
    // Mock challenge data lookup
    const challengeData = {
      id: challengeId,
      title: '30-Day Fitness Challenge',
      min_stake: 25.00,
      max_stake: 500.00,
      status: 'active',
      participants_count: 47,
      start_date: '2024-01-01T00:00:00Z',
      end_date: '2024-01-31T23:59:59Z'
    }
    
    // Validate stake amount against challenge limits
    if (stake < challengeData.min_stake || stake > challengeData.max_stake) {
      return NextResponse.json({
        success: false,
        error: `Stake amount must be between $${challengeData.min_stake} and $${challengeData.max_stake} for this challenge`
      }, { status: 400 })
    }
    
    // Check if challenge is still active
    if (challengeData.status !== 'active') {
      return NextResponse.json({
        success: false,
        error: 'This challenge is no longer accepting participants'
      }, { status: 400 })
    }
    
    // Mock user data lookup
    const userData = {
      id: userId,
      name: 'Alex Chen',
      credits: 247.50,
      trust_score: 82
    }
    
    // Check if user has sufficient credits
    if (userData.credits < totalCost) {
      return NextResponse.json({
        success: false,
        error: `Insufficient credits. You need $${totalCost.toFixed(2)} but only have $${userData.credits.toFixed(2)}`,
        details: {
          required: totalCost,
          available: userData.credits,
          shortfall: totalCost - userData.credits
        }
      }, { status: 400 })
    }
    
    // Create participation record (mock data)
    const participation = {
      id: crypto.randomUUID(),
      challenge_id: challengeId,
      user_id: userId,
      stake_amount: stake,
      entry_fee_paid: entryFee,
      insurance_purchased: insurancePurchased,
      insurance_fee_paid: insuranceFee,
      total_cost: totalCost,
      completion_status: 'active',
      proof_submitted: false,
      verification_status: 'pending',
      reward_earned: 0.00,
      joined_at: new Date().toISOString(),
      challenge: {
        title: challengeData.title,
        end_date: challengeData.end_date
      }
    }
    
    // Calculate potential reward (if everyone completes, what would user earn)
    const newParticipantCount = challengeData.participants_count + 1
    const totalStakePool = newParticipantCount * stake // Simplified calculation
    const platformCut = totalStakePool * 0.05 // 5% platform fee
    const remainingPool = totalStakePool - platformCut
    const potentialReward = remainingPool / newParticipantCount
    
    return NextResponse.json({
      success: true,
      participation,
      financial_breakdown: {
        stake_amount: stake,
        entry_fee: entryFee,
        insurance_fee: insuranceFee,
        total_cost: totalCost,
        remaining_credits: userData.credits - totalCost,
        potential_reward: potentialReward,
        entry_fee_percentage: entryFeePercentage
      },
      challenge_info: {
        title: challengeData.title,
        total_participants: newParticipantCount,
        estimated_pool_size: totalStakePool,
        end_date: challengeData.end_date
      },
      next_steps: [
        'Complete daily requirements',
        'Submit proof of completion',
        'Maintain verification compliance',
        'Earn rewards upon successful completion'
      ],
      message: 'Successfully joined challenge!',
      note: 'This is mock data. Will be replaced with real database operations.'
    }, { status: 201 })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to join challenge',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET challenge participation status
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const challengeId = params.id
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId parameter is required'
      }, { status: 400 })
    }
    
    // Mock participation data
    const participation = {
      id: 'part_123',
      challenge_id: challengeId,
      user_id: userId,
      stake_amount: 50.00,
      entry_fee_paid: 2.50,
      insurance_purchased: true,
      insurance_fee_paid: 1.00,
      total_cost: 53.50,
      completion_status: 'active',
      proof_submitted: true,
      verification_status: 'approved',
      reward_earned: 0.00,
      joined_at: '2024-01-01T10:00:00Z',
      progress: {
        days_completed: 12,
        total_days: 30,
        success_rate: 100,
        last_submission: '2024-01-12T09:30:00Z',
        next_deadline: '2024-01-13T23:59:59Z'
      }
    }
    
    return NextResponse.json({
      success: true,
      participation,
      message: 'Participation status retrieved successfully'
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get participation status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 