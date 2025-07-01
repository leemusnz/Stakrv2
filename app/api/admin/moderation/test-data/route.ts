import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const sql = await createDbConnection()

    // Insert sample data into moderation_queue
    await sql`
      INSERT INTO moderation_queue (
        content_type, content_id, user_id, priority, flagged_reasons, 
        ai_confidence, content_preview, status
      ) VALUES 
        ('post', gen_random_uuid(), ${session.user.id}, 2, 
         '["inappropriate_content"]'::jsonb, 78, 
         'This is a sample post that was flagged for review...', 'pending'),
        ('challenge', gen_random_uuid(), ${session.user.id}, 5, 
         '["spam"]'::jsonb, 65, 
         'Sample challenge description that needs moderation...', 'pending')
      ON CONFLICT DO NOTHING
    `

    // Insert sample data into user_reports
    await sql`
      INSERT INTO user_reports (
        reporter_id, reported_user_id, reported_content_type, 
        reported_content_id, report_reason, report_details, status
      ) VALUES 
        (${session.user.id}, ${session.user.id}, 'post', 
         gen_random_uuid(), 'harassment', 
         'This is a sample report for testing purposes', 'pending')
      ON CONFLICT DO NOTHING
    `

    return NextResponse.json({
      success: true,
      message: 'Sample moderation data inserted successfully'
    })

  } catch (error) {
    console.error('Failed to insert test data:', error)
    return NextResponse.json({ 
      error: 'Failed to insert test data',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
} 