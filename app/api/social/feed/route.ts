import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all' // all, friends, following, trending
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const sql = await createDbConnection()
    const userId = session.user.id

    let feedQuery: any
    let feedParams: any[] = [limit, offset]

    if (filter === 'following') {
      // Show feed from users the current user follows
      feedQuery = sql`
        SELECT 
          sfi.id,
          sfi.activity_type,
          sfi.title,
          sfi.description,
          sfi.challenge_id,
          sfi.metadata,
          sfi.is_trending,
          sfi.likes_count,
          sfi.comments_count,
          sfi.shares_count,
          sfi.created_at,
          u.id as user_id,
          u.name as user_name,
          u.email as user_email,
          u.avatar_url as user_avatar,
          u.verification_tier,
          c.title as challenge_title,
          EXISTS(
            SELECT 1 FROM social_feed_likes sfl 
            WHERE sfl.feed_item_id = sfi.id AND sfl.user_id = ${userId}
          ) as user_liked,
          EXISTS(
            SELECT 1 FROM social_follows sf 
            WHERE sf.follower_id = ${userId} AND sf.following_id = u.id
          ) as user_following
        FROM social_feed_items sfi
        JOIN users u ON sfi.user_id = u.id
        LEFT JOIN challenges c ON sfi.challenge_id = c.id
        WHERE EXISTS(
          SELECT 1 FROM social_follows sf 
          WHERE sf.follower_id = ${userId} AND sf.following_id = sfi.user_id
        )
        ORDER BY sfi.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (filter === 'trending') {
      // Show trending items
      feedQuery = sql`
        SELECT 
          sfi.id,
          sfi.activity_type,
          sfi.title,
          sfi.description,
          sfi.challenge_id,
          sfi.metadata,
          sfi.is_trending,
          sfi.likes_count,
          sfi.comments_count,
          sfi.shares_count,
          sfi.created_at,
          u.id as user_id,
          u.name as user_name,
          u.email as user_email,
          u.avatar_url as user_avatar,
          u.verification_tier,
          c.title as challenge_title,
          EXISTS(
            SELECT 1 FROM social_feed_likes sfl 
            WHERE sfl.feed_item_id = sfi.id AND sfl.user_id = ${userId}
          ) as user_liked,
          EXISTS(
            SELECT 1 FROM social_follows sf 
            WHERE sf.follower_id = ${userId} AND sf.following_id = u.id
          ) as user_following
        FROM social_feed_items sfi
        JOIN users u ON sfi.user_id = u.id
        LEFT JOIN challenges c ON sfi.challenge_id = c.id
        WHERE (
          sfi.is_trending = true 
          OR sfi.likes_count > 10 
          OR sfi.created_at > NOW() - INTERVAL '24 hours'
        )
        ORDER BY sfi.likes_count DESC, sfi.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (filter === 'friends') {
      // For now, friends = following (can be extended later)
      feedQuery = sql`
        SELECT 
          sfi.id,
          sfi.activity_type,
          sfi.title,
          sfi.description,
          sfi.challenge_id,
          sfi.metadata,
          sfi.is_trending,
          sfi.likes_count,
          sfi.comments_count,
          sfi.shares_count,
          sfi.created_at,
          u.id as user_id,
          u.name as user_name,
          u.email as user_email,
          u.avatar_url as user_avatar,
          u.verification_tier,
          c.title as challenge_title,
          EXISTS(
            SELECT 1 FROM social_feed_likes sfl 
            WHERE sfl.feed_item_id = sfi.id AND sfl.user_id = ${userId}
          ) as user_liked,
          EXISTS(
            SELECT 1 FROM social_follows sf 
            WHERE sf.follower_id = ${userId} AND sf.following_id = u.id
          ) as user_following
        FROM social_feed_items sfi
        JOIN users u ON sfi.user_id = u.id
        LEFT JOIN challenges c ON sfi.challenge_id = c.id
        WHERE EXISTS(
          SELECT 1 FROM social_follows sf 
          WHERE sf.follower_id = ${userId} AND sf.following_id = sfi.user_id
        )
        ORDER BY sfi.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      // Show all feed items
      feedQuery = sql`
        SELECT 
          sfi.id,
          sfi.activity_type,
          sfi.title,
          sfi.description,
          sfi.challenge_id,
          sfi.metadata,
          sfi.is_trending,
          sfi.likes_count,
          sfi.comments_count,
          sfi.shares_count,
          sfi.created_at,
          u.id as user_id,
          u.name as user_name,
          u.email as user_email,
          u.avatar_url as user_avatar,
          u.verification_tier,
          c.title as challenge_title,
          EXISTS(
            SELECT 1 FROM social_feed_likes sfl 
            WHERE sfl.feed_item_id = sfi.id AND sfl.user_id = ${userId}
          ) as user_liked,
          EXISTS(
            SELECT 1 FROM social_follows sf 
            WHERE sf.follower_id = ${userId} AND sf.following_id = u.id
          ) as user_following
        FROM social_feed_items sfi
        JOIN users u ON sfi.user_id = u.id
        LEFT JOIN challenges c ON sfi.challenge_id = c.id
        ORDER BY sfi.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    const feedItems = await feedQuery

    // Format feed items to match frontend expectations
    const formattedItems = feedItems.map((item: any) => ({
      id: item.id,
      type: item.activity_type,
      user: {
        id: item.user_id,
        name: item.user_name,
        email: item.user_email,
        avatar: item.user_avatar,
        verified: item.verification_tier === 'gold',
        isFollowing: item.user_following
      },
      timestamp: formatTimestamp(item.created_at),
      content: {
        title: item.title,
        description: item.description,
        challenge: item.challenge_title,
        ...parseMetadata(item.metadata, item.activity_type)
      },
      engagement: {
        likes: item.likes_count,
        comments: item.comments_count,
        shares: item.shares_count,
        liked: item.user_liked
      },
      trending: item.is_trending
    }))

    return NextResponse.json({
      success: true,
      items: formattedItems,
      pagination: {
        page,
        limit,
        hasMore: feedItems.length === limit
      }
    })

  } catch (error) {
    console.error('Social feed error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch social feed',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// POST endpoint for creating feed items
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { activityType, title, description, challengeId, metadata } = body

    if (!activityType || !title) {
      return NextResponse.json({ error: 'Activity type and title are required' }, { status: 400 })
    }

    const sql = await createDbConnection()

    // Create the feed item
    const feedItem = await sql`
      SELECT create_social_feed_item(
        ${session.user.id}::uuid,
        ${activityType},
        ${title},
        ${description || null},
        ${challengeId || null}::uuid,
        ${JSON.stringify(metadata || {})}::jsonb
      ) as id
    `

    return NextResponse.json({
      success: true,
      feedItemId: feedItem[0].id,
      message: 'Feed item created successfully'
    })

  } catch (error) {
    console.error('Create feed item error:', error)
    return NextResponse.json({ 
      error: 'Failed to create feed item',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// Helper functions
function formatTimestamp(timestamp: string): string {
  const now = new Date()
  const past = new Date(timestamp)
  const diffMs = now.getTime() - past.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    return `${Math.max(1, diffMinutes)} minute${diffMinutes > 1 ? 's' : ''} ago`
  }
}

function parseMetadata(metadata: any, activityType: string): any {
  if (!metadata) return {}

  const parsed = typeof metadata === 'string' ? JSON.parse(metadata) : metadata

  // Extract relevant data based on activity type
  const result: any = {}

  if (parsed.reward_amount) {
    result.amount = parseFloat(parsed.reward_amount)
  }

  if (parsed.streak_length) {
    result.streak = parseInt(parsed.streak_length)
  }

  if (parsed.participants_count) {
    result.participants = parseInt(parsed.participants_count)
  }

  if (parsed.challenge_category) {
    result.category = parsed.challenge_category
  }

  return result
} 