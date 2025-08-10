import { jest } from '@jest/globals'

// Helpers to build minimal request objects
const makeJsonRequest = (body: any) => ({
  json: async () => body,
  headers: new Headers({ 'content-type': 'application/json' }),
}) as any

const makeTextRequest = (raw: string) => ({
  text: async () => raw,
  headers: new Headers({ 'stripe-signature': 't=0,v1=dummy' }),
}) as any

describe('Payments flow (Stripe)', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('creates a checkout session (mock when no STRIPE_SECRET_KEY)', async () => {
    process.env.STRIPE_SECRET_KEY = '' // force mock path
    process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'

    // Mock session
    jest.unstable_mockModule('next-auth', () => ({
      getServerSession: jest.fn(async () => ({ user: { id: 'user-1' } })),
    }))
    // Mock next/server to avoid requiring Web Request in tests
    jest.unstable_mockModule('next/server', () => ({
      NextResponse: {
        json: (body: any, init?: any) => ({ json: async () => body, status: init?.status ?? 200 }),
      },
    }))

    // Capture SQL calls and mock responses
    const sqlCalls: any[] = []
    const sqlMock = (strings: TemplateStringsArray, ...values: any[]) => {
      const text = strings.join('?')
      sqlCalls.push({ text, values })
      if (text.includes('FROM challenges')) {
        return Promise.resolve([{ title: 'Test Challenge', entry_fee_percentage: 5 }])
      }
      return Promise.resolve([])
    }
    jest.unstable_mockModule('@/lib/db', () => ({
      createDbConnection: jest.fn(async () => sqlMock),
    }))

    const { createCheckoutSession } = await import('@/lib/payments-service')
    const result = await createCheckoutSession(sqlMock as any, 'user-1', 'ch_1', 10, {
      NEXT_PUBLIC_BASE_URL: 'https://example.com',
    })
    expect(result.success).toBe(true)
    expect(result.sessionId).toBeDefined()
    expect(result.checkoutUrl).toBeDefined()
    expect(sqlCalls.some(c => /INSERT INTO transactions/.test(c.text))).toBe(true)
  })

  it('finalizes on webhook checkout.session.completed (idempotent)', async () => {
    process.env.STRIPE_SECRET_KEY = '' // force dev path (no signature verify)

    // Capture SQL calls with simple router
    const sqlCalls: any[] = []
    const sqlMock = (strings: TemplateStringsArray, ...values: any[]) => {
      const text = strings.join('?')
      sqlCalls.push({ text, values })
      if (text.includes('FROM challenge_participants')) {
        // first call returns none (no existing participant)
        const already = sqlCalls.filter(c => c.text.includes('FROM challenge_participants')).length
        return Promise.resolve(already > 1 ? [{ id: 'cp_1' }] : [])
      }
      if (text.includes('FROM challenges')) {
        return Promise.resolve([{ title: 'Test', entry_fee_percentage: 5 }])
      }
      return Promise.resolve([])
    }
    jest.unstable_mockModule('@/lib/db', () => ({
      createDbConnection: jest.fn(async () => sqlMock),
    }))

    // Mock next/server to avoid requiring Web Request in tests
    jest.unstable_mockModule('next/server', () => ({
      NextResponse: {
        json: (body: any, init?: any) => ({ json: async () => body, status: init?.status ?? 200 }),
      },
    }))
    const { processCheckoutCompleted } = await import('@/lib/payments-service')
    const event = {
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_1',
          metadata: { userId: 'user-1', challengeId: 'ch_1', stakeAmount: '10' },
        },
      },
    }

    const j1 = await processCheckoutCompleted(sqlMock as any, event as any)
    expect(j1.success).toBe(true)

    // Should insert participant and update transaction
    expect(sqlCalls.some(c => /INSERT INTO challenge_participants/.test(c.text))).toBe(true)
    expect(sqlCalls.some(c => /UPDATE transactions SET status = 'succeeded'/.test(c.text))).toBe(true)

    // Idempotent on replay
    const j2 = await processCheckoutCompleted(sqlMock as any, { ...event, id: 'evt_1' } as any)
    expect(j2.success).toBe(true)
  })
})


