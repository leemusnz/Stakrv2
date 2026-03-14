import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'


interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// START a new activity session
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id: challengeId } = await params
    const { planned_duration, location } = await request.json()
    
    if (!planned_duration || planned_duration < 5 || planned_duration > 480) {
      return NextResponse.json({ 
        error: 'Invalid duration. Must be between 5 and 480 minutes.' 
      }, { status: 400 })
    }

    // Demo user handling
    if (false) { // Demo user check removed
      const mockSession = {
        id: `demo-session-${Date.now()}`,
        challenge_id: challengeId,
        user_id: session?.user?.id || '',
        session_date: new Date().toISOString().split('T')[0],
        started_at: new Date().toISOString(),
        planned_duration: planned_duration,
        status: 'active',
        random_checkin_scheduled: Math.random() < 0.3, // 30% chance
        next_checkin_time: Math.random() < 0.3 ? 
          new Date(Date.now() + (10 + Math.random() * 35) * 60 * 1000).toISOString() : null
      }
      
      return NextResponse.json({
        success: true,
        session: mockSession,
        message: 'Activity session started! Stay focused, random check-ins may appear.'
      })
    }

    // For real users, return demo for now until migration is run
    const mockSession = {
      id: `session-${Date.now()}`,
      challenge_id: challengeId,
      user_id: session.user.id,
      session_date: new Date().toISOString().split('T')[0],
      started_at: new Date().toISOString(),
      planned_duration: planned_duration,
      status: 'active',
      random_checkins_enabled: true,
      next_checkin_time: new Date(Date.now() + (15 + Math.random() * 20) * 60 * 1000).toISOString()
    }
    
    return NextResponse.json({
      success: true,
      session: mockSession,
      message: 'Session started! Random verification may appear during your activity.'
    })

  } catch (error) {
    console.error('Start session error:', error)
    return NextResponse.json({
      error: 'Failed to start session',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// GET current active session
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id: challengeId } = await params

    // Return mock active session for demo
    const mockSession = {
      id: 'demo-session-active',
      challenge_id: challengeId,
      user_id: session.user.id,
      started_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // Started 25 min ago
      planned_duration: 45,
      status: 'active',
      elapsed_minutes: 25,
      remaining_minutes: 20,
      has_pending_checkin: Math.random() < 0.2 // 20% chance of pending checkin
    }
    
    return NextResponse.json({
      success: true,
      session: mockSession
    })

  } catch (error) {
    console.error('Get session error:', error)
    return NextResponse.json({
      error: 'Failed to get session',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
