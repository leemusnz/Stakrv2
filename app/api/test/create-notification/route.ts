import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createNotification, NotificationData } from '@/lib/notification-service'

/**
 * POST /api/test/create-notification
 * Test endpoint to create a notification for the current user
 * Only works in development mode
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ 
      error: 'This endpoint is only available in development mode' 
    }, { status: 403 })
  }

  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { type = 'system', title, message, actionUrl } = body

    if (!title || !message) {
      return NextResponse.json({ 
        error: 'Title and message are required' 
      }, { status: 400 })
    }

    const notificationData: NotificationData = {
      userId: session.user.id,
      type: type as any,
      title,
      message,
      actionUrl,
      sendEmail: false
    }

    const result = await createNotification(notificationData)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test notification created',
        notificationId: result.notificationId
      })
    } else {
      return NextResponse.json({ 
        error: 'Failed to create notification' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Failed to create test notification:', error)
    return NextResponse.json({ 
      error: 'Failed to create test notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET /api/test/create-notification
 * Quick test - creates a random notification
 */
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ 
      error: 'This endpoint is only available in development mode' 
    }, { status: 403 })
  }

  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    const testNotifications = [
      {
        type: 'challenge',
        title: '🎯 Challenge Starting Soon',
        message: 'Your "30-Day Fitness Challenge" starts in 2 hours!',
        actionUrl: '/my-challenges'
      },
      {
        type: 'reward',
        title: '🎉 You Earned a Reward!',
        message: 'Congratulations! You earned $25.00 for completing "Morning Meditation"',
        actionUrl: '/wallet'
      },
      {
        type: 'verification',
        title: '📸 Proof Needed',
        message: 'Time to submit your proof for today\'s challenge!',
        actionUrl: '/my-challenges'
      },
      {
        type: 'social',
        title: '👥 New Follower',
        message: 'Alex started following your challenges',
        actionUrl: '/social'
      },
      {
        type: 'system',
        title: '🔔 System Update',
        message: 'New features available! Check out the latest improvements.',
        actionUrl: '/dashboard'
      }
    ]

    const randomNotification = testNotifications[Math.floor(Math.random() * testNotifications.length)]

    const notificationData: NotificationData = {
      userId: session.user.id,
      type: randomNotification.type as any,
      title: randomNotification.title,
      message: randomNotification.message,
      actionUrl: randomNotification.actionUrl,
      sendEmail: false
    }

    const result = await createNotification(notificationData)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Random test notification created',
        notification: randomNotification,
        notificationId: result.notificationId
      })
    } else {
      return NextResponse.json({ 
        error: 'Failed to create notification' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Failed to create test notification:', error)
    return NextResponse.json({ 
      error: 'Failed to create test notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

