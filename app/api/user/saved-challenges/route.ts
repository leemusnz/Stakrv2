import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

/**
 * GET /api/user/saved-challenges
 * Get all saved challenges for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get saved challenges
    const savedChallenges = await sql`
      SELECT 
        sc.challenge_id,
        sc.saved_at,
        c.*
      FROM saved_challenges sc
      JOIN challenges c ON c.id = sc.challenge_id
      WHERE sc.user_id = ${session.user.id}
      ORDER BY sc.saved_at DESC
    `

    return NextResponse.json({
      success: true,
      savedChallenges
    })
  } catch (error) {
    console.error('Error fetching saved challenges:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved challenges' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/saved-challenges
 * Save a challenge
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { challengeId } = await request.json()

    if (!challengeId) {
      return NextResponse.json(
        { error: 'Challenge ID is required' },
        { status: 400 }
      )
    }

    // Check if challenge exists
    const challenge = await sql`
      SELECT id FROM challenges WHERE id = ${challengeId}
    `

    if (challenge.length === 0) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      )
    }

    // Check if already saved
    const existing = await sql`
      SELECT id FROM saved_challenges 
      WHERE user_id = ${session.user.id} AND challenge_id = ${challengeId}
    `

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Challenge already saved',
        alreadySaved: true
      })
    }

    // Save the challenge
    await sql`
      INSERT INTO saved_challenges (user_id, challenge_id, saved_at)
      VALUES (${session.user.id}, ${challengeId}, NOW())
    `

    return NextResponse.json({
      success: true,
      message: 'Challenge saved successfully'
    })
  } catch (error) {
    console.error('Error saving challenge:', error)
    return NextResponse.json(
      { error: 'Failed to save challenge' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/user/saved-challenges
 * Unsave a challenge
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const challengeId = searchParams.get('challengeId')

    if (!challengeId) {
      return NextResponse.json(
        { error: 'Challenge ID is required' },
        { status: 400 }
      )
    }

    // Delete the saved challenge
    const result = await sql`
      DELETE FROM saved_challenges 
      WHERE user_id = ${session.user.id} AND challenge_id = ${challengeId}
    `

    return NextResponse.json({
      success: true,
      message: 'Challenge unsaved successfully'
    })
  } catch (error) {
    console.error('Error unsaving challenge:', error)
    return NextResponse.json(
      { error: 'Failed to unsave challenge' },
      { status: 500 }
    )
  }
}

