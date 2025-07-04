import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
  const nextAuthUrl = process.env.NEXTAUTH_URL
  const nextAuthSecret = process.env.NEXTAUTH_SECRET

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    google_oauth_config: {
      client_id_configured: !!googleClientId,
      client_id_preview: googleClientId ? `${googleClientId.substring(0, 20)}...` : 'Not set',
      client_secret_configured: !!googleClientSecret,
      client_secret_preview: googleClientSecret ? `${googleClientSecret.substring(0, 10)}...` : 'Not set',
      nextauth_url: nextAuthUrl || 'Not set',
      nextauth_secret_configured: !!nextAuthSecret,
      expected_callback_url: `${nextAuthUrl || 'https://your-domain.com'}/api/auth/callback/google`
    },
    setup_status: {
      ready_for_google_oauth: !!(googleClientId && googleClientSecret),
      next_steps: !(googleClientId && googleClientSecret) ? [
        "Set up Google Cloud Console project",
        "Create OAuth client credentials", 
        "Add GOOGLE_CLIENT_ID environment variable",
        "Add GOOGLE_CLIENT_SECRET environment variable"
      ] : [
        "Google OAuth ready to test!",
        "Try signing in with Google button"
      ]
    }
  })
} 