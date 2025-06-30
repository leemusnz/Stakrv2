import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isDemoUser } from '@/lib/demo-data'

interface RouteParams {
  params: Promise<{
    id: string
    sessionId: string
  }>
}

// UPDATE session status (complete, pause, resume, abandon)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id: challengeId, sessionId } = await params
    const { action, actual_duration, location, proof_data } = await request.json()
    
    const validActions = ['complete', 'pause', 'resume', 'abandon']
    if (!validActions.includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Must be: complete, pause, resume, or abandon' 
      }, { status: 400 })
    }

    // Demo user handling
    const mockResult = {
      session_id: sessionId,
      challenge_id: challengeId,
      action: action,
      status: action === 'complete' ? 'completed' : 
              action === 'abandon' ? 'abandoned' :
              action === 'pause' ? 'paused' : 'active',
      completed_at: action === 'complete' ? new Date().toISOString() : null,
      actual_duration: action === 'complete' ? (actual_duration || 45) : null,
      quality_score: action === 'complete' ? (85 + Math.random() * 15) : null
    }
    
    return NextResponse.json({
      success: true,
      session: mockResult,
      message: action === 'complete' ? 
        'Great job! Session completed successfully.' :
        `Session ${action}d successfully.`
    })

  } catch (error) {
    console.error('Update session error:', error)
    return NextResponse.json({
      error: 'Failed to update session',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// GET specific session details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { sessionId } = await params

    // Return mock session details
    const mockSession = {
      id: sessionId,
      started_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      planned_duration: 60,
      actual_duration: 45,
      status: 'completed',
      completed_at: new Date().toISOString(),
      random_checkins: [
        {
          id: 'check-1',
          triggered_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          prompt: 'Take a photo showing your exercise equipment',
          response_time_seconds: 28,
          status: 'approved'
        },
        {
          id: 'check-2',
          triggered_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          prompt: 'Show your water bottle',
          response_time_seconds: 15,
          status: 'approved'
        }
      ],
      quality_score: 92
    }
    
    return NextResponse.json({
      success: true,
      session: mockSession
    })

  } catch (error) {
    console.error('Get session details error:', error)
    return NextResponse.json({
      error: 'Failed to get session details',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
