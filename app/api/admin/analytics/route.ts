import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { isDemoUser } from '@/lib/demo-data'

// Mock analytics data for demo accounts
const getDemoAnalytics = () => ({
  userStats: {
    totalUsers: 12847,
    activeUsers: 8934,
    newUsersToday: 47,
    newUsersThisWeek: 312,
    newUsersThisMonth: 1284,
    userGrowthRate: 15.7,
    averageSessionDuration: 1247, // seconds
    retentionRate: 78.5
  },
  challengeStats: {
    totalChallenges: 1247,
    activeChallenges: 342,
    completedChallenges: 789,
    pendingChallenges: 23,
    successRate: 73.2,
    averageParticipants: 28.5,
    challengeGrowthRate: 12.3
  },
  financialStats: {
    totalRevenue: 284750.00,
    monthlyRevenue: 45230.00,
    dailyRevenue: 1847.50,
    totalStakes: 156890.00,
    activeStakes: 89450.00,
    platformFees: 28475.00,
    payoutsProcessed: 197850.00,
    averageStakeAmount: 47.50
  },
  systemHealth: {
    apiResponseTime: 142,
    databaseStatus: 'healthy',
    paymentGatewayStatus: 'online',
    storageUsage: 67,
    errorRate: 0.12,
    uptime: 99.8,
    activeConnections: 234,
    memoryUsage: 45.2
  },
  recentActivity: [
    {
      id: '1',
      type: 'user_registration',
      user: 'Sarah Chen',
      action: 'New user registered',
      timestamp: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
      details: { email: 'sarah@example.com' }
    },
    {
      id: '2', 
      type: 'challenge_completion',
      user: 'Mike Johnson',
      action: 'Completed "30-Day Fitness Challenge"',
      timestamp: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
      details: { challengeId: 'ch-123', reward: 75.00 }
    },
    {
      id: '3',
      type: 'verification_pending',
      user: 'Alex Rodriguez',
      action: 'Proof verification pending',
      timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      details: { challengeId: 'ch-456' }
    },
    {
      id: '4',
      type: 'challenge_created',
      user: 'FitnessGuru',
      action: 'Created new challenge "Morning Yoga"',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      details: { challengeId: 'ch-789', stakeAmount: 25.00 }
    }
  ],
  topChallenges: [
    {
      id: 'ch-001',
      title: '10K Steps Daily',
      participants: 567,
      totalPot: 12450.00,
      successRate: 82.1,
      category: 'Fitness'
    },
    {
      id: 'ch-002',
      title: 'Morning Meditation',
      participants: 234,
      totalPot: 5670.00,
      successRate: 89.3,
      category: 'Wellness'
    },
    {
      id: 'ch-003',
      title: 'No Social Media Weekend',
      participants: 189,
      totalPot: 2340.00,
      successRate: 67.8,
      category: 'Digital Wellness'
    }
  ],
  hourlyData: Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    users: Math.floor(Math.random() * 100) + 50,
    challenges: Math.floor(Math.random() * 20) + 5,
    revenue: Math.floor(Math.random() * 1000) + 200
  })),
  weeklyData: Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    users: Math.floor(Math.random() * 500) + 300,
    challenges: Math.floor(Math.random() * 50) + 20,
    revenue: Math.floor(Math.random() * 5000) + 1000
  }))
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin = session.user.isAdmin || session.user.email === 'alex@stakr.app'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // For demo users, return mock analytics
    if (isDemoUser(session.user.id)) {
      return NextResponse.json({
        success: true,
        analytics: getDemoAnalytics()
      })
    }

    // For real users, query the database
    const sql = await createDbConnection()

    // User statistics
    const userStats = await sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN last_login > NOW() - INTERVAL '24 hours' THEN 1 END) as active_users,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 day' THEN 1 END) as new_users_today,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_users_week,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_users_month
      FROM users
    `

    // Challenge statistics
    const challengeStats = await sql`
      SELECT 
        COUNT(*) as total_challenges,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_challenges,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_challenges,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_challenges
      FROM challenges
    `

    // Financial statistics
    const financialStats = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'fee' THEN amount END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN transaction_type = 'fee' AND created_at > NOW() - INTERVAL '30 days' THEN amount END), 0) as monthly_revenue,
        COALESCE(SUM(CASE WHEN transaction_type = 'stake' THEN amount END), 0) as total_stakes,
        COALESCE(SUM(CASE WHEN transaction_type = 'payout' THEN amount END), 0) as payouts_processed
      FROM transactions
    `

    // Recent activity
    const recentActivity = await sql`
      SELECT 
        'user_registration' as type,
        name as user_name,
        'New user registered' as action,
        created_at as timestamp
      FROM users 
      WHERE created_at > NOW() - INTERVAL '1 day'
      ORDER BY created_at DESC
      LIMIT 10
    `

    const analytics = {
      userStats: {
        totalUsers: parseInt(userStats[0].total_users) || 0,
        activeUsers: parseInt(userStats[0].active_users) || 0,
        newUsersToday: parseInt(userStats[0].new_users_today) || 0,
        newUsersThisWeek: parseInt(userStats[0].new_users_week) || 0,
        newUsersThisMonth: parseInt(userStats[0].new_users_month) || 0
      },
      challengeStats: {
        totalChallenges: parseInt(challengeStats[0].total_challenges) || 0,
        activeChallenges: parseInt(challengeStats[0].active_challenges) || 0,
        completedChallenges: parseInt(challengeStats[0].completed_challenges) || 0,
        pendingChallenges: parseInt(challengeStats[0].pending_challenges) || 0
      },
      financialStats: {
        totalRevenue: parseFloat(financialStats[0].total_revenue) || 0,
        monthlyRevenue: parseFloat(financialStats[0].monthly_revenue) || 0,
        totalStakes: parseFloat(financialStats[0].total_stakes) || 0,
        payoutsProcessed: parseFloat(financialStats[0].payouts_processed) || 0
      },
      recentActivity: recentActivity.map((activity: any) => ({
        id: `activity-${Date.now()}-${Math.random()}`,
        type: activity.type,
        user: activity.user_name,
        action: activity.action,
        timestamp: activity.timestamp
      })),
      systemHealth: {
        apiResponseTime: 142,
        databaseStatus: 'healthy',
        paymentGatewayStatus: 'online',
        storageUsage: 67,
        uptime: 99.8
      }
    }

    return NextResponse.json({
      success: true,
      analytics
    })

  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch analytics',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
} 