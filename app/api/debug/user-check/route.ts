import { NextRequest, NextResponse } from 'next/server'
import { createDbConnection } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    console.log('🔍 Diagnostic check for user:', email)
    
    // Check database connection
    let dbConnected = false
    let dbError = null
    try {
      const sql = await createDbConnection()
      await sql`SELECT 1`
      dbConnected = true
      console.log('✅ Database connection successful')
    } catch (error) {
      dbError = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Database connection failed:', dbError)
    }

    if (!dbConnected) {
      return NextResponse.json({
        success: false,
        dbConnected: false,
        dbError,
        message: 'Database connection failed'
      })
    }

    // Look up user
    const sql = await createDbConnection()
    const users = await sql`
      SELECT 
        id, 
        email, 
        name, 
        username,
        password_hash,
        email_verified,
        created_at
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    `

    if (users.length === 0) {
      console.log('❌ User not found in database:', email)
      return NextResponse.json({
        success: false,
        userExists: false,
        dbConnected: true,
        message: `User ${email} not found in database. Did you register with this email?`
      })
    }

    const user = users[0]
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      emailVerified: user.email_verified,
      hasPasswordHash: !!user.password_hash,
      passwordHashLength: user.password_hash?.length || 0,
      createdAt: user.created_at
    })

    // Test password if provided
    let passwordTest = null
    if (password && user.password_hash) {
      try {
        const isValid = await bcrypt.compare(password, user.password_hash)
        passwordTest = {
          isValid,
          method: 'bcrypt',
          hashPreview: user.password_hash.substring(0, 20) + '...'
        }
        console.log('🔑 Password test result:', isValid ? '✅ Valid' : '❌ Invalid')
      } catch (bcryptError) {
        passwordTest = {
          error: bcryptError instanceof Error ? bcryptError.message : 'Unknown error',
          method: 'bcrypt failed'
        }
        console.error('❌ bcrypt comparison failed:', bcryptError)
      }
    } else if (password) {
      passwordTest = {
        error: 'No password hash stored in database',
        method: 'no hash'
      }
    }

    return NextResponse.json({
      success: true,
      dbConnected: true,
      userExists: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
        hasPasswordHash: !!user.password_hash,
        passwordHashLength: user.password_hash?.length || 0
      },
      passwordTest,
      message: 'User found and checked successfully'
    })

  } catch (error) {
    console.error('❌ User diagnostic failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Diagnostic failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}