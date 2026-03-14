import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'

interface UserRow {
  id: string
  credits: string | number
  email: string
  name: string
}

interface CreditTransaction {
  id: string
  amount: string | number
  transaction_type: string
  description: string
  related_challenge_id: string | null
  created_at: Date | string
}

interface ActiveStake {
  id: string
  title: string
  stake_amount: string | number
  end_date: Date | string | null
  completion_status: string
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const sql = await createDbConnection()

    // Resolve actual user id from DB (handle OAuth id format edge-cases)
    let userRows: UserRow[] = []
    try {
      userRows = await sql`SELECT id, credits, email, name FROM users WHERE id = ${session.user.id} LIMIT 1`
    } catch {
      userRows = await sql`SELECT id, credits, email, name FROM users WHERE email = ${session.user.email} LIMIT 1`
    }
    if (userRows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }
    const userId = userRows[0].id as string
    const balance = parseFloat(String(userRows[0].credits || '0'))

    // Parse query params for pagination and filters
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')))
    const typeParam = searchParams.get('type') // e.g., 'reward,stake,fee'
    const fromParam = searchParams.get('from') // ISO date
    const toParam = searchParams.get('to') // ISO date

    const typeFilters = (typeParam || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    // Map UI types back to ledger types
    const uiToLedgerTypes: Record<string, string[]> = {
      reward: ['challenge_reward'],
      stake: ['stake_lock'],
      fee: ['entry_fee', 'insurance_fee'],
      deposit: ['deposit'],
      withdrawal: ['withdrawal']
    }
    const ledgerTypeFilters: string[] = typeFilters.flatMap(t => uiToLedgerTypes[t] || [])

    // Credit ledger transactions
    let creditTx: CreditTransaction[] = []
    let totalCount = 0
    try {
      // Build dynamic filter clauses
      const filters: any[] = []
      let whereSql = sql`user_id = ${userId}`
      if (ledgerTypeFilters.length > 0) {
        whereSql = sql`${whereSql} AND transaction_type IN ${sql(ledgerTypeFilters)}`
      }
      if (fromParam) {
        whereSql = sql`${whereSql} AND created_at >= ${new Date(fromParam)}`
      }
      if (toParam) {
        whereSql = sql`${whereSql} AND created_at <= ${new Date(toParam)}`
      }

      // Count total
      const countRows = await sql`
        SELECT COUNT(*)::int AS count
        FROM credit_transactions
        WHERE ${whereSql}
      `
      totalCount = countRows?.[0]?.count || 0

      // Page of results
      creditTx = await sql`
        SELECT id, amount, transaction_type, description, related_challenge_id, created_at
        FROM credit_transactions
        WHERE ${whereSql}
        ORDER BY created_at DESC
        LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
      `
    } catch {
      creditTx = []
      totalCount = 0
    }

    // Active stakes overview
    let activeStakes: ActiveStake[] = []
    try {
      activeStakes = await sql`
        SELECT c.id, c.title, cp.stake_amount, c.end_date, cp.completion_status
        FROM challenge_participants cp
        JOIN challenges c ON c.id = cp.challenge_id
        WHERE cp.user_id = ${userId} AND cp.completion_status IN ('active','pending_verification')
        ORDER BY c.end_date DESC
        LIMIT 20
      `
    } catch {
      activeStakes = []
    }

    const totalStaked = activeStakes.reduce((sum: number, s: any) => sum + parseFloat(s.stake_amount || '0'), 0)

    const mappedTransactions = creditTx.map((t) => ({
      id: t.id,
      type: mapLedgerTypeToUi(t.transaction_type),
      amount: parseFloat(String(t.amount)),
      description: t.description || t.transaction_type,
      date: t.created_at,
      status: 'completed',
      challengeId: t.related_challenge_id || null,
    }))

    const mappedActiveStakes = activeStakes.map((s) => ({
      id: s.id,
      challengeTitle: s.title,
      amount: parseFloat(String(s.stake_amount || '0')),
      progress: 0,
      daysLeft: s.end_date ? Math.max(0, Math.ceil((new Date(s.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0,
      potentialReward: 0,
      status: s.completion_status,
    }))

    // Basic aggregates
    const totalEarned = mappedTransactions
      .filter((t) => t.type === 'reward')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalSpent = mappedTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    return NextResponse.json({
      success: true,
      wallet: {
        balance,
        totalEarned,
        totalSpent,
        totalStaked,
        pendingRewards: 0,
        transactions: mappedTransactions,
        activeStakes: mappedActiveStakes,
        cashAccount: {
          balance: 0,
          connected: false,
          lastSync: null,
        }
      },
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
        hasNext: page * pageSize < totalCount
      }
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to load wallet' }, { status: 500 })
  }
}

function mapLedgerTypeToUi(type: string): string {
  switch (type) {
    case 'challenge_reward':
      return 'reward'
    case 'stake_lock':
      return 'stake'
    case 'entry_fee':
    case 'insurance_fee':
      return 'fee'
    case 'deposit':
      return 'deposit'
    case 'withdrawal':
      return 'withdrawal'
    default:
      return type
  }
}


