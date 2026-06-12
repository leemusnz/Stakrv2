/**
 * Phase 0 regression tests (board-approved recovery plan, June 2026).
 *
 * P0-5 — ledger SQL interpolation bug: transaction descriptions were embedded
 * inside quoted SQL string literals (`'... ${title}'`), which corrupts the
 * parameterized query, so every credits join debited users.credits WITHOUT
 * writing the credit_transactions row, and settlement INSERTs failed. These
 * tests prove descriptions now travel as whole bound parameters and that a
 * join issues participant + debit + ledger writes in one request, and that a
 * settlement run issues its reward INSERT and commits.
 *
 * P0-4 — Stripe webhook signature is mandatory (unsigned → 400 always).
 * P0-6 — Stripe idempotency: duplicate webhook events are no-ops and the
 * pending-transaction INSERT relies on ON CONFLICT (stripe_payment_id),
 * backed by the unique index in migrations/2026-06-12_phase0-fixes.sql.
 */
import { jest } from '@jest/globals'
import { NextRequest } from 'next/server'

type SqlCall = { text: string; values: any[] }

// Records every tagged-template call and answers from a per-test dispatcher.
const calls: SqlCall[] = []
let dispatcher: (text: string, values: any[]) => any[] = () => []

const sqlImplementation = async (strings: TemplateStringsArray, ...values: any[]) => {
  const text = strings.join(' ')
  calls.push({ text, values })
  return dispatcher(text, values)
}
const mockSql = jest.fn(sqlImplementation)

jest.mock('@/lib/db', () => ({
  createDbConnection: () => mockSql,
  testDatabaseConnection: jest.fn(),
  dbConfig: {},
  db: null,
}))

