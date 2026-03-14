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
    const sql = await createDbConnection()
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
    const sql = await createDbConnection()
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

      // TODO: Process financial implications (refund stakes, recalculate rewards)
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
