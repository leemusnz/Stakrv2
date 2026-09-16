import { joinChallenge } from '@/lib/challenge-join'

const sql = jest.fn()
jest.mock('@/lib/db/transaction', () => ({ withTransaction: (work: any) => work(sql) }))

let challenge: Record<string, any>
let canJoin: boolean
let balance: string
let duplicate: boolean
let count: number
const input = { stakeAmount: 50, pointsOnly: false, insurancePurchased: false }

beforeEach(() => {
  challenge = { title: 'Test', status: 'pending', min_stake: '0.01', max_stake: '100.00',
    allow_points_only: false, entry_fee_percentage: '5.00', proof_requirements: {}, max_participants: 10 }
  canJoin = true; balance = '100.00'; duplicate = false; count = 0
  sql.mockImplementation(async (strings: TemplateStringsArray) => {
    const text = strings.join('?')
    if (text.includes('SELECT c.*')) return [challenge]
    if (text.includes('AS can_join')) return [{ can_join: canJoin }]
    if (text.includes('SELECT id FROM challenge_participants')) return duplicate ? [{ id: 'existing' }] : []
    if (text.includes('COUNT(*)')) return [{ count }]
    if (text.includes('SELECT credits')) return [{ credits: balance }]
    if (text.includes('INSERT INTO challenge_participants')) return [{ id: 'participant', joined_at: '2026-09-16T00:00:00Z' }]
    if (text.includes('UPDATE users')) return [{ credits: '47.50' }]
    return []
  })
})

function writes() { return sql.mock.calls.filter(([strings]) => /INSERT|UPDATE users/.test(strings.join(' '))) }

it('returns the committed balance and numeric participant count, with an audit event', async () => {
  count = 3
  const result = await joinChallenge('challenge', 'user', input)
  expect(result.financial_breakdown.remaining_credits).toBe(47.5)
  expect(result.challenge_info.total_participants).toBe(4)
  const audit = sql.mock.calls.find(([strings]) => strings.join(' ').includes('INSERT INTO challenge_audit_events'))!
  expect(JSON.parse(audit.at(-1))).toMatchObject({ stakeCents: 5000, entryFeeCents: 250, entryFeeBps: 500 })
})

it.each(['suspended', 'cancelled', 'completed', 'ended', 'rewards_distributed'])('blocks %s challenges without writes', async status => {
  challenge.status = status
  await expect(joinChallenge('challenge', 'user', input)).rejects.toThrow('no longer accepting')
  expect(writes()).toHaveLength(0)
})

it('blocks an expired or started challenge', async () => {
  canJoin = false
  await expect(joinChallenge('challenge', 'user', input)).rejects.toThrow('when the challenge starts')
  expect(writes()).toHaveLength(0)
})

it('blocks a duplicate with no extra debit or ledger rows', async () => {
  duplicate = true
  await expect(joinChallenge('challenge', 'user', input)).rejects.toMatchObject({ status: 409 })
  expect(writes()).toHaveLength(0)
})

it('blocks a full challenge and insufficient funds', async () => {
  count = 10
  await expect(joinChallenge('challenge', 'user', input)).rejects.toThrow('full')
  count = 0; balance = '52.49'
  await expect(joinChallenge('challenge', 'user', input)).rejects.toThrow('Insufficient credits')
  expect(writes()).toHaveLength(0)
})

it('does not let pointsOnly bypass a stake debit', async () => {
  await expect(joinChallenge('challenge', 'user', { ...input, pointsOnly: true })).rejects.toThrow('requires a credit stake')
  expect(writes()).toHaveLength(0)
})

it('a genuine points-only join records no financial liability', async () => {
  challenge.allow_points_only = true
  const result = await joinChallenge('challenge', 'user', { ...input, pointsOnly: true })
  expect(result.financial_breakdown).toMatchObject({ stake_amount: 0, entry_fee: 0, insurance_fee: 0, total_cost: 0, remaining_credits: 100 })
  expect(sql.mock.calls.some(([strings]) => strings.join(' ').includes('INSERT INTO credit_transactions'))).toBe(false)
})

it.each([{ currency: 'CASH' }, '{bad json', [], { currency: 'UNKNOWN' }])('fails closed on payment metadata %p', async metadata => {
  challenge.proof_requirements = metadata
  await expect(joinChallenge('challenge', 'user', input)).rejects.toThrow()
  expect(writes()).toHaveLength(0)
})

it('rejects fractional cents before writes', async () => {
  await expect(joinChallenge('challenge', 'user', { ...input, stakeAmount: 50.001 })).rejects.toThrow('two decimal places')
  expect(writes()).toHaveLength(0)
})

it('propagates ledger failures so the transaction can roll back', async () => {
  const implementation = sql.getMockImplementation()!
  sql.mockImplementation(async (...args) => {
    if (args[0].join(' ').includes('INSERT INTO credit_transactions')) throw new Error('ledger unavailable')
    return implementation(...args)
  })
  await expect(joinChallenge('challenge', 'user', input)).rejects.toThrow('ledger unavailable')
  expect(sql.mock.calls.some(([strings]) => strings.join(' ').includes('INSERT INTO challenge_audit_events'))).toBe(false)
})
