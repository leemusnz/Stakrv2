import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check email configuration
    const emailConfig = {
      hasResendApiKey: !!process.env.RESEND_API_KEY,
      resendKeyPrefix: process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0, 7) + '...' : 'none',
      fromEmail: process.env.RESEND_FROM_EMAIL || 'Stakr <onboarding@resend.dev>',
      nextAuthUrl: process.env.NEXTAUTH_URL || 'not set',
      nodeEnv: process.env.NODE_ENV,
      isDummyKey: process.env.RESEND_API_KEY === 'dummy-key-for-development'
    }

    console.log('📧 Email configuration check:', emailConfig)

    return NextResponse.json({
      success: true,
      emailConfig,
      status: emailConfig.hasResendApiKey && !emailConfig.isDummyKey ? 'configured' : 'not_configured',
      message: emailConfig.hasResendApiKey && !emailConfig.isDummyKey 
        ? 'Email service is properly configured'
        : 'Email service needs RESEND_API_KEY environment variable'
    })

  } catch (error) {
    console.error('🚨 Email config check failed:', error)
    return NextResponse.json({
      error: 'Failed to check email configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { testEmail } = await request.json()
    
    if (!testEmail) {
      return NextResponse.json({ error: 'Test email address required' }, { status: 400 })
    }

    console.log('🧪 Testing email send to:', testEmail)

    // Import email functions
    const { sendEmail } = await import('@/lib/email')
    
    // Create test email
    const testEmailTemplate = {
      to: testEmail,
      subject: 'Stakr Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>📧 Email Configuration Test</h2>
          <p>If you're receiving this email, your Stakr email configuration is working correctly!</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
          <hr>
          <p style="color: #666; font-size: 14px;">This is a test email from your Stakr application.</p>
        </div>
      `
    }

    // Attempt to send test email
    const result = await sendEmail(testEmailTemplate)
    
    console.log('🧪 Test email result:', result)

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? 'Test email sent successfully! Check your inbox.'
        : 'Failed to send test email',
      error: result.error,
      testEmail
    })

  } catch (error) {
    console.error('🚨 Test email failed:', error)
    return NextResponse.json({
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
