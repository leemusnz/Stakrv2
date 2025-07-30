import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { validateProofSubmission, processDetectionResult } from '@/lib/ai-anti-cheat'
import { createDbConnection } from '@/lib/db'

interface RouteParams {
  params: Promise<{
    id: string
  }>
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

    // 🛡️ AI ANTI-CHEAT VALIDATION
    console.log('🤖 Running AI anti-cheat validation...')
    
    let aiValidationResult = null
    let verificationStatus = 'pending'
    
    try {
      // Extract proof content for AI analysis
      let proofContent = ''
      if (proof_type === 'text') {
        proofContent = proof_data?.text || proof_data?.description || JSON.stringify(proof_data)
      } else if (proof_type === 'photo' || proof_type === 'video') {
        proofContent = proof_data?.file_url || proof_data?.file_name || 'Media file submitted'
      } else {
        proofContent = JSON.stringify(proof_data)
      }

      // Map proof_type to AI system format
      const aiProofType = proof_type === 'photo' ? 'image' : 
                         proof_type === 'video' ? 'video' : 
                         proof_type === 'text' ? 'text' : 'document'

      // Run AI validation
      aiValidationResult = await validateProofSubmission(
        'test-user-id', // TODO: Use session.user.id when auth is enabled
        challengeId,
        {
          type: aiProofType,
          content: proofContent,
          metadata: {
            deviceInfo: 'web-browser',
            location: location ? `${location.lat},${location.lng}` : undefined,
            fileSize: proof_data?.file_size,
            submissionType: submission_type,
            timerDuration: timer_duration
          }
        }
      )

      console.log('🧠 AI Analysis Result:', {
        confidence: aiValidationResult.confidence,
        action: aiValidationResult.action,
        processingTime: aiValidationResult.processingTime
      })

      // Set verification status based on AI decision
      switch (aiValidationResult.action) {
        case 'approve':
          verificationStatus = 'approved'
          break
        case 'review':
          verificationStatus = 'pending_review'
          break
        case 'reject':
          verificationStatus = 'rejected'
          break
        case 'ban':
          verificationStatus = 'banned'
          // Process the ban
          await processDetectionResult(aiValidationResult, 'test-user-id', `checkin-${Date.now()}`)
          break
        default:
          verificationStatus = 'pending'
      }

      console.log(`✅ AI validation complete: ${aiValidationResult.action} (${aiValidationResult.confidence}% confidence)`)

    } catch (aiError) {
      console.error('❌ AI validation failed:', aiError)
      // Don't block submission on AI errors, just log and continue
      verificationStatus = 'pending'
    }

    // Mock handling for demo purposes (enhanced with AI results)
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
      verification_status: verificationStatus,
      timer_duration: timer_duration,
      
      // AI Analysis Results
      ai_confidence: aiValidationResult?.confidence || null,
      ai_decision: aiValidationResult?.action || null,
      ai_reasons: aiValidationResult?.reasons || [],
      ai_processing_time: aiValidationResult?.processingTime || null,
      location: location,
      
      // Session-based scoring
      session_quality_score: submission_type === 'timer_based' ? 
        (85 + Math.random() * 15) : (70 + Math.random() * 20),
      random_checkins_passed: submission_type === 'timer_based' ? 
        Math.floor(Math.random() * 3) : 0,
      random_checkins_failed: submission_type === 'timer_based' ? 
        Math.floor(Math.random() * 1) : 0
    }

    // Generate AI-enhanced response message
    let responseMessage = ''
    let aiMessage = ''
    
    if (aiValidationResult) {
      switch (aiValidationResult.action) {
        case 'approve':
          aiMessage = `✅ AI Auto-Approved (${aiValidationResult.confidence}% confidence)`
          responseMessage = submission_type === 'timer_based' ? 
            'Timer-based check-in approved! Your session quality score has been calculated.' :
            'Check-in approved automatically! Great work!'
          break
        case 'review':
          aiMessage = `🔍 Queued for Review (${aiValidationResult.confidence}% confidence)`
          responseMessage = 'Check-in submitted and queued for human review. You\'ll be notified when it\'s processed.'
          break
        case 'reject':
          aiMessage = `❌ Rejected (${aiValidationResult.confidence}% confidence)`
          responseMessage = `Check-in rejected: ${aiValidationResult.reasons.join(', ')}. You may appeal this decision.`
          break
        case 'ban':
          aiMessage = `🚫 Account Suspended (${aiValidationResult.confidence}% confidence)`
          responseMessage = 'Account suspended due to violation of platform policies. Contact support to appeal.'
          break
        default:
          aiMessage = 'Pending validation'
          responseMessage = submission_type === 'timer_based' ? 
            'Timer-based check-in submitted! Your session quality score has been calculated.' :
            'Daily check-in submitted successfully! Awaiting verification.'
      }
    } else {
      responseMessage = submission_type === 'timer_based' ? 
        'Timer-based check-in submitted! Your session quality score has been calculated.' :
        'Daily check-in submitted successfully! Awaiting verification.'
    }

    return NextResponse.json({
      success: verificationStatus !== 'banned', // Don't return success for banned users
      checkin: mockCheckin,
      message: responseMessage,
      ai_analysis: aiValidationResult ? {
        decision: aiValidationResult.action,
        confidence: aiValidationResult.confidence,
        processing_time: aiValidationResult.processingTime,
        reasons: aiValidationResult.reasons,
        can_appeal: ['reject', 'ban'].includes(aiValidationResult.action)
      } : null,
      ai_message: aiMessage,
      next_checkin_available: verificationStatus !== 'banned' ? 
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null
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
