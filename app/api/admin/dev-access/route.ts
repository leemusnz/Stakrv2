import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { z } from 'zod'

const devAccessSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(['grant', 'revoke']),
  reason: z.string().min(1).max(500)
})

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { userId, action, reason } = devAccessSchema.parse(body)

    // Connect to database
    const sql = await createDbConnection()

    // Update user's dev access
    const isDev = action === 'grant'
    const updatedUser = await sql`
      UPDATE users 
      SET 
        is_dev = ${isDev},
        dev_access_granted_by = ${isDev ? session.user.id : null},
        dev_access_granted_at = ${isDev ? new Date() : null},
        updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, email, name, is_dev, dev_mode_enabled
    `

    if (updatedUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Log admin action
    await sql`
      INSERT INTO admin_actions (
        admin_id,
        action_type,
        target_user_id,
        old_values,
        new_values,
        reason,
        created_at
      ) VALUES (
        ${session.user.id},
        ${action === 'grant' ? 'GRANT_DEV_ACCESS' : 'REVOKE_DEV_ACCESS'},
        ${userId},
        ${{ isDev: !isDev }},
        ${{ isDev }},
        ${reason},
        NOW()
      )
    `

    const user = updatedUser[0]
    return NextResponse.json({
      success: true,
      message: `Dev access ${action === 'grant' ? 'granted to' : 'revoked from'} ${user.email}`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isDev: user.is_dev,
        devModeEnabled: user.dev_mode_enabled
      }
    })

  } catch (error) {
    console.error('Dev access management error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Failed to manage dev access' }, { status: 500 })
  }
}

// Get list of all users with their dev access status (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const sql = await createDbConnection()
    const users = await sql`
      SELECT 
        id,
        email, 
        name,
        is_dev,
        dev_mode_enabled,
        dev_access_granted_at,
        created_at
      FROM users 
      ORDER BY is_dev DESC, created_at DESC
    `

    return NextResponse.json({
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        isDev: user.is_dev,
        devModeEnabled: user.dev_mode_enabled,
        devAccessGrantedAt: user.dev_access_granted_at,
        createdAt: user.created_at
      }))
    })

  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
