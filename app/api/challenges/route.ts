import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { shouldUseDemoData, createDemoResponse } from '@/lib/demo-mode'


// GET challenges with optional filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status') || 'joinable'
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Check for demo mode (new system) OR demo users (legacy compatibility)
    if (shouldUseDemoData(request, session) || false) {
      const mockChallenges = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: '30-Day Fitness Challenge',
          description: 'Complete 30 minutes of exercise every day for 30 days',
          category: 'fitness',
          duration: '30 days',
          difficulty: 'medium',
          min_stake: 25.00,
          max_stake: 500.00,
          participants_count: 47,
          total_stake_pool: 2350.00,
          status: 'active',
          rules: [
            'Complete at least 30 minutes of exercise daily',
            'Submit proof within 24 hours of workout'
          ],
          start_date: '2024-01-01T00:00:00Z',
          end_date: '2024-01-31T23:59:59Z',
          created_at: '2023-12-15T10:00:00Z'
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          title: 'Daily Meditation Practice',
          description: '10 minutes of meditation every day for 21 days',
          category: 'wellness',
          duration: '21 days',
          difficulty: 'easy',
          min_stake: 15.00,
          max_stake: 200.00,
          participants_count: 89,
          total_stake_pool: 3560.00,
          status: 'active',
          rules: [
            'Meditate for at least 10 minutes daily',
            'Use a supported meditation app for automatic tracking'
          ],
          start_date: '2024-01-15T00:00:00Z',
          end_date: '2024-02-05T23:59:59Z',
          created_at: '2024-01-01T09:00:00Z'
        }
      ]

      let filteredChallenges = mockChallenges
      if (category) {
        filteredChallenges = filteredChallenges.filter(c => c.category === category)
      }
      if (status !== 'all') {
        filteredChallenges = filteredChallenges.filter(c => c.status === status)
      }
      filteredChallenges = filteredChallenges.slice(0, limit)

      return NextResponse.json(createDemoResponse({
        success: true,
        challenges: filteredChallenges,
        count: filteredChallenges.length,
        total_available: mockChallenges.length,
        filters_applied: { category, status, limit },
        message: 'Demo challenges retrieved successfully'
      }, request, session))
    }

    // For real users, query the database
    const sql = await createDbConnection()
    
    // Build the query with filters
    let whereClause = 'WHERE privacy_type = \'public\'' // Only show public challenges in discovery
    const queryParams: any[] = []
    let paramIndex = 1

    if (category) {
      whereClause += ` AND category = $${paramIndex}`
      queryParams.push(category)
      paramIndex++
    }

    if (status === 'joinable') {
      // Show challenges that are still accepting participants (pending or recently active)
      whereClause += ` AND (status = 'pending' OR (status = 'active' AND start_date > NOW() - INTERVAL '2 days'))`
    } else if (status !== 'all') {
      whereClause += ` AND status = $${paramIndex}`
      queryParams.push(status)
      paramIndex++
    }

    // Get challenges with participant count
    const challenges = await sql`
      SELECT 
        c.id,
        c.title,
        c.description,
        c.category,
        c.duration,
        c.difficulty,
        c.min_stake,
        c.max_stake,
        c.host_id,
        c.start_date,
        c.end_date,
        c.status,
        c.rules,
        c.created_at,
        c.allow_points_only,
        c.thumbnail_url,
        COALESCE(
          (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = c.id), 
          0
        ) as participants_count,
        COALESCE(
          (SELECT SUM(stake_amount) FROM challenge_participants WHERE challenge_id = c.id), 
          0
        ) as total_stake_pool,
        u.name as host_name,
        u.avatar_url as host_avatar_url
      FROM challenges c
      LEFT JOIN users u ON c.host_id = u.id
      WHERE c.privacy_type = 'public'
      ${category ? sql`AND c.category = ${category}` : sql``}
      ${status === 'joinable' ? sql`AND (c.status = 'pending' OR (c.status = 'active' AND c.start_date > NOW() - INTERVAL '2 days'))` : 
        status !== 'all' ? sql`AND c.status = ${status}` : sql``}
      ORDER BY c.created_at DESC
      LIMIT ${limit}
    `



    // Format the challenges for the frontend
    const formattedChallenges = challenges.map((challenge: any) => ({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      category: challenge.category,
      duration: challenge.duration,
      difficulty: challenge.difficulty,
      min_stake: parseFloat(challenge.min_stake) || 0,
      max_stake: parseFloat(challenge.max_stake) || 0,
      participants_count: parseInt(challenge.participants_count) || 0,
      total_stake_pool: parseFloat(challenge.total_stake_pool) || 0,
      status: challenge.status,
      rules: challenge.rules || [],
      start_date: challenge.start_date,
      end_date: challenge.end_date,
      created_at: challenge.created_at,
      host_name: challenge.host_name,
      host_avatar_url: challenge.host_avatar_url,
      allow_points_only: challenge.allow_points_only,
      thumbnail_url: challenge.thumbnail_url
    }))
    
    // Debug logging for thumbnail URLs
    console.log('🔍 API Response - Challenges with thumbnails:', formattedChallenges.map(c => ({
      id: c.id,
      title: c.title,
      thumbnail_url: c.thumbnail_url
    })))
    
    return NextResponse.json({
      success: true,
      challenges: formattedChallenges,
      count: formattedChallenges.length,
      total_available: formattedChallenges.length, // Would need a separate count query for exact total
      filters_applied: { category, status, limit },
      message: 'Challenges retrieved successfully'
    })
    
  } catch (error) {
    console.error('Challenges fetch error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get challenges',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
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

    // For demo mode only, return mock success
    if (shouldUseDemoData(request, session)) {
      return NextResponse.json(createDemoResponse({
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
      }, request, session), { status: 201 })
    }

    // For real users, create in database
    const sql = await createDbConnection()
    
    // Calculate start/end dates
    let startDate, endDate
    if (challengeData.startDateType === 'days') {
      startDate = new Date(Date.now() + challengeData.startDateDays * 24 * 60 * 60 * 1000)
    } else if (challengeData.startDateType === 'participants') {
      startDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // Start next day when full
    } else if (challengeData.startDateType === 'manual') {
      startDate = null // No start date set - will be set when manually started
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
      // For manual start challenges, end date will be calculated when challenge starts
      endDate = startDate ? new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000) : null
    } else {
      // Default 30 days from start, or null if manual start
      endDate = startDate ? new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000) : null
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
        require_timer, timer_min_duration, timer_max_duration,
        random_checkin_enabled, random_checkin_probability,
        verification_type, proof_requirements, ai_analysis
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
        ${startDate ? startDate.toISOString() : null},
        ${endDate ? endDate.toISOString() : null},
        'pending',
        ${challengeData.rules},
        ${challengeData.dailyInstructions},
        ${challengeData.generalInstructions || ''},
        ${challengeData.proofInstructions},
        ${challengeData.privacyType},
        ${challengeData.tags || []},
        ${challengeData.thumbnailUrl || null},
        ${challengeData.minParticipants},
        ${challengeData.maxParticipants},
        ${challengeData.startDateType},
        ${challengeData.startDateDays},
        ${challengeData.allowPointsOnly},
        ${challengeData.rewardDistribution || 'equal-split'},
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
        ${challengeData.requireTimer || false},
        ${challengeData.timerMinDuration || 15},
        ${challengeData.timerMaxDuration || 120},
        ${challengeData.randomCheckinsEnabled || false},
        ${challengeData.randomCheckinProbability || 30},
        ${challengeData.selectedProofTypes[0] || 'manual'}, -- primary verification type
        ${JSON.stringify({
          types: challengeData.selectedProofTypes,
          description: challengeData.proofInstructions,
          camera_only: challengeData.cameraOnly,
          late_submissions: challengeData.allowLateSubmissions,
          late_hours: challengeData.lateSubmissionHours,
          require_timer: challengeData.requireTimer,
          timer_min: challengeData.timerMinDuration,
          timer_max: challengeData.timerMaxDuration,
          random_checkins: challengeData.randomCheckinsEnabled,
          checkin_probability: challengeData.randomCheckinProbability
        })},
        ${challengeData.aiAnalysis ? JSON.stringify(challengeData.aiAnalysis) : null}
      )
      RETURNING id, invite_code, created_at
    `

    const challengeId = newChallenge[0].id

    // Create teams if team mode is enabled
    if (challengeData.enableTeamMode) {
      await sql`SELECT create_challenge_teams(${challengeId}, ${challengeData.numberOfTeams || 2})`
    }

    // Log challenge creation
    try {
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
    } catch (error) {
      // Admin logging is optional - don't fail challenge creation if admin_actions table doesn't exist
      console.log('Admin logging skipped:', error instanceof Error ? error.message : 'Unknown error')
    }

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
