import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { isDemoUser } from '@/lib/demo-data'

interface NudgeRequest {
  targetUserId: string
  type: 'nudge' | 'cheer'
  message?: string
}

// POST - Send a nudge or cheer to another participant
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const challengeId = params.id
    const body: NudgeRequest = await request.json()
    const { targetUserId, type, message } = body

    if (!targetUserId || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['nudge', 'cheer'].includes(type)) {
      return NextResponse.json({ error: 'Invalid interaction type' }, { status: 400 })
    }

    // Demo user handling
    if (isDemoUser(session.user.id)) {
      return handleDemoNudge(session.user, targetUserId, type, message)
    }

    // Real user handling
    const sql = await createDbConnection()

    // Verify both users are participants in this challenge
    const participantCheck = await sql`
      SELECT 
        sender.user_id as sender_id,
        sender_user.name as sender_name,
        target.user_id as target_id,
        target_user.name as target_name,
        c.title as challenge_title
      FROM challenge_participants sender
      JOIN users sender_user ON sender.user_id = sender_user.id
      JOIN challenge_participants target ON sender.challenge_id = target.challenge_id
      JOIN users target_user ON target.user_id = target_user.id
      JOIN challenges c ON sender.challenge_id = c.id
      WHERE sender.challenge_id = ${challengeId}
      AND sender.user_id = ${session.user.id}
      AND target.user_id = ${targetUserId}
    `

    if (participantCheck.length === 0) {
      return NextResponse.json({ 
        error: 'Both users must be participants in this challenge' 
      }, { status: 403 })
    }

    const info = participantCheck[0]

    // Prevent self-nudging
    if (session.user.id === targetUserId) {
      return NextResponse.json({ error: 'Cannot nudge yourself' }, { status: 400 })
    }

    // Check for rate limiting (max 3 nudges per day per user)
    const todayNudges = await sql`
      SELECT COUNT(*) as count
      FROM challenge_interactions
      WHERE sender_id = ${session.user.id}
      AND target_user_id = ${targetUserId}
      AND challenge_id = ${challengeId}
      AND interaction_type = ${type}
      AND created_at > NOW() - INTERVAL '24 hours'
    `

    if (parseInt(todayNudges[0]?.count) >= 3) {
      return NextResponse.json({ 
        error: `You can only send 3 ${type}s per day to the same person` 
      }, { status: 429 })
    }

    // Create the interaction record
    await sql`
      INSERT INTO challenge_interactions (
        challenge_id, sender_id, target_user_id, interaction_type, message, created_at
      ) VALUES (
        ${challengeId}, ${session.user.id}, ${targetUserId}, ${type}, 
        ${message || getDefaultMessage(type, info.sender_name)}, NOW()
      )
    `

    // Create notification for target user
    await sql`
      INSERT INTO notifications (
        user_id, type, title, content, challenge_id, 
        sender_id, is_read, created_at
      ) VALUES (
        ${targetUserId}, 
        ${type}, 
        ${type === 'nudge' ? 'Friendly Reminder' : 'You Got Cheered!'}, 
        ${getNotificationContent(type, info.sender_name, info.challenge_title, message)},
        ${challengeId},
        ${session.user.id},
        false,
        NOW()
      )
    `

    return NextResponse.json({
      success: true,
      message: `${type === 'nudge' ? 'Nudge' : 'Cheer'} sent successfully!`,
      interaction: {
        type,
        targetUser: info.target_name,
        timestamp: new Date()
      }
    })

  } catch (error) {
    console.error('Nudge/cheer error:', error)
    return NextResponse.json({
      error: 'Failed to send interaction',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// GET - Get interaction history for a challenge
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

    // Demo user handling
    if (isDemoUser(session.user.id)) {
      return handleDemoGetInteractions(challengeId, limit)
    }

    // Real user handling
    const sql = await createDbConnection()

    // Get recent interactions
    const interactions = await sql`
      SELECT 
        ci.*,
        sender.name as sender_name,
        sender.avatar_url as sender_avatar,
        target.name as target_name,
        target.avatar_url as target_avatar
      FROM challenge_interactions ci
      JOIN users sender ON ci.sender_id = sender.id
      JOIN users target ON ci.target_user_id = target.id
      WHERE ci.challenge_id = ${challengeId}
      ORDER BY ci.created_at DESC
      LIMIT ${limit}
    `

    const formattedInteractions = interactions.map(interaction => ({
      id: interaction.id,
      type: interaction.interaction_type,
      message: interaction.message,
      timestamp: interaction.created_at,
      sender: {
        id: interaction.sender_id,
        name: interaction.sender_name,
        avatar: interaction.sender_avatar
      },
      target: {
        id: interaction.target_user_id,
        name: interaction.target_name,
        avatar: interaction.target_avatar
      }
    }))

    return NextResponse.json({
      success: true,
      interactions: formattedInteractions
    })

  } catch (error) {
    console.error('Get interactions error:', error)
    return NextResponse.json({
      error: 'Failed to get interactions',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// Helper functions
function getDefaultMessage(type: string, senderName: string): string {
  if (type === 'nudge') {
    const nudgeMessages = [
      `${senderName} is sending you a gentle reminder to check in! 🔔`,
      `Hey there! ${senderName} wants to make sure you're staying on track 💪`,
      `${senderName} believes in you! Don't forget your daily check-in ⏰`
    ]
    return nudgeMessages[Math.floor(Math.random() * nudgeMessages.length)]
  } else {
    const cheerMessages = [
      `${senderName} is cheering you on! Keep up the great work! 🎉`,
      `Amazing job! ${senderName} is proud of your progress 🌟`,
      `${senderName} says you're doing fantastic! Keep going! 🚀`
    ]
    return cheerMessages[Math.floor(Math.random() * cheerMessages.length)]
  }
}

function getNotificationContent(type: string, senderName: string, challengeTitle: string, customMessage?: string): string {
  if (customMessage) {
    return customMessage
  }
  
  if (type === 'nudge') {
    return `${senderName} sent you a friendly reminder in "${challengeTitle}". Don't forget to check in today!`
  } else {
    return `${senderName} is cheering you on in "${challengeTitle}"! Keep up the amazing work!`
  }
}

// Demo implementations
function handleDemoNudge(user: any, targetUserId: string, type: string, message?: string) {
  return NextResponse.json({
    success: true,
    message: `${type === 'nudge' ? 'Nudge' : 'Cheer'} sent successfully! (Demo Mode)`,
    interaction: {
      type,
      targetUser: "Demo User",
      timestamp: new Date()
    }
  })
}

function handleDemoGetInteractions(challengeId: string, limit: number) {
  const demoInteractions = [
    {
      id: "demo-interaction-1",
      type: "cheer",
      message: "Amazing progress! Keep it up! 🌟",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      sender: {
        id: "demo-user-1",
        name: "Sarah Chen",
        avatar: "/avatars/avatar-1.svg"
      },
      target: {
        id: "demo-user-2", 
        name: "Mike Rodriguez",
        avatar: "/avatars/avatar-2.svg"
      }
    },
    {
      id: "demo-interaction-2",
      type: "nudge",
      message: "Friendly reminder to check in today! 🔔",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      sender: {
        id: "demo-user-3",
        name: "Emma Wilson",
        avatar: "/avatars/avatar-3.svg"
      },
      target: {
        id: "demo-user-4",
        name: "Alex Thompson", 
        avatar: "/avatars/avatar-4.svg"
      }
    }
  ]

  return NextResponse.json({
    success: true,
    interactions: demoInteractions.slice(0, limit)
  })
}
