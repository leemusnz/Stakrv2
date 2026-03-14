import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { itemId, decision, notes } = body

    if (!itemId || !decision) {
      return NextResponse.json({ error: 'Item ID and decision are required' }, { status: 400 })
    }

    if (!['approve', 'reject'].includes(decision)) {
      return NextResponse.json({ error: 'Decision must be approve or reject' }, { status: 400 })
    }

    const sql = await createDbConnection()
    
    // Get the queue item details first
    const queueItem = await sql`
      SELECT content_type, content_id, user_id 
      FROM moderation_queue 
      WHERE id = ${itemId}
    `

    if (queueItem.length === 0) {
      return NextResponse.json({ error: 'Moderation item not found' }, { status: 404 })
    }

    const { content_type, content_id, user_id } = queueItem[0]

    // Update the moderation queue
    await sql`
      UPDATE moderation_queue 
      SET 
        status = ${decision === 'approve' ? 'approved' : 'rejected'},
        assigned_moderator_id = ${session.user.id},
        moderator_decision = ${decision},
        moderator_notes = ${notes || null},
        reviewed_at = NOW()
      WHERE id = ${itemId}
    `

    // Update the content status based on content type
    const contentStatus = decision === 'approve' ? 'approved' : 'rejected'
    
    try {
      if (content_type === 'post') {
        await sql`
          UPDATE user_posts 
          SET moderation_status = ${contentStatus}
          WHERE id = ${content_id}
        `
      } else if (content_type === 'challenge') {
        await sql`
          UPDATE challenges 
          SET moderation_status = ${contentStatus}
          WHERE id = ${content_id}
        `
      } else if (content_type === 'profile') {
        await sql`
          UPDATE users 
          SET moderation_status = ${contentStatus}
          WHERE id = ${content_id}
        `
      }
    } catch (error) {
      console.warn(`Could not update content status for ${content_type}:`, error)
    }

    // Log the decision in moderation_logs (map content types to valid values)
    const logContentType = content_type === 'post' || content_type === 'challenge' || content_type === 'profile' ? 'text' : content_type
    
    await sql`
      INSERT INTO moderation_logs (
        content_hash, content_type, context, service, flagged, 
        action, details, created_at
      ) VALUES (
        ${content_id}, ${logContentType}, 'admin_review', 'manual_review', 
        ${decision === 'reject'}, ${decision}, 
        ${JSON.stringify({ moderator: session.user.email, notes, itemId, originalContentType: content_type })}, 
        NOW()
      )
    `

    if (notes) {
    }

    return NextResponse.json({
      success: true,
      message: `Content ${decision}d successfully`,
      itemId: itemId
    })

  } catch (error) {
    console.error('Failed to process moderation decision:', error)
    return NextResponse.json({ 
      error: 'Failed to process moderation decision',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
