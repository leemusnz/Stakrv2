import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { shouldUseDemoData, createDemoResponse } from '@/lib/demo-mode'

/**
 * GET /api/user/notification-preferences
 * Fetch user's notification preferences
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    // Demo mode handling
    if (shouldUseDemoData(request, session)) {
      return NextResponse.json(createDemoResponse({
        success: true,
        preferences: {
          // Challenge notifications
          challenge_joined: true,
          challenge_starting_soon: true,
          challenge_started: true,
          challenge_ending_soon: true,
          challenge_completed: true,
          challenge_failed: true,
          challenge_invite: true,
          
          // Verification notifications
          proof_reminder: true,
          proof_submitted: true,
          proof_approved: true,
          proof_rejected: true,
          appeal_result: true,
          
          // Social notifications
          nudge_received: true,
          comment_received: true,
          new_follower: true,
          participant_joined: true,
          
          // Financial notifications
          payment_received: true,
          withdrawal_processed: true,
          reward_earned: true,
          insurance_payout: true,
          refund_processed: true,
          
          // Milestone notifications
          milestone_achieved: true,
          streak_milestone: true,
          reward_milestone: true,
          
          // System notifications
          welcome: true,
          account_verified: true,
          premium_status: true,
          security_alerts: true,
          platform_updates: false,
          
          // Email preferences
          email_challenge: true,
          email_verification: true,
          email_social: false,
          email_financial: true,
          email_milestones: true,
          email_system: true,
          
          // Marketing
          marketing_emails: false,
          newsletter: false,
          
          // Digests
          daily_digest: false,
          weekly_digest: false
        }
      }, request, session))
    }

    const sql = createDbConnection()
    
    // Get or create preferences
    let preferences = await sql`
      SELECT * FROM notification_preferences
      WHERE user_id = ${session.user.id}
    `

    // If no preferences exist, create them
    if (preferences.length === 0) {
      preferences = await sql`
        INSERT INTO notification_preferences (user_id)
        VALUES (${session.user.id})
        RETURNING *
      `
    }

    const prefs = preferences[0]
    
    return NextResponse.json({
      success: true,
      preferences: {
        // Challenge notifications
        challenge_joined: prefs.challenge_joined,
        challenge_starting_soon: prefs.challenge_starting_soon,
        challenge_started: prefs.challenge_started,
        challenge_ending_soon: prefs.challenge_ending_soon,
        challenge_completed: prefs.challenge_completed,
        challenge_failed: prefs.challenge_failed,
        challenge_invite: prefs.challenge_invite,
        
        // Verification notifications
        proof_reminder: prefs.proof_reminder,
        proof_submitted: prefs.proof_submitted,
        proof_approved: prefs.proof_approved,
        proof_rejected: prefs.proof_rejected,
        appeal_result: prefs.appeal_result,
        
        // Social notifications
        nudge_received: prefs.nudge_received,
        comment_received: prefs.comment_received,
        new_follower: prefs.new_follower,
        participant_joined: prefs.participant_joined,
        
        // Financial notifications
        payment_received: prefs.payment_received,
        withdrawal_processed: prefs.withdrawal_processed,
        reward_earned: prefs.reward_earned,
        insurance_payout: prefs.insurance_payout,
        refund_processed: prefs.refund_processed,
        
        // Milestone notifications
        milestone_achieved: prefs.milestone_achieved,
        streak_milestone: prefs.streak_milestone,
        reward_milestone: prefs.reward_milestone,
        
        // System notifications
        welcome: prefs.welcome,
        account_verified: prefs.account_verified,
        premium_status: prefs.premium_status,
        security_alerts: prefs.security_alerts,
        platform_updates: prefs.platform_updates,
        
        // Email preferences
        email_challenge: prefs.email_challenge,
        email_verification: prefs.email_verification,
        email_social: prefs.email_social,
        email_financial: prefs.email_financial,
        email_milestones: prefs.email_milestones,
        email_system: prefs.email_system,
        
        // Marketing
        marketing_emails: prefs.marketing_emails,
        newsletter: prefs.newsletter,
        
        // Digests
        daily_digest: prefs.daily_digest,
        weekly_digest: prefs.weekly_digest
      }
    })

  } catch (error) {
    console.error('❌ Failed to fetch notification preferences:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch notification preferences',
      details: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : 'Unknown error') 
        : undefined
    }, { status: 500 })
  }
}

/**
 * PATCH /api/user/notification-preferences
 * Update user's notification preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { preferences } = body

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json({ 
        error: 'Invalid preferences data' 
      }, { status: 400 })
    }

    // Demo mode - just return success
    if (shouldUseDemoData(request, session)) {
      return NextResponse.json(createDemoResponse({
        success: true,
        message: 'Preferences updated (demo mode)',
        preferences
      }, request, session))
    }

    const sql = createDbConnection()
    
    // Build update query dynamically
    const allowedFields = [
      'challenge_joined', 'challenge_starting_soon', 'challenge_started', 
      'challenge_ending_soon', 'challenge_completed', 'challenge_failed', 'challenge_invite',
      'proof_reminder', 'proof_submitted', 'proof_approved', 'proof_rejected', 'appeal_result',
      'nudge_received', 'comment_received', 'new_follower', 'participant_joined',
      'payment_received', 'withdrawal_processed', 'reward_earned', 'insurance_payout', 'refund_processed',
      'milestone_achieved', 'streak_milestone', 'reward_milestone',
      'welcome', 'account_verified', 'premium_status', 'security_alerts', 'platform_updates',
      'email_challenge', 'email_verification', 'email_social', 'email_financial', 
      'email_milestones', 'email_system',
      'marketing_emails', 'newsletter',
      'daily_digest', 'weekly_digest'
    ]

    const updates: Record<string, boolean> = {}
    for (const field of allowedFields) {
      if (field in preferences && typeof preferences[field] === 'boolean') {
        updates[field] = preferences[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: 'No valid preferences to update' 
      }, { status: 400 })
    }

    // Update preferences
    const setClause = Object.keys(updates)
      .map((key, idx) => `${key} = $${idx + 2}`)
      .join(', ')
    
    const values = [session.user.id, ...Object.values(updates)]
    
    await sql.unsafe(`
      UPDATE notification_preferences
      SET ${setClause}, updated_at = NOW()
      WHERE user_id = $1
    `, values)

    // Fetch updated preferences
    const updatedPrefs = await sql`
      SELECT * FROM notification_preferences
      WHERE user_id = ${session.user.id}
    `

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated',
      preferences: updatedPrefs[0]
    })

  } catch (error) {
    console.error('❌ Failed to update notification preferences:', error)
    return NextResponse.json({ 
      error: 'Failed to update notification preferences',
      details: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : 'Unknown error') 
        : undefined
    }, { status: 500 })
  }
}

