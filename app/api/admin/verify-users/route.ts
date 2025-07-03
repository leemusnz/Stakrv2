import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { systemLogger } from '@/lib/system-logger'

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin access required'
      }, { status: 403 })
    }

    const body = await request.json()
    const { email, verifyAll } = body

    const sql = await createDbConnection()

    if (verifyAll) {
      // Verify all unverified users (be careful with this!)
      const result = await sql`
        UPDATE users 
        SET email_verified = true, email_verified_at = NOW(), updated_at = NOW()
        WHERE email_verified = false OR email_verified IS NULL
        RETURNING email
      `

      console.log(`✅ Admin verified ${result.length} users`)
      systemLogger.info(`Admin ${session.user.email} verified ${result.length} users`, 'admin')

      return NextResponse.json({
        success: true,
        message: `Successfully verified ${result.length} users`,
        verifiedEmails: result.map(user => user.email)
      })
    } else if (email) {
      // Verify specific user
      const result = await sql`
        UPDATE users 
        SET email_verified = true, email_verified_at = NOW(), updated_at = NOW()
        WHERE email = ${email} AND (email_verified = false OR email_verified IS NULL)
        RETURNING email, name
      `

      if (result.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'User not found',
          message: 'User not found or already verified'
        }, { status: 404 })
      }

      console.log(`✅ Admin verified user: ${email}`)
      systemLogger.info(`Admin ${session.user.email} verified user: ${email}`, 'admin')

      return NextResponse.json({
        success: true,
        message: `Successfully verified user: ${email}`,
        user: result[0]
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Missing parameters',
        message: 'Provide either email or verifyAll=true'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Admin user verification failed:', error)
    systemLogger.error('Admin user verification failed', 'admin', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    
    return NextResponse.json({
      success: false,
      error: 'Verification failed',
      message: 'Failed to verify users',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// GET endpoint to list unverified users
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin access required'
      }, { status: 403 })
    }

    const sql = await createDbConnection()

    // Get list of unverified users
    const unverifiedUsers = await sql`
      SELECT email, name, created_at
      FROM users 
      WHERE email_verified = false OR email_verified IS NULL
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      success: true,
      count: unverifiedUsers.length,
      users: unverifiedUsers
    })

  } catch (error) {
    console.error('❌ Failed to fetch unverified users:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Fetch failed',
      message: 'Failed to fetch unverified users'
    }, { status: 500 })
  }
} 