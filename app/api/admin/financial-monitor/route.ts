import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'

/**
 * GET /api/admin/financial-monitor
 * Comprehensive financial monitoring endpoint for admins
 * Returns:
 * - Recent withdrawals
 * - Insurance payouts
 * - Revenue breakdown
 * - Active stakes
 * - Suspicious activities
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user has admin access
    const sql = createDbConnection()
    const adminCheck = await sql`
      SELECT has_dev_access FROM users WHERE id = ${session.user.id}
    `
    
    if (!adminCheck[0]?.has_dev_access) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '7' // days
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    // 1. Recent Withdrawals
    const recentWithdrawals = await sql`
      SELECT 
        ct.id,
        ct.user_id,
        u.name as user_name,
        u.email as user_email,
        ct.amount,
        ct.description,
        ct.created_at,
        (SELECT amount FROM credit_transactions 
         WHERE user_id = ct.user_id 
         AND transaction_type = 'cashout_fee' 
         AND created_at = ct.created_at 
         LIMIT 1) as fee
      FROM credit_transactions ct
      JOIN users u ON ct.user_id = u.id
      WHERE ct.transaction_type = 'withdrawal'
        AND ct.created_at > NOW() - INTERVAL '${timeRange} days'
      ORDER BY ct.created_at DESC
      LIMIT ${limit}
    `

    // 2. Insurance Payouts
    const insurancePayouts = await sql`
      SELECT 
        ct.id,
        ct.user_id,
        u.name as user_name,
        u.email as user_email,
        ct.amount,
        ct.related_challenge_id,
        c.title as challenge_title,
        ct.description,
        ct.created_at
      FROM credit_transactions ct
      JOIN users u ON ct.user_id = u.id
      LEFT JOIN challenges c ON ct.related_challenge_id = c.id
      WHERE ct.transaction_type = 'insurance_payout'
        AND ct.created_at > NOW() - INTERVAL '${timeRange} days'
      ORDER BY ct.created_at DESC
      LIMIT ${limit}
    `

    // 3. Platform Revenue Summary
    const revenueSummary = await sql`
      SELECT 
        SUM(CASE WHEN revenue_type = 'entry_fee' THEN amount ELSE 0 END) as entry_fees,
        SUM(CASE WHEN revenue_type = 'failed_stakes' THEN amount ELSE 0 END) as failed_stakes,
        SUM(CASE WHEN revenue_type = 'insurance' THEN amount ELSE 0 END) as insurance_fees,
        SUM(CASE WHEN revenue_type = 'cashout_fee' THEN amount ELSE 0 END) as cashout_fees,
        SUM(amount) as total_revenue,
        COUNT(*) as transaction_count
      FROM platform_revenue
      WHERE created_at > NOW() - INTERVAL '${timeRange} days'
    `

    // 4. Active Stakes (Money at Risk)
    const activeStakes = await sql`
      SELECT 
        c.id as challenge_id,
        c.title as challenge_title,
        c.end_date,
        COUNT(cp.id) as participant_count,
        SUM(cp.stake_amount) as total_stakes,
        SUM(cp.entry_fee_paid) as total_entry_fees,
        SUM(CASE WHEN cp.insurance_purchased THEN 1 ELSE 0 END) as insured_count,
        SUM(CASE WHEN cp.insurance_purchased THEN cp.stake_amount ELSE 0 END) as insured_stakes
      FROM challenges c
      JOIN challenge_participants cp ON c.id = cp.challenge_id
      WHERE c.status IN ('active', 'pending')
        AND cp.completion_status = 'active'
      GROUP BY c.id, c.title, c.end_date
      ORDER BY total_stakes DESC
      LIMIT ${limit}
    `

    // 5. Large Transactions (Potential fraud detection)
    const largeTransactions = await sql`
      SELECT 
        ct.id,
        ct.user_id,
        u.name as user_name,
        u.email as user_email,
        u.trust_score,
        ct.transaction_type,
        ct.amount,
        ct.created_at,
        (SELECT COUNT(*) FROM credit_transactions 
         WHERE user_id = ct.user_id 
         AND transaction_type = 'withdrawal' 
         AND created_at > NOW() - INTERVAL '24 hours') as recent_withdrawals
      FROM credit_transactions ct
      JOIN users u ON ct.user_id = u.id
      WHERE ct.transaction_type IN ('withdrawal', 'challenge_reward')
        AND ABS(ct.amount) > 100
        AND ct.created_at > NOW() - INTERVAL '${timeRange} days'
      ORDER BY ABS(ct.amount) DESC
      LIMIT ${limit}
    `

    // 6. Top Earners (Last 30 days)
    const topEarners = await sql`
      SELECT 
        u.id as user_id,
        u.name,
        u.email,
        u.trust_score,
        u.challenges_completed,
        COALESCE(SUM(CASE WHEN ct.transaction_type = 'challenge_reward' THEN ct.amount ELSE 0 END), 0) as total_earnings,
        COUNT(CASE WHEN ct.transaction_type = 'challenge_reward' THEN 1 END) as challenges_won
      FROM users u
      LEFT JOIN credit_transactions ct ON u.id = ct.user_id
        AND ct.created_at > NOW() - INTERVAL '30 days'
      GROUP BY u.id, u.name, u.email, u.trust_score, u.challenges_completed
      HAVING SUM(CASE WHEN ct.transaction_type = 'challenge_reward' THEN ct.amount ELSE 0 END) > 0
      ORDER BY total_earnings DESC
      LIMIT 20
    `

    // 7. Failed vs Completed Challenges (Completion Rate)
    const challengeStats = await sql`
      SELECT 
        COUNT(DISTINCT c.id) as total_challenges,
        COUNT(DISTINCT CASE WHEN c.status = 'rewards_distributed' THEN c.id END) as completed_challenges,
        AVG(CASE 
          WHEN c.status = 'rewards_distributed' THEN 
            (SELECT COUNT(*) * 100.0 / NULLIF(COUNT(*) OVER (), 0)
             FROM challenge_participants cp 
             WHERE cp.challenge_id = c.id AND cp.completion_status = 'completed')
          ELSE NULL 
        END) as avg_completion_rate
      FROM challenges c
      WHERE c.created_at > NOW() - INTERVAL '${timeRange} days'
    `

    // 8. Insurance Claim Rate
    const insuranceStats = await sql`
      SELECT 
        COUNT(*) as total_insured_participants,
        SUM(CASE WHEN cp.completion_status = 'failed' THEN 1 ELSE 0 END) as insurance_claims,
        ROUND(100.0 * SUM(CASE WHEN cp.completion_status = 'failed' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) as claim_rate,
        SUM(cp.insurance_fee_paid) as total_insurance_revenue,
        SUM(CASE WHEN cp.completion_status = 'failed' THEN cp.stake_amount ELSE 0 END) as total_payouts
      FROM challenge_participants cp
      WHERE cp.insurance_purchased = true
        AND cp.joined_at > NOW() - INTERVAL '${timeRange} days'
    `

    return NextResponse.json({
      success: true,
      timeRange: `${timeRange} days`,
      timestamp: new Date().toISOString(),
      data: {
        withdrawals: {
          recent: recentWithdrawals.map((w: Record<string, any>) => ({
            id: w.id,
            user: {
              id: w.user_id,
              name: w.user_name,
              email: w.user_email
            },
            amount: parseFloat(w.amount),
            fee: parseFloat(w.fee || 0),
            net_amount: parseFloat(w.amount) - parseFloat(w.fee || 0),
            created_at: w.created_at
          })),
          count: recentWithdrawals.length
        },
        insurance: {
          recent_payouts: insurancePayouts.map((p: Record<string, any>) => ({
            id: p.id,
            user: {
              id: p.user_id,
              name: p.user_name,
              email: p.user_email
            },
            amount: parseFloat(p.amount),
            challenge: {
              id: p.related_challenge_id,
              title: p.challenge_title
            },
            created_at: p.created_at
          })),
          statistics: insuranceStats.length > 0 ? {
            total_insured: parseInt(insuranceStats[0].total_insured_participants || 0),
            claims_filed: parseInt(insuranceStats[0].insurance_claims || 0),
            claim_rate: parseFloat(insuranceStats[0].claim_rate || 0),
            total_revenue: parseFloat(insuranceStats[0].total_insurance_revenue || 0),
            total_payouts: parseFloat(insuranceStats[0].total_payouts || 0),
            net_profit: parseFloat(insuranceStats[0].total_insurance_revenue || 0) - parseFloat(insuranceStats[0].total_payouts || 0)
          } : null
        },
        revenue: revenueSummary.length > 0 ? {
          entry_fees: parseFloat(revenueSummary[0].entry_fees || 0),
          failed_stakes: parseFloat(revenueSummary[0].failed_stakes || 0),
          insurance_fees: parseFloat(revenueSummary[0].insurance_fees || 0),
          cashout_fees: parseFloat(revenueSummary[0].cashout_fees || 0),
          total: parseFloat(revenueSummary[0].total_revenue || 0),
          transaction_count: parseInt(revenueSummary[0].transaction_count || 0)
        } : null,
        active_stakes: activeStakes.map((s: Record<string, any>) => ({
          challenge_id: s.challenge_id,
          challenge_title: s.challenge_title,
          end_date: s.end_date,
          participant_count: parseInt(s.participant_count),
          total_stakes: parseFloat(s.total_stakes),
          total_entry_fees: parseFloat(s.total_entry_fees),
          insured_count: parseInt(s.insured_count),
          insured_stakes: parseFloat(s.insured_stakes),
          at_risk: parseFloat(s.total_stakes) - parseFloat(s.insured_stakes)
        })),
        large_transactions: largeTransactions.map((t: Record<string, any>) => ({
          id: t.id,
          user: {
            id: t.user_id,
            name: t.user_name,
            email: t.user_email,
            trust_score: parseInt(t.trust_score)
          },
          type: t.transaction_type,
          amount: parseFloat(t.amount),
          created_at: t.created_at,
          recent_withdrawals: parseInt(t.recent_withdrawals),
          is_suspicious: parseInt(t.recent_withdrawals) > 3 || (parseInt(t.trust_score) < 30 && Math.abs(parseFloat(t.amount)) > 200)
        })),
        top_earners: topEarners.map((e: Record<string, any>) => ({
          user: {
            id: e.user_id,
            name: e.name,
            email: e.email,
            trust_score: parseInt(e.trust_score),
            challenges_completed: parseInt(e.challenges_completed)
          },
          total_earnings: parseFloat(e.total_earnings),
          challenges_won: parseInt(e.challenges_won),
          avg_earning_per_challenge: parseFloat(e.total_earnings) / Math.max(parseInt(e.challenges_won), 1)
        })),
        challenge_stats: challengeStats.length > 0 ? {
          total_challenges: parseInt(challengeStats[0].total_challenges || 0),
          completed_challenges: parseInt(challengeStats[0].completed_challenges || 0),
          avg_completion_rate: parseFloat(challengeStats[0].avg_completion_rate || 0)
        } : null
      }
    })

  } catch (error) {
    console.error('❌ Financial monitor error:', error)
    
    return NextResponse.json({
      error: 'Failed to fetch financial monitoring data',
      details: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : 'Unknown error') 
        : undefined
    }, { status: 500 })
  }
}
