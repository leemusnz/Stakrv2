import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: {
    id: string
  }
}

// POST daily check-in (manual or session-based)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // TEMPORARILY DISABLE AUTH FOR TESTING
    // const session = await getServerSession(authOptions)
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    // }

    const challengeId = params.id
    const { 
      submission_type, 
      session_id, 
      proof_type, 
      proof_data, 
      notes, 
      location,
      timer_duration 
    } = await request.json()
    
    if (!submission_type || !proof_type) {
      return NextResponse.json({ 
        error: 'Submission type and proof type are required' 
      }, { status: 400 })
    }

    const validSubmissionTypes = ['manual', 'timer_based', 'auto_sync']
    const validProofTypes = ['photo', 'video', 'text', 'location', 'measurement']
    
    if (!validSubmissionTypes.includes(submission_type)) {
      return NextResponse.json({ 
        error: 'Invalid submission type' 
      }, { status: 400 })
    }
    
    if (!validProofTypes.includes(proof_type)) {
      return NextResponse.json({ 
        error: 'Invalid proof type' 
      }, { status: 400 })
    }

    // Mock handling for demo purposes
    const mockCheckin = {
      id: `checkin-${Date.now()}`,
      challenge_id: challengeId,
      user_id: 'test-user-id', // session.user.id,
      participant_id: `participant-test-user-id`, // session.user.id,
      session_id: session_id,
      checkin_date: new Date().toISOString().split('T')[0],
      submission_type: submission_type,
      proof_type: proof_type,
      proof_data: proof_data,
      notes: notes,
      submitted_at: new Date().toISOString(),
      verification_status: 'pending',
      timer_duration: timer_duration,
      location: location,
      
      // Session-based scoring
      session_quality_score: submission_type === 'timer_based' ? 
        (85 + Math.random() * 15) : (70 + Math.random() * 20),
      random_checkins_passed: submission_type === 'timer_based' ? 
        Math.floor(Math.random() * 3) : 0,
      random_checkins_failed: submission_type === 'timer_based' ? 
        Math.floor(Math.random() * 1) : 0
    }

    return NextResponse.json({
      success: true,
      checkin: mockCheckin,
      message: submission_type === 'timer_based' ? 
        'Timer-based check-in submitted! Your session quality score has been calculated.' :
        'Daily check-in submitted successfully! Awaiting verification.',
      next_checkin_available: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })

  } catch (error) {
    console.error('Submit checkin error:', error)
    return NextResponse.json({
      error: 'Failed to submit checkin',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// GET user's check-ins for this challenge
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // TEMPORARILY DISABLE AUTH FOR TESTING
    // const session = await getServerSession(authOptions)
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    // }

    const challengeId = params.id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Mock check-ins data with different session types
    const mockCheckins = [
      {
        id: 'checkin-1',
        checkin_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        submission_type: 'timer_based',
        proof_type: 'photo',
        submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        verification_status: 'approved',
        timer_duration: 45,
        session_quality_score: 92,
        random_checkins_passed: 2,
        random_checkins_failed: 0,
        notes: 'Great workout session with perfect random check-ins!'
      },
      {
        id: 'checkin-2',
        checkin_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        submission_type: 'manual',
        proof_type: 'photo',
        submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        verification_status: 'approved',
        timer_duration: null,
        session_quality_score: 78,
        random_checkins_passed: 0,
        random_checkins_failed: 0,
        notes: 'Manual submission with photo proof'
      },
      {
        id: 'checkin-3',
        checkin_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        submission_type: 'timer_based',
        proof_type: 'photo',
        submitted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        verification_status: 'approved',
        timer_duration: 60,
        session_quality_score: 87,
        random_checkins_passed: 1,
        random_checkins_failed: 1,
        notes: 'Had one failed random check-in but overall good session'
      }
    ]

    return NextResponse.json({
      success: true,
      checkins: mockCheckins,
      pagination: {
        current_page: page,
        total_pages: 1,
        total_checkins: mockCheckins.length,
        has_next: false,
        has_previous: false
      },
      statistics: {
        total_checkins: mockCheckins.length,
        approved_checkins: mockCheckins.filter(c => c.verification_status === 'approved').length,
        pending_checkins: mockCheckins.filter(c => c.verification_status === 'pending').length,
        timer_based_checkins: mockCheckins.filter(c => c.submission_type === 'timer_based').length,
        average_quality_score: mockCheckins.reduce((sum, c) => sum + c.session_quality_score, 0) / mockCheckins.length,
        total_random_checkins_passed: mockCheckins.reduce((sum, c) => sum + c.random_checkins_passed, 0),
        total_random_checkins_failed: mockCheckins.reduce((sum, c) => sum + c.random_checkins_failed, 0)
      }
    })

  } catch (error) {
    console.error('Get checkins error:', error)
    return NextResponse.json({
      error: 'Failed to get checkins',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
} 