import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { shouldUseDemoData, createDemoResponse } from '@/lib/demo-mode'

/**
 * GET /api/user/notifications
 * Fetch user's notifications from database
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
        notifications: [
          {
            id: 'demo-1',
            type: 'system',
            title: 'Welcome to Stakr Demo! 🎉',
            message: 'This is a demo notification. Real notifications will appear here.',
            action_url: '/discover',
            read: false,
            metadata: {},
            created_at: new Date().toISOString()
          },
          {
            id: 'demo-2',
            type: 'challenge',
            title: 'Demo Challenge Starting Soon',
            message: 'Your demo challenge starts in 2 days!',
            action_url: '/my-challenges',
            read: false,
            metadata: {},
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          }
        ],
        unread_count: 2
      }, request, session))
    }

    const sql = createDbConnection()
    
    // Get user's notifications with proper ordering
    const notifications = await sql`
      SELECT 
        id,
        type,
        title,
        message,
        action_url,
        read,
        metadata,
        created_at
      FROM notifications
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC
      LIMIT 100
    `

    const unreadCount = await sql`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ${session.user.id} AND read = false
    `

    return NextResponse.json({
      success: true,
      notifications: notifications.map((n: any) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        actionUrl: n.action_url,
        read: n.read,
        metadata: n.metadata || {},
        timestamp: n.created_at
      })),
      unread_count: parseInt(unreadCount[0]?.count || '0')
    })

  } catch (error) {
    console.error('❌ Failed to fetch notifications:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch notifications',
      details: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : 'Unknown error') 
        : undefined
    }, { status: 500 })
  }
}

/**
 * PATCH /api/user/notifications
 * Mark all notifications as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    // Demo mode - just return success
    if (shouldUseDemoData(request, session)) {
      return NextResponse.json(createDemoResponse({
        success: true,
        message: 'All notifications marked as read (demo mode)'
      }, request, session))
    }

    const sql = createDbConnection()
    
    // Mark all notifications as read for this user
    await sql`
      UPDATE notifications
      SET read = true
      WHERE user_id = ${session.user.id} AND read = false
    `

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read'
    })

  } catch (error) {
    console.error('❌ Failed to mark notifications as read:', error)
    return NextResponse.json({ 
      error: 'Failed to mark notifications as read',
      details: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : 'Unknown error') 
        : undefined
    }, { status: 500 })
  }
}

/**
 * DELETE /api/user/notifications
 * Delete all read notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    // Demo mode - just return success
    if (shouldUseDemoData(request, session)) {
      return NextResponse.json(createDemoResponse({
        success: true,
        message: 'Read notifications deleted (demo mode)'
      }, request, session))
    }

    const sql = createDbConnection()
    
    // Delete all read notifications for this user
    const result = await sql`
      DELETE FROM notifications
      WHERE user_id = ${session.user.id} AND read = true
      RETURNING id
    `

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.length} read notifications`
    })

  } catch (error) {
    console.error('❌ Failed to delete notifications:', error)
    return NextResponse.json({ 
      error: 'Failed to delete notifications',
      details: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : 'Unknown error') 
        : undefined
    }, { status: 500 })
  }
}

