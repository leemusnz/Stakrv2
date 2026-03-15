import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'


// Mock appeals data for demo accounts
const getDemoAppeals = () => ({
  pendingAppeals: [
    {
      id: 'appeal-001',
      verificationId: 'ver-102',
      challengeId: 'ch-002',
      challengeTitle: 'Early Riser Challenge',
      userId: 'user-456',
      userName: 'Lisa Park',
      userEmail: 'lisa@example.com',
      originalDecision: 'rejected',
      originalReason: 'Timestamp indicates photo was taken at 8:30 AM, not 6:00 AM as required.',
      appealReason: 'The timestamp is incorrect due to timezone settings on my phone. I have additional proof showing my phone was set to EST instead of PST. I actually woke up at 5:30 AM PST as required.',
      appealSubmittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      stakeAmount: 35.00,
      status: 'pending',
      priority: 'high',
      additionalEvidence: 'Phone screenshot showing timezone settings + fitness tracker data'
    },
    {
      id: 'appeal-002',
      verificationId: 'ver-201',
      challengeId: 'ch-005',
      challengeTitle: 'No Fast Food Week',
      userId: 'user-789',
      userName: 'Carlos Martinez',
      userEmail: 'carlos@example.com',
      originalDecision: 'rejected',
      originalReason: 'Photo appears to show fast food packaging in background.',
      appealReason: 'That was my roommate\'s food, not mine. The photo clearly shows my homemade salad in the foreground. I can provide additional photos of my meal preparation and grocery receipts.',
      appealSubmittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      stakeAmount: 40.00,
      status: 'pending',
      priority: 'medium',
      additionalEvidence: 'Grocery receipts + meal prep photos'
    },
    {
      id: 'appeal-003',
      verificationId: 'ver-301',
      challengeId: 'ch-006',
      challengeTitle: '10,000 Steps Daily',
      userId: 'user-101',
      userName: 'Jennifer Wu',
      userEmail: 'jennifer@example.com',
      originalDecision: 'rejected',
      originalReason: 'Step counter shows 9,847 steps, below the 10,000 requirement.',
      appealReason: 'My fitness tracker had a syncing issue that day. My phone\'s health app shows 10,234 steps for the same day. I can provide screenshots from multiple tracking apps.',
      appealSubmittedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
      stakeAmount: 30.00,
      status: 'pending',
      priority: 'medium',
      additionalEvidence: 'Multiple fitness app screenshots'
    }
  ],
  recentAppealDecisions: [
    {
      id: 'appeal-101',
      challengeTitle: 'Meditation Challenge',
      userName: 'David Chen',
      originalDecision: 'rejected',
      appealDecision: 'approved',
      appealDecidedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      appealDecidedBy: 'Admin',
      appealReason: 'User provided valid evidence that meditation app had a logging error',
      stakeAmount: 45.00
    },
    {
      id: 'appeal-102',
      challengeTitle: 'Sugar-Free Week',
      userName: 'Amanda Rodriguez',
      originalDecision: 'rejected',
      appealDecision: 'rejected',
      appealDecidedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      appealDecidedBy: 'Admin',
      appealReason: 'Additional evidence still shows sugar consumption despite appeal',
      stakeAmount: 50.00
    }
  ],
  stats: {
    pendingAppeals: 3,
    appealsApprovedToday: 2,
    appealsRejectedToday: 1,
    totalAppealsThisWeek: 8,
    appealSuccessRate: 65.5,
    avgAppealProcessingTime: 4.2 // hours
  }
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user has admin access
    const sql = createDbConnection()
    const adminCheck = await sql`
      SELECT has_dev_access FROM users WHERE id = ${session.user.id}
    `
    
    if (!adminCheck[0]?.has_dev_access) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // For demo users, return mock appeals data
    if (false) { // Demo user check removed
      return NextResponse.json({
        success: true,
        appeals: getDemoAppeals()
      })
    }

    // For real users, query the database (reuse existing sql connection)

    // Get pending appeals (using proof_submissions table)
    const pendingAppeals = await sql`
      SELECT 
        a.id,
        a.verification_id,
        a.user_id,
        a.appeal_reason,
        a.additional_evidence,
        a.submitted_at as appeal_submitted_at,
        a.status,
        ps.challenge_id,
        ps.status as original_decision,
        ps.admin_notes as original_reason,
        c.title as challenge_title,
        c.min_stake as stake_amount,
        u.name as user_name,
        u.email as user_email
      FROM verification_appeals a
      JOIN proof_submissions ps ON a.verification_id = ps.id
      JOIN challenges c ON ps.challenge_id = c.id
      JOIN users u ON a.user_id = u.id
      WHERE a.status = 'pending'
      ORDER BY a.submitted_at ASC
      LIMIT 20
    `

    // Get recent appeal decisions (using proof_submissions table)
    const recentAppealDecisions = await sql`
      SELECT 
        a.id,
        a.status as appeal_decision,
        a.updated_at as appeal_decided_at,
        a.admin_notes as appeal_reason,
        ps.status as original_decision,
        c.title as challenge_title,
        c.min_stake as stake_amount,
        u.name as user_name
      FROM verification_appeals a
      JOIN proof_submissions ps ON a.verification_id = ps.id
      JOIN challenges c ON ps.challenge_id = c.id
      JOIN users u ON a.user_id = u.id
      WHERE a.status IN ('approved', 'rejected')
      ORDER BY a.updated_at DESC
      LIMIT 10
    `

    // Get appeal stats
    const stats = await sql`
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_appeals,
        COUNT(CASE WHEN status = 'approved' AND updated_at > NOW() - INTERVAL '1 day' THEN 1 END) as appeals_approved_today,
        COUNT(CASE WHEN status = 'rejected' AND updated_at > NOW() - INTERVAL '1 day' THEN 1 END) as appeals_rejected_today,
        COUNT(CASE WHEN updated_at > NOW() - INTERVAL '7 days' THEN 1 END) as total_appeals_this_week
      FROM verification_appeals
    `

    const appeals = {
      pendingAppeals: pendingAppeals.map((a: any) => ({
        id: a.id,
        verificationId: a.verification_id,
        challengeId: a.challenge_id,
        challengeTitle: a.challenge_title,
        userId: a.user_id,
        userName: a.user_name,
        userEmail: a.user_email,
        originalDecision: a.original_decision,
        originalReason: a.original_reason,
        appealReason: a.appeal_reason,
        appealSubmittedAt: a.appeal_submitted_at,
        stakeAmount: parseFloat(a.stake_amount),
        status: a.status,
        additionalEvidence: a.additional_evidence
      })),
      recentAppealDecisions: recentAppealDecisions.map((d: any) => ({
        id: d.id,
        challengeTitle: d.challenge_title,
        userName: d.user_name,
        originalDecision: d.original_decision,
        appealDecision: d.appeal_decision,
        appealDecidedAt: d.appeal_decided_at,
        appealDecidedBy: 'Admin',
        appealReason: d.appeal_reason,
        stakeAmount: parseFloat(d.stake_amount)
      })),
      stats: {
        pendingAppeals: parseInt(stats[0].pending_appeals) || 0,
        appealsApprovedToday: parseInt(stats[0].appeals_approved_today) || 0,
        appealsRejectedToday: parseInt(stats[0].appeals_rejected_today) || 0,
        totalAppealsThisWeek: parseInt(stats[0].total_appeals_this_week) || 0,
        appealSuccessRate: 65.5,
        avgAppealProcessingTime: 4.2
      }
    }

    return NextResponse.json({
      success: true,
      appeals
    })

  } catch (error) {
    console.error('Appeals fetch error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch appeals',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// POST endpoint for processing appeals
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user has admin access
    const sql = createDbConnection()
    const adminCheck = await sql`
      SELECT has_dev_access FROM users WHERE id = ${session.user.id}
    `
    
    if (!adminCheck[0]?.has_dev_access) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { appealId, decision, reason } = body

    if (!['approved', 'rejected'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision. Must be "approved" or "rejected"' }, { status: 400 })
    }

    // For demo users, return mock success
    if (false) { // Demo user check removed
      return NextResponse.json({
        success: true,
        message: `Appeal ${decision} successfully`,
        appeal: {
          id: appealId,
          status: decision,
          decidedAt: new Date().toISOString(),
          decidedBy: session?.user?.name || 'Admin',
          reason: reason || `Appeal ${decision} by admin`
        }
      })
    }

    // For real users, update the database (reuse existing sql connection)

    // Get the appeal and original verification (using proof_submissions table)
    const appeal = await sql`
      SELECT a.*, ps.status as original_verification_status, ps.challenge_id
      FROM verification_appeals a
      JOIN proof_submissions ps ON a.verification_id = ps.id
      WHERE a.id = ${appealId}
    `

    if (appeal.length === 0) {
      return NextResponse.json({ error: 'Appeal not found' }, { status: 404 })
    }

    // Update the appeal status
    await sql`
      UPDATE verification_appeals 
      SET 
        status = ${decision},
        admin_notes = ${reason || ''},
        reviewed_by = ${session.user.id},
        updated_at = NOW()
      WHERE id = ${appealId}
    `

    // If appeal is approved, reverse the original verification decision
    if (decision === 'approved') {
      const newVerificationStatus = appeal[0].original_verification_status === 'rejected' ? 'approved' : 'rejected'
      
      await sql`
        UPDATE proof_submissions 
        SET 
          status = ${newVerificationStatus},
          admin_notes = ${`Decision reversed due to successful appeal: ${reason || 'Appeal approved'}`},
          reviewed_by = ${session.user.id},
          reviewed_at = NOW()
        WHERE id = ${appeal[0].verification_id}
      `

      // Process financial implications (refund stakes, recalculate rewards)
      if (newVerificationStatus === 'approved') {
        // Get the user and challenge details
        const userAndChallenge = await sql`
          SELECT 
            ps.user_id,
            c.id as challenge_id,
            c.title as challenge_title,
            c.min_stake,
            cp.stake_amount,
            cp.id as participant_id
          FROM proof_submissions ps
          JOIN challenges c ON ps.challenge_id = c.id
          JOIN challenge_participants cp ON cp.challenge_id = c.id AND cp.user_id = ps.user_id
          WHERE ps.id = ${appeal[0].verification_id}
        `

        if (userAndChallenge.length > 0) {
          const userId = userAndChallenge[0].user_id
          const challengeId = userAndChallenge[0].challenge_id
          const challengeTitle = userAndChallenge[0].challenge_title
          const stakeAmount = parseFloat(userAndChallenge[0].stake_amount)
          const minStake = parseFloat(userAndChallenge[0].min_stake)
          const participantId = userAndChallenge[0].participant_id

          // Refund the stake to the user's wallet
          await sql`
            UPDATE users 
            SET 
              credits = credits + ${stakeAmount},
              updated_at = NOW()
            WHERE id = ${userId}
          `

          // Record the refund transaction
          await sql`
            INSERT INTO credit_transactions (
              user_id, amount, transaction_type, related_challenge_id, description, created_at
            ) VALUES (
              ${userId}, 
              ${stakeAmount}, 
              'appeal_refund', 
              ${challengeId},
              'Stake refunded due to successful appeal: ${challengeTitle}',
              NOW()
            )
          `

          // Calculate and award the challenge reward (10% bonus on stake, capped at 150% of min_stake)
          const baseReward = Math.min(minStake * 1.5, stakeAmount * 1.1)
          
          // Award the reward
          await sql`
            UPDATE users 
            SET 
              credits = credits + ${baseReward},
              updated_at = NOW()
            WHERE id = ${userId}
          `

          // Record the reward transaction
          await sql`
            INSERT INTO credit_transactions (
              user_id, amount, transaction_type, related_challenge_id, description, created_at
            ) VALUES (
              ${userId}, 
              ${baseReward}, 
              'appeal_reward', 
              ${challengeId},
              'Reward earned from successful appeal: ${challengeTitle}',
              NOW()
            )
          `

          // Update the challenge participant to reflect the completion and reward
          await sql`
            UPDATE challenge_participants 
            SET 
              completion_status = 'completed',
              verification_status = 'approved',
              reward_earned = ${baseReward},
              completed_at = NOW(),
              updated_at = NOW()
            WHERE id = ${participantId}
          `

          // Send notification to user about successful appeal and rewards
          const { createNotification } = await import('@/lib/notification-service')
          
          await createNotification({
            userId,
            type: 'financial',
            title: '✅ Appeal Approved - Reward Received',
            message: `Your appeal has been approved! You've received a $${baseReward.toFixed(2)} reward plus your $${stakeAmount.toFixed(2)} stake refund.`,
            actionUrl: '/wallet',
            metadata: {
              amount: baseReward + stakeAmount,
              reason: `Appeal approved: ${reason || 'Successful appeal'}`,
              challengeTitle,
              eventType: 'appeal_approved'
            },
            sendEmail: true,
            emailSubject: `Appeal Approved - Reward Received`,
            emailBody: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">✅ Appeal Approved</h2>
                <p>Great news! Your appeal for the challenge <strong>"${challengeTitle}"</strong> has been approved.</p>
                
                <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                  <h3 style="margin-top: 0; color: #047857;">Financial Summary</h3>
                  <p style="font-size: 16px; margin: 10px 0;">
                    <strong>Stake Refunded:</strong> 
                    <span style="color: #10b981; font-size: 18px;">+$${stakeAmount.toFixed(2)}</span>
                  </p>
                  <p style="font-size: 16px; margin: 10px 0;">
                    <strong>Reward Earned:</strong> 
                    <span style="color: #10b981; font-size: 18px;">+$${baseReward.toFixed(2)}</span>
                  </p>
                  <hr style="border: none; border-top: 1px solid #d1fae5; margin: 15px 0;">
                  <p style="font-size: 18px; margin: 10px 0;">
                    <strong>Total Added to Wallet:</strong> 
                    <span style="color: #10b981; font-size: 20px;">$${(baseReward + stakeAmount).toFixed(2)}</span>
                  </p>
                </div>
                
                <p><strong>Reason:</strong> ${reason || 'Appeal approved'}</p>
                
                <p style="color: #6b7280;">
                  Thank you for providing additional evidence. Your wallet has been updated with the refund and reward.
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://stakr.app'}/wallet" 
                     style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px;">
                    View Wallet
                  </a>
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://stakr.app'}/discover" 
                     style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    Find New Challenges
                  </a>
                </div>
              </div>
            `
          }).catch(error => {
            console.error('Failed to send appeal notification:', error)
            // Don't fail the appeal if notification fails
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Appeal ${decision} successfully`,
      appeal: {
        id: appealId,
        status: decision,
        decidedAt: new Date().toISOString(),
        decidedBy: session.user.name,
        reason: reason || `Appeal ${decision} by admin`
      }
    })

  } catch (error) {
    console.error('Appeal decision error:', error)
    return NextResponse.json({ 
      error: 'Failed to process appeal decision',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
