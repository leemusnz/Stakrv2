import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { shouldUseDemoData, createDemoResponse } from '@/lib/demo-mode'

/**
 * PATCH /api/user/notifications/[id]
 * Mark a specific notification as read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    const notificationId = params.id

    // Demo mode - just return success
    if (shouldUseDemoData(request, session)) {
      return NextResponse.json(createDemoResponse({
        success: true,
        message: 'Notification marked as read (demo mode)'
      }, request, session))
    }

    const sql = await createDbConnection()
    
    // Mark specific notification as read (ensure it belongs to the user)
    const result = await sql`
      UPDATE notifications
      SET read = true
      WHERE id = ${notificationId} AND user_id = ${session.user.id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ 
        error: 'Notification not found' 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read'
    })

  } catch (error) {
    console.error('❌ Failed to mark notification as read:', error)
    return NextResponse.json({ 
      error: 'Failed to mark notification as read',
      details: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : 'Unknown error') 
        : undefined
    }, { status: 500 })
  }
}

/**
 * DELETE /api/user/notifications/[id]
 * Delete a specific notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    const notificationId = params.id

    // Demo mode - just return success
    if (shouldUseDemoData(request, session)) {
      return NextResponse.json(createDemoResponse({
        success: true,
        message: 'Notification deleted (demo mode)'
      }, request, session))
    }

    const sql = await createDbConnection()
    
    // Delete specific notification (ensure it belongs to the user)
    const result = await sql`
      DELETE FROM notifications
      WHERE id = ${notificationId} AND user_id = ${session.user.id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ 
        error: 'Notification not found' 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted'
    })

  } catch (error) {
    console.error('❌ Failed to delete notification:', error)
    return NextResponse.json({ 
      error: 'Failed to delete notification',
      details: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : 'Unknown error') 
        : undefined
    }, { status: 500 })
  }
}

