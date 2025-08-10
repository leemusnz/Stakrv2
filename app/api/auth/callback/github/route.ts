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
      console.error('GitHub OAuth error:', error)
      return NextResponse.redirect(new URL('/settings?tab=integrations&error=github_auth_failed', request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/settings?tab=integrations&error=missing_code', request.url))
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok || tokenData.error) {
      console.error('GitHub token exchange failed:', tokenData)
      return NextResponse.redirect(new URL('/settings?tab=integrations&error=token_exchange_failed', request.url))
    }

    // Get user profile
    const profileResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'Stakr-Integration',
      },
    })

    const profileData = await profileResponse.json()

    // Store the tokens and user info
    const sql = await createDbConnection()
    
    await sql`
      INSERT INTO app_integrations (
        user_id,
        app_type,
        enabled,
        auto_sync,
        privacy_level,
        api_credentials,
        data_types,
        created_at,
        updated_at,
        last_sync
      ) VALUES (
        ${session.user.id},
        'github',
        true,
        true,
        'standard',
        ${JSON.stringify({
          access_token: tokenData.access_token,
          token_type: tokenData.token_type,
          scope: tokenData.scope,
          profile: profileData,
        })},
        ${JSON.stringify(['code_commit'])},
        NOW(),
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id, app_type) 
      DO UPDATE SET
        enabled = EXCLUDED.enabled,
        api_credentials = EXCLUDED.api_credentials,
        updated_at = NOW(),
        last_sync = NOW()
    `

    console.log(`✅ GitHub OAuth completed for user ${session.user.id}`)
    return NextResponse.redirect(new URL('/settings?tab=integrations&success=github_connected', request.url))

  } catch (error) {
    console.error('GitHub OAuth callback error:', error)
    return NextResponse.redirect(new URL('/settings?tab=integrations&error=oauth_error', request.url))
  }
}
