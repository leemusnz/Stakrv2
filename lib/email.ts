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
          <meta name="color-scheme" content="light dark">
          <meta name="supported-color-schemes" content="light dark">
          <style>
            :root {
              color-scheme: light dark;
              --bg-primary: #ffffff;
              --bg-secondary: #f8fafc;
              --bg-accent: #fef3c7;
              --text-primary: #1f2937;
              --text-secondary: #6b7280;
              --text-accent: #92400e;
              --border-color: #e5e7eb;
                             --stakr-primary: #FF6B35;
               --stakr-secondary: #E55A2B;
               --stakr-success: #10b981;
              --shadow: rgba(0,0,0,0.1);
            }
            
            @media (prefers-color-scheme: dark) {
              :root {
                --bg-primary: #1f2937;
                --bg-secondary: #374151;
                --bg-accent: #451a03;
                --text-primary: #f9fafb;
                --text-secondary: #d1d5db;
                --text-accent: #fbbf24;
                --border-color: #4b5563;
                --shadow: rgba(0,0,0,0.3);
              }
            }
            
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
            }
            
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
              line-height: 1.6; 
              color: var(--text-primary);
              background: var(--bg-secondary);
              padding: 20px; 
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
            }
            
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: var(--bg-primary); 
              border-radius: 16px; 
              box-shadow: 0 10px 30px var(--shadow); 
              overflow: hidden;
              border: 1px solid var(--border-color);
            }
            
            .header { 
              background: linear-gradient(135deg, var(--stakr-primary) 0%, var(--stakr-secondary) 100%); 
              padding: 40px 30px; 
              text-align: center; 
              color: white;
            }
            
            .logo { 
              font-size: 32px; 
              font-weight: 800; 
              letter-spacing: -1px;
              margin-bottom: 8px;
              color: white !important;
            }
            
            .tagline { 
              font-size: 16px; 
              opacity: 0.95; 
              font-weight: 300;
              color: white !important;
            }
            
            .content { 
              padding: 40px 30px; 
              background: var(--bg-primary);
            }
            
            .welcome { 
              font-size: 24px; 
              font-weight: 600; 
              color: var(--text-primary); 
              margin-bottom: 16px;
              text-align: center;
            }
            
            .message { 
              font-size: 16px; 
              color: var(--text-secondary); 
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
              background: linear-gradient(135deg, var(--stakr-primary) 0%, var(--stakr-secondary) 100%); 
              color: white !important; 
              padding: 16px 32px; 
              text-decoration: none; 
              border-radius: 12px; 
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
            }
            
            .link-fallback { 
              margin: 32px 0; 
              padding: 20px; 
              background: var(--bg-secondary); 
              border-radius: 8px; 
              border-left: 4px solid var(--stakr-primary);
            }
            
            .link-text { 
              font-size: 14px; 
              color: var(--text-secondary); 
              margin-bottom: 8px; 
            }
            
            .link-url { 
              word-break: break-all; 
              color: var(--stakr-primary); 
              font-size: 14px; 
              font-family: 'SF Mono', Monaco, 'Roboto Mono', monospace;
              background: var(--bg-primary);
              padding: 8px;
              border-radius: 4px;
              border: 1px solid var(--border-color);
            }
            
            .security-note { 
              background: var(--bg-accent); 
              border: 1px solid var(--text-accent); 
              border-radius: 8px; 
              padding: 16px; 
              margin: 24px 0;
            }
            
            .security-text { 
              font-size: 14px; 
              color: var(--text-accent); 
              font-weight: 500;
            }
            
            .footer { 
              background: var(--bg-secondary); 
              padding: 30px; 
              text-align: center; 
              border-top: 1px solid var(--border-color);
            }
            
            .footer-text { 
              font-size: 14px; 
              color: var(--text-secondary); 
              margin-bottom: 8px;
            }
            
            .footer-brand { 
              font-size: 14px; 
              color: var(--text-primary); 
              font-weight: 500;
            }
            
            .features-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin: 30px 0;
              text-align: center;
            }
            
            .feature {
              padding: 16px;
              background: var(--bg-secondary);
              border-radius: 8px;
              border: 1px solid var(--border-color);
            }
            
            .feature-icon {
              font-size: 24px;
              margin-bottom: 8px;
            }
            
            .feature-text {
              font-size: 12px;
              color: var(--text-secondary);
              font-weight: 500;
            }
            
            @media only screen and (max-width: 600px) {
              .container { margin: 10px; border-radius: 12px; }
              .header { padding: 30px 20px; }
              .content { padding: 30px 20px; }
              .footer { padding: 20px; }
              .welcome { font-size: 20px; }
              .button { padding: 14px 24px; font-size: 15px; }
              .features-grid { grid-template-columns: 1fr; gap: 12px; }
            }
            
            @media (prefers-color-scheme: dark) {
              .button {
                box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏔️ Stakr</div>
              <div class="tagline">Challenge yourself. Build better habits.</div>
            </div>
            
            <div class="content">
              <h1 class="welcome">Welcome aboard, ${name}! 🎉</h1>
              
              <p class="message">
                You're just one click away from joining thousands of people who are building better habits through challenges. 
                Let's verify your email to secure your account and get you started.
              </p>
              
              <div class="features-grid">
                <div class="feature">
                  <div class="feature-icon">💪</div>
                  <div class="feature-text">Set Personal Challenges</div>
                </div>
                <div class="feature">
                  <div class="feature-icon">💰</div>
                  <div class="feature-text">Stake Real Money</div>
                </div>
                <div class="feature">
                  <div class="feature-icon">🏆</div>
                  <div class="feature-text">Build Lasting Habits</div>
                </div>
              </div>
              
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
                Need help? Reply to this email or contact us at support@stakr.app
              </div>
              <div class="footer-brand">
                © 2024 Stakr. Built to help you reach new heights. 🏔️
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
