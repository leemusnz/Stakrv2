import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { aiAntiCheat, validateProofSubmission, processDetectionResult } from '@/lib/ai-anti-cheat'
import { createDbConnection } from '@/lib/db'
import { systemLogger } from '@/lib/system-logger'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: 'You must be logged in to submit proof'
      }, { status: 401 })
    }

    const body = await request.json()
    const { challengeId, proofType, proofContent, metadata } = body

    // Validate input
    if (!challengeId || !proofType || !proofContent) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'Challenge ID, proof type, and proof content are required'
      }, { status: 400 })
    }


    // Initialize AI system if not already done
    await aiAntiCheat.initialize()

    // Run AI analysis
    const detectionResult = await validateProofSubmission(
      session.user.id,
      challengeId,
      {
        type: proofType,
        content: proofContent,
        deviceInfo: metadata?.deviceInfo,
        location: metadata?.location,
        fileSize: metadata?.fileSize,
        duration: metadata?.duration
      }
    )


    // Handle the result based on AI decision
    let responseMessage = ''
    let shouldSaveSubmission = false
    let submissionStatus = ''

    switch (detectionResult.action) {
      case 'approve':
        responseMessage = 'Proof validated and approved automatically'
        shouldSaveSubmission = true
        submissionStatus = 'approved'
        break
        
      case 'review':
        responseMessage = 'Proof queued for human review (usually completed within 24 hours)'
        shouldSaveSubmission = true
        submissionStatus = 'pending_review'
        break
        
      case 'reject':
        responseMessage = `Proof rejected: ${detectionResult.reasons.join(', ')}. You may appeal this decision.`
        shouldSaveSubmission = true
        submissionStatus = 'rejected'
        break
        
      case 'ban':
        responseMessage = 'Account suspended due to violation of platform policies. Contact support to appeal.'
        shouldSaveSubmission = true
        submissionStatus = 'banned'
        
        // Process the ban
        const submissionId = `submission_${Date.now()}`
        await processDetectionResult(detectionResult, session.user.id, submissionId)
        break
    }

    // Save to database if appropriate
    if (shouldSaveSubmission) {
      const sql = await createDbConnection()
      
      try {
        await sql`
          INSERT INTO proof_submissions (
            id,
            user_id,
            challenge_id,
            proof_type,
            proof_content,
            ai_confidence,
            ai_decision,
            ai_reasons,
            status,
            created_at,
            metadata
          ) VALUES (
            gen_random_uuid(),
            ${session.user.id},
            ${challengeId},
            ${proofType},
            ${proofContent},
            ${detectionResult.confidence},
            ${detectionResult.action},
            ${JSON.stringify(detectionResult.reasons)},
            ${submissionStatus},
            NOW(),
            ${JSON.stringify({
              ...metadata,
              aiAnalysis: detectionResult.layerResults,
              processingTime: detectionResult.processingTime
            })}
          )
        `
        
        
      } catch (dbError) {
        console.error('❌ Failed to save proof submission:', dbError)
        systemLogger.error('Failed to save proof submission', 'ai-anticheat', {
          userId: session.user.id,
          challengeId,
          error: dbError instanceof Error ? dbError.message : 'Unknown error'
        })
        
        return NextResponse.json({
          success: false,
          error: 'Database error',
          message: 'Failed to save proof submission. Please try again.'
        }, { status: 500 })
      }
    }

    // Log the validation result
    systemLogger.info('AI proof validation completed', 'ai-anticheat', {
      userId: session.user.id,
      challengeId,
      confidence: detectionResult.confidence,
      action: detectionResult.action,
      processingTime: detectionResult.processingTime
    })

    return NextResponse.json({
      success: true,
      result: {
        action: detectionResult.action,
        confidence: detectionResult.confidence,
        message: responseMessage,
        processingTime: detectionResult.processingTime,
        canAppeal: ['reject', 'ban'].includes(detectionResult.action)
      }
    })

  } catch (error) {
    console.error('❌ AI proof validation error:', error)
    systemLogger.error('AI proof validation error', 'ai-anticheat', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json({
      success: false,
      error: 'Validation failed',
      message: 'An error occurred during proof validation. Please try again.',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// GET endpoint to check AI system status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin access required'
      }, { status: 403 })
    }

    // Get AI system stats (placeholder)
    const stats = {
      status: 'operational',
      modelsLoaded: true,
      averageProcessingTime: 1.2, // seconds
      todayStats: {
        totalSubmissions: 156,
        approved: 142,
        underReview: 12,
        rejected: 2,
        banned: 0
      },
      accuracyMetrics: {
        truePositiveRate: 96.2,
        falsePositiveRate: 0.8,
        confidence: 98.1
      }
    }

    return NextResponse.json({
      success: true,
      aiSystem: stats
    })

  } catch (error) {
    console.error('❌ AI system status error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Status check failed',
      message: 'Failed to get AI system status'
    }, { status: 500 })
  }
}
