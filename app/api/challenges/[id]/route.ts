import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { challengeUpdateSchema, challengeRestrictedUpdateSchema, formatValidationErrors } from '@/lib/validation'
import { z } from 'zod'


interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET individual challenge details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    const { id: challengeId } = await params
    
    // For demo users or demo challenge IDs, return mock data
    if (!session?.user  || challengeId.startsWith('demo-')) {
      return getMockChallenge(challengeId)
    }

    // Real user handling
    const sql = createDbConnection()
    
    // Fetch challenge with host info and participant count (gracefully handle missing tables)
    try {
      const challenge = await sql`
        SELECT 
          c.*,
          u.name as host_name,
          u.email as host_email,
          u.avatar_url as host_avatar_url,
          COUNT(DISTINCT cp.id) as current_participants
        FROM challenges c
        LEFT JOIN users u ON c.host_id = u.id
        LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
        WHERE c.id = ${challengeId}
        GROUP BY c.id, u.name, u.email, u.avatar_url
      `
      
      if (challenge.length === 0) {
        return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
      }
      
      const challengeData = challenge[0]

      // Expose currency and stake tiers from proof_requirements JSON
      try {
        const proofReq = typeof challengeData.proof_requirements === 'string'
          ? JSON.parse(challengeData.proof_requirements)
          : challengeData.proof_requirements
        challengeData.currency = proofReq?.currency || 'CREDITS'
        challengeData.stake_tiers = Array.isArray(proofReq?.stake_tiers) ? proofReq.stake_tiers : []
      } catch {}

      // Attach latest settlement summary if available
      try {
        const settlements = await sql`
          SELECT 
            total_distributed,
            platform_revenue_total,
            revenue_entry_fees,
            revenue_failed_stakes_cut,
            participants_rewarded,
            reward_distribution_method,
            created_at
          FROM settlements
          WHERE challenge_id = ${challengeId}
          ORDER BY created_at DESC
          LIMIT 1
        `
        if (settlements.length > 0) {
          challengeData.settlement_summary = settlements[0]
        }
      } catch {}
      
      // Transform proof_requirements JSONB to proper ProofRequirement objects
      if (challengeData.proof_requirements) {
        const proofReqs = challengeData.proof_requirements
        
        // Create ProofRequirement objects from stored proof types and settings
        challengeData.proofRequirements = (challengeData.selected_proof_types || []).map((type: string) => ({
          type: type as "photo" | "video" | "file" | "text" | "auto_sync",
          required: true,
          cameraOnly: proofReqs.camera_only || false, // Map global camera_only to individual requirements
          instructions: proofReqs.description || challengeData.proof_instructions || '',
          aiVerificationEnabled: challengeData.verification_type === 'ai'
        }))
      } else {
        // Fallback for challenges without proof_requirements JSONB
        challengeData.proofRequirements = (challengeData.selected_proof_types || ['photo']).map((type: string) => ({
          type: type as "photo" | "video" | "file" | "text" | "auto_sync",
          required: true,
          cameraOnly: challengeData.camera_only || false,
          instructions: challengeData.proof_instructions || '',
          aiVerificationEnabled: challengeData.verification_type === 'ai'
        }))
      }
      
      // Debug: Log what we're returning for host data
      
      // Debug: Log proof requirements transformation
      
      return NextResponse.json({
        success: true,
        challenge: challengeData
      })
    } catch (dbError) {
      console.error('Database query failed, falling back to basic query:', dbError)
      
      // Fallback to basic challenge query if advanced features fail
      const challenge = await sql`
        SELECT c.*, u.name as host_name, u.email as host_email, u.avatar_url as host_avatar_url
        FROM challenges c
        LEFT JOIN users u ON c.host_id = u.id
        WHERE c.id = ${challengeId}
      `
      
      if (challenge.length === 0) {
        return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
      }
      
      const challengeData = challenge[0]
      challengeData.current_participants = 0 // Default value
      
      // Transform proof_requirements JSONB to proper ProofRequirement objects (fallback)
      if (challengeData.proof_requirements) {
        const proofReqs = challengeData.proof_requirements
        
        // Create ProofRequirement objects from stored proof types and settings
        challengeData.proofRequirements = (challengeData.selected_proof_types || []).map((type: string) => ({
          type: type as "photo" | "video" | "file" | "text" | "auto_sync",
          required: true,
          cameraOnly: proofReqs.camera_only || false, // Map global camera_only to individual requirements
          instructions: proofReqs.description || challengeData.proof_instructions || '',
          aiVerificationEnabled: challengeData.verification_type === 'ai'
        }))
      } else {
        // Fallback for challenges without proof_requirements JSONB
        challengeData.proofRequirements = (challengeData.selected_proof_types || ['photo']).map((type: string) => ({
          type: type as "photo" | "video" | "file" | "text" | "auto_sync",
          required: true,
          cameraOnly: challengeData.camera_only || false,
          instructions: challengeData.proof_instructions || '',
          aiVerificationEnabled: challengeData.verification_type === 'ai'
        }))
      }
      
      return NextResponse.json({
        success: true,
        challenge: challengeData
      })
    }
    
  } catch (error) {
    console.error('Get challenge error:', error)
    return NextResponse.json({
      error: 'Failed to get challenge',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// UPDATE challenge (for edit functionality)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id: challengeId } = await params
    const updateData = await request.json()
    
    // For demo users, return mock success
    if (challengeId.startsWith('demo-')) {
      return NextResponse.json({
        success: true,
        message: 'Challenge updated successfully! (Demo Mode)',
        challenge: { id: challengeId, ...updateData }
      })
    }

    const sql = createDbConnection()
    
    // Fetch challenge with participant count
    const challenge = await sql`
      SELECT 
        c.id,
        c.host_id, 
        c.status, 
        c.start_date,
        c.title,
        c.description,
        c.rules,
        c.category,
        c.difficulty,
        c.duration,
        COUNT(DISTINCT cp.id) as participant_count
      FROM challenges c
      LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
      WHERE c.id = ${challengeId}
      GROUP BY c.id, c.host_id, c.status, c.start_date, c.title, c.description, c.rules, c.category, c.difficulty, c.duration
    `
    
    if (challenge.length === 0) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }
    
    const challengeRecord = challenge[0]
    
    // Check ownership
    if (challengeRecord.host_id !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to edit this challenge' }, { status: 403 })
    }
    
    // Handle different update types
    if (updateData.action === 'start') {
      // Manual start functionality - calculate end date based on duration
      const duration = challengeRecord.duration
      const durationMatch = duration.match(/(\d+)\s*(day|week|month)s?/)
      let endDate = new Date()
      
      if (durationMatch) {
        const [, amount, unit] = durationMatch
        const days = unit === 'day' ? parseInt(amount) : 
                     unit === 'week' ? parseInt(amount) * 7 :
                     parseInt(amount) * 30
        endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      } else {
        endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default 30 days
      }
      
      await sql`
        UPDATE challenges 
        SET status = 'active', 
            start_date = NOW(),
            end_date = ${endDate.toISOString()},
            updated_at = NOW()
        WHERE id = ${challengeId}
      `
      
      return NextResponse.json({
        success: true,
        message: 'Challenge started successfully!',
        challenge: { id: challengeId, status: 'active', start_date: new Date().toISOString(), end_date: endDate.toISOString() }
      })
    } else {
      // Regular edit functionality
      // Determine if challenge is active with participants
      const hasParticipants = challengeRecord.participant_count > 0
      const isActive = challengeRecord.status === 'active'
      
      // Choose validation schema based on challenge state
      const validationSchema = (isActive && hasParticipants) ? 
        challengeRestrictedUpdateSchema : 
        challengeUpdateSchema
      
      // Validate input
      const parseResult = validationSchema.safeParse(updateData)
      
      if (!parseResult.success) {
        const errors = formatValidationErrors(parseResult.error)
        return NextResponse.json({
          error: 'Validation failed',
          details: errors
        }, { status: 400 })
      }
      
      const validatedData = parseResult.data
      
      // Check restrictions for active challenges with participants
      if (isActive && hasParticipants) {
        // Only description and rules can be updated on active challenges with participants
        const canUpdate = validatedData.description !== undefined || validatedData.rules !== undefined
        
        if (!canUpdate) {
          return NextResponse.json({
            error: 'Cannot edit active challenge',
            details: 'Once participants have joined, only description and rules can be updated'
          }, { status: 400 })
        }
        
        // Perform updates
        if (validatedData.description !== undefined || validatedData.rules !== undefined) {
          await sql`
            UPDATE challenges
            SET 
              description = COALESCE(${validatedData.description}, description),
              rules = COALESCE(${validatedData.rules}, rules),
              updated_at = NOW()
            WHERE id = ${challengeId}
          `
        }
        
        // Fetch updated challenge
        const updated = await sql`
          SELECT * FROM challenges WHERE id = ${challengeId}
        `
        
        return NextResponse.json({
          success: true,
          message: 'Challenge updated successfully!',
          challenge: updated[0]
        })
      } else {
        // Draft challenges can be fully edited
        // Cast to the full update type since we validated with challengeUpdateSchema
        const fullData = validatedData as z.infer<typeof challengeUpdateSchema>
        
        // Build conditional SET clause
        await sql`
          UPDATE challenges
          SET 
            title = COALESCE(${fullData.title}, title),
            description = COALESCE(${fullData.description}, description),
            long_description = COALESCE(${fullData.longDescription}, long_description),
            rules = COALESCE(${fullData.rules}, rules),
            category = COALESCE(${fullData.category}, category),
            difficulty = COALESCE(${fullData.difficulty}, difficulty),
            duration = COALESCE(${fullData.duration}, duration),
            updated_at = NOW()
          WHERE id = ${challengeId}
        `
        
        // Fetch updated challenge
        const updated = await sql`
          SELECT * FROM challenges WHERE id = ${challengeId}
        `
        
        if (updated.length === 0) {
          return NextResponse.json({
            error: 'Challenge not found after update',
            details: 'The challenge was deleted or is no longer accessible'
          }, { status: 404 })
        }
        
        return NextResponse.json({
          success: true,
          message: 'Challenge updated successfully!',
          challenge: updated[0]
        })
      }
    }
    
  } catch (error) {
    console.error('Update challenge error:', error)
    return NextResponse.json({
      error: 'Failed to update challenge',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// PATCH - Alias for PUT (semantic HTTP method for partial updates)
export const PATCH = PUT

// DELETE challenge
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id: challengeId } = await params
    
    // For demo users, return mock success
    if ( challengeId.startsWith('demo-')) {
      return NextResponse.json({
        success: true,
        message: 'Challenge deleted successfully! (Demo Mode)'
      })
    }

    const sql = createDbConnection()
    
    // Check if user owns this challenge
    const challenge = await sql`
      SELECT host_id, status, start_date 
      FROM challenges 
      WHERE id = ${challengeId}
    `
    
    if (challenge.length === 0) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }
    
    if (challenge[0].host_id !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this challenge' }, { status: 403 })
    }
    
    // Check if challenge can be deleted
    const challengeStarted = new Date(challenge[0].start_date) <= new Date()
    if (challengeStarted && challenge[0].status !== 'pending') {
      return NextResponse.json({ error: 'Cannot delete challenge that has already started' }, { status: 400 })
    }
    
    // Delete the challenge (this will cascade to related tables)
    await sql`DELETE FROM challenges WHERE id = ${challengeId}`
    
    return NextResponse.json({
      success: true,
      message: 'Challenge deleted successfully!'
    })
    
  } catch (error) {
    console.error('Delete challenge error:', error)
    return NextResponse.json({
      error: 'Failed to delete challenge',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// Mock challenge data for demo users
function getMockChallenge(challengeId: string) {
  const challenge = {
    id: challengeId,
    title: "Morning Meditation Streak",
    description: "Transform your mornings and build unshakeable mental clarity with a 7-day meditation commitment.",
    category: "Mindfulness",
    duration: "7 days",
    difficulty: "Easy",
    current_participants: 234,
    max_participants: 500,
    min_stake: 10,
    max_stake: 100,
    allow_points_only: true,
    status: 'active',
    host_name: "Sarah Chen",
    host_avatar_url: null,
    enable_team_mode: false,
    privacy_type: 'public'
  }
  
  return NextResponse.json({
    success: true,
    challenge: challenge
  })
}
