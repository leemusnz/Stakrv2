import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const sql = await createDbConnection()
    
    // Fetch real user reports from database
    const reports = await sql`
      SELECT 
        ur.id,
        ur.reported_content_type as "contentType",
        ur.reported_content_id as "contentId",
        ur.report_reason as "reason",
        ur.report_details as "details",
        ur.status,
        ur.moderator_action as "moderatorAction",
        ur.moderator_notes as "moderatorNotes", 
        ur.created_at as "createdAt",
        ur.updated_at as "updatedAt",
        reporter.name as "reporterName",
        reporter.email as "reporterEmail",
        reported_user.name as "reportedUserName",
        reported_user.email as "reportedUserEmail",
        moderator.name as "moderatorName"
      FROM user_reports ur
      LEFT JOIN users reporter ON ur.reporter_id = reporter.id
      LEFT JOIN users reported_user ON ur.reported_user_id = reported_user.id
      LEFT JOIN users moderator ON ur.moderator_id = moderator.id
      ORDER BY ur.created_at DESC
      LIMIT 100
    `

    // Format the data to match expected structure
    const formattedReports = reports.map((report: Record<string, any>) => ({
      id: report.id,
      reporterName: report.reporterName || 'Anonymous',
      reportedUserName: report.reportedUserName,
      reportedUserEmail: report.reportedUserEmail,
      contentType: report.contentType,
      contentId: report.contentId,
      reason: report.reason,
      details: report.details,
      status: report.status,
      moderatorAction: report.moderatorAction,
      moderatorNotes: report.moderatorNotes,
      moderatorName: report.moderatorName,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      contentPreview: `${report.contentType} content (ID: ${report.contentId})`
    }))

    return NextResponse.json({
      success: true,
      reports: formattedReports,
      count: formattedReports.length
    })

  } catch (error) {
    console.error('Failed to load user reports:', error)
    return NextResponse.json({ 
      error: 'Failed to load user reports',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { reportId, action, notes } = body

    if (!reportId || !action) {
      return NextResponse.json({ error: 'Report ID and action are required' }, { status: 400 })
    }

    const sql = await createDbConnection()
    
    // Update the report in the database
    const result = await sql`
      UPDATE user_reports 
      SET 
        status = ${action === 'resolve' ? 'resolved' : action === 'dismiss' ? 'dismissed' : 'investigating'},
        moderator_id = ${session.user.id},
        moderator_action = ${action},
        moderator_notes = ${notes || null},
        updated_at = NOW()
      WHERE id = ${reportId}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (notes) {
    }

    return NextResponse.json({
      success: true,
      message: `Report ${action}d successfully`,
      reportId: reportId
    })

  } catch (error) {
    console.error('Failed to process user report:', error)
    return NextResponse.json({ 
      error: 'Failed to process user report',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
