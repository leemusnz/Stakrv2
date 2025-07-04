import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
  const nextAuthUrl = process.env.NEXTAUTH_URL
  const nextAuthSecret = process.env.NEXTAUTH_SECRET

  // Test URL construction
  const baseUrl = nextAuthUrl || (
    process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : 'https://stakr.app'
  )
  
  const expectedCallbackUrl = `${baseUrl}/api/auth/callback/google`
  
  // Test auth options
  const hasGoogleProvider = authOptions.providers.some(
    provider => provider.id === 'google'
  )

  const testResults = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    
    // Environment Variables Check
    environment_variables: {
      google_client_id: {
        configured: !!googleClientId,
        preview: googleClientId ? `${googleClientId.substring(0, 20)}...` : '❌ Missing',
        length: googleClientId?.length || 0,
        valid_format: googleClientId?.includes('.googleusercontent.com') || false
      },
      google_client_secret: {
        configured: !!googleClientSecret,
        preview: googleClientSecret ? `${googleClientSecret.substring(0, 10)}...` : '❌ Missing',
        length: googleClientSecret?.length || 0,
        looks_valid: googleClientSecret && googleClientSecret.length > 20
      },
      nextauth_url: {
        configured: !!nextAuthUrl,
        value: nextAuthUrl || '❌ Missing',
        is_https_prod: nextAuthUrl?.startsWith('https://') || false
      },
      nextauth_secret: {
        configured: !!nextAuthSecret,
        length: nextAuthSecret?.length || 0,
        sufficient_length: (nextAuthSecret?.length || 0) >= 32
      }
    },

    // NextAuth Configuration Check
    nextauth_config: {
      google_provider_configured: hasGoogleProvider,
      expected_callback_url: expectedCallbackUrl,
      providers_count: authOptions.providers.length,
      session_strategy: (authOptions as any).session?.strategy || 'jwt'
    },

    // URLs to test manually
    test_urls: {
      google_oauth_debug: `${baseUrl}/api/debug/google-oauth`,
      signin_page: `${baseUrl}/auth/signin`,
      auth_providers: `${baseUrl}/api/auth/providers`,
      google_signin_direct: `${baseUrl}/api/auth/signin/google`
    },

    // Overall status
    setup_status: {
      environment_ready: !!(googleClientId && googleClientSecret && nextAuthUrl && nextAuthSecret),
      google_oauth_ready: !!(googleClientId && googleClientSecret && hasGoogleProvider),
      production_ready: !!(
        googleClientId && 
        googleClientSecret && 
        nextAuthUrl?.startsWith('https://') && 
        nextAuthSecret && 
        nextAuthSecret.length >= 32
      )
    },

    // Next steps
    next_steps: [] as string[]
  }

  // Generate specific next steps based on what's missing
  if (!googleClientId || !googleClientSecret) {
    testResults.next_steps.push("🔧 Set up Google Cloud Console OAuth credentials")
  }
  
  if (!googleClientId?.includes('.googleusercontent.com')) {
    testResults.next_steps.push("⚠️ Google Client ID format looks incorrect")
  }
  
  if (!nextAuthUrl) {
    testResults.next_steps.push("🌐 Set NEXTAUTH_URL environment variable")
  }
  
  if (!nextAuthSecret || nextAuthSecret.length < 32) {
    testResults.next_steps.push("🔑 Generate a longer NEXTAUTH_SECRET (32+ characters)")
  }
  
  if (!hasGoogleProvider) {
    testResults.next_steps.push("⚙️ Google provider not found in NextAuth config")
  }

  if (testResults.next_steps.length === 0) {
    testResults.next_steps.push("🎉 Setup looks good! Test Google sign-in now.")
  }

  return NextResponse.json(testResults, { 
    status: testResults.setup_status.google_oauth_ready ? 200 : 400 
  })
}
