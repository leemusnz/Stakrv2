import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { provider, type } = await request.json() // type: 'app' | 'wearable'
    
    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const state = `${session.user.id}-${Date.now()}` // Simple state for CSRF protection

    let authUrl: string

    switch (provider) {
      case 'spotify':
        authUrl = `https://accounts.spotify.com/authorize?` +
          `response_type=code&` +
          `client_id=${process.env.SPOTIFY_CLIENT_ID}&` +
          `scope=user-read-email,user-read-private,user-top-read,user-read-recently-played&` +
          `redirect_uri=${encodeURIComponent(`${baseUrl}/api/auth/callback/spotify`)}&` +
          `state=${state}`
        break

      case 'strava':
        // Use a dedicated integrations callback to avoid interference with NextAuth dynamic routes
        authUrl = `https://www.strava.com/oauth/authorize?` +
          `client_id=${process.env.STRAVA_CLIENT_ID}&` +
          `response_type=code&` +
          `redirect_uri=${encodeURIComponent(`${baseUrl}/api/integrations/callback/strava`)}&` +
          `approval_prompt=force&` +
          `scope=read,activity:read&` +
          `state=${state}`
        break

      case 'fitbit':
        authUrl = `https://www.fitbit.com/oauth2/authorize?` +
          `response_type=code&` +
          `client_id=${process.env.FITBIT_CLIENT_ID}&` +
          `redirect_uri=${encodeURIComponent(`${baseUrl}/api/auth/callback/fitbit`)}&` +
          `scope=activity+heartrate+location+nutrition+profile+settings+sleep+social+weight&` +
          `state=${state}`
        break

      case 'github':
        authUrl = `https://github.com/login/oauth/authorize?` +
          `client_id=${process.env.GITHUB_CLIENT_ID}&` +
          `redirect_uri=${encodeURIComponent(`${baseUrl}/api/auth/callback/github`)}&` +
          `scope=user:email,repo&` +
          `state=${state}`
        break

      case 'todoist':
        authUrl = `https://todoist.com/oauth/authorize?` +
          `client_id=${process.env.TODOIST_CLIENT_ID}&` +
          `scope=data:read&` +
          `state=${state}`
        break

      case 'google_fit':
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `response_type=code&` +
          `client_id=${process.env.GOOGLE_FIT_CLIENT_ID}&` +
          `redirect_uri=${encodeURIComponent(`${baseUrl}/api/auth/callback/google-fit`)}&` +
          `scope=https://www.googleapis.com/auth/fitness.activity.read+https://www.googleapis.com/auth/fitness.body.read&` +
          `access_type=offline&` +
          `state=${state}`
        break

      case 'myfitnesspal':
        // MyFitnessPal uses Under Armour's API
        authUrl = `https://www.mapmyfitness.com/v7.1/oauth2/uacf/authorize/?` +
          `client_id=${process.env.MYFITNESSPAL_CLIENT_ID}&` +
          `response_type=code&` +
          `redirect_uri=${encodeURIComponent(`${baseUrl}/api/auth/callback/myfitnesspal`)}&` +
          `state=${state}`
        break

      default:
        return NextResponse.json({ error: `OAuth not available for ${provider}` }, { status: 400 })
    }

    // Store state in database for verification (optional but recommended)
    // For now, we'll just return the URL

    return NextResponse.json({ 
      success: true, 
      authUrl,
      provider,
      state 
    })

  } catch (error) {
    console.error('OAuth authorization error:', error)
    return NextResponse.json({
      error: 'Failed to generate authorization URL',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
