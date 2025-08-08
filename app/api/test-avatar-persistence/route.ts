import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🧪 Testing avatar persistence for user:', session.user.id)

    const results = {
      persistenceSuccess: false,
      steps: {
        save: false,
        load: false,
        match: false
      },
      databaseAvatar: null as string | null,
      error: null as string | null,
      timestamp: new Date().toISOString()
    }

    try {
      console.log('💾 Testing avatar persistence...')

      // Step 1: Create a test avatar URL
      const testAvatarUrl = 'https://via.placeholder.com/100x100/0066ff/ffffff?text=Test'

      // Step 2: Save to database via profile update
      const profileResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/user/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: testAvatarUrl })
      })
      
      if (!profileResponse.ok) {
        results.error = `Profile update failed: ${profileResponse.status}`
        return NextResponse.json(results)
      }
      
      results.steps.save = true

      // Step 3: Load from database directly
      const sql = await createDbConnection()
      
      const dbResult = await sql`
        SELECT avatar_url FROM users WHERE id = ${session.user.id}
      `
      
      if (dbResult.length > 0) {
        results.steps.load = true
        results.databaseAvatar = dbResult[0].avatar_url
        results.steps.match = dbResult[0].avatar_url === testAvatarUrl
      } else {
        results.error = 'User not found in database'
      }

      results.persistenceSuccess = results.steps.save && results.steps.load && results.steps.match
      
      console.log('✅ Avatar persistence test completed:', results.persistenceSuccess ? 'PASSED' : 'FAILED')
      
    } catch (error) {
      results.error = error instanceof Error ? error.message : 'Unknown persistence error'
      console.error('❌ Avatar persistence test error:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Avatar persistence test completed',
      results
    })

  } catch (error) {
    console.error('Avatar persistence test failed:', error)
    return NextResponse.json({
      error: 'Avatar persistence test failed',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// GET endpoint to show test info
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Avatar persistence test endpoint',
    usage: {
      method: 'POST',
      description: 'Tests avatar persistence by saving a test avatar URL to the database and then loading it back to verify it was saved correctly'
    }
  })
}
