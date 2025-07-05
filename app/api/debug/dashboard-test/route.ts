import { NextRequest, NextResponse } from 'next/server'
import { createDbConnection } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'No session',
        userExists: false,
        userId: null
      })
    }

    const sql = await createDbConnection()
    
    // Test basic user lookup
    const userProfile = await sql`
      SELECT id, email, name, credits
      FROM users 
      WHERE id = ${session.user.id}
      LIMIT 1
    `
    
    if (userProfile.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found in database',
        userId: session.user.id,
        userEmail: session.user.email
      })
    }

    // Test table existence
    const tableTests = {
      challenges: false,
      challenge_participants: false,
      transactions: false,
      notifications: false
    }

    try {
      await sql`SELECT 1 FROM challenges LIMIT 1`
      tableTests.challenges = true
    } catch (e) {
      // Table doesn't exist or query failed
    }

    try {
      await sql`SELECT 1 FROM challenge_participants LIMIT 1`
      tableTests.challenge_participants = true
    } catch (e) {
      // Table doesn't exist or query failed
    }

    try {
      await sql`SELECT 1 FROM transactions LIMIT 1`
      tableTests.transactions = true
    } catch (e) {
      // Table doesn't exist or query failed
    }

    try {
      await sql`SELECT 1 FROM notifications LIMIT 1`
      tableTests.notifications = true
    } catch (e) {
      // Table doesn't exist or query failed
    }

    return NextResponse.json({
      success: true,
      user: userProfile[0],
      tableTests,
      message: 'Debug test successful'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Debug test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack'
    })
  }
} 