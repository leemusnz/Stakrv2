import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'

import { systemLogger } from '@/lib/system-logger'
import { notifyProofApproved, notifyProofRejected } from '@/lib/notification-templates'
import { createNotification } from '@/lib/notification-service'

// Mock verification data for demo accounts
const getDemoVerifications = () => ({
  pendingVerifications: [
    {
      id: 'ver-001',
      challengeId: 'ch-001',
      challengeTitle: '30-Day Morning Workout',
      userId: 'user-123',
      userName: 'Sarah Chen',
      userEmail: 'sarah@example.com',
      submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      proofType: 'photo',
      proofUrl: '/api/placeholder-proof-image',
      proofText: 'Completed my morning workout session with 30 minutes of cardio and strength training.',
      stakeAmount: 50.00,
      participantCount: 24,
      status: 'pending',
      priority: 'high',
      daysIntoChallenge: 22,
      challengeDuration: 30
    },
    {
      id: 'ver-002', 
      challengeId: 'ch-002',
      challengeTitle: 'Daily Reading Challenge',
      userId: 'user-456',
      userName: 'Mike Rodriguez',
      userEmail: 'mike@example.com',
      submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      proofType: 'text',
      proofUrl: null,
      proofText: 'Just finished reading Chapter 8 of "Atomic Habits" - learned about the importance of environment design for habit formation. Really enjoying this book!',
      stakeAmount: 30.00,
      participantCount: 18,
      status: 'pending',
      priority: 'medium',
      daysIntoChallenge: 15,
      challengeDuration: 21
    },
    {
      id: 'ver-003',
      challengeId: 'ch-003', 
      challengeTitle: 'No Social Media Weekend',
      userId: 'user-789',
      userName: 'Alex Johnson',
      userEmail: 'alex@example.com',
      submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      proofType: 'screenshot',
      proofUrl: '/api/placeholder-screenshot',
      proofText: 'Screenshot of my phone showing 0 minutes on social media apps for the entire weekend!',
      stakeAmount: 25.00,
      participantCount: 12,
      status: 'pending',
      priority: 'medium',
      daysIntoChallenge: 2,
      challengeDuration: 2
    },
    {
      id: 'ver-004',
      challengeId: 'ch-004',
      challengeTitle: 'Meditation Mastery',
      userId: 'user-101',
      userName: 'Emma Wilson',
      userEmail: 'emma@example.com',
      submittedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
      proofType: 'video',
      proofUrl: '/api/placeholder-video',
      proofText: 'Video proof of my 15-minute guided meditation session using the Headspace app.',
      stakeAmount: 45.00,
      participantCount: 31,
      status: 'pending',
      priority: 'low',
      daysIntoChallenge: 8,
      challengeDuration: 14
    }
  ],
  recentDecisions: [
    {
      id: 'ver-101',
      challengeTitle: '10K Steps Daily',
      userName: 'David Kim',
      decision: 'approved',
      decidedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      decidedBy: 'Admin',
      reason: 'Clear photo evidence of fitness tracker showing 10,247 steps.',
      stakeAmount: 40.00
    },
    {
      id: 'ver-102',
      challengeTitle: 'Early Riser Challenge',
      userName: 'Lisa Park',
      decision: 'rejected',
      decidedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      decidedBy: 'Admin',
      reason: 'Timestamp indicates photo was taken at 8:30 AM, not 6:00 AM as required.',
      stakeAmount: 35.00
    },
    {
      id: 'ver-103',
      challengeTitle: 'Healthy Cooking Week',
      userName: 'James Foster',
      decision: 'approved',
      decidedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      decidedBy: 'Admin',
      reason: 'Excellent photo of homemade healthy meal with ingredients list.',
      stakeAmount: 60.00
    }
  ],
  stats: {
    pendingCount: 4,
    approvedToday: 12,
    rejectedToday: 3,
    avgProcessingTime: 2.5, // hours
    totalStakesUnderReview: 150.00,
    disputesOpen: 1
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

    // For demo users, return mock verification data
    if (false) { // Demo user check removed
      return NextResponse.json({
        success: true,
        verifications: getDemoVerifications()
      })
    }

    // For real users, query the database (reuse existing sql connection)

    // Get pending verifications (using proof_submissions table)
    const pendingVerifications = await sql`
      SELECT 
        ps.id,
        ps.challenge_id,
        ps.user_id,
        ps.submission_type as proof_type,
        ps.file_url as proof_url,
        ps.text_content as proof_text,
        ps.submitted_at,
        ps.status,
        c.title as challenge_title,
        c.min_stake as stake_amount,
        c.duration,
        u.name as user_name,
        u.email as user_email,
        (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = c.id) as participant_count
      FROM proof_submissions ps
      JOIN challenges c ON ps.challenge_id = c.id
      JOIN users u ON ps.user_id = u.id
      WHERE ps.status = 'pending'
      ORDER BY ps.submitted_at ASC
      LIMIT 20
    `

    // Get recent decisions (using proof_submissions table)
    const recentDecisions = await sql`
      SELECT 
        ps.id,
        ps.status as decision,
        ps.reviewed_at as decided_at,
        ps.admin_notes as reason,
        c.title as challenge_title,
        c.min_stake as stake_amount,
        u.name as user_name
      FROM proof_submissions ps
      JOIN challenges c ON ps.challenge_id = c.id
      JOIN users u ON ps.user_id = u.id
      WHERE ps.status IN ('approved', 'rejected')
      ORDER BY ps.reviewed_at DESC
      LIMIT 10
    `

    // Get verification stats (using proof_submissions table)
    const stats = await sql`
      SELECT 
        COUNT(CASE WHEN ps.status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN ps.status = 'approved' AND ps.reviewed_at > NOW() - INTERVAL '1 day' THEN 1 END) as approved_today,
        COUNT(CASE WHEN ps.status = 'rejected' AND ps.reviewed_at > NOW() - INTERVAL '1 day' THEN 1 END) as rejected_today,
        SUM(CASE WHEN ps.status = 'pending' THEN c.min_stake END) as total_stakes_under_review
      FROM proof_submissions ps
      JOIN challenges c ON ps.challenge_id = c.id
    `

    const verifications = {
      pendingVerifications: pendingVerifications.map((v: any) => ({
        id: v.id,
        challengeId: v.challenge_id,
        challengeTitle: v.challenge_title,
        userId: v.user_id,
        userName: v.user_name,
        userEmail: v.user_email,
        submittedAt: v.submitted_at,
        proofType: v.proof_type,
        proofUrl: v.proof_url,
        proofText: v.proof_text,
        stakeAmount: parseFloat(v.stake_amount),
        participantCount: v.participant_count,
        status: v.status
      })),
      recentDecisions: recentDecisions.map((d: any) => ({
        id: d.id,
        challengeTitle: d.challenge_title,
        userName: d.user_name,
        decision: d.decision,
        decidedAt: d.decided_at,
        decidedBy: 'Admin',
        reason: d.reason,
        stakeAmount: parseFloat(d.stake_amount)
      })),
      stats: {
        pendingCount: parseInt(stats[0].pending_count) || 0,
        approvedToday: parseInt(stats[0].approved_today) || 0,
        rejectedToday: parseInt(stats[0].rejected_today) || 0,
        totalStakesUnderReview: parseFloat(stats[0].total_stakes_under_review) || 0,
        avgProcessingTime: 2.5,
        disputesOpen: 0
      }
    }

    return NextResponse.json({
      success: true,
      verifications
    })

  } catch (error) {
    console.error('Verifications fetch error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch verifications',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// POST endpoint for verification decisions
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
    const { verificationId, decision, reason } = body

    if (!['approved', 'rejected'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision. Must be "approved" or "rejected"' }, { status: 400 })
    }

    // For demo users, return mock success
    if (false) { // Demo user check removed
      return NextResponse.json({
        success: true,
        message: `Verification ${decision} successfully`,
        verification: {
          id: verificationId,
          status: decision,
          decidedAt: new Date().toISOString(),
          decidedBy: session?.user?.name || 'Admin',
          reason: reason || `Verification ${decision} by admin`
        }
      })
    }

    // For real users, update the database (reuse existing sql connection)

    const updatedVerification = await sql`
      UPDATE proof_submissions 
      SET 
        status = ${decision},
        admin_notes = ${reason || ''},
        reviewed_by = ${session.user.id},
        reviewed_at = NOW()
      WHERE id = ${verificationId}
      RETURNING id, status, reviewed_at
    `

    if (updatedVerification.length === 0) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 })
    }

    // Log admin action
    systemLogger.info(`Admin ${session?.user?.name || 'Unknown'} ${decision} verification ${verificationId}`, 'admin', {
      verificationId,
      decision,
      adminId: session?.user?.id,
      reason
    })

    // Fetch proof submission details for notifications
    const proofDetails = await sql`
      SELECT 
        ps.user_id,
        ps.challenge_id,
        c.title as challenge_title
      FROM proof_submissions ps
      JOIN challenges c ON ps.challenge_id = c.id
      WHERE ps.id = ${verificationId}
    `

    if (proofDetails.length > 0) {
      const { user_id, challenge_id, challenge_title } = proofDetails[0]

      // Send notification based on decision
      if (decision === 'approved') {
        // Notify user of approval
        await notifyProofApproved(user_id, challenge_id, challenge_title, sql)
      } else if (decision === 'rejected') {
        // Notify user of rejection
        const canAppeal = true // Users can appeal rejected proofs
        await notifyProofRejected(user_id, challenge_id, challenge_title, reason || 'Your proof did not meet the challenge requirements.', canAppeal, sql)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Verification ${decision} successfully`,
      verification: {
        id: verificationId,
        status: decision,
        decidedAt: updatedVerification[0].updated_at,
        decidedBy: session?.user?.name || 'Admin',
        reason: reason || `Verification ${decision} by admin`
      }
    })

  } catch (error) {
    console.error('Verification decision error:', error)
    return NextResponse.json({ 
      error: 'Failed to process verification decision',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// PUT endpoint for reversing verification decisions
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user has admin access
    const adminSql = await createDbConnection()
    const adminCheck = await adminSql`
      SELECT has_dev_access FROM users WHERE id = ${session.user.id}
    `
    
    if (!adminCheck[0]?.has_dev_access) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { verificationId, reason } = body

    if (!reason) {
      return NextResponse.json({ error: 'Reason is required for reversing verification decisions' }, { status: 400 })
    }

    // For demo users, return mock success
    if (false) { // Demo user check removed
      return NextResponse.json({
        success: true,
        message: 'Verification decision reversed successfully',
        verification: {
          id: verificationId,
          status: 'reversed',
          reversedAt: new Date().toISOString(),
          reversedBy: session?.user?.name || 'Admin',
          reversalReason: reason
        }
      })
    }

    // For real users, update the database
    const sql = createDbConnection()

    // Get the current verification status
    const currentVerification = await sql`
      SELECT id, status, challenge_id FROM proof_submissions WHERE id = ${verificationId}
    `

    if (currentVerification.length === 0) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 })
    }

    const currentStatus = currentVerification[0].status
    if (currentStatus === 'pending') {
      return NextResponse.json({ error: 'Cannot reverse pending verifications' }, { status: 400 })
    }

    // Reverse the decision
    const newStatus = currentStatus === 'approved' ? 'rejected' : 'approved'
    
    const updatedVerification = await sql`
      UPDATE proof_submissions 
      SET 
        status = ${newStatus},
        admin_notes = ${`REVERSED: ${reason} (Originally ${currentStatus})`},
        reviewed_by = ${session.user.id},
        reviewed_at = NOW()
      WHERE id = ${verificationId}
      RETURNING id, status, reviewed_at
    `

    // Log the reversal in admin actions table
    await sql`
      INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details, created_at)
      VALUES (
        ${session.user.id},
        'verification_reversed',
        'verification',
        ${verificationId},
        ${JSON.stringify({
          originalStatus: currentStatus,
          newStatus: newStatus,
          reason: reason,
          challengeId: currentVerification[0].challenge_id
        })},
        NOW()
      )
    `

    // Fetch proof submission and user details for notifications
    const proofWithUserDetails = await sql`
      SELECT 
        ps.user_id,
        ps.challenge_id,
        c.title as challenge_title
      FROM proof_submissions ps
      JOIN challenges c ON ps.challenge_id = c.id
      WHERE ps.id = ${verificationId}
    `

    // Process financial implications if reversing from approved to rejected
    if (currentStatus === 'approved' && newStatus === 'rejected') {
      // User had received a reward - we need to reverse it
      const rewardRecord = await sql`
        SELECT id, amount FROM credit_transactions 
        WHERE user_id = (SELECT user_id FROM proof_submissions WHERE id = ${verificationId})
        AND related_challenge_id = ${currentVerification[0].challenge_id}
        AND transaction_type = 'challenge_reward'
        ORDER BY created_at DESC
        LIMIT 1
      `

      if (rewardRecord.length > 0) {
        const rewardAmount = rewardRecord[0].amount
        
        // Deduct the reward from user credits
        await sql`
          UPDATE users 
          SET credits = credits - ${rewardAmount}
          WHERE id = (SELECT user_id FROM proof_submissions WHERE id = ${verificationId})
        `

        // Record reversal transaction
        await sql`
          INSERT INTO credit_transactions (user_id, amount, transaction_type, related_challenge_id, description, created_at)
          VALUES (
            (SELECT user_id FROM proof_submissions WHERE id = ${verificationId}),
            ${-rewardAmount},
            'reward_reversal',
            ${currentVerification[0].challenge_id},
            'Reward reversed due to verification reversal',
            NOW()
          )
        `
      }
    }
    // Process financial implications if reversing from rejected to approved
    else if (currentStatus === 'rejected' && newStatus === 'approved') {
      // User should receive a reward - process it
      const participant = await sql`
        SELECT user_id FROM proof_submissions WHERE id = ${verificationId}
      `

      if (participant.length > 0) {
        // For now, we'll calculate a standard reward based on challenge setup
        // In a full implementation, this would use the full reward calculation logic
        const challengeData = await sql`
          SELECT min_stake FROM challenges WHERE id = ${currentVerification[0].challenge_id}
        `

        if (challengeData.length > 0) {
          const baseReward = parseFloat(challengeData[0].min_stake) * 1.1 // 10% bonus on stake
          
          // Award the reward
          await sql`
            UPDATE users 
            SET credits = credits + ${baseReward}
            WHERE id = ${participant[0].user_id}
          `

          // Record reward transaction
          await sql`
            INSERT INTO credit_transactions (user_id, amount, transaction_type, related_challenge_id, description, created_at)
            VALUES (
              ${participant[0].user_id},
              ${baseReward},
              'challenge_reward',
              ${currentVerification[0].challenge_id},
              'Reward granted due to verification reversal',
              NOW()
            )
          `
        }
      }
    }

    // Send notification to user about reversal
    if (proofWithUserDetails.length > 0) {
      const { user_id, challenge_id, challenge_title } = proofWithUserDetails[0]
      
      const reversalMessage = currentStatus === 'approved' 
        ? `Your previously approved proof for "${challenge_title}" has been reversed to rejected. Reason: ${reason}`
        : `Your previously rejected proof for "${challenge_title}" has been reversed to approved! You've been granted the reward.`

      await createNotification({
        userId: user_id,
        type: 'verification',
        title: currentStatus === 'approved' ? '⚠️ Proof Reversal - Now Rejected' : '✅ Proof Reversal - Now Approved',
        message: reversalMessage,
        actionUrl: `/challenge/${challenge_id}`,
        metadata: {
          challengeId: challenge_id,
          challengeTitle: challenge_title,
          eventType: 'proof_reversal',
          originalStatus: currentStatus,
          newStatus: newStatus,
          reason: reason
        },
        sendEmail: true,
        emailSubject: `Proof Decision Reversed - "${challenge_title}"`,
        emailBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">⚠️ Proof Decision Reversed</h2>
            <p>Your proof submission for <strong>"${challenge_title}"</strong> has been reviewed and reversed.</p>
            
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3 style="margin-top: 0; color: #92400e;">Previous Status: ${currentStatus === 'approved' ? 'Approved ✅' : 'Rejected ❌'}</h3>
              <h3 style="color: #92400e;">New Status: ${newStatus === 'approved' ? 'Approved ✅' : 'Rejected ❌'}</h3>
              <p><strong>Reason for Reversal:</strong> ${reason}</p>
            </div>
            
            <p>If you have questions about this decision, please contact our support team.</p>
            
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/challenge/${challenge_id}" 
               style="display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Challenge
            </a>
          </div>
        `
      }, sql)
    }

    return NextResponse.json({
      success: true,
      message: `Verification decision reversed from ${currentStatus} to ${newStatus}`,
      verification: {
        id: verificationId,
        status: newStatus,
        reversedAt: updatedVerification[0].updated_at,
        reversedBy: session?.user?.name || 'Admin',
        reversalReason: reason,
        originalStatus: currentStatus
      }
    })

  } catch (error) {
    console.error('Verification reversal error:', error)
    return NextResponse.json({ 
      error: 'Failed to reverse verification decision',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
