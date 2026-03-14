import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'

import { systemLogger } from '@/lib/system-logger'

// Mock user data for demo accounts
const getDemoUsers = () => ({
  users: [
    {
      id: 'user-1',
      email: 'alex@stakr.app',
      name: 'Alex Rodriguez',
      avatar: '/avatars/avatar-1.svg',
      credits: 2847.30,
      trustScore: 94,
      verificationTier: 'gold',
      challengesCompleted: 42,
      currentStreak: 15,
      longestStreak: 23,
      premiumSubscription: true,
      hasDevAccess: true,
      isActive: true,
      lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      falseClaims: 0,
      status: 'active'
    },
    {
      id: 'user-2',
      email: 'sarah@example.com',
      name: 'Sarah Chen',
      avatar: '/avatars/avatar-2.svg',
      credits: 456.75,
      trustScore: 87,
      verificationTier: 'silver',
      challengesCompleted: 28,
      currentStreak: 8,
      longestStreak: 15,
      premiumSubscription: false,
      hasDevAccess: false,
      isActive: true,
      lastLogin: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      falseClaims: 1,
      status: 'active'
    },
    {
      id: 'user-3',
      email: 'mike@example.com',
      name: 'Mike Johnson',
      avatar: '/avatars/avatar-3.svg',
      credits: 123.50,
      trustScore: 62,
      verificationTier: 'bronze',
      challengesCompleted: 12,
      currentStreak: 0,
      longestStreak: 7,
      premiumSubscription: false,
      hasDevAccess: false,
      isActive: false,
      lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      falseClaims: 2,
      status: 'suspended'
    },
    {
      id: 'user-4',
      email: 'emma@example.com',
      name: 'Emma Wilson',
      avatar: '/avatars/avatar-4.svg',
      credits: 1289.25,
      trustScore: 91,
      verificationTier: 'gold',
      challengesCompleted: 35,
      currentStreak: 12,
      longestStreak: 20,
      premiumSubscription: true,
      hasDevAccess: false,
      isActive: true,
      lastLogin: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      falseClaims: 0,
      status: 'active'
    }
  ],
  pagination: {
    total: 4,
    page: 1,
    limit: 10,
    totalPages: 1
  },
  stats: {
    totalUsers: 4,
    activeUsers: 3,
    suspendedUsers: 1,
    premiumUsers: 2,
    devUsers: 1
  }
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user has admin access
    const sql = await createDbConnection()
    const adminCheck = await sql`
      SELECT has_dev_access FROM users WHERE id = ${session.user.id}
    `
    
    if (!adminCheck[0]?.has_dev_access) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Log admin dashboard access
    systemLogger.info(`User management accessed by ${session.user.name || session.user.email}`, 'admin')

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const tier = searchParams.get('tier') || 'all'
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Always return real user data from database

    // For real users, query the database
    const offset = (page - 1) * limit

    // Build WHERE clause for filtering
    let whereConditions = []
    let params: any[] = []
    let paramIndex = 1

    if (search) {
      whereConditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`)
      params.push(`%${search}%`)
      paramIndex++
    }

    if (status !== 'all') {
      if (status === 'active') {
        whereConditions.push(`last_login > NOW() - INTERVAL '30 days'`)
      } else if (status === 'inactive') {
        whereConditions.push(`(last_login IS NULL OR last_login <= NOW() - INTERVAL '30 days')`)
      } else if (status === 'suspended') {
        whereConditions.push(`false_claims >= 3`)
      }
    }

    if (tier !== 'all') {
      whereConditions.push(`verification_tier = $${paramIndex}`)
      params.push(tier)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // For real queries, we'll simplify and use basic filtering without complex dynamic queries
    // This avoids SQL injection and type issues
    let users, total, stats

    if (search) {
      // Search by name or email
      users = await sql`
        SELECT 
          id, email, name, avatar_url, credits, trust_score, verification_tier,
          challenges_completed, false_claims, current_streak, longest_streak,
          premium_subscription, has_dev_access, last_login, created_at, updated_at
        FROM users
        WHERE (name ILIKE ${`%${search}%`} OR email ILIKE ${`%${search}%`})
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      
      const countResult = await sql`
        SELECT COUNT(*) as total FROM users
        WHERE (name ILIKE ${`%${search}%`} OR email ILIKE ${`%${search}%`})
      `
      total = parseInt(countResult[0].total)
    } else {
      // Get all users
      users = await sql`
        SELECT 
          id, email, name, avatar_url, credits, trust_score, verification_tier,
          challenges_completed, false_claims, current_streak, longest_streak,
          premium_subscription, has_dev_access, last_login, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      
      const countResult = await sql`SELECT COUNT(*) as total FROM users`
      total = parseInt(countResult[0].total)
    }

    // Get stats
    const statsResult = await sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN last_login > NOW() - INTERVAL '30 days' THEN 1 END) as active_users,
        COUNT(CASE WHEN false_claims >= 3 THEN 1 END) as suspended_users,
        COUNT(CASE WHEN premium_subscription = true THEN 1 END) as premium_users,
        COUNT(CASE WHEN has_dev_access = true THEN 1 END) as dev_users
      FROM users
    `
    stats = statsResult[0]

    const result = {
      users: users.map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar_url,
        credits: parseFloat(user.credits) || 0,
        trustScore: user.trust_score || 50,
        verificationTier: user.verification_tier || 'manual',
        challengesCompleted: user.challenges_completed || 0,
        currentStreak: user.current_streak || 0,
        longestStreak: user.longest_streak || 0,
        premiumSubscription: user.premium_subscription || false,
        hasDevAccess: user.has_dev_access || false,
        isActive: user.last_login && new Date(user.last_login) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastLogin: user.last_login,
        createdAt: user.created_at,
        falseClaims: user.false_claims || 0,
        status: user.false_claims >= 3 ? 'suspended' : 'active'
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        totalUsers: parseInt(stats.total_users) || 0,
        activeUsers: parseInt(stats.active_users) || 0,
        suspendedUsers: parseInt(stats.suspended_users) || 0,
        premiumUsers: parseInt(stats.premium_users) || 0,
        devUsers: parseInt(stats.dev_users) || 0
      }
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('User management fetch error:', error)
    systemLogger.error(`User management fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'admin')
    
    return NextResponse.json({ 
      error: 'Failed to fetch users',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// POST endpoint for user actions (suspend, unsuspend, grant admin, etc.)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user has admin access
    const sql = await createDbConnection()
    const adminCheck = await sql`
      SELECT has_dev_access FROM users WHERE id = ${session.user.id}
    `
    
    if (!adminCheck[0]?.has_dev_access) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { action, userId, reason } = body

    if (!action || !userId) {
      return NextResponse.json({ error: 'Action and userId are required' }, { status: 400 })
    }

    // Process real admin actions on database

    let result = {}
    
    switch (action) {
      case 'suspend':
        await sql`
          UPDATE users 
          SET false_claims = 5, updated_at = NOW()
          WHERE id = ${userId}
        `
        result = { message: 'User suspended successfully' }
        break
        
      case 'unsuspend':
        await sql`
          UPDATE users 
          SET false_claims = 0, updated_at = NOW()
          WHERE id = ${userId}
        `
        result = { message: 'User unsuspended successfully' }
        break
        
      case 'grant_admin':
        await sql`
          UPDATE users 
          SET has_dev_access = true, updated_at = NOW()
          WHERE id = ${userId}
        `
        result = { message: 'Admin access granted successfully' }
        break
        
      case 'revoke_admin':
        await sql`
          UPDATE users 
          SET has_dev_access = false, updated_at = NOW()
          WHERE id = ${userId}
        `
        result = { message: 'Admin access revoked successfully' }
        break
        
      case 'reset_trust_score':
        await sql`
          UPDATE users 
          SET trust_score = 50, false_claims = 0, updated_at = NOW()
          WHERE id = ${userId}
        `
        result = { message: 'Trust score reset successfully' }
        break
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Log admin action
    systemLogger.info(`Admin ${session.user.name} performed ${action} on user ${userId}`, 'admin', {
      action,
      targetUserId: userId,
      adminId: session.user.id,
      reason: reason || 'No reason provided'
    })

    // Log to admin_actions table if it exists
    try {
      await sql`
        INSERT INTO admin_actions (
          admin_id, 
          action_type, 
          target_user_id, 
          reason, 
          created_at
        ) VALUES (
          ${session.user.id},
          ${action},
          ${userId},
          ${reason || 'No reason provided'},
          NOW()
        )
      `
    } catch (dbError) {
      // Table might not exist, log but don't fail
    }

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('User action error:', error)
    systemLogger.error(`User action failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'admin')
    
    return NextResponse.json({ 
      error: 'Failed to perform user action',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
