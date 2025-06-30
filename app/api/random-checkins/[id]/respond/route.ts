import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// POST response to random check-in
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id: checkinId } = await params
    const { response_type, response_data, response_time_seconds } = await request.json()
    
    if (!response_type || !response_data) {
      return NextResponse.json({ 
        error: 'Response type and data are required' 
      }, { status: 400 })
    }

    // Validate response time (should be within reasonable limits)
    if (response_time_seconds > 120) { // 2 minutes max
      return NextResponse.json({
        success: false,
        result: 'failed',
        reason: 'Response took too long. Random check-ins must be completed quickly.',
        quality_impact: -10
      })
    }

    // Mock verification logic - 80% pass rate for demo
    const verificationScore = Math.random()
    const isValid = verificationScore > 0.2
    
    const mockResult = {
      checkin_id: checkinId,
      user_id: session.user.id,
      response_submitted_at: new Date().toISOString(),
      response_type: response_type,
      response_time_seconds: response_time_seconds || 30,
      verification_status: isValid ? 'auto_approved' : 'rejected',
      response_valid: isValid,
      quality_score: isValid ? (85 + Math.random() * 15) : (20 + Math.random() * 30),
      verified_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      result: isValid ? 'approved' : 'rejected',
      checkin: mockResult,
      message: isValid ? 
        'Great! Verification passed. You can continue your session.' :
        'Verification failed. This may affect your session quality score.',
      session_can_continue: true, // Allow session to continue even if failed
      quality_impact: isValid ? 5 : -5
    })

  } catch (error) {
    console.error('Respond to checkin error:', error)
    return NextResponse.json({
      error: 'Failed to process checkin response',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// GET random check-in details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id: checkinId } = await params

    // Mock check-in details
    const mockCheckin = {
      id: checkinId,
      session_id: 'demo-session-active',
      challenge_id: 'demo-challenge-1',
      triggered_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
      checkin_type: 'immediate_photo',
      checkin_prompt: 'Take a photo showing your current exercise equipment',
      time_limit_seconds: 60,
      response_submitted_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(), // 1 minute ago
      response_time_seconds: 45,
      verification_status: 'auto_approved',
      response_valid: true,
      quality_score: 92
    }

    return NextResponse.json({
      success: true,
      checkin: mockCheckin
    })

  } catch (error) {
    console.error('Get checkin details error:', error)
    return NextResponse.json({
      error: 'Failed to get checkin details',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
