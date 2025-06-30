import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { isDemoUser } from '@/lib/demo-data'

interface RouteParams {
  params: {
    id: string
  }
}

// GET individual challenge details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    const challengeId = params.id
    
    // For demo users or demo challenge IDs, return mock data
    if (!session?.user || isDemoUser(session.user.id) || challengeId.startsWith('demo-')) {
      return getMockChallenge(challengeId)
    }

    // Real user handling
    const sql = await createDbConnection()
    
    // Fetch challenge with host info and participant count
    const challenge = await sql`
      SELECT 
        c.*,
        u.name as host_name,
        u.email as host_email,
        COUNT(DISTINCT cp.id) as current_participants,
        COUNT(DISTINCT ct.id) as team_count
      FROM challenges c
      LEFT JOIN users u ON c.host_id = u.id
      LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
      LEFT JOIN challenge_teams ct ON c.id = ct.challenge_id
      WHERE c.id = ${challengeId}
      GROUP BY c.id, u.name, u.email
    `
    
    if (challenge.length === 0) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }
    
    const challengeData = challenge[0]
    
    return NextResponse.json({
      success: true,
      challenge: challengeData
    })
    
  } catch (error) {
    console.error('Get challenge error:', error)
    return NextResponse.json({
      error: 'Failed to get challenge',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// Mock challenge data for demo users
function getMockChallenge(challengeId: string) {
  const challenge = {
    id: challengeId,
    title: "Morning Meditation Streak",
    description: "Transform your mornings and build unshakeable mental clarity with a 7-day meditation commitment.",
    category: "Mindfulness",
    duration: "7 days",
    difficulty: "Easy",
    current_participants: 234,
    max_participants: 500,
    min_stake: 10,
    max_stake: 100,
    allow_points_only: true,
    status: 'active',
    host_name: "Sarah Chen",
    enable_team_mode: false,
    privacy_type: 'public'
  }
  
  return NextResponse.json({
    success: true,
    challenge: challenge
  })
} 