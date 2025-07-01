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
    
    // Fetch real moderation queue items from database
    const queueItems = await sql`
      SELECT 
        mq.id,
        mq.content_type as "contentType",
        mq.content_id as "contentId", 
        mq.user_id as "userId",
        mq.priority,
        mq.flagged_reasons as "flaggedReasons",
        mq.ai_confidence as "aiConfidence",
        mq.content_preview as "contentPreview",
        mq.content_url as "contentUrl",
        mq.status,
        mq.auto_flagged_at as "autoFlaggedAt",
        u.name as "userName",
        u.email as "userEmail",
        u.avatar_url as "userAvatar"
      FROM moderation_queue mq
      LEFT JOIN users u ON mq.user_id = u.id
      WHERE mq.status IN ('pending', 'reviewing')
      ORDER BY mq.priority ASC, mq.created_at ASC
      LIMIT 50
    `

    // Format the data to match expected structure
    const formattedItems = queueItems.map(item => ({
      id: item.id,
      contentType: item.contentType,
      contentId: item.contentId,
      userId: item.userId,
      priority: item.priority,
      flaggedReasons: item.flaggedReasons || [],
      aiConfidence: item.aiConfidence,
      contentPreview: item.contentPreview,
      contentUrl: item.contentUrl,
      status: item.status,
      autoFlaggedAt: item.autoFlaggedAt,
      userInfo: {
        name: item.userName || 'Unknown User',
        email: item.userEmail || '',
        avatar: item.userAvatar
      }
    }))

    return NextResponse.json({
      success: true,
      items: formattedItems,
      count: formattedItems.length
    })

  } catch (error) {
    console.error('Failed to load moderation queue:', error)
    return NextResponse.json({ 
      error: 'Failed to load moderation queue',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
} 