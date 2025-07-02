import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'

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

    // Calculate revenue by source
    const revenueStats = await sql`
      SELECT 
        transaction_type,
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_amount,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE transaction_type IN ('platform_fee', 'entry_fee', 'failed_stake_cut', 'premium_fee', 'insurance_fee', 'cashout_fee')
      GROUP BY transaction_type
    `

    // Calculate subscription revenue (if we have premium subscriptions)
    const subscriptionRevenue = await sql`
      SELECT 
        COUNT(CASE WHEN premium_subscription = true THEN 1 END) as active_subscriptions,
        COUNT(CASE WHEN premium_subscription = true THEN 1 END) * 9.99 as monthly_subscription_revenue
      FROM users
    `

    // Calculate platform fee revenue from challenge completions
    const challengeRevenue = await sql`
      SELECT 
        COALESCE(SUM(amount), 0) as platform_revenue_from_challenges
      FROM transactions
      WHERE transaction_type = 'platform_fee'
    `

    // Map the revenue sources
    const revenueMap = revenueStats.reduce((acc: any, stat: any) => {
      acc[stat.transaction_type] = parseFloat(stat.total_amount) || 0
      return acc
    }, {})

    const result = {
      entryFees: revenueMap.entry_fee || 0,
      failedStakeCuts: revenueMap.failed_stake_cut || 0,
      premiumSubscriptions: parseFloat(subscriptionRevenue[0]?.monthly_subscription_revenue) || 0,
      insuranceFees: revenueMap.insurance_fee || 0,
      cashoutFees: revenueMap.cashout_fee || 0,
      platformFees: revenueMap.platform_fee || 0,
      totalRevenue: Object.values(revenueMap).reduce((sum: number, amount: any) => sum + (parseFloat(amount) || 0), 0) + (parseFloat(subscriptionRevenue[0]?.monthly_subscription_revenue) || 0),
      activeSubscriptions: parseInt(subscriptionRevenue[0]?.active_subscriptions) || 0
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Revenue stats error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch revenue stats',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
} 