import { withTransaction } from '@/lib/db/transaction'
import { Pool } from '@neondatabase/serverless'

const query = jest.fn()
const release = jest.fn()
const end = jest.fn()
const connect = jest.fn()
jest.mock('@neondatabase/serverless', () => ({
  Pool: jest.fn(() => ({ connect, end })),
}))

beforeEach(() => {
  ;(Pool as unknown as jest.Mock).mockImplementation(() => ({ connect, end }))
  query.mockResolvedValue({ rows: [] })
  connect.mockResolvedValue({ query, release })
  end.mockResolvedValue(undefined)
})

it('binds SQL values and commits on the same checked-out client', async () => {
  await withTransaction(async sql => {
    await sql`INSERT INTO audit (reason, amount) VALUES (${'literal $1 and quote\''}, ${'1.00'})`
  })
  expect(query).toHaveBeenCalledWith('INSERT INTO audit (reason, amount) VALUES ($1, $2)', ["literal $1 and quote'", '1.00'])
  expect(query.mock.calls[0][0]).toBe('BEGIN')
  expect(query.mock.calls.at(-1)?.[0]).toBe('COMMIT')
  expect(connect).toHaveBeenCalledTimes(1)
  expect(release).toHaveBeenCalledTimes(1)
  expect(end).toHaveBeenCalledTimes(1)
})

it('rolls back a write failure and releases the connection', async () => {
  const failure = new Error('ledger write failed')
  await expect(withTransaction(async sql => {
    await sql`UPDATE users SET credits = 0`
    throw failure
  })).rejects.toBe(failure)
  expect(query.mock.calls.at(-1)?.[0]).toBe('ROLLBACK')
  expect(query.mock.calls.some(([text]) => text === 'COMMIT')).toBe(false)
  expect(release).toHaveBeenCalledTimes(1)
  expect(end).toHaveBeenCalledTimes(1)
})

it('closes the pool if connecting fails', async () => {
  connect.mockRejectedValue(new Error('unavailable'))
  await expect(withTransaction(async () => 1)).rejects.toThrow('unavailable')
  expect(end).toHaveBeenCalledTimes(1)
})
