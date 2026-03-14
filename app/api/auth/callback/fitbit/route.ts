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

    if (error) {
      console.error('Fitbit OAuth error:', error)
      return NextResponse.redirect(new URL('/settings?tab=integrations&error=fitbit_auth_failed', request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/settings?tab=integrations&error=missing_code', request.url))
    }

    // Exchange authorization code for access token
    const credentials = Buffer.from(`${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`).toString('base64')
    
    const tokenResponse = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/fitbit`,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Fitbit token exchange failed:', tokenData)
      return NextResponse.redirect(new URL('/settings?tab=integrations&error=token_exchange_failed', request.url))
    }

    // Get user profile
    const profileResponse = await fetch('https://api.fitbit.com/1/user/-/profile.json', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    const profileData = await profileResponse.json()

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
        'fitbit',
        true,
        true,
        'standard',
        ${JSON.stringify({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
          expires_at: Date.now() + (tokenData.expires_in * 1000),
          user_id: tokenData.user_id,
          profile: profileData.user,
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

    return NextResponse.redirect(new URL('/settings?tab=integrations&success=fitbit_connected', request.url))

  } catch (error) {
    console.error('Fitbit OAuth callback error:', error)
    return NextResponse.redirect(new URL('/settings?tab=integrations&error=oauth_error', request.url))
  }
}


