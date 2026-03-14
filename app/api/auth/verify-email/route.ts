import { NextRequest, NextResponse } from 'next/server'
import { createDbConnection } from '@/lib/db'
import { systemLogger } from '@/lib/system-logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Missing verification token',
        message: 'No verification token provided'
      }, { status: 400 })
    }

    const sql = await createDbConnection()

    // Verify the token directly with database operations
    // First, check if the token exists and is valid
    const tokenResult = await sql`
      SELECT user_id, email, expires_at 
      FROM verification_tokens 
      WHERE token = ${token} 
        AND type = 'email_verification' 
        AND expires_at > NOW()
    `

    if (tokenResult.length === 0) {
      systemLogger.warning(`Email verification failed: Invalid or expired token`, 'auth')
      
      return NextResponse.json({
        success: false,
        error: 'Verification failed',
        message: 'Invalid or expired verification token'
      }, { status: 400 })
    }

    const tokenData = tokenResult[0]
    const userId = tokenData.user_id
    const email = tokenData.email

    // Update user's email verification status
    await sql`
      UPDATE users 
      SET email_verified = true, email_verified_at = NOW()
      WHERE id = ${userId}
    `

    // Delete the used token
    await sql`
      DELETE FROM verification_tokens 
      WHERE token = ${token}
    `

    systemLogger.info(`Email verified successfully for user: ${email}`, 'auth')

    // Award XP for email verification completion
    try {
      const xpAwardResult = await sql`
        SELECT award_xp(
          ${userId}::UUID,
          50,
          'email_verification',
          NULL,
          'Email verification completed - Welcome to Stakr!'
        )
      `
      
      if (xpAwardResult[0]?.award_xp) {
        systemLogger.info(`Awarded 50 XP for email verification to user: ${email}`, 'xp')
      } else {
      }
    } catch (xpError) {
      console.error('❌ Failed to award XP for email verification:', xpError)
      // Don't fail email verification if XP award fails
    }

    // Return success response with user ID for automatic sign-in
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You are now signed in. +50 XP earned!',
      email: email,
      userId: userId,
      xpAwarded: 50
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Email verification error:', error)
    systemLogger.error('Email verification error', 'auth', { error: error instanceof Error ? error.message : 'Unknown error' })
    
    return NextResponse.json({
      success: false,
      error: 'Verification failed',
      message: 'An error occurred during email verification. Please try again.',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// Also support POST for form submissions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Missing verification token',
        message: 'No verification token provided'
      }, { status: 400 })
    }

    const sql = await createDbConnection()

    // Verify the token directly with database operations
    // First, check if the token exists and is valid
    const tokenResult = await sql`
      SELECT user_id, email, expires_at 
      FROM verification_tokens 
      WHERE token = ${token} 
        AND type = 'email_verification' 
        AND expires_at > NOW()
    `

    if (tokenResult.length === 0) {
      systemLogger.warning(`Email verification failed: Invalid or expired token`, 'auth')
      
      return NextResponse.json({
        success: false,
        error: 'Verification failed',
        message: 'Invalid or expired verification token'
      }, { status: 400 })
    }

    const tokenData = tokenResult[0]
    const userId = tokenData.user_id
    const email = tokenData.email

    // Update user's email verification status
    await sql`
      UPDATE users 
      SET email_verified = true, email_verified_at = NOW()
      WHERE id = ${userId}
    `

    // Delete the used token
    await sql`
      DELETE FROM verification_tokens 
      WHERE token = ${token}
    `

    systemLogger.info(`Email verified successfully for user: ${email}`, 'auth')

    // Award XP for email verification completion
    try {
      const xpAwardResult = await sql`
        SELECT award_xp(
          ${userId}::UUID,
          50,
          'email_verification',
          NULL,
          'Email verification completed - Welcome to Stakr!'
        )
      `
      
      if (xpAwardResult[0]?.award_xp) {
        systemLogger.info(`Awarded 50 XP for email verification to user: ${email}`, 'xp')
      } else {
      }
    } catch (xpError) {
      console.error('❌ Failed to award XP for email verification:', xpError)
      // Don't fail email verification if XP award fails
    }

    // Return success response with user ID for automatic sign-in
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You are now signed in. +50 XP earned!',
      email: email,
      userId: userId,
      xpAwarded: 50
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Email verification error:', error)
    systemLogger.error('Email verification error', 'auth', { error: error instanceof Error ? error.message : 'Unknown error' })
    
    return NextResponse.json({
      success: false,
      error: 'Verification failed',
      message: 'An error occurred during email verification. Please try again.',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
