import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'

import { shouldUseDemoData, createDemoResponse } from '@/lib/demo-mode'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Hybrid demo system: new demo mode OR legacy demo users
    if (shouldUseDemoData(request, session) ) {
      const mockHostedChallenges = [
        {
          id: 'demo-hosted-1',
          title: 'Morning Meditation Challenge',
          description: 'Start each day with 10 minutes of mindfulness',
          category: 'Wellness',
          status: 'pending',
          start_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
          start_date_type: 'manual',
          duration: '7 days',
          difficulty: 'Easy',
          min_stake: 10,
          max_stake: 50,
          allow_points_only: false,
          privacy_type: 'public',
          current_participants: 12,
          require_timer: false,
          random_checkin_enabled: false,
          enable_team_mode: false,
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'demo-hosted-2',
          title: 'Daily Reading Habit',
          description: 'Read for 30 minutes every day',
          category: 'Education',
          status: 'active',
          start_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString(),
          start_date_type: 'days',
          duration: '30 days',
          difficulty: 'Medium',
          min_stake: 25,
          max_stake: 100,
          allow_points_only: false,
          privacy_type: 'public',
          current_participants: 45,
          require_timer: true,
          random_checkin_enabled: true,
          enable_team_mode: false,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'demo-hosted-3',
          title: 'Early Morning Workout',
          description: 'Exercise before 7 AM every day for stronger discipline',
          category: 'Fitness',
          status: 'completed',
          start_date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          start_date_type: 'days',
          duration: '30 days',
          difficulty: 'Hard',
          min_stake: 50,
          max_stake: 200,
          allow_points_only: false,
          privacy_type: 'public',
          current_participants: 32,
          require_timer: false,
          random_checkin_enabled: false,
          enable_team_mode: false,
          created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      return NextResponse.json(createDemoResponse({
        success: true,
        challenges: mockHostedChallenges
      }, request, session))
    }

    // For real users, query database
    const sql = await createDbConnection()
    
    const hostedChallenges = await sql`
      SELECT 
        c.*,
        COUNT(DISTINCT cp.id) as current_participants
      FROM challenges c
      LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
      WHERE c.host_id = ${session.user.id}
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `

    return NextResponse.json({
      success: true,
      challenges: hostedChallenges
    })

  } catch (error) {
    console.error('Hosted challenges fetch error:', error)
    return NextResponse.json({
      error: 'Failed to fetch hosted challenges',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
