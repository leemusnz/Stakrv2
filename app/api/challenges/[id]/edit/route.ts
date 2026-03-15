import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// UPDATE challenge details (only for hosts and only before it starts)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id: challengeId } = await params
    const updateData = await request.json()
    
    const sql = createDbConnection()
    
    // First, verify ownership and editability
    const challenge = await sql`
      SELECT 
        c.id,
        c.host_id,
        c.status,
        c.start_date,
        COUNT(cp.id) as participant_count
      FROM challenges c
      LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
      WHERE c.id = ${challengeId}
      GROUP BY c.id, c.host_id, c.status, c.start_date
    `
    
    if (challenge.length === 0) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }
    
    const challengeData = challenge[0]
    
    // Verify ownership
    if (challengeData.host_id !== session.user.id) {
      return NextResponse.json({ error: 'Only the challenge host can edit this challenge' }, { status: 403 })
    }
    
    // Check if challenge can be edited
    if (challengeData.status === 'active' || challengeData.status === 'completed') {
      return NextResponse.json({ 
        error: 'Cannot edit challenge that has already started or completed' 
      }, { status: 400 })
    }
    
    // If challenge has participants and we're making certain changes, restrict
    const hasParticipants = challengeData.participant_count > 0
    
    if (hasParticipants) {
      // Restrict certain changes when there are participants
      const restrictedFields = ['min_stake', 'max_stake', 'duration', 'start_date', 'allow_points_only']
      const hasRestrictedChanges = restrictedFields.some(field => updateData[field] !== undefined)
      
      if (hasRestrictedChanges) {
        return NextResponse.json({ 
          error: 'Cannot change stakes, duration, or start date when participants have already joined' 
        }, { status: 400 })
      }
    }
    
    // Build update query dynamically based on provided fields
    const allowedUpdates = {
      title: updateData.title,
      description: updateData.description,
      category: updateData.category,
      difficulty: updateData.difficulty,
      thumbnail_url: updateData.thumbnailUrl,
      tags: updateData.tags,
      rules: updateData.rules,
      daily_instructions: updateData.dailyInstructions,
      general_instructions: updateData.generalInstructions,
      proof_instructions: updateData.proofInstructions,
      selected_proof_types: updateData.selectedProofTypes,
      camera_only: updateData.cameraOnly,
      allow_late_submissions: updateData.allowLateSubmissions,
      late_submission_hours: updateData.lateSubmissionHours,
      require_timer: updateData.requireTimer,
      timer_min_duration: updateData.timerMinDuration,
      timer_max_duration: updateData.timerMaxDuration,
      random_checkin_enabled: updateData.randomCheckinEnabled,
      random_checkin_probability: updateData.randomCheckinProbability,
      verification_type: updateData.verificationType,
      proof_requirements: updateData.proofRequirements,
      // Only allow these if no participants
      ...(!hasParticipants && {
        min_stake: updateData.minStake,
        max_stake: updateData.maxStake,
        duration: updateData.duration,
        allow_points_only: updateData.allowPointsOnly,
        start_date: updateData.startDate ? new Date(updateData.startDate).toISOString() : undefined,
        end_date: updateData.endDate ? new Date(updateData.endDate).toISOString() : undefined,
      })
    }
    
    // Filter out undefined values
    const updates = Object.fromEntries(
      Object.entries(allowedUpdates).filter(([_, value]) => value !== undefined)
    )
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }
    
    // Add updated timestamp
    updates.updated_at = new Date().toISOString()
    
    // Filter out restricted fields if participants exist
    if (hasParticipants) {
      delete updates.min_stake
      delete updates.max_stake
      delete updates.duration
      delete updates.allow_points_only
      delete updates.start_date
      delete updates.end_date
    }
    
    
    // Now update all other fields
    const updateResult = await sql`
      UPDATE challenges 
      SET 
        title = ${updates.title},
        description = ${updates.description},
        category = ${updates.category},
        difficulty = ${updates.difficulty},
        tags = ${updates.tags},
        rules = ${updates.rules},
        daily_instructions = ${updates.daily_instructions},
        general_instructions = ${updates.general_instructions},
        proof_instructions = ${updates.proof_instructions},
        selected_proof_types = ${updates.selected_proof_types},
        camera_only = ${updates.camera_only},
        allow_late_submissions = ${updates.allow_late_submissions},
        late_submission_hours = ${updates.late_submission_hours},
        require_timer = ${updates.require_timer},
        timer_min_duration = ${updates.timer_min_duration},
        timer_max_duration = ${updates.timer_max_duration},
        random_checkin_enabled = ${updates.random_checkin_enabled},
        random_checkin_probability = ${updates.random_checkin_probability},
        min_stake = ${updates.min_stake},
        max_stake = ${updates.max_stake},
        duration = ${updates.duration},
        allow_points_only = ${updates.allow_points_only},
        updated_at = ${updates.updated_at || new Date().toISOString()}
      WHERE id = ${challengeId} 
      RETURNING *
    `
    
    // The result should be an array of updated records
    if (!Array.isArray(updateResult) || updateResult.length === 0) {
      return NextResponse.json({ error: 'Failed to update challenge' }, { status: 500 })
    }
    
    const updatedChallenge = updateResult[0]
    
    
    return NextResponse.json({
      success: true,
      challenge: updatedChallenge,
      message: 'Challenge updated successfully',
      restrictions: hasParticipants ? {
        hasParticipants: true,
        restrictedFields: ['Stakes', 'Duration', 'Start Date'],
        reason: 'Participants have already joined'
      } : null
    })
    
  } catch (error) {
    console.error('❌ Challenge update error:', error)
    return NextResponse.json(
      { error: 'Failed to update challenge: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}

// GET challenge data for editing (includes all editable fields)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id: challengeId } = await params
    const sql = createDbConnection()
    
    // Get challenge with ownership verification
    const challenge = await sql`
      SELECT 
        c.*,
        COUNT(cp.id) as participant_count
      FROM challenges c
      LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
      WHERE c.id = ${challengeId} AND c.host_id = ${session.user.id}
      GROUP BY c.id
    `
    
    if (challenge.length === 0) {
      return NextResponse.json({ error: 'Challenge not found or not owned by user' }, { status: 404 })
    }
    
    const challengeData = challenge[0]
    
    // Check if challenge can be edited
    const canEdit = challengeData.status === 'pending'
    const hasParticipants = challengeData.participant_count > 0
    
    return NextResponse.json({
      success: true,
      challenge: challengeData,
      canEdit,
      hasParticipants,
      restrictions: hasParticipants ? {
        restrictedFields: ['min_stake', 'max_stake', 'duration', 'start_date', 'allow_points_only'],
        reason: 'Participants have already joined'
      } : null
    })
    
  } catch (error) {
    console.error('❌ Get challenge for edit error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch challenge: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
