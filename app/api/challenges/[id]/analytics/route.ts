import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { isDemoUser } from '@/lib/demo-data'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET challenge analytics
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id: challengeId } = await params
    
    // For demo users, return mock analytics
    if (isDemoUser(session.user.id) || challengeId.startsWith('demo-')) {
      return getMockAnalytics(challengeId)
    }

    const sql = await createDbConnection()
    
    // Check if user owns this challenge
    const challenge = await sql`
      SELECT host_id, title, status, start_date, end_date 
      FROM challenges 
      WHERE id = ${challengeId}
    `
    
    if (challenge.length === 0) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }
    
    if (challenge[0].host_id !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to view analytics for this challenge' }, { status: 403 })
    }

    // Get basic challenge analytics
    const analytics = await generateChallengeAnalytics(sql, challengeId, challenge[0])
    
    return NextResponse.json({
      success: true,
      analytics
    })
    
  } catch (error) {
    console.error('Challenge analytics error:', error)
    return NextResponse.json({
      error: 'Failed to get challenge analytics',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

async function generateChallengeAnalytics(sql: any, challengeId: string, challenge: any) {
  try {
    // Get participant statistics
    const participantStats = await sql`
      SELECT 
        COUNT(*) as total_participants,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_participants,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_participants,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_participants,
        AVG(stake_amount) as average_stake
      FROM challenge_participants 
      WHERE challenge_id = ${challengeId}
    `

    // Get financial statistics
    const financialStats = await sql`
      SELECT 
        SUM(stake_amount) as total_staked,
        SUM(CASE WHEN status = 'completed' THEN reward_earned ELSE 0 END) as total_rewards_paid,
        SUM(CASE WHEN status = 'failed' THEN stake_amount ELSE 0 END) as total_stakes_lost
      FROM challenge_participants 
      WHERE challenge_id = ${challengeId}
    `

    // Get daily participation data (if challenge has started)
    const dailyData = await sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_participants
      FROM challenge_participants 
      WHERE challenge_id = ${challengeId}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `

    const stats = participantStats[0] || {}
    const financial = financialStats[0] || {}

    return {
      challenge: {
        id: challengeId,
        title: challenge.title,
        status: challenge.status,
        start_date: challenge.start_date,
        end_date: challenge.end_date
      },
      participation: {
        total_participants: parseInt(stats.total_participants) || 0,
        active_participants: parseInt(stats.active_participants) || 0,
        completed_participants: parseInt(stats.completed_participants) || 0,
        failed_participants: parseInt(stats.failed_participants) || 0,
        success_rate: stats.total_participants > 0 
          ? Math.round((parseInt(stats.completed_participants) / parseInt(stats.total_participants)) * 100)
          : 0,
        average_stake: parseFloat(stats.average_stake) || 0
      },
      financial: {
        total_staked: parseFloat(financial.total_staked) || 0,
        total_rewards_paid: parseFloat(financial.total_rewards_paid) || 0,
        total_stakes_lost: parseFloat(financial.total_stakes_lost) || 0,
        platform_revenue: (parseFloat(financial.total_staked) * 0.05) + (parseFloat(financial.total_stakes_lost) * 0.20)
      },
      daily_trends: dailyData.map((day: any) => ({
        date: day.date,
        new_participants: parseInt(day.new_participants)
      }))
    }
  } catch (error) {
    console.error('Error generating analytics:', error)
    // Return basic structure with zeros if database queries fail
    return {
      challenge: {
        id: challengeId,
        title: challenge.title,
        status: challenge.status,
        start_date: challenge.start_date,
        end_date: challenge.end_date
      },
      participation: {
        total_participants: 0,
        active_participants: 0,
        completed_participants: 0,
        failed_participants: 0,
        success_rate: 0,
        average_stake: 0
      },
      financial: {
        total_staked: 0,
        total_rewards_paid: 0,
        total_stakes_lost: 0,
        platform_revenue: 0
      },
      daily_trends: []
    }
  }
}

function getMockAnalytics(challengeId: string) {
  // Generate different mock data based on challenge ID
  let mockAnalytics
  
  if (challengeId === 'demo-hosted-3') {
    // Completed challenge analytics
    mockAnalytics = {
      challenge: {
        id: challengeId,
        title: "Early Morning Workout",
        status: "completed",
        start_date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      participation: {
        total_participants: 32,
        active_participants: 0,
        completed_participants: 26,
        failed_participants: 6,
        success_rate: 81,
        average_stake: 87.50
      },
      financial: {
        total_staked: 2800.00,
        total_rewards_paid: 3276.00,
        total_stakes_lost: 525.00,
        platform_revenue: 245.00
      },
      daily_trends: [
        { date: '2024-01-05', new_participants: 3 },
        { date: '2024-01-04', new_participants: 5 },
        { date: '2024-01-03', new_participants: 8 },
        { date: '2024-01-02', new_participants: 7 },
        { date: '2024-01-01', new_participants: 9 }
      ]
    }
  } else {
    // Active/pending challenge analytics
    mockAnalytics = {
      challenge: {
        id: challengeId,
        title: "Daily Reading Habit",
        status: "active",
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString()
      },
      participation: {
        total_participants: 45,
        active_participants: 38,
        completed_participants: 5,
        failed_participants: 2,
        success_rate: 84,
        average_stake: 42.50
      },
      financial: {
        total_staked: 1912.50,
        total_rewards_paid: 287.25,
        total_stakes_lost: 85.00,
        platform_revenue: 112.63
      },
      daily_trends: [
        { date: '2024-01-15', new_participants: 8 },
        { date: '2024-01-14', new_participants: 12 },
        { date: '2024-01-13', new_participants: 6 },
        { date: '2024-01-12', new_participants: 9 },
        { date: '2024-01-11', new_participants: 10 }
      ]
    }
  }

  return NextResponse.json({
    success: true,
    analytics: mockAnalytics
  })
} 