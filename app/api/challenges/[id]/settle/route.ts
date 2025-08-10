import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { distributeRewards } from '@/lib/reward-calculation'
import { createDbConnection } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: challengeId } = await params

    // Authorization: only host or admin may settle
    const sql = await createDbConnection()
    const rows = await sql`
      SELECT host_id FROM challenges WHERE id = ${challengeId}
    `
    const isHost = rows.length > 0 && String(rows[0].host_id) === String(session.user.id)
    const isAdmin = (session.user as any)?.role === 'admin' || (session.user as any)?.is_admin === true
    if (!isHost && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const result = await distributeRewards(challengeId)

    return NextResponse.json({ success: true, settlement: result })
  } catch (error) {
    return NextResponse.json({ error: 'Settlement failed' }, { status: 500 })
  }
}


