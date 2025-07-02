import { NextRequest, NextResponse } from 'next/server'
import { createDbConnection } from '@/lib/db'
import { systemLogger } from '@/lib/system-logger'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// Validation schema for password reset
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password confirmation is required')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validationResult = resetPasswordSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.issues
      }, { status: 400 })
    }

    const { token, password } = validationResult.data

    const sql = await createDbConnection()

    // Verify the reset token
    const verificationResult = await sql`
      SELECT * FROM verify_token(${token}, 'password_reset')
    `

    const result = verificationResult[0]

    if (!result.success) {
      console.log('❌ Password reset failed:', result.message)
      systemLogger.warning(`Password reset failed: ${result.message}`, 'auth')
      
      return NextResponse.json({
        success: false,
        error: 'Reset failed',
        message: result.message
      }, { status: 400 })
    }

    // Hash the new password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Update user's password
    const updateResult = await sql`
      UPDATE users 
      SET password_hash = ${passwordHash}, updated_at = NOW() 
      WHERE id = ${result.user_id}
      RETURNING email, name
    `

    if (updateResult.length === 0) {
      console.error('❌ Failed to update password for user:', result.user_id)
      systemLogger.error('Failed to update password', 'auth', { userId: result.user_id })
      
      return NextResponse.json({
        success: false,
        error: 'Update failed',
        message: 'Failed to update password. Please try again.'
      }, { status: 500 })
    }

    const updatedUser = updateResult[0]

    console.log('✅ Password reset successful for:', updatedUser.email)
    systemLogger.info(`Password reset successful for user: ${updatedUser.email}`, 'auth')

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Password reset successfully! You can now sign in with your new password.',
      email: updatedUser.email
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Password reset error:', error)
    systemLogger.error('Password reset error', 'auth', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    
    return NextResponse.json({
      success: false,
      error: 'Reset failed',
      message: 'An error occurred during password reset. Please try again.',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// Also support GET to validate token before showing form
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Missing reset token',
        message: 'No reset token provided'
      }, { status: 400 })
    }

    const sql = await createDbConnection()

    // Check if token is valid without marking it as used
    const tokenCheck = await sql`
      SELECT email, expires_at, used_at 
      FROM verification_tokens 
      WHERE token = ${token} AND type = 'password_reset'
    `

    if (tokenCheck.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid token',
        message: 'Invalid or expired reset token'
      }, { status: 400 })
    }

    const tokenData = tokenCheck[0]

    // Check if token is already used
    if (tokenData.used_at) {
      return NextResponse.json({
        success: false,
        error: 'Token used',
        message: 'This reset link has already been used'
      }, { status: 400 })
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Token expired',
        message: 'This reset link has expired. Please request a new one.'
      }, { status: 400 })
    }

    // Token is valid
    return NextResponse.json({
      success: true,
      message: 'Reset token is valid',
      email: tokenData.email
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Token validation error:', error)
    systemLogger.error('Token validation error', 'auth', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    
    return NextResponse.json({
      success: false,
      error: 'Validation failed',
      message: 'An error occurred while validating the reset token.',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
