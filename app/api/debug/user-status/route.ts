import { NextRequest, NextResponse } from 'next/server'
import { createDbConnection } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    console.log('🔍 Checking user status for:', email)

    const sql = await createDbConnection()
    
    // Check user's current status
    const users = await sql`
      SELECT 
        id,
        email,
        name,
        email_verified,
        email_verified_at,
        created_at,
        updated_at
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json({
        found: false,
        message: 'User not found'
      })
    }

    const user = users[0]
    
    console.log('👤 User found:', {
      id: user.id,
      email: user.email,
      emailVerified: user.email_verified,
      emailVerifiedAt: user.email_verified_at
    })

    // Check for pending verification tokens
    const tokens = await sql`
      SELECT 
        token,
        token_type,
        expires_at,
        created_at,
        used_at
      FROM verification_tokens 
      WHERE email = ${email} 
      AND token_type = 'email_verification'
      ORDER BY created_at DESC
      LIMIT 5
    `

    return NextResponse.json({
      found: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.email_verified,
        emailVerifiedAt: user.email_verified_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      verificationTokens: tokens.map(token => ({
        token: token.token.substring(0, 8) + '...',
        type: token.token_type,
        expiresAt: token.expires_at,
        createdAt: token.created_at,
        usedAt: token.used_at,
        isExpired: new Date() > new Date(token.expires_at),
        isUsed: !!token.used_at
      })),
      diagnosis: {
        canSignIn: user.email_verified === true,
        needsVerification: user.email_verified !== true,
        hasRecentTokens: tokens.length > 0
      }
    })

  } catch (error) {
    console.error('🚨 User status check failed:', error)
    return NextResponse.json({
      error: 'Failed to check user status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
