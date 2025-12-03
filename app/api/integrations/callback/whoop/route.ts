import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { validateOAuthState } from '@/lib/oauth-state'
import { encryptCredentials } from '@/lib/encryption'

// Force Node.js runtime and dynamic execution
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/auth/signin?error=unauthorized', request.url))
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const state = searchParams.get('state')

    if (error) {
      console.error('Whoop OAuth error:', error)
      return NextResponse.redirect(new URL('/settings?tab=integrations&error=whoop_auth_failed', request.url))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/settings?tab=integrations&error=missing_parameters', request.url))
    }

    // CSRF Protection: Validate OAuth state
    const isValidState = await validateOAuthState(session.user.id, 'whoop', state)
    if (!isValidState) {
      console.error('❌ Invalid OAuth state - possible CSRF attack attempt')
      return NextResponse.redirect(new URL('/settings?tab=integrations&error=invalid_state', request.url))
    }

    // Exchange authorization code for access token
    // Whoop uses client_secret_post method (credentials in body, not header)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const tokenResponse = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${baseUrl}/api/integrations/callback/whoop`,
        client_id: process.env.WHOOP_CLIENT_ID,
        client_secret: process.env.WHOOP_CLIENT_SECRET
      })
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Whoop token exchange failed:', tokenData)
      return NextResponse.redirect(new URL('/settings?tab=integrations&error=token_exchange_failed', request.url))
    }

    // Get user profile to verify connection
    const profileResponse = await fetch('https://api.prod.whoop.com/developer/v1/user/profile/basic', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })

    let userProfile = null
    if (profileResponse.ok) {
      userProfile = await profileResponse.json()
    }

    // Store the tokens and user info with encryption
    const sql = await createDbConnection()

    await sql`
      INSERT INTO wearable_integrations (
        user_id,
        device_type,
        enabled,
        auto_sync,
        privacy_level,
        api_credentials,
        created_at,
        updated_at,
        last_sync
      ) VALUES (
        ${session.user.id},
        'whoop',
        true,
        true,
        'standard',
        ${encryptCredentials({
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: Math.floor(Date.now() / 1000) + tokenData.expires_in,
          userProfile: userProfile,
        })},
        NOW(),
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id, device_type) 
      DO UPDATE SET
        enabled = EXCLUDED.enabled,
        api_credentials = EXCLUDED.api_credentials,
        updated_at = NOW(),
        last_sync = NOW()
    `

    console.log(`✅ Whoop OAuth completed for user ${session.user.id}`)
    
    // Redirect back to integrations page with success message
    const redirectUrl = new URL('/settings', request.url)
    redirectUrl.searchParams.set('tab', 'integrations')
    redirectUrl.searchParams.set('success', 'whoop_connected')
    
    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error('Whoop OAuth callback error:', error)
    return NextResponse.redirect(new URL('/settings?tab=integrations&error=oauth_error', request.url))
  }
}


