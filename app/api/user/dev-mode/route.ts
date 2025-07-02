import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { z } from 'zod'
import { isDemoUser, getDemoUserData } from '@/lib/demo-data'
import { shouldUseDemoData, createDemoResponse } from '@/lib/demo-mode'

const devModeSchema = z.object({
  enabled: z.boolean()
})

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and has dev access
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Hybrid demo system: new demo mode OR legacy demo users
    if (shouldUseDemoData(request, session) || isDemoUser(session.user.id)) {
      const isAdmin = session.user.isAdmin || session.user.email === 'alex@stakr.app'
      
      if (!isAdmin) {
        return NextResponse.json({ 
          error: 'Dev access required. Contact an admin to grant dev access.' 
        }, { status: 403 })
      }

      // Parse request body
      const body = await request.json()
      const { enabled } = devModeSchema.parse(body)

      // For demo users, return mock success response
      return NextResponse.json(createDemoResponse({
        success: true,
        message: `Dev mode ${enabled ? 'enabled' : 'disabled'}`,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          isDev: true,
          devModeEnabled: enabled
        }
      }, request, session))
    }

    // For real users, check dev access
    if (!session.user.isDev) {
      return NextResponse.json({ 
        error: 'Dev access required. Contact an admin to grant dev access.' 
      }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { enabled } = devModeSchema.parse(body)

    // Connect to database
    const sql = await createDbConnection()

    // Update user's dev mode status
    const updatedUser = await sql`
      UPDATE users 
      SET 
        dev_mode_enabled = ${enabled},
        updated_at = NOW()
      WHERE id = ${session.user.id}
      RETURNING id, email, name, is_dev, dev_mode_enabled
    `

    if (updatedUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = updatedUser[0]
    return NextResponse.json({
      success: true,
      message: `Dev mode ${enabled ? 'enabled' : 'disabled'}`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isDev: user.is_dev,
        devModeEnabled: user.dev_mode_enabled
      }
    })

  } catch (error) {
    console.error('Dev mode toggle error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Failed to toggle dev mode' }, { status: 500 })
  }
}

// Get current dev mode status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Hybrid demo system: new demo mode OR legacy demo users
    if (shouldUseDemoData(request, session) || isDemoUser(session.user.id)) {
      const isAdmin = session.user.isAdmin || session.user.email === 'alex@stakr.app'
      
      return NextResponse.json(createDemoResponse({
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          isDev: isAdmin,
          devModeEnabled: false,
          devAccessGrantedAt: isAdmin ? new Date('2024-01-01') : null
        }
      }, request, session))
    }

    // For real users, query database
    const sql = await createDbConnection()
    const users = await sql`
      SELECT 
        id,
        email, 
        name,
        is_dev,
        dev_mode_enabled,
        dev_access_granted_at
      FROM users 
      WHERE id = ${session.user.id}
      LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = users[0]
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isDev: user.is_dev,
        devModeEnabled: user.dev_mode_enabled,
        devAccessGrantedAt: user.dev_access_granted_at
      }
    })

  } catch (error) {
    console.error('Failed to fetch dev mode status:', error)
    return NextResponse.json({ error: 'Failed to fetch dev mode status' }, { status: 500 })
  }
}
