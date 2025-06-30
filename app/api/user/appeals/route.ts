import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { isDemoUser } from '@/lib/demo-data'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { verificationId, appealReason, additionalEvidence } = body

    if (!verificationId || !appealReason) {
      return NextResponse.json({ error: 'Verification ID and appeal reason are required' }, { status: 400 })
    }

    // For demo users, return mock success
    if (isDemoUser(session.user.id)) {
      return NextResponse.json({
        success: true,
        message: 'Appeal submitted successfully',
        appeal: {
          id: `appeal-${Date.now()}`,
          verificationId,
          appealReason,
          additionalEvidence,
          status: 'pending',
          submittedAt: new Date().toISOString()
        }
      })
    }

    // For real users, process with database
    const sql = await createDbConnection()

    // Check if verification exists and belongs to the user
    const verification = await sql`
      SELECT v.id, v.status, v.user_id, c.title as challenge_title
      FROM verifications v
      JOIN challenges c ON v.challenge_id = c.id
      WHERE v.id = ${verificationId} AND v.user_id = ${session.user.id}
    `

    if (verification.length === 0) {
      return NextResponse.json({ error: 'Verification not found or access denied' }, { status: 404 })
    }

    if (verification[0].status !== 'rejected') {
      return NextResponse.json({ error: 'Appeals can only be submitted for rejected verifications' }, { status: 400 })
    }

    // Check if appeal already exists
    const existingAppeal = await sql`
      SELECT id FROM verification_appeals 
      WHERE verification_id = ${verificationId} AND user_id = ${session.user.id}
    `

    if (existingAppeal.length > 0) {
      return NextResponse.json({ error: 'An appeal has already been submitted for this verification' }, { status: 400 })
    }

    // Create the appeal
    const newAppeal = await sql`
      INSERT INTO verification_appeals (
        verification_id,
        user_id,
        appeal_reason,
        additional_evidence,
        status,
        submitted_at
      ) VALUES (
        ${verificationId},
        ${session.user.id},
        ${appealReason},
        ${additionalEvidence || null},
        'pending',
        NOW()
      )
      RETURNING id, status, submitted_at
    `

    return NextResponse.json({
      success: true,
      message: 'Appeal submitted successfully. An admin will review your appeal within 24-48 hours.',
      appeal: {
        id: newAppeal[0].id,
        verificationId,
        challengeTitle: verification[0].challenge_title,
        appealReason,
        additionalEvidence,
        status: newAppeal[0].status,
        submittedAt: newAppeal[0].submitted_at
      }
    })

  } catch (error) {
    console.error('Appeal submission error:', error)
    return NextResponse.json({ 
      error: 'Failed to submit appeal',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// GET endpoint for users to check their appeals
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // For demo users, return mock appeals
    if (isDemoUser(session.user.id)) {
      return NextResponse.json({
        success: true,
        appeals: [
          {
            id: 'appeal-demo-1',
            verificationId: 'ver-demo-1',
            challengeTitle: 'Demo Challenge',
            appealReason: 'This is a demo appeal',
            status: 'pending',
            submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          }
        ]
      })
    }

    // For real users, query database
    const sql = await createDbConnection()

    const appeals = await sql`
      SELECT 
        a.id,
        a.verification_id,
        a.appeal_reason,
        a.additional_evidence,
        a.status,
        a.submitted_at,
        a.updated_at,
        a.admin_notes,
        c.title as challenge_title
      FROM verification_appeals a
      JOIN verifications v ON a.verification_id = v.id
      JOIN challenges c ON v.challenge_id = c.id
      WHERE a.user_id = ${session.user.id}
      ORDER BY a.submitted_at DESC
    `

    return NextResponse.json({
      success: true,
      appeals: appeals.map((appeal: any) => ({
        id: appeal.id,
        verificationId: appeal.verification_id,
        challengeTitle: appeal.challenge_title,
        appealReason: appeal.appeal_reason,
        additionalEvidence: appeal.additional_evidence,
        status: appeal.status,
        submittedAt: appeal.submitted_at,
        updatedAt: appeal.updated_at,
        adminNotes: appeal.admin_notes
      }))
    })

  } catch (error) {
    console.error('Appeals fetch error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch appeals',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
} 