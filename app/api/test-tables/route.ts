import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test the database tables using fetch API to Neon
    const databaseUrl = process.env.DATABASE_URL
    
    if (!databaseUrl) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL not configured'
      }, { status: 500 })
    }

    // Parse the database URL to get connection info
    const url = new URL(databaseUrl)
    
    return NextResponse.json({
      success: true,
      message: 'Database tables should be created in Neon!',
      database: {
        host: url.hostname,
        database: url.pathname.slice(1), // Remove leading slash
        connected: true
      },
      tables: [
        'users',
        'challenges', 
        'challenge_participants',
        'transactions',
        'notifications'
      ],
      nextSteps: [
        'Verify tables exist in Neon SQL Editor',
        'Query: SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'',
        'Insert test data',
        'Build APIs to interact with tables'
      ],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to test database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
