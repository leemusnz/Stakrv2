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

    // Verify the token using our database function
    const verificationResult = await sql`
      SELECT * FROM verify_token(${token}, 'email_verification')
    `

    const result = verificationResult[0]

    if (!result.success) {
      console.log('❌ Email verification failed:', result.message)
      systemLogger.warning(`Email verification failed: ${result.message}`, 'auth')
      
      return NextResponse.json({
        success: false,
        error: 'Verification failed',
        message: result.message
      }, { status: 400 })
    }

    console.log('✅ Email verified successfully for:', result.email)
    systemLogger.info(`Email verified successfully for user: ${result.email}`, 'auth')

    // Award XP for email verification completion
    try {
      const xpAwardResult = await sql`
        SELECT award_xp(
          ${result.user_id}::UUID,
          50,
          'email_verification',
          NULL,
          'Email verification completed - Welcome to Stakr!'
        )
      `
      
      if (xpAwardResult[0]?.award_xp) {
        console.log('🎯 Awarded 50 XP for email verification to user:', result.email)
        systemLogger.info(`Awarded 50 XP for email verification to user: ${result.email}`, 'xp')
      } else {
        console.log('⚠️ XP already awarded for email verification to user:', result.email)
      }
    } catch (xpError) {
      console.error('❌ Failed to award XP for email verification:', xpError)
      // Don't fail email verification if XP award fails
    }

    // Return success response with user ID for automatic sign-in
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You are now signed in. +50 XP earned!',
      email: result.email,
      userId: result.user_id,
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

    // Verify the token using our database function
    const verificationResult = await sql`
      SELECT * FROM verify_token(${token}, 'email_verification')
    `

    const result = verificationResult[0]

    if (!result.success) {
      console.log('❌ Email verification failed:', result.message)
      systemLogger.warning(`Email verification failed: ${result.message}`, 'auth')
      
      return NextResponse.json({
        success: false,
        error: 'Verification failed',
        message: result.message
      }, { status: 400 })
    }

    console.log('✅ Email verified successfully for:', result.email)
    systemLogger.info(`Email verified successfully for user: ${result.email}`, 'auth')

    // Award XP for email verification completion
    try {
      const xpAwardResult = await sql`
        SELECT award_xp(
          ${result.user_id}::UUID,
          50,
          'email_verification',
          NULL,
          'Email verification completed - Welcome to Stakr!'
        )
      `
      
      if (xpAwardResult[0]?.award_xp) {
        console.log('🎯 Awarded 50 XP for email verification to user:', result.email)
        systemLogger.info(`Awarded 50 XP for email verification to user: ${result.email}`, 'xp')
      } else {
        console.log('⚠️ XP already awarded for email verification to user:', result.email)
      }
    } catch (xpError) {
      console.error('❌ Failed to award XP for email verification:', xpError)
      // Don't fail email verification if XP award fails
    }

    // Return success response with user ID for automatic sign-in
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You are now signed in. +50 XP earned!',
      email: result.email,
      userId: result.user_id,
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
