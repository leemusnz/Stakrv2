import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'

interface CreateReportRequest {
  contentType: 'user' | 'post' | 'challenge' | 'profile'
  contentId: string
  reportedUserId?: string
  reason: string
  details?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body: CreateReportRequest = await request.json()
    const { contentType, contentId, reportedUserId, reason, details } = body

    // Validate required fields
    if (!contentType || !contentId || !reason) {
      return NextResponse.json({ 
        error: 'Missing required fields: contentType, contentId, and reason are required' 
      }, { status: 400 })
    }

    // Validate content type
    const validContentTypes = ['user', 'post', 'challenge', 'profile']
    if (!validContentTypes.includes(contentType)) {
      return NextResponse.json({ 
        error: 'Invalid content type. Must be one of: user, post, challenge, profile' 
      }, { status: 400 })
    }

    // Prevent self-reporting
    if (reportedUserId && reportedUserId === session.user.id) {
      return NextResponse.json({ 
        error: 'You cannot report your own content' 
      }, { status: 400 })
    }

    const sql = await createDbConnection()

    // Check if user has already reported this content
    const existingReport = await sql`
      SELECT id FROM user_reports 
      WHERE reporter_id = ${session.user.id} 
      AND reported_content_type = ${contentType}
      AND reported_content_id = ${contentId}
      AND status IN ('pending', 'investigating')
    `

    if (existingReport.length > 0) {
      return NextResponse.json({ 
        error: 'You have already reported this content' 
      }, { status: 400 })
    }

    // Check if content exists (basic validation)
    let contentExists = false
    switch (contentType) {
      case 'user':
      case 'profile':
        const userCheck = await sql`SELECT id FROM users WHERE id = ${contentId}`
        contentExists = userCheck.length > 0
        break
      case 'post':
        const postCheck = await sql`SELECT id FROM user_posts WHERE id = ${contentId}`
        contentExists = postCheck.length > 0
        break
      case 'challenge':
        const challengeCheck = await sql`SELECT id FROM challenges WHERE id = ${contentId}`
        contentExists = challengeCheck.length > 0
        break
    }

    if (!contentExists) {
      return NextResponse.json({ 
        error: 'The reported content no longer exists' 
      }, { status: 404 })
    }

    // Create the report
    const report = await sql`
      INSERT INTO user_reports (
        reporter_id,
        reported_user_id,
        reported_content_type,
        reported_content_id,
        report_reason,
        report_details,
        status,
        created_at
      ) VALUES (
        ${session.user.id},
        ${reportedUserId || null},
        ${contentType},
        ${contentId},
        ${reason},
        ${details || null},
        'pending',
        NOW()
      )
      RETURNING id, created_at
    `

    // If this is a high-priority report (hate speech, harassment), automatically flag for urgent review
    const urgentReasons = ['hate_speech', 'harassment', 'unsafe']
    if (urgentReasons.includes(reason)) {
      // Add to high-priority moderation queue
      try {
        await sql`
          INSERT INTO moderation_queue (
            content_type,
            content_id,
            user_id,
            priority,
            flagged_reasons,
            ai_confidence,
            content_preview,
            status
          ) VALUES (
            ${contentType},
            ${contentId},
            ${reportedUserId || session.user.id},
            1, -- Highest priority
            ${JSON.stringify([reason])},
            100, -- Human report confidence
            ${`User reported for: ${reason}`},
            'pending'
          )
          ON CONFLICT (content_type, content_id) DO UPDATE SET
            priority = LEAST(moderation_queue.priority, 1),
            flagged_reasons = moderation_queue.flagged_reasons || ${JSON.stringify([reason])}::jsonb
        `
      } catch (error) {
        console.error('Failed to add to moderation queue:', error)
        // Continue anyway - the report was still created
      }
    }

    // Log the report for analytics

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully. Our moderation team will review it.',
      reportId: report[0].id,
      priority: urgentReasons.includes(reason) ? 'urgent' : 'normal'
    }, { status: 201 })

  } catch (error) {
    console.error('Report creation error:', error)
    return NextResponse.json({
      error: 'Failed to submit report',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// GET endpoint for users to check their report history (optional)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const sql = await createDbConnection()

    const reports = await sql`
      SELECT 
        id,
        reported_content_type,
        reported_content_id,
        report_reason,
        status,
        created_at,
        updated_at
      FROM user_reports 
      WHERE reporter_id = ${session.user.id}
      ORDER BY created_at DESC
      LIMIT 50
    `

    return NextResponse.json({
      success: true,
      reports: reports.map((report: Record<string, any>) => ({
        id: report.id,
        contentType: report.reported_content_type,
        contentId: report.reported_content_id,
        reason: report.report_reason,
        status: report.status,
        submittedAt: report.created_at,
        lastUpdated: report.updated_at
      }))
    })

  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json({
      error: 'Failed to get reports',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
