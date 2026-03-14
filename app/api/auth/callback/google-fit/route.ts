import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'

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
      console.error('Google Fit OAuth error:', error)
      return NextResponse.redirect(new URL('/settings?tab=integrations&error=googlefit_auth_failed', request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/settings?tab=integrations&error=missing_code', request.url))
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_FIT_CLIENT_ID!,
        client_secret: process.env.GOOGLE_FIT_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/google-fit`,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Google Fit token exchange failed:', tokenData)
      return NextResponse.redirect(new URL('/settings?tab=integrations&error=token_exchange_failed', request.url))
    }

    // Store the tokens
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
        'google_fit',
        true,
        true,
        'standard',
        ${JSON.stringify({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
          expires_at: Date.now() + (tokenData.expires_in * 1000),
          scope: tokenData.scope,
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

    return NextResponse.redirect(new URL('/settings?tab=integrations&success=googlefit_connected', request.url))

  } catch (error) {
    console.error('Google Fit OAuth callback error:', error)
    return NextResponse.redirect(new URL('/settings?tab=integrations&error=oauth_error', request.url))
  }
}


