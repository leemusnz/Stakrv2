import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check all OAuth environment variables for integrations
    const oauthConfig = {
      spotify: {
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET,
        configured: !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET),
        client_id_preview: process.env.SPOTIFY_CLIENT_ID 
          ? `${process.env.SPOTIFY_CLIENT_ID.substring(0, 15)}...` 
          : '❌ Missing'
      },
      strava: {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        configured: !!(process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET),
        client_id_preview: process.env.STRAVA_CLIENT_ID 
          ? `${process.env.STRAVA_CLIENT_ID.substring(0, 10)}...` 
          : '❌ Missing'
      },
      fitbit: {
        client_id: process.env.FITBIT_CLIENT_ID,
        client_secret: process.env.FITBIT_CLIENT_SECRET,
        configured: !!(process.env.FITBIT_CLIENT_ID && process.env.FITBIT_CLIENT_SECRET),
        client_id_preview: process.env.FITBIT_CLIENT_ID 
          ? `${process.env.FITBIT_CLIENT_ID.substring(0, 10)}...` 
          : '❌ Missing'
      },
      github: {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        configured: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
        client_id_preview: process.env.GITHUB_CLIENT_ID 
          ? `${process.env.GITHUB_CLIENT_ID.substring(0, 15)}...` 
          : '❌ Missing'
      },
      todoist: {
        client_id: process.env.TODOIST_CLIENT_ID,
        client_secret: process.env.TODOIST_CLIENT_SECRET,
        configured: !!(process.env.TODOIST_CLIENT_ID && process.env.TODOIST_CLIENT_SECRET),
        client_id_preview: process.env.TODOIST_CLIENT_ID 
          ? `${process.env.TODOIST_CLIENT_ID.substring(0, 15)}...` 
          : '❌ Missing'
      },
      google_fit: {
        client_id: process.env.GOOGLE_FIT_CLIENT_ID,
        client_secret: process.env.GOOGLE_FIT_CLIENT_SECRET,
        configured: !!(process.env.GOOGLE_FIT_CLIENT_ID && process.env.GOOGLE_FIT_CLIENT_SECRET),
        client_id_preview: process.env.GOOGLE_FIT_CLIENT_ID 
          ? `${process.env.GOOGLE_FIT_CLIENT_ID.substring(0, 15)}...` 
          : '❌ Missing'
      },
      myfitnesspal: {
        client_id: process.env.MYFITNESSPAL_CLIENT_ID,
        client_secret: process.env.MYFITNESSPAL_CLIENT_SECRET,
        configured: !!(process.env.MYFITNESSPAL_CLIENT_ID && process.env.MYFITNESSPAL_CLIENT_SECRET),
        client_id_preview: process.env.MYFITNESSPAL_CLIENT_ID 
          ? `${process.env.MYFITNESSPAL_CLIENT_ID.substring(0, 15)}...` 
          : '❌ Missing'
      }
    }

    // Count configured and missing
    const configuredCount = Object.values(oauthConfig).filter(config => config.configured).length
    const totalCount = Object.keys(oauthConfig).length
    const missingServices = Object.entries(oauthConfig)
      .filter(([_, config]) => !config.configured)
      .map(([service, _]) => service)

    const callbackUrls = Object.keys(oauthConfig).map(service => ({
      service,
      callback_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/${service === 'google_fit' ? 'google-fit' : service}`,
      status: oauthConfig[service as keyof typeof oauthConfig].configured ? '✅ Ready' : '❌ Missing credentials'
    }))

    // Generate test URLs for configured services
    const testUrls = Object.entries(oauthConfig)
      .filter(([_, config]) => config.configured)
      .map(([service, config]) => {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        return {
          service,
          test_url: `${baseUrl}/settings?test=${service}`,
          oauth_authorize_url: getAuthorizeUrl(service, config.client_id!, baseUrl)
        }
      })

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      summary: {
        configured: configuredCount,
        total: totalCount,
        percentage: Math.round((configuredCount / totalCount) * 100),
        status: configuredCount === totalCount ? '✅ All configured' : `⚠️ ${missingServices.length} missing`
      },
      oauth_config: oauthConfig,
      missing_services: missingServices,
      callback_urls: callbackUrls,
      test_urls: testUrls,
      next_steps: missingServices.length > 0 ? [
        "🔧 Set up missing OAuth credentials:",
        ...missingServices.map(service => `   - ${service.toUpperCase()}_CLIENT_ID and ${service.toUpperCase()}_CLIENT_SECRET`),
        "📖 See OAUTH_ENV_SETUP.md for detailed setup instructions",
        "🔄 Restart development server after adding environment variables"
      ] : [
        "🎉 All OAuth integrations configured!",
        "🧪 Test integrations in Settings → Integrations",
        "🚀 Ready for production deployment"
      ]
    })

  } catch (error) {
    console.error('OAuth debug error:', error)
    return NextResponse.json({
      error: 'Failed to check OAuth configuration',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

function getAuthorizeUrl(service: string, clientId: string, baseUrl: string): string {
  const state = `debug-${Date.now()}`
  const redirectUri = `${baseUrl}/api/auth/callback/${service === 'google_fit' ? 'google-fit' : service}`

  switch (service) {
    case 'spotify':
      return `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=user-read-email,user-read-private&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
    
    case 'strava':
      return `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read,activity:read&state=${state}`
    
    case 'fitbit':
      return `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=activity+heartrate&state=${state}`
    
    case 'github':
      return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=${state}`
    
    case 'todoist':
      return `https://todoist.com/oauth/authorize?client_id=${clientId}&scope=data:read&state=${state}`
    
    default:
      return `# OAuth URL not configured for ${service}`
  }
}


