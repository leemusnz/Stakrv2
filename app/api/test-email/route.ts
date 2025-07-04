import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, createVerificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    console.log('🧪 Testing email configuration...')
    console.log('📧 To:', email)
    console.log('🔑 Has API Key:', !!process.env.RESEND_API_KEY)
    console.log('📤 From Address:', process.env.RESEND_FROM_EMAIL || 'Stakr <onboarding@resend.dev>')

    // Create test verification email
    const testEmail = createVerificationEmail(email, 'test-token-123', 'Test User')
    
    // Attempt to send
    const result = await sendEmail(testEmail)
    
    console.log('🧪 Email test result:', result)

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Test email sent successfully!' : 'Email test failed',
      error: result.error,
      config: {
        hasApiKey: !!process.env.RESEND_API_KEY,
        fromEmail: process.env.RESEND_FROM_EMAIL || 'Stakr <onboarding@resend.dev>',
        environment: process.env.NODE_ENV
      }
    })

  } catch (error) {
    console.error('🚨 Email test error:', error)
    return NextResponse.json({
      error: 'Email test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 