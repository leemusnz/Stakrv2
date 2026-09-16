import { Pool } from '@neondatabase/serverless'

export type TransactionSql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<any[]>

/**
 * Interactive transactions need a single checked-out connection. Separate
 * neon() HTTP calls containing BEGIN/COMMIT do not share a transaction.
 * Keep the pool request-scoped so no WebSocket survives a serverless request.
 */
export async function withTransaction<T>(work: (sql: TransactionSql) => Promise<T>): Promise<T> {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL environment variable is not set')
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 5000 })
  try {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query("SET LOCAL TIME ZONE 'UTC'")
      await client.query("SET LOCAL lock_timeout = '5s'")
      await client.query("SET LOCAL statement_timeout = '15s'")
      const sql: TransactionSql = async (strings, ...values) => {
        const text = strings.reduce((query, part, index) =>
          query + (index ? `$${index}` : '') + part, '')
        return (await client.query(text, values)).rows
      }
      const result = await work(sql)
      await client.query('COMMIT')
      return result
    } catch (error) {
      try { await client.query('ROLLBACK') } catch { /* Preserve the original failure. */ }
      throw error
    } finally {
      client.release()
    }
  } finally {
    // Disposal must not turn a committed join into an apparent failure.
    try { await pool.end() } catch { console.warn('Transaction connection cleanup failed') }
  }
}