const mockGetServerSession = jest.fn()
jest.mock('next-auth', () => ({
  getServerSession: () => mockGetServerSession(),
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

jest.mock('@/lib/auto-sync-service', () => ({
  triggerAutoSync: jest.fn().mockResolvedValue(undefined),
  SYNC_TRIGGERS: { CHALLENGE_JOIN: 'challenge_join' },
}))

jest.mock('@/lib/xp-reward-calculation', () => ({
  calculatePotentialXPReward: jest.fn().mockResolvedValue(100),
}))

// The join route only needs the potential-reward estimate; the settlement
// tests below use the REAL module via jest.requireActual.
jest.mock('@/lib/reward-calculation', () => ({
  calculatePotentialReward: jest.fn().mockResolvedValue(150),
}))

jest.mock('@/lib/notification-service', () => ({
  notifyInsurancePayout: jest.fn().mockResolvedValue(undefined),
  notifyBatchRewards: jest.fn().mockResolvedValue(undefined),
}))

const autoSyncService = require('@/lib/auto-sync-service')
const xpRewardCalculation = require('@/lib/xp-reward-calculation')
const rewardCalculationMock = require('@/lib/reward-calculation')
const notificationService = require('@/lib/notification-service')

const { POST: joinPost } = require('@/app/api/challenges/[id]/join/route')
const { POST: webhookPost } = require('@/app/api/payments/webhook/route')
const { distributeRewards } = jest.requireActual('@/lib/reward-calculation') as
  typeof import('@/lib/reward-calculation')
const { createCheckoutSession, processCheckoutCompleted } = jest.requireActual(
  '@/lib/payments-service',
) as typeof import('@/lib/payments-service')

const CHALLENGE = {
  id: 'challenge-1',
  title: 'Test Challenge',
  status: 'active',
  max_participants: null,
  min_stake: 10,
  max_stake: 100,
  entry_fee_percentage: 5,
  allow_points_only: false,
  enable_team_mode: false,
  proof_requirements: null,
  host_name: 'Host',
  current_participants: '3',
  start_date: '2026-06-01T00:00:00Z',
  end_date: '2026-07-01T00:00:00Z',
}

beforeEach(() => {
  calls.length = 0
  dispatcher = () => []
  // jest.config sets resetMocks: true, which strips implementations
  mockSql.mockImplementation(sqlImplementation)
  mockGetServerSession.mockResolvedValue({
    user: { id: 'user-1', email: 'user@example.com' },
  })
  autoSyncService.triggerAutoSync.mockResolvedValue(undefined)
  xpRewardCalculation.calculatePotentialXPReward.mockResolvedValue(100)
  rewardCalculationMock.calculatePotentialReward.mockResolvedValue(150)
  notificationService.notifyInsurancePayout.mockResolvedValue(undefined)
  notificationService.notifyBatchRewards.mockResolvedValue(undefined)
})

describe('P0-5: credits join writes participant + debit + ledger rows', () => {
  function joinDispatcher(text: string): any[] {
    if (text.includes('FROM challenges c')) return [CHALLENGE]
    if (text.includes('SELECT id FROM challenge_participants')) return []
    if (text.includes('SELECT credits FROM users')) return [{ credits: 500 }]
    if (text.includes('INSERT INTO challenge_participants')) {
      return [{ id: 'participation-1', joined_at: '2026-06-12T00:00:00Z' }]
    }
    if (text.includes('UPDATE users')) return [{ credits: 447.5 }]
    return []
  }

  async function postJoin() {
    const request = new NextRequest('http://localhost:3000/api/challenges/challenge-1/join', {
      method: 'POST',
      body: JSON.stringify({ stakeAmount: 50, insurancePurchased: false, pointsOnly: false }),
      headers: { 'Content-Type': 'application/json' },
    })
    return joinPost(request, { params: Promise.resolve({ id: 'challenge-1' }) })
  }

  it('issues all three writes in one request and the join succeeds', async () => {
    dispatcher = joinDispatcher

    const response = await postJoin()
    expect(response.status).toBe(201)

    const participantInsert = calls.find((c) => c.text.includes('INSERT INTO challenge_participants'))
    const debit = calls.find((c) => c.text.includes('SET credits = credits -'))
    const ledgerInsert = calls.find((c) => c.text.includes('INSERT INTO credit_transactions'))

    expect(participantInsert).toBeDefined()
    expect(debit).toBeDefined()
    expect(ledgerInsert).toBeDefined()

    // stake 50 + 5% entry fee = 52.5 debited atomically with a balance guard
    expect(debit!.values).toContain(52.5)
    expect(debit!.text).toContain('credits >=')

    // stake_lock −50 and entry_fee −2.5 recorded for the challenge
    expect(ledgerInsert!.values).toEqual(
      expect.arrayContaining([-50, -2.5, 'user-1', 'challenge-1']),
    )
  })

  it('REGRESSION: ledger descriptions are bound parameters, never SQL literals', async () => {
    dispatcher = joinDispatcher

    const response = await postJoin()
    expect(response.status).toBe(201)

    const ledgerInsert = calls.find((c) => c.text.includes('INSERT INTO credit_transactions'))!

    // The full composed description must arrive as a VALUE...
    expect(ledgerInsert.values).toContain('Stake locked for challenge: Test Challenge')
    expect(ledgerInsert.values).toContain('Entry fee for challenge: Test Challenge')

    // ...and must NOT appear inside the SQL text itself. Before the fix the
    // template read `'Stake locked for challenge: ${title}'`, leaving the
    // prefix inside a quoted literal and breaking the INSERT.
    expect(ledgerInsert.text).not.toContain('Stake locked')
    expect(ledgerInsert.text).not.toContain('Entry fee for challenge')
  })

  it('records the insurance fee ledger row as a bound parameter too', async () => {
    dispatcher = joinDispatcher

    const request = new NextRequest('http://localhost:3000/api/challenges/challenge-1/join', {
      method: 'POST',
      body: JSON.stringify({ stakeAmount: 50, insurancePurchased: true, pointsOnly: false }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await joinPost(request, { params: Promise.resolve({ id: 'challenge-1' }) })
    expect(response.status).toBe(201)

    const insuranceInsert = calls.find(
      (c) => c.text.includes('INSERT INTO credit_transactions') && c.values.includes(-1),
    )!
    expect(insuranceInsert).toBeDefined()
    expect(insuranceInsert.values).toContain('Insurance fee for challenge: Test Challenge')
    expect(insuranceInsert.text).not.toContain('Insurance fee')
  })
})

describe('P0-5: settlement INSERT succeeds with bound descriptions', () => {
  function settlementDispatcher(text: string): any[] {
    if (text.includes('COUNT(cp.id) as total_participants')) {
      return [
        {
          id: 'challenge-1',
          title: 'Test Challenge',
          reward_distribution: 'equal-split',
          failed_stake_cut: '20',
          host_contribution: '0',
          total_participants: '2',
          completed_participants: '1',
          failed_participants: '1',
          total_stakes: '100',
          failed_stakes: '50',
          completed_stakes: '50',
          total_entry_fees: '5',
        },
      ]
    }
    if (text.includes("completion_status = 'completed'")) {
      return [
        { participant_id: 'p-1', user_id: 'winner-1', stake_amount: '50', entry_fee_paid: '2.5' },
      ]
    }
    if (text.includes('SELECT status FROM challenges')) return [{ status: 'ended' }]
    if (text.includes('insurance_purchased = true')) return []
    return []
  }

  it('writes the challenge_reward ledger row and commits', async () => {
    dispatcher = settlementDispatcher

    const result = await distributeRewards('challenge-1', mockSql as any)

    expect(result.participant_rewards).toHaveLength(1)

    const rewardInsert = calls.find(
      (c) =>
        c.text.includes('INSERT INTO credit_transactions') &&
        c.values.includes('Challenge completion reward: Test Challenge'),
    )
    expect(rewardInsert).toBeDefined()
    // Description is a parameter, not part of the SQL text (the regression)
    expect(rewardInsert!.text).not.toContain('Challenge completion reward')
    expect(rewardInsert!.values).toContain('winner-1')

    expect(calls.some((c) => c.text.trim() === 'COMMIT')).toBe(true)
    expect(calls.some((c) => c.text.trim() === 'ROLLBACK')).toBe(false)
  })

  it('skips re-distribution when rewards were already distributed', async () => {
    dispatcher = (text) => {
      if (text.includes('SELECT status FROM challenges')) {
        return [{ status: 'rewards_distributed' }]
      }
      return settlementDispatcher(text)
    }

    await distributeRewards('challenge-1', mockSql as any)

    expect(calls.some((c) => c.text.includes('INSERT INTO credit_transactions'))).toBe(false)
  })
})

describe('P0-4: webhook signature is mandatory', () => {
  const env = process.env

  afterEach(() => {
    process.env = env
  })

  function webhookRequest(headers: Record<string, string> = {}) {
    return new NextRequest('http://localhost:3000/api/payments/webhook', {
      method: 'POST',
      body: JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed' }),
      headers: { 'Content-Type': 'application/json', ...headers },
    })
  }

  it('returns 503 when Stripe is not configured (never accepts unsigned JSON)', async () => {
    process.env = { ...env }
    delete process.env.STRIPE_SECRET_KEY
    delete process.env.STRIPE_WEBHOOK_SECRET

    const response = await webhookPost(webhookRequest())
    expect(response.status).toBe(503)
    expect(mockSql).not.toHaveBeenCalled()
  })

  it('returns 400 when the stripe-signature header is missing', async () => {
    process.env = { ...env, STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: 'whsec_x' }

    const response = await webhookPost(webhookRequest())
    expect(response.status).toBe(400)
    expect(mockSql).not.toHaveBeenCalled()
  })

  it('returns 400 when the signature does not verify', async () => {
    process.env = { ...env, STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: 'whsec_x' }

    const response = await webhookPost(
      webhookRequest({ 'stripe-signature': 't=1,v1=deadbeef' }),
    )
    expect(response.status).toBe(400)
    expect(mockSql).not.toHaveBeenCalled()
  })
})

describe('P0-6: Stripe idempotency', () => {
  it('creates the pending transaction with ON CONFLICT (stripe_payment_id)', async () => {
    dispatcher = (text) => {
      if (text.includes('SELECT title, entry_fee_percentage')) {
        return [{ title: 'Test Challenge', entry_fee_percentage: '5' }]
      }
      return []
    }

    await createCheckoutSession(mockSql as any, 'user-1', 'challenge-1', 50, {})

    const pendingInsert = calls.find((c) => c.text.includes('INSERT INTO transactions'))
    expect(pendingInsert).toBeDefined()
    expect(pendingInsert!.text).toContain('ON CONFLICT (stripe_payment_id) DO NOTHING')
  })

  it('processes a checkout event once and ignores the duplicate delivery', async () => {
    const processedEventIds = new Set<string>()
    dispatcher = (text, values) => {
      if (text.includes('SELECT id FROM webhook_events')) {
        return processedEventIds.has(values[0]) ? [{ id: values[0] }] : []
      }
      if (text.includes('INSERT INTO webhook_events')) {
        processedEventIds.add(values[0])
        return []
      }
      if (text.includes('FROM transactions')) {
        return [
          { user_id: 'user-1', challenge_id: 'challenge-1', amount: '52.5', platform_revenue: '2.5' },
        ]
      }
      if (text.includes('SELECT id FROM challenge_participants')) return []
      return []
    }

    const event = {
      id: 'evt_dup',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_123' } },
    }

    await processCheckoutCompleted(mockSql as any, event)
    const writesAfterFirst = calls.filter((c) =>
      c.text.includes('INSERT INTO challenge_participants'),
    ).length
    expect(writesAfterFirst).toBe(1)

    await processCheckoutCompleted(mockSql as any, event)
    const writesAfterSecond = calls.filter((c) =>
      c.text.includes('INSERT INTO challenge_participants'),
    ).length
    expect(writesAfterSecond).toBe(1)

    const statusUpdates = calls.filter((c) => c.text.includes('UPDATE transactions')).length
    expect(statusUpdates).toBe(1)
  })

  it('reconciles amounts from the stored pending row, never event metadata', async () => {
    dispatcher = (text) => {
      if (text.includes('SELECT id FROM webhook_events')) return []
      if (text.includes('FROM transactions')) {
        return [
          { user_id: 'user-1', challenge_id: 'challenge-1', amount: '52.5', platform_revenue: '2.5' },
        ]
      }
      if (text.includes('SELECT id FROM challenge_participants')) return []
      return []
    }

    await processCheckoutCompleted(mockSql as any, {
      id: 'evt_meta',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_456',
          // Attacker-influenced metadata must be ignored
          metadata: { userId: 'attacker', challengeId: 'challenge-1', stakeAmount: '99999' },
        },
      },
    })

    const participantInsert = calls.find((c) =>
      c.text.includes('INSERT INTO challenge_participants'),
    )!
    expect(participantInsert).toBeDefined()
    expect(participantInsert.values).toContain('user-1')
    expect(participantInsert.values).toContain(50) // 52.5 total − 2.5 fee
    expect(participantInsert.values).not.toContain('attacker')
    expect(participantInsert.values).not.toContain(99999)
  })
})
