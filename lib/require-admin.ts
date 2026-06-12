import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'

export type AdminCheck =
  | { ok: true; session: Session; userId: string }
  | { ok: false; response: NextResponse }

/**
 * Single authorization gate for admin endpoints.
 *
 * Requires a session AND a live is_dev/has_dev_access flag on the user's
 * database row — never a hardcoded email and never a stale JWT claim alone,
 * so revoking the flag takes effect immediately.
 *
 * Usage in a route handler:
 *   const admin = await requireAdmin()
 *   if (!admin.ok) return admin.response
 */
export async function requireAdmin(): Promise<AdminCheck> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    }
  }

  try {
    const sql = createDbConnection()
    const rows = await sql`
      SELECT is_dev, has_dev_access FROM users WHERE id = ${session.user.id}
    `
    if (!rows[0]?.is_dev && !rows[0]?.has_dev_access) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Admin access required' }, { status: 403 }),
      }
    }
  } catch (error) {
    console.error('requireAdmin: authorization check failed:', error)
    return {
      ok: false,
      response: NextResponse.json({ error: 'Authorization check failed' }, { status: 500 }),
    }
  }

  return { ok: true, session, userId: session.user.id }
}
