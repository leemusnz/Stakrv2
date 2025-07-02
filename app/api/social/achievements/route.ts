import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'

// GET - Get user achievements
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || session.user.id
    const category = searchParams.get('category') // optional: consistency, completion, performance, social

    const sql = await createDbConnection()

    let achievementsQuery = sql`
      SELECT 
        ua.id,
        ua.achievement_type,
        ua.title,
        ua.description,
        ua.icon,
        ua.category,
        ua.earned_at,
        ua.metadata,
        ua.is_hidden
      FROM user_achievements ua
      WHERE ua.user_id = ${userId}
      AND ua.is_hidden = FALSE
    `

    if (category) {
      achievementsQuery = sql`
        SELECT 
          ua.id,
          ua.achievement_type,
          ua.title,
          ua.description,
          ua.icon,
          ua.category,
          ua.earned_at,
          ua.metadata,
          ua.is_hidden
        FROM user_achievements ua
        WHERE ua.user_id = ${userId}
        AND ua.category = ${category}
        AND ua.is_hidden = FALSE
      `
    }

    achievementsQuery = sql`
      ${achievementsQuery}
      ORDER BY ua.earned_at DESC
    `

    const achievements = await achievementsQuery

    // Get achievement statistics
    const stats = await sql`
      SELECT 
        COUNT(*) as total_achievements,
        COUNT(CASE WHEN category = 'consistency' THEN 1 END) as consistency_achievements,
        COUNT(CASE WHEN category = 'completion' THEN 1 END) as completion_achievements,
        COUNT(CASE WHEN category = 'performance' THEN 1 END) as performance_achievements,
        COUNT(CASE WHEN category = 'social' THEN 1 END) as social_achievements
      FROM user_achievements
      WHERE user_id = ${userId} AND is_hidden = FALSE
    `

    return NextResponse.json({
      success: true,
      data: {
        achievements: achievements.map((achievement: any) => ({
          id: achievement.id,
          type: achievement.achievement_type,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category,
          earnedAt: achievement.earned_at,
          metadata: achievement.metadata
        })),
        stats: {
          total: parseInt(stats[0]?.total_achievements || '0'),
          byCategory: {
            consistency: parseInt(stats[0]?.consistency_achievements || '0'),
            completion: parseInt(stats[0]?.completion_achievements || '0'),
            performance: parseInt(stats[0]?.performance_achievements || '0'),
            social: parseInt(stats[0]?.social_achievements || '0')
          }
        }
      }
    })

  } catch (error) {
    console.error('Get achievements error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch achievements',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// POST - Award achievement to user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, achievementType, title, description, icon, category, metadata } = body

    // Only allow users to award achievements to themselves for now
    // In the future, this could be restricted to admin users or automated systems
    if (userId && userId !== session.user.id) {
      return NextResponse.json({ error: 'Can only award achievements to yourself' }, { status: 403 })
    }

    const targetUserId = userId || session.user.id

    if (!achievementType || !title || !description || !category) {
      return NextResponse.json({ 
        error: 'Achievement type, title, description, and category are required' 
      }, { status: 400 })
    }

    const sql = await createDbConnection()

    // Check if user already has this achievement
    const existingAchievement = await sql`
      SELECT id FROM user_achievements 
      WHERE user_id = ${targetUserId} AND achievement_type = ${achievementType}
    `

    if (existingAchievement.length > 0) {
      return NextResponse.json({ 
        error: 'User already has this achievement',
        achievementId: existingAchievement[0].id
      }, { status: 409 })
    }

    // Award the achievement
    const newAchievement = await sql`
      INSERT INTO user_achievements (
        user_id, achievement_type, title, description, icon, category, metadata
      ) VALUES (
        ${targetUserId},
        ${achievementType},
        ${title},
        ${description},
        ${icon || '🏆'},
        ${category},
        ${JSON.stringify(metadata || {})}
      ) RETURNING *
    `

    // Create a social feed item for the achievement
    await sql`
      SELECT create_social_feed_item(
        ${targetUserId}::uuid,
        'achievement',
        'Earned: ${title}',
        ${description},
        NULL::uuid,
        ${JSON.stringify({ 
          achievement_type: achievementType,
          achievement_category: category,
          ...metadata 
        })}::jsonb
      )
    `

    return NextResponse.json({
      success: true,
      achievement: {
        id: newAchievement[0].id,
        type: newAchievement[0].achievement_type,
        title: newAchievement[0].title,
        description: newAchievement[0].description,
        icon: newAchievement[0].icon,
        category: newAchievement[0].category,
        earnedAt: newAchievement[0].earned_at,
        metadata: newAchievement[0].metadata
      },
      message: 'Achievement awarded successfully'
    })

  } catch (error) {
    console.error('Award achievement error:', error)
    return NextResponse.json({ 
      error: 'Failed to award achievement',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// PUT - Check and award automatic achievements based on user progress
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const sql = await createDbConnection()
    const userId = session.user.id

    // Get current user stats
    const userStats = await sql`
      SELECT 
        u.current_streak,
        u.longest_streak,
        u.challenges_completed,
        u.trust_score,
        u.created_at,
        COALESCE(earnings.total_earnings, 0) as total_earnings,
        COALESCE(social_stats.followers_count, 0) as followers_count
      FROM users u
      LEFT JOIN (
        SELECT 
          user_id,
          SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_earnings
        FROM transactions 
        WHERE transaction_type IN ('reward', 'payout')
        GROUP BY user_id
      ) earnings ON u.id = earnings.user_id
      LEFT JOIN user_social_stats social_stats ON u.id = social_stats.user_id
      WHERE u.id = ${userId}
    `

    if (userStats.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const stats = userStats[0]
    const newAchievements = []

    // Define achievement criteria and check each one
    const achievementChecks = [
      {
        type: 'streak_master',
        condition: stats.current_streak >= 25,
        title: 'Streak Master',
        description: 'Maintained a 25+ day streak',
        icon: '🔥',
        category: 'consistency',
        metadata: { streak_length: stats.current_streak }
      },
      {
        type: 'streak_legend',
        condition: stats.current_streak >= 50,
        title: 'Streak Legend',
        description: 'Maintained a 50+ day streak',
        icon: '🔥',
        category: 'consistency',
        metadata: { streak_length: stats.current_streak }
      },
      {
        type: 'challenge_veteran',
        condition: stats.challenges_completed >= 10,
        title: 'Challenge Veteran',
        description: 'Completed 10+ challenges',
        icon: '🏆',
        category: 'completion',
        metadata: { challenges_completed: stats.challenges_completed }
      },
      {
        type: 'challenge_master',
        condition: stats.challenges_completed >= 25,
        title: 'Challenge Master',
        description: 'Completed 25+ challenges',
        icon: '👑',
        category: 'completion',
        metadata: { challenges_completed: stats.challenges_completed }
      },
      {
        type: 'top_performer',
        condition: stats.trust_score >= 90,
        title: 'Top Performer',
        description: 'Achieved 90+ trust score',
        icon: '⭐',
        category: 'performance',
        metadata: { trust_score: stats.trust_score }
      },
      {
        type: 'high_earner',
        condition: parseFloat(stats.total_earnings) >= 500,
        title: 'High Earner',
        description: 'Earned $500+ from challenges',
        icon: '💰',
        category: 'performance',
        metadata: { total_earnings: stats.total_earnings }
      },
      {
        type: 'social_butterfly',
        condition: stats.followers_count >= 10,
        title: 'Social Butterfly',
        description: 'Gained 10+ followers',
        icon: '🦋',
        category: 'social',
        metadata: { followers_count: stats.followers_count }
      },
      {
        type: 'early_adopter',
        condition: new Date(stats.created_at) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        title: 'Early Adopter',
        description: 'One of the first users to join Stakr',
        icon: '🚀',
        category: 'social',
        metadata: { join_date: stats.created_at }
      }
    ]

    // Check each achievement
    for (const achievement of achievementChecks) {
      if (achievement.condition) {
        // Check if user already has this achievement
        const existing = await sql`
          SELECT id FROM user_achievements 
          WHERE user_id = ${userId} AND achievement_type = ${achievement.type}
        `

        if (existing.length === 0) {
          // Award the achievement
          const newAchievement = await sql`
            INSERT INTO user_achievements (
              user_id, achievement_type, title, description, icon, category, metadata
            ) VALUES (
              ${userId},
              ${achievement.type},
              ${achievement.title},
              ${achievement.description},
              ${achievement.icon},
              ${achievement.category},
              ${JSON.stringify(achievement.metadata)}
            ) RETURNING *
          `

          // Create social feed item
          await sql`
            SELECT create_social_feed_item(
              ${userId}::uuid,
              'achievement',
              'Earned: ${achievement.title}',
              ${achievement.description},
              NULL::uuid,
              ${JSON.stringify({
                achievement_type: achievement.type,
                achievement_category: achievement.category,
                ...achievement.metadata
              })}::jsonb
            )
          `

          newAchievements.push(newAchievement[0])
        }
      }
    }

    return NextResponse.json({
      success: true,
      newAchievements: newAchievements.map((achievement: any) => ({
        id: achievement.id,
        type: achievement.achievement_type,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        earnedAt: achievement.earned_at
      })),
      message: `${newAchievements.length} new achievements awarded`
    })

  } catch (error) {
    console.error('Check achievements error:', error)
    return NextResponse.json({ 
      error: 'Failed to check achievements',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
} 