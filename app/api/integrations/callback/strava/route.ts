import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'

// Force Node.js runtime and dynamic execution to ensure the route is deployed in all environments
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
      console.error('Strava OAuth error:', error)
      return NextResponse.redirect(new URL('/settings?tab=integrations&error=strava_auth_failed', request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/settings?tab=integrations&error=missing_code', request.url))
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Strava token exchange failed:', tokenData)
      return NextResponse.redirect(new URL('/settings?tab=integrations&error=token_exchange_failed', request.url))
    }

    // Store the tokens and user info
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
        'strava',
        true,
        true,
        'standard',
        ${JSON.stringify({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_at,
          athlete: tokenData.athlete,
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

    console.log(`✅ Strava OAuth completed for user ${session.user.id}`)
    return NextResponse.redirect(new URL('/settings?tab=integrations&success=strava_connected', request.url))

  } catch (error) {
    console.error('Strava OAuth callback error:', error)
    return NextResponse.redirect(new URL('/settings?tab=integrations&error=oauth_error', request.url))
  }
}
