import { NextRequest, NextResponse } from 'next/server'
import { createDbConnection } from '@/lib/db'
import { sendEmail, createPasswordResetEmail, generateResetToken } from '@/lib/email'
import { systemLogger } from '@/lib/system-logger'
import { z } from 'zod'

// Validation schema for forgot password
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validationResult = forgotPasswordSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.issues
      }, { status: 400 })
    }

    const { email } = validationResult.data

    const sql = await createDbConnection()

    // Check if user exists
    const users = await sql`
      SELECT id, name, email, email_verified FROM users WHERE email = ${email}
    `

    // Always return success to avoid email enumeration attacks
    // But only send email if user actually exists
    if (users.length > 0) {
      const user = users[0]

      // Check if email is verified (security measure)
      if (!user.email_verified) {
        console.log('🚫 Password reset denied for unverified email:', email)
        systemLogger.warning(`Password reset attempted for unverified email: ${email}`, 'auth')
        
        return NextResponse.json({
          success: false,
          error: 'Email not verified',
          message: 'Please verify your email address before requesting a password reset.'
        }, { status: 400 })
      }

      // Generate reset token
      const resetToken = generateResetToken()
      
      try {
        // Store reset token in database (expires in 1 hour)
        await sql`
          SELECT create_verification_token(${email}, ${resetToken}, 'password_reset', 1)
        `

        // Send password reset email
        const emailTemplate = createPasswordResetEmail(email, resetToken, user.name)
        const emailResult = await sendEmail(emailTemplate)

        if (!emailResult.success) {
          console.error('❌ Failed to send password reset email:', emailResult.error)
          systemLogger.error('Failed to send password reset email', 'auth', { 
            email, 
            error: emailResult.error 
          })
          
          return NextResponse.json({
            success: false,
            error: 'Email sending failed',
            message: 'Unable to send password reset email. Please try again later.'
          }, { status: 500 })
        }

        console.log('✅ Password reset email sent to:', email)
        systemLogger.info(`Password reset email sent to user: ${email}`, 'auth')

      } catch (emailError) {
        console.error('❌ Password reset setup failed:', emailError)
        systemLogger.error('Password reset setup failed', 'auth', { 
          email, 
          error: emailError instanceof Error ? emailError.message : 'Unknown error' 
        })
        
        return NextResponse.json({
          success: false,
          error: 'Reset setup failed',
          message: 'Unable to process password reset. Please try again later.'
        }, { status: 500 })
      }
    } else {
      console.log('🔍 Password reset requested for non-existent email:', email)
      systemLogger.info(`Password reset requested for non-existent email: ${email}`, 'auth')
    }

    // Always return success message to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, we have sent you a password reset link.',
      email: email
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Forgot password error:', error)
    systemLogger.error('Forgot password error', 'auth', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    
    return NextResponse.json({
      success: false,
      error: 'Request failed',
      message: 'An error occurred while processing your request. Please try again.',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
} 