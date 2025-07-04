import { NextRequest, NextResponse } from 'next/server'
import { createDbConnection } from '@/lib/db'
import { sendEmail, createVerificationEmail, generateVerificationToken } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'Email address is required'
      }, { status: 400 })
    }

    console.log('🔄 Resending verification email for:', email)

    // Check if user exists and is not already verified
    const sql = await createDbConnection()
    const users = await sql`
      SELECT id, email, name, email_verified 
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No account found with this email address'
      }, { status: 404 })
    }

    const user = users[0]

    // Check if already verified
    if (user.email_verified === true) {
      return NextResponse.json({
        success: false,
        message: 'This email address is already verified'
      }, { status: 400 })
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken()

    try {
      // Store new verification token in database (replacing any existing ones)
      await sql`
        SELECT create_verification_token(${email}, ${verificationToken}, 'email_verification', 24)
      `

      // Send verification email
      const emailTemplate = createVerificationEmail(email, verificationToken, user.name)
      const emailResult = await sendEmail(emailTemplate)

      if (!emailResult.success) {
        console.error('❌ Failed to resend verification email:', emailResult.error)
        return NextResponse.json({
          success: false,
          message: 'Failed to send verification email. Please try again later.'
        }, { status: 500 })
      }

      console.log('✅ Verification email resent to:', email)

      return NextResponse.json({
        success: true,
        message: 'Verification email sent! Please check your inbox and spam folder.'
      })

    } catch (emailError) {
      console.error('❌ Email resend setup failed:', emailError)
      return NextResponse.json({
        success: false,
        message: 'Failed to setup verification email. Please try again later.'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Resend verification failed:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error. Please try again later.'
    }, { status: 500 })
  }
}
