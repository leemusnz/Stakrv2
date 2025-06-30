import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { isDemoUser } from '@/lib/demo-data'

interface CreatePostRequest {
  content: string
  isPublic: boolean
  challengeId?: string
  includeStats: boolean
  includeChallenge: boolean
  attachedImage?: string
  postType: 'general' | 'proof_submission' | 'milestone' | 'achievement'
}

// CREATE a new post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body: CreatePostRequest = await request.json()
    const { 
      content, 
      isPublic, 
      challengeId, 
      includeStats, 
      includeChallenge, 
      attachedImage,
      postType 
    } = body

    // Validate content
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Post content is required' }, { status: 400 })
    }

    if (content.length > 500) {
      return NextResponse.json({ error: 'Post content too long (max 500 characters)' }, { status: 400 })
    }

    // Demo user handling
    if (isDemoUser(session.user.id)) {
      return handleDemoPost(session.user, body)
    }

    // Real user handling
    const sql = await createDbConnection()
    
    // Get user stats if requested
    let userStats = null
    if (includeStats) {
      userStats = await getUserStats(sql, session.user.id)
    }

    // Get challenge info if requested
    let challengeInfo = null
    if (includeChallenge && challengeId) {
      challengeInfo = await getChallengeInfo(sql, challengeId)
    }

    // Create the post
    const post = await sql`
      INSERT INTO user_posts (
        user_id, content, is_public, challenge_id, post_type,
        include_stats, include_challenge, attached_image, created_at
      ) VALUES (
        ${session.user.id}, ${content.trim()}, ${isPublic}, ${challengeId || null},
        ${postType}, ${includeStats}, ${includeChallenge}, ${attachedImage || null}, NOW()
      )
      RETURNING id, created_at
    `

    // Get user info for response
    const userInfo = await sql`
      SELECT name, avatar_url FROM users WHERE id = ${session.user.id}
    `

    const postData = {
      id: post[0].id,
      content: content.trim(),
      isPublic,
      challengeId: challengeId || null,
      postType,
      includeStats,
      includeChallenge,
      attachedImage: attachedImage || null,
      createdAt: post[0].created_at,
      user: {
        id: session.user.id,
        name: userInfo[0]?.name || 'Unknown User',
        avatar: userInfo[0]?.avatar_url || null
      },
      stats: userStats,
      challenge: challengeInfo,
      engagement: {
        likes: 0,
        comments: 0,
        shares: 0
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Post created successfully',
      post: postData
    }, { status: 201 })

  } catch (error) {
    console.error('Post creation error:', error)
    return NextResponse.json({
      error: 'Failed to create post',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// GET posts (feed)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') // For profile posts
    const challengeId = searchParams.get('challengeId') // For challenge posts
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Demo user handling
    if (isDemoUser(session.user.id)) {
      return handleDemoGetPosts(userId, challengeId, limit, offset)
    }

    // Real user handling
    const sql = await createDbConnection()
    
    // Build query based on filters
    let posts
    
    if (userId) {
      // Get user's posts (both public and private if it's their own profile)
      posts = await sql`
        SELECT 
          p.*,
          u.name as user_name,
          u.avatar_url as user_avatar,
          c.title as challenge_title,
          c.category as challenge_category,
          COUNT(DISTINCT pl.id) as likes_count,
          COUNT(DISTINCT pc.id) as comments_count
        FROM user_posts p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN challenges c ON p.challenge_id = c.id
        LEFT JOIN post_likes pl ON p.id = pl.post_id
        LEFT JOIN post_comments pc ON p.id = pc.post_id
        WHERE p.user_id = ${userId}
        GROUP BY p.id, u.name, u.avatar_url, c.title, c.category
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (challengeId) {
      // Get challenge-specific posts
      posts = await sql`
        SELECT 
          p.*,
          u.name as user_name,
          u.avatar_url as user_avatar,
          c.title as challenge_title,
          c.category as challenge_category,
          COUNT(DISTINCT pl.id) as likes_count,
          COUNT(DISTINCT pc.id) as comments_count
        FROM user_posts p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN challenges c ON p.challenge_id = c.id
        LEFT JOIN post_likes pl ON p.id = pl.post_id
        LEFT JOIN post_comments pc ON p.id = pc.post_id
        WHERE p.challenge_id = ${challengeId} AND p.is_public = TRUE
        GROUP BY p.id, u.name, u.avatar_url, c.title, c.category
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      // Get general public feed
      posts = await sql`
        SELECT 
          p.*,
          u.name as user_name,
          u.avatar_url as user_avatar,
          c.title as challenge_title,
          c.category as challenge_category,
          COUNT(DISTINCT pl.id) as likes_count,
          COUNT(DISTINCT pc.id) as comments_count
        FROM user_posts p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN challenges c ON p.challenge_id = c.id
        LEFT JOIN post_likes pl ON p.id = pl.post_id
        LEFT JOIN post_comments pc ON p.id = pc.post_id
        WHERE p.is_public = TRUE
        GROUP BY p.id, u.name, u.avatar_url, c.title, c.category
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    const formattedPosts = posts.map(post => ({
      id: post.id,
      content: post.content,
      isPublic: post.is_public,
      postType: post.post_type,
      attachedImage: post.attached_image,
      createdAt: post.created_at,
      user: {
        id: post.user_id,
        name: post.user_name,
        avatar: post.user_avatar
      },
      challenge: post.challenge_title ? {
        id: post.challenge_id,
        title: post.challenge_title,
        category: post.challenge_category
      } : null,
      engagement: {
        likes: parseInt(post.likes_count) || 0,
        comments: parseInt(post.comments_count) || 0,
        shares: 0 // Would need separate table for shares
      }
    }))

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
      pagination: {
        limit,
        offset,
        hasMore: posts.length === limit
      }
    })

  } catch (error) {
    console.error('Get posts error:', error)
    return NextResponse.json({
      error: 'Failed to get posts',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// Helper functions
async function getUserStats(sql: any, userId: string) {
  try {
    const stats = await sql`
      SELECT 
        COUNT(DISTINCT cp.challenge_id) as challenges_completed,
        ROUND(AVG(CASE WHEN cp.completion_status = 'completed' THEN 100 ELSE 0 END)) as success_rate,
        7 as current_streak -- Would calculate from daily completions
      FROM challenge_participants cp
      WHERE cp.user_id = ${userId}
      AND cp.completion_status IN ('completed', 'failed')
    `

    return {
      challengesCompleted: parseInt(stats[0]?.challenges_completed) || 0,
      successRate: parseInt(stats[0]?.success_rate) || 0,
      currentStreak: parseInt(stats[0]?.current_streak) || 0
    }
  } catch (error) {
    console.error('Error getting user stats:', error)
    return null
  }
}

async function getChallengeInfo(sql: any, challengeId: string) {
  try {
    const challenge = await sql`
      SELECT title, category, duration FROM challenges 
      WHERE id = ${challengeId}
    `

    if (challenge.length > 0) {
      return {
        title: challenge[0].title,
        category: challenge[0].category,
        duration: challenge[0].duration
      }
    }
    return null
  } catch (error) {
    console.error('Error getting challenge info:', error)
    return null
  }
}

// Demo implementations
function handleDemoPost(user: any, body: CreatePostRequest) {
  const demoPost = {
    id: `demo-post-${Date.now()}`,
    content: body.content,
    isPublic: body.isPublic,
    challengeId: body.challengeId || null,
    postType: body.postType,
    attachedImage: body.attachedImage || null,
    createdAt: new Date().toISOString(),
    user: {
      id: user.id,
      name: user.name || 'Demo User',
      avatar: user.avatar || null
    },
    stats: body.includeStats ? {
      challengesCompleted: 15,
      successRate: 85,
      currentStreak: 12
    } : null,
    challenge: body.includeChallenge && body.challengeId ? {
      title: 'Demo Challenge',
      category: 'Fitness',
      duration: '30 days'
    } : null,
    engagement: {
      likes: 0,
      comments: 0,
      shares: 0
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Post created successfully (Demo Mode)',
    post: demoPost
  }, { status: 201 })
}

function handleDemoGetPosts(userId?: string | null, challengeId?: string | null, limit: number = 20, offset: number = 0) {
  const demoPosts = [
    {
      id: 'demo-post-1',
      content: 'Just completed day 15 of my fitness challenge! Feeling stronger every day 💪 #StakrChallenge #Fitness',
      isPublic: true,
      postType: 'proof_submission',
      attachedImage: null,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      user: {
        id: 'demo-user-1',
        name: 'Fitness Enthusiast',
        avatar: '/avatars/avatar-1.svg'
      },
      challenge: {
        id: 'demo-challenge-1',
        title: '30-Day Fitness Challenge',
        category: 'Fitness'
      },
      engagement: {
        likes: 12,
        comments: 3,
        shares: 2
      }
    },
    {
      id: 'demo-post-2',
      content: 'My Stakr journey so far: 15 challenges completed, 85% success rate, and a 12-day streak! 📈',
      isPublic: true,
      postType: 'general',
      attachedImage: null,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      user: {
        id: 'demo-user-2',
        name: 'Goal Achiever',
        avatar: '/avatars/avatar-2.svg'
      },
      challenge: null,
      engagement: {
        likes: 24,
        comments: 8,
        shares: 5
      }
    }
  ]

  return NextResponse.json({
    success: true,
    posts: demoPosts.slice(offset, offset + limit),
    pagination: {
      limit,
      offset,
      hasMore: offset + limit < demoPosts.length
    }
  })
} 