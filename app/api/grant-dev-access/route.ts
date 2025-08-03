import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔧 Granting dev access to user:', session.user.email)

    const sql = await createDbConnection()

    // Update user to have dev access
    const result = await sql`
      UPDATE users 
      SET 
        is_dev = true,
        has_dev_access = true,
        dev_access_granted_by = ${session.user.id},
        dev_access_granted_at = NOW(),
        updated_at = NOW()
      WHERE id = ${session.user.id}
      RETURNING id, email, name, is_dev, has_dev_access, dev_mode_enabled
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = result[0]
    
    console.log('✅ Dev access granted to:', user.email)

    return NextResponse.json({
      success: true,
      message: `Dev access granted to ${user.email}`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isDev: user.is_dev,
        hasDevAccess: user.has_dev_access,
        devModeEnabled: user.dev_mode_enabled
      }
    })

  } catch (error) {
    console.error('Failed to grant dev access:', error)
    return NextResponse.json({ 
      error: 'Failed to grant dev access',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// GET endpoint to check current user's dev access status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sql = await createDbConnection()
    
    const result = await sql`
      SELECT id, email, name, is_dev, has_dev_access, dev_mode_enabled
      FROM users 
      WHERE id = ${session.user.id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = result[0]

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isDev: user.is_dev,
        hasDevAccess: user.has_dev_access,
        devModeEnabled: user.dev_mode_enabled
      }
    })

  } catch (error) {
    console.error('Failed to check dev access:', error)
    return NextResponse.json({ error: 'Failed to check dev access' }, { status: 500 })
  }
} 