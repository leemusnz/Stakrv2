import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { isDemoUser } from '@/lib/demo-data'

// GET challenge activities
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
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Demo user handling
    if (isDemoUser(session.user.id)) {
      return handleDemoActivities(challengeId, limit, offset)
    }

    // Real user handling
    const sql = await createDbConnection()

    // Verify user has access to this challenge (is participant or it's public)
    const accessCheck = await sql`
      SELECT c.privacy_type, cp.user_id
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

    if (!isParticipant && !isPublic) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get various activity types from different tables
    const activities = await sql`
      WITH activity_feed AS (
        -- Check-ins
        SELECT 
          'check_in' as type,
          dc.id as activity_id,
          dc.user_id,
          u.name as user_name,
          u.avatar_url as user_avatar,
          dc.completed_at as timestamp,
          dc.completion_day,
          NULL as proof_url,
          NULL as verification_status,
          'completed daily check-in' as action_text
        FROM daily_completions dc
        JOIN users u ON dc.user_id = u.id
        WHERE dc.challenge_id = ${challengeId}
        AND dc.completed_at IS NOT NULL
        
        UNION ALL
        
        -- Verifications/Proof submissions
        SELECT 
          'verification' as type,
          ps.id as activity_id,
          ps.user_id,
          u.name as user_name,
          u.avatar_url as user_avatar,
          ps.submitted_at as timestamp,
          NULL as completion_day,
          ps.proof_url,
          ps.verification_status,
          'submitted proof of activity' as action_text
        FROM proof_submissions ps
        JOIN users u ON ps.user_id = u.id
        WHERE ps.challenge_id = ${challengeId}
        AND ps.submitted_at IS NOT NULL
        
        UNION ALL
        
        -- New participants joining
        SELECT 
          'join' as type,
          cp.id as activity_id,
          cp.user_id,
          u.name as user_name,
          u.avatar_url as user_avatar,
          cp.joined_at as timestamp,
          NULL as completion_day,
          NULL as proof_url,
          NULL as verification_status,
          'joined the challenge' as action_text
        FROM challenge_participants cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.challenge_id = ${challengeId}
        AND cp.joined_at IS NOT NULL
        
        UNION ALL
        
        -- Posts in challenge
        SELECT 
          'post' as type,
          up.id as activity_id,
          up.user_id,
          u.name as user_name,
          u.avatar_url as user_avatar,
          up.created_at as timestamp,
          NULL as completion_day,
          up.attached_image as proof_url,
          NULL as verification_status,
          CASE 
            WHEN up.post_type = 'proof_submission' THEN 'shared progress update'
            WHEN up.post_type = 'milestone' THEN 'reached a milestone'
            ELSE 'posted in the community'
          END as action_text
        FROM user_posts up
        JOIN users u ON up.user_id = u.id
        WHERE up.challenge_id = ${challengeId}
        AND up.is_public = true
      )
      SELECT *
      FROM activity_feed
      ORDER BY timestamp DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Calculate streaks for check-ins
    const activitiesWithStreaks = await Promise.all(activities.map(async (activity) => {
      let streak = null
      
      if (activity.type === 'check_in') {
        // Calculate current streak for this user
        const streakResult = await sql`
          SELECT COUNT(*) as streak
          FROM daily_completions
          WHERE challenge_id = ${challengeId}
          AND user_id = ${activity.user_id}
          AND completed_at IS NOT NULL
          AND completion_day <= ${activity.completion_day}
          AND completion_day > ${activity.completion_day} - 30 -- Look back max 30 days
          ORDER BY completion_day DESC
        `
        streak = parseInt(streakResult[0]?.streak) || 1
      }

      return {
        id: activity.activity_id,
        type: activity.type,
        user: {
          id: activity.user_id,
          name: activity.user_name,
          avatar: activity.user_avatar
        },
        action: activity.action_text,
        timestamp: activity.timestamp,
        challenge: activity.completion_day ? `Day ${activity.completion_day}` : null,
        streak: streak,
        imageUrl: activity.proof_url,
        verificationStatus: activity.verification_status
      }
    }))

    return NextResponse.json({
      success: true,
      activities: activitiesWithStreaks,
      pagination: {
        limit,
        offset,
        hasMore: activities.length === limit
      }
    })

  } catch (error) {
    console.error('Get challenge activities error:', error)
    return NextResponse.json({
      error: 'Failed to get challenge activities',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// Demo implementation
function handleDemoActivities(challengeId: string, limit: number, offset: number) {
  const demoActivities = [
    {
      id: "demo-activity-1",
      type: "check_in",
      user: {
        id: "demo-user-1",
        name: "Sarah Chen",
        avatar: "/avatars/avatar-1.svg"
      },
      action: "completed daily check-in",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      challenge: "Day 15",
      streak: 15,
      imageUrl: null,
      verificationStatus: null
    },
    {
      id: "demo-activity-2",
      type: "verification", 
      user: {
        id: "demo-user-2",
        name: "Mike Rodriguez",
        avatar: "/avatars/avatar-2.svg"
      },
      action: "submitted proof of workout",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      challenge: "30-min gym session",
      streak: null,
      imageUrl: "/placeholder.jpg",
      verificationStatus: "pending"
    },
    {
      id: "demo-activity-3",
      type: "post",
      user: {
        id: "demo-user-3", 
        name: "Emma Wilson",
        avatar: "/avatars/avatar-3.svg"
      },
      action: "reached a milestone",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      challenge: "Halfway point",
      streak: null,
      imageUrl: null,
      verificationStatus: null
    },
    {
      id: "demo-activity-4",
      type: "join",
      user: {
        id: "demo-user-4",
        name: "Alex Thompson", 
        avatar: "/avatars/avatar-4.svg"
      },
      action: "joined the challenge",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      challenge: "Welcome!",
      streak: null,
      imageUrl: null,
      verificationStatus: null
    }
  ]

  return NextResponse.json({
    success: true,
    activities: demoActivities.slice(offset, offset + limit),
    pagination: {
      limit,
      offset,
      hasMore: offset + limit < demoActivities.length
    }
  })
} 