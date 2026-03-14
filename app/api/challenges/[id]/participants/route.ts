import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'


// GET challenge participants with detailed info
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const challengeId = params.id

    // Demo user handling
    if (false) { // Demo user check removed
      return handleDemoParticipants(challengeId)
    }

    // Real user handling
    const sql = await createDbConnection()

    // Verify user has access to this challenge
    const accessCheck = await sql`
      SELECT c.privacy_type, cp.user_id, c.host_id
      FROM challenges c
      LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id AND cp.user_id = ${session.user.id}
      WHERE c.id = ${challengeId}
    `

    if (accessCheck.length === 0) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    const challenge = accessCheck[0]
    const isParticipant = !!challenge.user_id
    const isPublic = challenge.privacy_type === 'public'
    const isHost = session.user.id === challenge.host_id

    if (!isParticipant && !isPublic && !isHost) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get participants with progress, streaks, and activity status
    const participants = await sql`
      SELECT 
        cp.user_id,
        u.name,
        u.avatar_url,
        cp.joined_at,
        cp.completion_status,
        c.host_id,
        -- Progress calculation
        COUNT(DISTINCT dc.id) as days_completed,
        c.duration as total_days,
        -- Current streak calculation
        COALESCE(
          (SELECT COUNT(*)
           FROM daily_completions dc2
           WHERE dc2.user_id = cp.user_id 
           AND dc2.challenge_id = ${challengeId}
           AND dc2.completed_at IS NOT NULL
           AND dc2.completion_day >= (
             SELECT MAX(completion_day) - 6
             FROM daily_completions dc3
             WHERE dc3.user_id = cp.user_id 
             AND dc3.challenge_id = ${challengeId}
             AND dc3.completed_at IS NOT NULL
           )
          ), 0
        ) as current_streak,
        -- Last activity
        GREATEST(
          COALESCE(MAX(dc.completed_at), cp.joined_at),
          COALESCE(MAX(ps.submitted_at), cp.joined_at),
          COALESCE(MAX(up.created_at), cp.joined_at)
        ) as last_activity,
        -- Activity status calculation
        CASE 
          WHEN MAX(dc.completed_at) > NOW() - INTERVAL '24 hours' THEN 'active'
          WHEN MAX(dc.completed_at) > NOW() - INTERVAL '48 hours' THEN 'at_risk'
          ELSE 'inactive'
        END as activity_status
      FROM challenge_participants cp
      JOIN users u ON cp.user_id = u.id
      JOIN challenges c ON cp.challenge_id = c.id
      LEFT JOIN daily_completions dc ON cp.user_id = dc.user_id AND cp.challenge_id = dc.challenge_id
      LEFT JOIN proof_submissions ps ON cp.user_id = ps.user_id AND cp.challenge_id = ps.challenge_id
      LEFT JOIN user_posts up ON cp.user_id = up.user_id AND cp.challenge_id = up.challenge_id
      WHERE cp.challenge_id = ${challengeId}
      GROUP BY cp.user_id, u.name, u.avatar_url, cp.joined_at, cp.completion_status, c.host_id, c.duration
      ORDER BY 
        CASE WHEN cp.user_id = c.host_id THEN 0 ELSE 1 END, -- Host first
        days_completed DESC, -- Then by progress
        current_streak DESC -- Then by streak
    `

    const formattedParticipants = participants.map((participant: Record<string, any>) => ({
      id: participant.user_id,
      name: participant.name,
      avatar: participant.avatar_url,
      progress: {
        completed: parseInt(participant.days_completed) || 0,
        total: parseInt(participant.total_days) || 30
      },
      streak: parseInt(participant.current_streak) || 0,
      lastActivity: participant.last_activity,
      status: participant.activity_status,
      isHost: participant.user_id === participant.host_id,
      joinedAt: participant.joined_at,
      completionStatus: participant.completion_status
    }))

    return NextResponse.json({
      success: true,
      participants: formattedParticipants,
      stats: {
        total: formattedParticipants.length,
        active: formattedParticipants.filter((p: Record<string, any>) => p.status === 'active').length,
        atRisk: formattedParticipants.filter((p: Record<string, any>) => p.status === 'at_risk').length,
        avgProgress: Math.round(
          formattedParticipants.reduce((sum: number, p: Record<string, any>) => sum + (p.progress.completed / p.progress.total), 0) / 
          formattedParticipants.length * 100
        ) || 0
      }
    })

  } catch (error) {
    console.error('Get challenge participants error:', error)
    return NextResponse.json({
      error: 'Failed to get challenge participants',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// Demo implementation
function handleDemoParticipants(challengeId: string) {
  const demoParticipants = [
    {
      id: "demo-user-1",
      name: "Sarah Chen",
      avatar: "/avatars/avatar-1.svg",
      progress: { completed: 15, total: 30 },
      streak: 15,
      lastActivity: new Date(Date.now() - 30 * 60 * 1000),
      status: "active",
      isHost: false,
      joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      completionStatus: "in_progress"
    },
    {
      id: "demo-user-2", 
      name: "Mike Rodriguez",
      avatar: "/avatars/avatar-2.svg",
      progress: { completed: 12, total: 30 },
      streak: 3,
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: "active",
      isHost: false,
      joinedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      completionStatus: "in_progress"
    },
    {
      id: "demo-user-3",
      name: "Emma Wilson", 
      avatar: "/avatars/avatar-3.svg",
      progress: { completed: 8, total: 30 },
      streak: 1,
      lastActivity: new Date(Date.now() - 36 * 60 * 60 * 1000),
      status: "at_risk",
      isHost: false,
      joinedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      completionStatus: "in_progress"
    },
    {
      id: "demo-user-4",
      name: "Challenge Host",
      avatar: "/avatars/avatar-5.svg",
      progress: { completed: 20, total: 30 },
      streak: 20,
      lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000),
      status: "active",
      isHost: true,
      joinedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      completionStatus: "in_progress"
    }
  ]

  return NextResponse.json({
    success: true,
    participants: demoParticipants,
    stats: {
      total: demoParticipants.length,
      active: demoParticipants.filter(p => p.status === 'active').length,
      atRisk: demoParticipants.filter(p => p.status === 'at_risk').length,
      avgProgress: Math.round(
        demoParticipants.reduce((sum, p) => sum + (p.progress.completed / p.progress.total), 0) / 
        demoParticipants.length * 100
      )
    }
  })
}
