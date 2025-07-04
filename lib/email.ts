import { Resend } from 'resend'

// Initialize Resend with API key or fallback for development
const resend = new Resend(process.env.RESEND_API_KEY || 'dummy-key-for-development')

interface EmailTemplate {
  to: string
  subject: string
  html: string
}

// Email verification template
export function createVerificationEmail(to: string, verificationToken: string, name: string): EmailTemplate {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken}`
  
  return {
    to,
    subject: 'Verify your Stakr account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
            .button { 
              display: inline-block; 
              background: #2563eb; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
            }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Stakr</div>
            </div>
            
            <h2>Welcome to Stakr, ${name}!</h2>
            
            <p>Thank you for signing up. To complete your registration and start creating challenges, please verify your email address.</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
            
            <p><strong>This link will expire in 24 hours.</strong></p>
            
            <div class="footer">
              <p>If you didn't create a Stakr account, you can safely ignore this email.</p>
              <p>© 2024 Stakr. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }
}

// Password reset template
export function createPasswordResetEmail(to: string, resetToken: string, name: string): EmailTemplate {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`
  
  return {
    to,
    subject: 'Reset your Stakr password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
            .button { 
              display: inline-block; 
              background: #dc2626; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
            }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Stakr</div>
            </div>
            
            <h2>Reset Your Password</h2>
            
            <p>Hi ${name},</p>
            
            <p>You requested to reset your password for your Stakr account. Click the button below to set a new password.</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #dc2626;">${resetUrl}</p>
            
            <p><strong>This link will expire in 1 hour.</strong></p>
            
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
            
            <div class="footer">
              <p>For security reasons, this reset link will only work once.</p>
              <p>© 2024 Stakr. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }
}

// Send email function
export async function sendEmail(template: EmailTemplate): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if we have a valid API key
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'dummy-key-for-development') {
      console.log('⚠️ Email service not configured (missing RESEND_API_KEY), skipping email send')
      console.log('📧 Would send email to:', template.to, 'Subject:', template.subject)
      return { success: true } // Return success in development to not break auth flow
    }

    // Use environment variable for from address or fallback to Resend's default
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Stakr <onboarding@resend.dev>'
    
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: template.to,
      subject: template.subject,
      html: template.html,
    })
    
    console.log('📧 Sending email from:', fromAddress, 'to:', template.to)

    if (error) {
      console.error('❌ Email sending failed:', error)
      console.error('❌ Error details:', {
        message: error.message,
        name: error.name,
        fromAddress,
        to: template.to
      })
      
      // Provide helpful error messages for common issues
      let helpfulMessage = error.message
      if (error.message?.includes('domain')) {
        helpfulMessage = 'Domain not verified in Resend. Use onboarding@resend.dev or verify your domain.'
      } else if (error.message?.includes('api_key')) {
        helpfulMessage = 'Invalid Resend API key. Check your RESEND_API_KEY environment variable.'
      }
      
      return { success: false, error: helpfulMessage }
    }

    console.log('✅ Email sent successfully:', data?.id)
    return { success: true }
  } catch (error) {
    console.error('❌ Email service error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown email error' 
    }
  }
}

// Utility functions for token generation
export function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function generateResetToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}
