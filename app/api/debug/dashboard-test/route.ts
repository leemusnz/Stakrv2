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
    
    // The issue: session.user.id is "116681594226615175759" (numeric string)
    // But database expects UUID format for id column
    
    let userProfile = []
    let lookupMethod = ''
    
    // Try to find user by email instead of ID (since ID format is wrong)
    try {
      userProfile = await sql`
        SELECT id, email, name, credits, avatar_url, created_at
        FROM users 
        WHERE email = ${session.user.email}
        LIMIT 1
      `
      lookupMethod = 'email'
    } catch (emailError) {
      return NextResponse.json({
        success: false,
        error: 'Email lookup failed',
        userId: session.user.id,
        userEmail: session.user.email,
        emailError: emailError instanceof Error ? emailError.message : 'Unknown error'
      })
    }
    
    if (userProfile.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found by email',
        userId: session.user.id,
        userEmail: session.user.email,
        lookupMethod,
        message: 'User needs to be created with proper UUID format'
      })
    }

    const user = userProfile[0]
    
    // Test table existence with proper user ID (UUID)
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
      message: 'User found by email (ID format was incompatible)',
      issue: {
        description: 'Session user ID is numeric string, database expects UUID',
        sessionUserId: session.user.id,
        sessionUserIdType: typeof session.user.id,
        databaseUserId: user.id,
        databaseUserIdType: typeof user.id,
        solution: 'User authentication needs to be updated to use UUID from database'
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        avatar: user.avatar_url,
        createdAt: user.created_at
      },
      tableTests,
      lookupMethod
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
