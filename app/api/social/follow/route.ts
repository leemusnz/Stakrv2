import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'

// POST - Follow/Unfollow a user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { targetUserId, action } = body

    if (!targetUserId || !action) {
      return NextResponse.json({ error: 'Target user ID and action are required' }, { status: 400 })
    }

    if (!['follow', 'unfollow'].includes(action)) {
      return NextResponse.json({ error: 'Action must be "follow" or "unfollow"' }, { status: 400 })
    }

    if (targetUserId === session.user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    const sql = await createDbConnection()

    // Check if target user exists
    const targetUser = await sql`
      SELECT id, name FROM users WHERE id = ${targetUserId}
    `

    if (targetUser.length === 0) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    if (action === 'follow') {
      // Follow user (insert relationship)
      try {
        await sql`
          INSERT INTO social_follows (follower_id, following_id)
          VALUES (${session.user.id}, ${targetUserId})
          ON CONFLICT (follower_id, following_id) DO NOTHING
        `

        return NextResponse.json({
          success: true,
          action: 'followed',
          targetUser: {
            id: targetUser[0].id,
            name: targetUser[0].name
          },
          message: `You are now following ${targetUser[0].name}`
        })

      } catch (error) {
        console.error('Follow error:', error)
        return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 })
      }

    } else {
      // Unfollow user (delete relationship)
      const result = await sql`
        DELETE FROM social_follows 
        WHERE follower_id = ${session.user.id} AND following_id = ${targetUserId}
      `

      return NextResponse.json({
        success: true,
        action: 'unfollowed',
        targetUser: {
          id: targetUser[0].id,
          name: targetUser[0].name
        },
        message: `You unfollowed ${targetUser[0].name}`
      })
    }

  } catch (error) {
    console.error('Follow/unfollow error:', error)
    return NextResponse.json({ 
      error: 'Failed to process follow request',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// GET - Get follow relationships for a user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || session.user.id
    const type = searchParams.get('type') || 'both' // followers, following, both
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const sql = await createDbConnection()

    let followers: any[] = []
    let following: any[] = []

    if (type === 'followers' || type === 'both') {
      // Get followers
      followers = await sql`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.avatar_url,
          u.verification_tier,
          u.trust_score,
          u.current_streak,
          sf.created_at as followed_since,
          EXISTS(
            SELECT 1 FROM social_follows sf2 
            WHERE sf2.follower_id = ${session.user.id} AND sf2.following_id = u.id
          ) as is_following_back
        FROM social_follows sf
        JOIN users u ON sf.follower_id = u.id
        WHERE sf.following_id = ${userId}
        ORDER BY sf.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    if (type === 'following' || type === 'both') {
      // Get following
      following = await sql`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.avatar_url,
          u.verification_tier,
          u.trust_score,
          u.current_streak,
          sf.created_at as followed_since,
          EXISTS(
            SELECT 1 FROM social_follows sf2 
            WHERE sf2.follower_id = u.id AND sf2.following_id = ${session.user.id}
          ) as is_following_back
        FROM social_follows sf
        JOIN users u ON sf.following_id = u.id
        WHERE sf.follower_id = ${userId}
        ORDER BY sf.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    // Get counts
    const counts = await sql`
      SELECT 
        (SELECT COUNT(*) FROM social_follows WHERE following_id = ${userId}) as followers_count,
        (SELECT COUNT(*) FROM social_follows WHERE follower_id = ${userId}) as following_count
    `

    return NextResponse.json({
      success: true,
      data: {
        followers: followers.map(formatUser),
        following: following.map(formatUser),
        counts: {
          followers: parseInt(counts[0]?.followers_count || '0'),
          following: parseInt(counts[0]?.following_count || '0')
        }
      },
      pagination: {
        page,
        limit,
        hasMore: Math.max(followers.length, following.length) === limit
      }
    })

  } catch (error) {
    console.error('Get follow data error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch follow data',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

function formatUser(user: any) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar_url,
    verified: user.verification_tier === 'gold',
    trustScore: user.trust_score || 50,
    currentStreak: user.current_streak || 0,
    followedSince: user.followed_since,
    isFollowingBack: user.is_following_back
  }
}
