import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'

// POST - Like/Unlike a feed item
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { feedItemId, action } = body

    if (!feedItemId || !action) {
      return NextResponse.json({ error: 'Feed item ID and action are required' }, { status: 400 })
    }

    if (!['like', 'unlike'].includes(action)) {
      return NextResponse.json({ error: 'Action must be "like" or "unlike"' }, { status: 400 })
    }

    const sql = createDbConnection()

    // Check if feed item exists
    const feedItem = await sql`
      SELECT id, title, likes_count FROM social_feed_items WHERE id = ${feedItemId}
    `

    if (feedItem.length === 0) {
      return NextResponse.json({ error: 'Feed item not found' }, { status: 404 })
    }

    if (action === 'like') {
      // Like the item (insert like relationship)
      try {
        await sql`
          INSERT INTO social_feed_likes (user_id, feed_item_id)
          VALUES (${session.user.id}, ${feedItemId})
          ON CONFLICT (user_id, feed_item_id) DO NOTHING
        `

        // Get updated like count
        const updatedItem = await sql`
          SELECT likes_count FROM social_feed_items WHERE id = ${feedItemId}
        `

        return NextResponse.json({
          success: true,
          action: 'liked',
          feedItemId,
          likesCount: updatedItem[0].likes_count,
          message: 'Item liked successfully'
        })

      } catch (error) {
        console.error('Like error:', error)
        return NextResponse.json({ error: 'Failed to like item' }, { status: 500 })
      }

    } else {
      // Unlike the item (delete like relationship)
      await sql`
        DELETE FROM social_feed_likes 
        WHERE user_id = ${session.user.id} AND feed_item_id = ${feedItemId}
      `

      // Get updated like count
      const updatedItem = await sql`
        SELECT likes_count FROM social_feed_items WHERE id = ${feedItemId}
      `

      return NextResponse.json({
        success: true,
        action: 'unliked',
        feedItemId,
        likesCount: updatedItem[0].likes_count,
        message: 'Item unliked successfully'
      })
    }

  } catch (error) {
    console.error('Like/unlike error:', error)
    return NextResponse.json({ 
      error: 'Failed to process like request',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// GET - Get likes for a feed item
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const feedItemId = searchParams.get('feedItemId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    if (!feedItemId) {
      return NextResponse.json({ error: 'Feed item ID is required' }, { status: 400 })
    }

    const sql = createDbConnection()

    // Get users who liked this item
    const likes = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.avatar_url,
        u.verification_tier,
        sfl.created_at as liked_at
      FROM social_feed_likes sfl
      JOIN users u ON sfl.user_id = u.id
      WHERE sfl.feed_item_id = ${feedItemId}
      ORDER BY sfl.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as total FROM social_feed_likes WHERE feed_item_id = ${feedItemId}
    `

    return NextResponse.json({
      success: true,
      data: {
        likes: likes.map((like: any) => ({
          user: {
            id: like.id,
            name: like.name,
            email: like.email,
            avatar: like.avatar_url,
            verified: like.verification_tier === 'gold'
          },
          likedAt: like.liked_at
        })),
        totalCount: parseInt(countResult[0].total)
      },
      pagination: {
        page,
        limit,
        hasMore: likes.length === limit
      }
    })

  } catch (error) {
    console.error('Get likes error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch likes',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
