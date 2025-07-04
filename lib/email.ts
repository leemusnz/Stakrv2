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
    subject: '🎯 Welcome to Stakr - Verify your account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 20px; 
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white; 
              border-radius: 16px; 
              box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
              overflow: hidden;
            }
            .header { 
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
              padding: 40px 30px; 
              text-align: center; 
              color: white;
            }
            .logo { 
              font-size: 32px; 
              font-weight: 800; 
              letter-spacing: -1px;
              margin-bottom: 8px;
            }
            .tagline { 
              font-size: 16px; 
              opacity: 0.9; 
              font-weight: 300;
            }
            .content { 
              padding: 40px 30px; 
            }
            .welcome { 
              font-size: 24px; 
              font-weight: 600; 
              color: #1f2937; 
              margin-bottom: 16px;
              text-align: center;
            }
            .message { 
              font-size: 16px; 
              color: #6b7280; 
              margin-bottom: 32px; 
              text-align: center;
              line-height: 1.6;
            }
            .cta-container { 
              text-align: center; 
              margin: 40px 0; 
            }
            .button { 
              display: inline-block; 
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
              color: white; 
              padding: 16px 32px; 
              text-decoration: none; 
              border-radius: 12px; 
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
              transition: transform 0.2s ease;
            }
            .button:hover { 
              transform: translateY(-2px); 
            }
            .link-fallback { 
              margin: 32px 0; 
              padding: 20px; 
              background: #f8fafc; 
              border-radius: 8px; 
              border-left: 4px solid #2563eb;
            }
            .link-text { 
              font-size: 14px; 
              color: #6b7280; 
              margin-bottom: 8px; 
            }
            .link-url { 
              word-break: break-all; 
              color: #2563eb; 
              font-size: 14px; 
              font-family: monospace;
              background: white;
              padding: 8px;
              border-radius: 4px;
            }
            .security-note { 
              background: #fef3c7; 
              border: 1px solid #f59e0b; 
              border-radius: 8px; 
              padding: 16px; 
              margin: 24px 0;
            }
            .security-text { 
              font-size: 14px; 
              color: #92400e; 
              font-weight: 500;
            }
            .footer { 
              background: #f8fafc; 
              padding: 30px; 
              text-align: center; 
              border-top: 1px solid #e5e7eb;
            }
            .footer-text { 
              font-size: 14px; 
              color: #6b7280; 
              margin-bottom: 8px;
            }
            .footer-brand { 
              font-size: 14px; 
              color: #374151; 
              font-weight: 500;
            }
            @media only screen and (max-width: 600px) {
              .container { margin: 10px; border-radius: 12px; }
              .header { padding: 30px 20px; }
              .content { padding: 30px 20px; }
              .footer { padding: 20px; }
              .welcome { font-size: 20px; }
              .button { padding: 14px 24px; font-size: 15px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎯 Stakr</div>
              <div class="tagline">Challenge yourself. Build better habits.</div>
            </div>
            
            <div class="content">
              <h1 class="welcome">Welcome aboard, ${name}! 🎉</h1>
              
              <p class="message">
                You're just one click away from starting your journey with Stakr. 
                We need to verify your email address to secure your account and keep you updated on your challenges.
              </p>
              
              <div class="cta-container">
                <a href="${verificationUrl}" class="button">
                  ✨ Verify My Email Address
                </a>
              </div>
              
              <div class="link-fallback">
                <div class="link-text">If the button doesn't work, copy and paste this link:</div>
                <div class="link-url">${verificationUrl}</div>
              </div>
              
              <div class="security-note">
                <div class="security-text">
                  🔒 <strong>Security Note:</strong> This verification link expires in 24 hours for your protection.
                </div>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-text">
                If you didn't create a Stakr account, you can safely ignore this email.
              </div>
              <div class="footer-text">
                Need help? Reply to this email or contact support.
              </div>
              <div class="footer-brand">
                © 2024 Stakr. Built to help you succeed. 💪
              </div>
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
