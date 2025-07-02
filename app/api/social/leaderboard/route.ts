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
    const timeframe = searchParams.get('timeframe') || 'weekly' // daily, weekly, monthly, all-time
    const category = searchParams.get('category') || 'overall' // overall, earnings, streaks, completions
    const limit = parseInt(searchParams.get('limit') || '50')

    const sql = await createDbConnection()

    // Calculate timeframe conditions
    let timeCondition = ''
    const now = new Date()
    
    switch (timeframe) {
      case 'daily':
        timeCondition = `AND created_at >= DATE_TRUNC('day', NOW())`
        break
      case 'weekly':
        timeCondition = `AND created_at >= DATE_TRUNC('week', NOW())`
        break
      case 'monthly':
        timeCondition = `AND created_at >= DATE_TRUNC('month', NOW())`
        break
      case 'all-time':
      default:
        timeCondition = ''
        break
    }

    let leaderboardQuery: any

    switch (category) {
      case 'earnings':
        // Rank by total earnings
        leaderboardQuery = sql`
          WITH user_earnings AS (
            SELECT 
              user_id,
              COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_earnings
            FROM transactions 
            WHERE transaction_type IN ('reward', 'payout') ${sql.unsafe(timeCondition)}
            GROUP BY user_id
          ),
          ranked_users AS (
            SELECT 
              u.id,
              u.name,
              u.email,
              u.avatar_url,
              u.verification_tier,
              u.trust_score,
              u.current_streak,
              u.challenges_completed,
              COALESCE(ue.total_earnings, 0) as score,
              ROW_NUMBER() OVER (ORDER BY COALESCE(ue.total_earnings, 0) DESC) as rank
            FROM users u
            LEFT JOIN user_earnings ue ON u.id = ue.user_id
            WHERE u.created_at < NOW() - INTERVAL '1 day'
            ORDER BY score DESC
            LIMIT ${limit}
          )
          SELECT *, 
            CASE 
              WHEN rank = 1 THEN 'gold'
              WHEN rank = 2 THEN 'silver' 
              WHEN rank = 3 THEN 'bronze'
              ELSE NULL
            END as badge
          FROM ranked_users
        `
        break

      case 'streaks':
        // Rank by current streak
        leaderboardQuery = sql`
          WITH ranked_users AS (
            SELECT 
              u.id,
              u.name,
              u.email,
              u.avatar_url,
              u.verification_tier,
              u.trust_score,
              u.current_streak,
              u.challenges_completed,
              u.current_streak as score,
              ROW_NUMBER() OVER (ORDER BY u.current_streak DESC, u.longest_streak DESC) as rank
            FROM users u
            WHERE u.created_at < NOW() - INTERVAL '1 day'
            AND u.current_streak > 0
            ORDER BY score DESC
            LIMIT ${limit}
          )
          SELECT *, 
            CASE 
              WHEN rank = 1 THEN 'gold'
              WHEN rank = 2 THEN 'silver' 
              WHEN rank = 3 THEN 'bronze'
              ELSE NULL
            END as badge
          FROM ranked_users
        `
        break

      case 'completions':
        // Rank by challenges completed
        leaderboardQuery = sql`
          WITH user_completions AS (
            SELECT 
              user_id,
              COUNT(*) as completions_count
            FROM challenge_participants 
            WHERE completion_status = 'completed' ${sql.unsafe(timeCondition)}
            GROUP BY user_id
          ),
          ranked_users AS (
            SELECT 
              u.id,
              u.name,
              u.email,
              u.avatar_url,
              u.verification_tier,
              u.trust_score,
              u.current_streak,
              u.challenges_completed,
              COALESCE(uc.completions_count, u.challenges_completed) as score,
              ROW_NUMBER() OVER (ORDER BY COALESCE(uc.completions_count, u.challenges_completed) DESC) as rank
            FROM users u
            LEFT JOIN user_completions uc ON u.id = uc.user_id
            WHERE u.created_at < NOW() - INTERVAL '1 day'
            ORDER BY score DESC
            LIMIT ${limit}
          )
          SELECT *, 
            CASE 
              WHEN rank = 1 THEN 'gold'
              WHEN rank = 2 THEN 'silver' 
              WHEN rank = 3 THEN 'bronze'
              ELSE NULL
            END as badge
          FROM ranked_users
        `
        break

      case 'overall':
      default:
        // Overall score calculation: combines trust score, streaks, completions, and earnings
        leaderboardQuery = sql`
          WITH user_stats AS (
            SELECT 
              u.id,
              u.name,
              u.email,
              u.avatar_url,
              u.verification_tier,
              u.trust_score,
              u.current_streak,
              u.challenges_completed,
              COALESCE(earnings.total_earnings, 0) as total_earnings,
              -- Calculate overall score: weighted combination of different factors
              (
                (u.trust_score * 0.3) +
                (u.current_streak * 10 * 0.2) +
                (u.challenges_completed * 50 * 0.3) +
                (COALESCE(earnings.total_earnings, 0) * 0.2)
              ) as overall_score
            FROM users u
            LEFT JOIN (
              SELECT 
                user_id,
                SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_earnings
              FROM transactions 
              WHERE transaction_type IN ('reward', 'payout')
              GROUP BY user_id
            ) earnings ON u.id = earnings.user_id
            WHERE u.created_at < NOW() - INTERVAL '1 day'
          ),
          ranked_users AS (
            SELECT 
              *,
              ROW_NUMBER() OVER (ORDER BY overall_score DESC) as rank
            FROM user_stats
            ORDER BY overall_score DESC
            LIMIT ${limit}
          )
          SELECT *, 
            ROUND(overall_score) as score,
            CASE 
              WHEN rank = 1 THEN 'gold'
              WHEN rank = 2 THEN 'silver' 
              WHEN rank = 3 THEN 'bronze'
              ELSE NULL
            END as badge
          FROM ranked_users
        `
        break
    }

    const leaderboardData = await leaderboardQuery

    // Find current user's position if not in top results
    let currentUserPosition = null
    const currentUserInTop = leaderboardData.find((user: any) => user.id === session.user.id)

    if (!currentUserInTop) {
      // Query for current user's rank
      let userRankQuery: any

      switch (category) {
        case 'earnings':
          userRankQuery = sql`
            WITH user_earnings AS (
              SELECT 
                user_id,
                COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_earnings
              FROM transactions 
              WHERE transaction_type IN ('reward', 'payout') ${sql.unsafe(timeCondition)}
              GROUP BY user_id
            ),
            ranked_users AS (
              SELECT 
                u.id,
                u.name,
                u.avatar_url,
                COALESCE(ue.total_earnings, 0) as score,
                ROW_NUMBER() OVER (ORDER BY COALESCE(ue.total_earnings, 0) DESC) as rank
              FROM users u
              LEFT JOIN user_earnings ue ON u.id = ue.user_id
            )
            SELECT * FROM ranked_users WHERE id = ${session.user.id}
          `
          break

        case 'streaks':
          userRankQuery = sql`
            WITH ranked_users AS (
              SELECT 
                u.id,
                u.name,
                u.avatar_url,
                u.current_streak as score,
                ROW_NUMBER() OVER (ORDER BY u.current_streak DESC, u.longest_streak DESC) as rank
              FROM users u
            )
            SELECT * FROM ranked_users WHERE id = ${session.user.id}
          `
          break

        case 'completions':
          userRankQuery = sql`
            WITH ranked_users AS (
              SELECT 
                u.id,
                u.name,
                u.avatar_url,
                u.challenges_completed as score,
                ROW_NUMBER() OVER (ORDER BY u.challenges_completed DESC) as rank
              FROM users u
            )
            SELECT * FROM ranked_users WHERE id = ${session.user.id}
          `
          break

        default:
          userRankQuery = sql`
            WITH user_stats AS (
              SELECT 
                u.id,
                u.name,
                u.avatar_url,
                (
                  (u.trust_score * 0.3) +
                  (u.current_streak * 10 * 0.2) +
                  (u.challenges_completed * 50 * 0.3) +
                  (COALESCE(earnings.total_earnings, 0) * 0.2)
                ) as overall_score
              FROM users u
              LEFT JOIN (
                SELECT 
                  user_id,
                  SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_earnings
                FROM transactions 
                WHERE transaction_type IN ('reward', 'payout')
                GROUP BY user_id
              ) earnings ON u.id = earnings.user_id
            ),
            ranked_users AS (
              SELECT 
                *,
                ROUND(overall_score) as score,
                ROW_NUMBER() OVER (ORDER BY overall_score DESC) as rank
              FROM user_stats
            )
            SELECT * FROM ranked_users WHERE id = ${session.user.id}
          `
          break
      }

      const userRank = await userRankQuery
      if (userRank.length > 0) {
        currentUserPosition = userRank[0]
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: leaderboardData.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar_url,
          score: formatScore(user.score, category),
          rank: user.rank,
          previousRank: user.rank, // TODO: Implement rank tracking
          streak: user.current_streak || 0,
          completedChallenges: user.challenges_completed || 0,
          totalEarnings: user.total_earnings || 0,
          badge: user.badge,
          verified: user.verification_tier === 'gold'
        })),
        currentUser: currentUserPosition ? {
          id: currentUserPosition.id,
          name: currentUserPosition.name,
          avatar: currentUserPosition.avatar_url,
          score: formatScore(currentUserPosition.score, category),
          rank: currentUserPosition.rank,
          previousRank: currentUserPosition.rank // TODO: Implement rank tracking
        } : null,
        metadata: {
          timeframe,
          category,
          totalUsers: leaderboardData.length,
          lastUpdated: new Date().toISOString()
        }
      }
    })

  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch leaderboard',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

function formatScore(score: any, category: string): string {
  const numericScore = parseFloat(score) || 0
  
  switch (category) {
    case 'earnings':
      return `$${numericScore.toFixed(2)}`
    case 'streaks':
      return `${Math.floor(numericScore)} days`
    case 'completions':
      return `${Math.floor(numericScore)}`
    default:
      return Math.floor(numericScore).toLocaleString()
  }
} 