import { NextRequest, NextResponse } from 'next/server'
import { testDatabaseConnection } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const test = searchParams.get('test') || 'all'
    
    const results = {
      timestamp: new Date().toISOString(),
      tests: {} as any
    }

    // Test 1: Database Connection
    if (test === 'all' || test === 'database') {
      try {
        const dbTest = await testDatabaseConnection()
        results.tests.database = {
          name: 'Database Connection',
          success: dbTest.success,
          message: dbTest.message || dbTest.error || 'No message',
          details: {
            hasConnectionString: !!process.env.DATABASE_URL,
            connectionStringFormat: process.env.DATABASE_URL?.startsWith('postgresql://') ? 'valid' : 'invalid',
            environment: process.env.NODE_ENV
          }
        }
      } catch (error) {
        results.tests.database = {
          name: 'Database Connection',
          success: false,
          message: `Database test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: {
            hasConnectionString: !!process.env.DATABASE_URL,
            environment: process.env.NODE_ENV
          }
        }
      }
    }

    // Test 2: Authentication Configuration
    if (test === 'all' || test === 'auth') {
      results.tests.authentication = {
        name: 'Authentication Configuration',
        success: true,
        message: 'NextAuth configuration loaded',
        details: {
          providers: authOptions.providers?.map(p => p.name) || [],
          sessionStrategy: authOptions.session?.strategy || 'unknown',
          hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
          hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
          hasGoogleOAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
          environment: process.env.NODE_ENV
        }
      }
    }

    // Test 3: Current Session
    if (test === 'all' || test === 'session') {
      try {
        const session = await getServerSession(authOptions)
        results.tests.session = {
          name: 'Current Session',
          success: true,
          message: session ? 'User is authenticated' : 'No active session',
          details: {
            authenticated: !!session,
            user: session?.user ? {
              id: session.user.id,
              email: session.user.email,
              name: session.user.name,
              credits: session.user.credits,
              trustScore: session.user.trustScore,
              verificationTier: session.user.verificationTier,
              isAdmin: session.user.isAdmin
            } : null
          }
        }
      } catch (error) {
        results.tests.session = {
          name: 'Current Session',
          success: false,
          message: `Session test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }
    }

    // Test 4: Demo Users
    if (test === 'all' || test === 'demo') {
      results.tests.demoUsers = {
        name: 'Demo Users',
        success: true,
        message: 'Demo users are available for testing',
        details: {
          availableUsers: [
            { email: 'alex@stakr.app', password: 'password123', role: 'admin' },
            { email: 'demo@stakr.app', password: 'demo123', role: 'user' }
          ],
          instructions: 'Use these credentials to test the login functionality'
        }
      }
    }

    // Test 5: Environment Variables
    if (test === 'all' || test === 'env') {
      results.tests.environment = {
        name: 'Environment Variables',
        success: true,
        message: 'Environment configuration status',
        details: {
          NODE_ENV: process.env.NODE_ENV,
          DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
          NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set',
          NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'Set' : 'Not set',
          GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
          GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set',
          missingRequired: []
        }
      }
      
      // Check for missing required variables
      const missing = []
      if (!process.env.DATABASE_URL) missing.push('DATABASE_URL')
      if (!process.env.NEXTAUTH_SECRET) missing.push('NEXTAUTH_SECRET')
      
      results.tests.environment.details.missingRequired = missing
      if (missing.length > 0) {
        results.tests.environment.success = false
        results.tests.environment.message = `Missing required environment variables: ${missing.join(', ')}`
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding and authentication tests completed',
      ...results
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Test execution failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// POST endpoint for testing user creation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    if (action === 'create-test-user') {
      // Simulate user creation process
      const { email, password, name } = data
      
      if (!email || !password || !name) {
        return NextResponse.json({
          success: false,
          error: 'Missing required fields',
          required: ['email', 'password', 'name']
        }, { status: 400 })
      }

      // For now, simulate successful user creation
      const mockUser = {
        id: crypto.randomUUID(),
        email,
        name,
        credits: 0,
        trustScore: 50,
        verificationTier: 'manual',
        isAdmin: false,
        created: new Date().toISOString()
      }

      return NextResponse.json({
        success: true,
        message: 'Test user created successfully (simulated)',
        user: mockUser,
        note: 'This is a simulation. Real database integration needed for actual user creation.'
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Unknown action',
      availableActions: ['create-test-user']
    }, { status: 400 })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Test execution failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 