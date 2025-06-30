import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { isDemoUser } from '@/lib/demo-data'

// GET challenges with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status') || 'active'
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Mock challenges data that matches our database schema
    const allChallenges = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: '30-Day Fitness Challenge',
        description: 'Complete 30 minutes of exercise every day for 30 days',
        long_description: 'Transform your fitness routine with this comprehensive 30-day challenge. Whether you\'re a beginner or experienced athlete, this challenge will help you build consistency and see real results.',
        category: 'fitness',
        duration: '30 days',
        difficulty: 'medium',
        min_stake: 25.00,
        max_stake: 500.00,
        host_id: '550e8400-e29b-41d4-a716-446655440000',
        host_contribution: 100.00,
        entry_fee_percentage: 5.00,
        failed_stake_cut: 20.00,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-31T23:59:59Z',
        status: 'active',
        verification_type: 'photo',
        proof_requirements: {
          type: 'photo',
          description: 'Upload a photo showing your completed workout',
          required_frequency: 'daily'
        },
        rules: [
          'Complete at least 30 minutes of exercise daily',
          'Submit proof within 24 hours of workout',
          'Exercise can include running, gym, yoga, sports, etc.',
          'Rest days are allowed but must be declared in advance'
        ],
        participants_count: 47,
        total_stake_pool: 2350.00,
        created_at: '2023-12-15T10:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Read 12 Books Challenge',
        description: 'Read one book per month for a full year',
        long_description: 'Expand your mind and develop a consistent reading habit. Perfect for book lovers who want accountability and community support.',
        category: 'education',
        duration: '12 months',
        difficulty: 'easy',
        min_stake: 50.00,
        max_stake: 1000.00,
        host_id: '550e8400-e29b-41d4-a716-446655440001',
        host_contribution: 200.00,
        entry_fee_percentage: 5.00,
        failed_stake_cut: 20.00,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
        status: 'active',
        verification_type: 'manual',
        proof_requirements: {
          type: 'text',
          description: 'Write a brief summary or review of the book you completed',
          required_frequency: 'monthly'
        },
        rules: [
          'Complete one book per month (minimum 200 pages)',
          'Submit book summary by the last day of each month',
          'Fiction and non-fiction both count',
          'Audiobooks are acceptable'
        ],
        participants_count: 23,
        total_stake_pool: 1450.00,
        created_at: '2023-12-10T14:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174002',
        title: 'Daily Meditation Practice',
        description: '10 minutes of meditation every day for 21 days',
        long_description: 'Build a sustainable meditation practice that will reduce stress and improve focus. Perfect for beginners and experienced practitioners alike.',
        category: 'wellness',
        duration: '21 days',
        difficulty: 'easy',
        min_stake: 15.00,
        max_stake: 200.00,
        host_id: '550e8400-e29b-41d4-a716-446655440000',
        host_contribution: 50.00,
        entry_fee_percentage: 5.00,
        failed_stake_cut: 20.00,
        start_date: '2024-01-15T00:00:00Z',
        end_date: '2024-02-05T23:59:59Z',
        status: 'active',
        verification_type: 'app_sync',
        proof_requirements: {
          type: 'app_integration',
          description: 'Connect with Headspace, Calm, or similar meditation app',
          required_frequency: 'daily'
        },
        rules: [
          'Meditate for at least 10 minutes daily',
          'Use a supported meditation app for automatic tracking',
          'Guided or unguided meditation both count',
          'Missed days can be made up within 48 hours'
        ],
        participants_count: 89,
        total_stake_pool: 3560.00,
        created_at: '2024-01-01T09:00:00Z',
        updated_at: '2024-01-15T00:00:00Z'
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174003',
        title: 'Learn Spanish in 90 Days',
        description: 'Complete daily Spanish lessons and reach conversational level',
        long_description: 'Master Spanish fundamentals through daily practice and structured learning. Includes conversation practice and cultural immersion activities.',
        category: 'education',
        duration: '90 days',
        difficulty: 'hard',
        min_stake: 100.00,
        max_stake: 2000.00,
        host_id: '550e8400-e29b-41d4-a716-446655440001',
        host_contribution: 500.00,
        entry_fee_percentage: 5.00,
        failed_stake_cut: 20.00,
        start_date: '2024-02-01T00:00:00Z',
        end_date: '2024-05-01T23:59:59Z',
        status: 'upcoming',
        verification_type: 'test',
        proof_requirements: {
          type: 'assessment',
          description: 'Weekly quizzes and final conversation test',
          required_frequency: 'weekly'
        },
        rules: [
          'Complete daily lessons on approved language apps',
          'Submit weekly quiz results',
          'Participate in live conversation sessions',
          'Pass final speaking assessment'
        ],
        participants_count: 0,
        total_stake_pool: 0.00,
        created_at: '2024-01-20T11:00:00Z',
        updated_at: '2024-01-20T11:00:00Z'
      }
    ]
    
    // Filter challenges based on query parameters
    let filteredChallenges = allChallenges
    
    if (category) {
      filteredChallenges = filteredChallenges.filter(c => c.category === category)
    }
    
    if (status !== 'all') {
      filteredChallenges = filteredChallenges.filter(c => c.status === status)
    }
    
    // Apply limit
    filteredChallenges = filteredChallenges.slice(0, limit)
    
    return NextResponse.json({
      success: true,
      challenges: filteredChallenges,
      count: filteredChallenges.length,
      total_available: allChallenges.length,
      filters_applied: { category, status, limit },
      message: 'Challenges retrieved successfully'
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get challenges',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// CREATE new challenge with full feature support
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const challengeData = await request.json()
    
    // Validate required fields
    const requiredFields = [
      'privacyType', 'category', 'title', 'description', 'duration', 'difficulty',
      'rules', 'dailyInstructions', 'selectedProofTypes', 'proofInstructions'
    ]
    
    const missingFields = requiredFields.filter(field => !challengeData[field] || 
      (Array.isArray(challengeData[field]) && challengeData[field].length === 0))
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        error: 'Missing required fields',
        missingFields,
        received: Object.keys(challengeData)
      }, { status: 400 })
    }

    // Validate stakes for money challenges
    if (!challengeData.allowPointsOnly) {
      if (!challengeData.minStake || !challengeData.maxStake || 
          challengeData.minStake > challengeData.maxStake) {
        return NextResponse.json({
          error: 'Invalid stake amounts for money challenge'
        }, { status: 400 })
      }
    }

    // For demo users, return mock success
    if (isDemoUser(session.user.id)) {
      return NextResponse.json({
        success: true,
        message: 'Challenge created successfully!',
        challenge: {
          id: `demo-challenge-${Date.now()}`,
          ...challengeData,
          host_id: session.user.id,
          status: 'pending',
          created_at: new Date().toISOString(),
          invite_code: challengeData.privacyType === 'private' ? 'DEMO1234' : null
        }
      }, { status: 201 })
    }

    // For real users, create in database
    const sql = await createDbConnection()
    
    // Calculate start/end dates
    let startDate, endDate
    if (challengeData.startDateType === 'days') {
      startDate = new Date(Date.now() + challengeData.startDateDays * 24 * 60 * 60 * 1000)
    } else {
      startDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // Default 2 days
    }
    
    // Parse duration to calculate end date
    const durationMatch = challengeData.duration.match(/(\d+)\s*(day|week|month)s?/)
    if (durationMatch) {
      const [, amount, unit] = durationMatch
      const days = unit === 'day' ? parseInt(amount) : 
                   unit === 'week' ? parseInt(amount) * 7 :
                   parseInt(amount) * 30
      endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000)
    } else {
      endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000) // Default 30 days
    }

    // Generate invite code for private challenges
    const inviteCode = challengeData.privacyType === 'private' ? 
      await sql`SELECT generate_invite_code() as code`.then(r => r[0].code) : null

    // Create the challenge
    const newChallenge = await sql`
      INSERT INTO challenges (
        title, description, category, duration, difficulty,
        min_stake, max_stake, host_id, host_contribution,
        start_date, end_date, status,
        rules, daily_instructions, general_instructions, proof_instructions,
        privacy_type, tags, thumbnail_url,
        min_participants, max_participants,
        start_date_type, start_date_days,
        allow_points_only, reward_distribution,
        selected_proof_types, camera_only, 
        allow_late_submissions, late_submission_hours,
        bonus_rewards, invite_code,
        enable_team_mode, team_assignment_method, number_of_teams,
        winning_criteria, losing_team_outcome,
        enable_referral_bonus, referral_bonus_percentage, max_referrals,
        verification_type, proof_requirements
      ) VALUES (
        ${challengeData.title},
        ${challengeData.description},
        ${challengeData.category},
        ${challengeData.duration},
        ${challengeData.difficulty},
        ${challengeData.allowPointsOnly ? 0 : challengeData.minStake},
        ${challengeData.allowPointsOnly ? 0 : challengeData.maxStake},
        ${session.user.id},
        ${challengeData.hostContribution || 0},
        ${startDate.toISOString()},
        ${endDate.toISOString()},
        'pending',
        ${challengeData.rules},
        ${challengeData.dailyInstructions},
        ${challengeData.generalInstructions || ''},
        ${challengeData.proofInstructions},
        ${challengeData.privacyType},
        ${challengeData.tags || []},
        ${null}, -- thumbnail_url (TODO: handle file upload)
        ${challengeData.minParticipants},
        ${challengeData.maxParticipants},
        ${challengeData.startDateType},
        ${challengeData.startDateDays},
        ${challengeData.allowPointsOnly},
        ${challengeData.rewardDistribution || 'winner-takes-all'},
        ${challengeData.selectedProofTypes},
        ${challengeData.cameraOnly},
        ${challengeData.allowLateSubmissions},
        ${challengeData.lateSubmissionHours},
        ${challengeData.bonusRewards || []},
        ${inviteCode},
        ${challengeData.enableTeamMode},
        ${challengeData.teamAssignmentMethod || 'auto-balance'},
        ${challengeData.numberOfTeams || 2},
        ${challengeData.winningCriteria || 'completion-rate'},
        ${challengeData.losingTeamOutcome || 'lose-stake'},
        ${challengeData.enableReferralBonus},
        ${challengeData.referralBonusPercentage || 20},
        ${challengeData.maxReferrals || 3},
        ${challengeData.selectedProofTypes[0] || 'manual'}, -- primary verification type
        ${JSON.stringify({
          types: challengeData.selectedProofTypes,
          description: challengeData.proofInstructions,
          camera_only: challengeData.cameraOnly,
          late_submissions: challengeData.allowLateSubmissions,
          late_hours: challengeData.lateSubmissionHours
        })}
      )
      RETURNING id, invite_code, created_at
    `

    const challengeId = newChallenge[0].id

    // Create teams if team mode is enabled
    if (challengeData.enableTeamMode) {
      await sql`SELECT create_challenge_teams(${challengeId}, ${challengeData.numberOfTeams || 2})`
    }

    // Log challenge creation
    await sql`
      INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details, created_at)
      VALUES (
        ${session.user.id},
        'challenge_created',
        'challenge',
        ${challengeId},
        ${JSON.stringify({
          title: challengeData.title,
          category: challengeData.category,
          privacy_type: challengeData.privacyType,
          team_mode: challengeData.enableTeamMode,
          points_only: challengeData.allowPointsOnly
        })},
        NOW()
      )
    `

    return NextResponse.json({
      success: true,
      message: 'Challenge created successfully!',
      challenge: {
        id: challengeId,
        ...challengeData,
        host_id: session.user.id,
        status: 'pending',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        invite_code: newChallenge[0].invite_code,
        created_at: newChallenge[0].created_at
      },
      next_steps: {
        redirect_url: challengeData.privacyType === 'private' && challengeData.minParticipants > 1 
          ? `/challenge/invite/${newChallenge[0].invite_code}`
          : `/challenge/${challengeId}`,
        message: challengeData.privacyType === 'private' 
          ? 'Challenge created! Share the invite code with participants.'
          : 'Challenge created and will be published soon!'
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Challenge creation error:', error)
    return NextResponse.json({
      error: 'Failed to create challenge',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
} 