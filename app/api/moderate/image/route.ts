import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { moderationService, type ModerationResult } from '@/lib/moderation'

// ============================================================================
// IMAGE MODERATION WITH CONTEXT-AWARE LOGIC
// ============================================================================
//
// Features:
// - Higher confidence thresholds to reduce false positives
// - Allow-list for fitness/workout imagery (core to Stakr)
// - Proper error handling: API failures don't block uploads, flag for review
// - Context-aware: stricter for profile pics, lenient for challenge uploads
// - Configurable thresholds via env vars

// Fitness-related allow-list: common workout & fitness imagery
const FITNESS_ALLOW_LIST = [
  'person',
  'gym',
  'fitness',
  'muscle',
  'athlete',
  'workout',
  'exercise',
  'running',
  'cycling',
  'weights',
  'dumbbells',
  'barbell',
  'stretching',
  'yoga',
  'sports',
  'training',
  'outdoor',
  'nature',
  'park',
  'water',
  'swimming',
  'activity',
]

// Confidence thresholds (configurable via env)
const MODERATION_CONFIG = {
  // Confidence threshold for strict rejection (85% = only very confident blocks)
  STRICT_REJECTION_THRESHOLD: parseFloat(process.env.MODERATION_STRICT_THRESHOLD || '85'),
  // Threshold for flagging content for manual review (70% = more lenient)
  REVIEW_THRESHOLD: parseFloat(process.env.MODERATION_REVIEW_THRESHOLD || '70'),
  // Enable fitness allow-list bypass
  ENABLE_FITNESS_ALLOWLIST: process.env.MODERATION_FITNESS_ALLOWLIST !== 'false',
}

interface ModerationDecision {
  approved: boolean
  action: 'approve' | 'review' | 'reject'
  confidence: number
  reason: string[]
  isFitnessContent: boolean
  isTechnicalError: boolean
  notes: string
}

/**
 * Check if moderation result is a technical error (API failure, not content violation)
 */
function isTechnicalError(result: ModerationResult): boolean {
  return (
    result.reason.some(r =>
      r.includes('moderation_') ||
      r.includes('api_') ||
      r.includes('download_') ||
      r.includes('parse_') ||
      r.includes('error')
    ) || (result.flagged && result.confidence === 0)
  )
}

/**
 * Check if content matches fitness allow-list
 * (Stakr is a fitness challenge app, so workout imagery should be lenient)
 */
function isFitnessContent(result: ModerationResult): boolean {
  if (!MODERATION_CONFIG.ENABLE_FITNESS_ALLOWLIST) return false
  if (result.flagged === false) return false

  // Check if any flagged reason contains fitness-related keywords
  const flaggedReasons = result.reason || []
  return flaggedReasons.some(reason =>
    FITNESS_ALLOW_LIST.some(keyword =>
      reason.toLowerCase().includes(keyword)
    )
  )
}

/**
 * Apply context-aware moderation logic
 */
function applyContextLogic(
  result: ModerationResult,
  context: string
): ModerationDecision {
  const technicalError = isTechnicalError(result)
  const fitnessContent = isFitnessContent(result)

  // If it's not flagged, approve immediately
  if (!result.flagged) {
    return {
      approved: true,
      action: 'approve',
      confidence: result.confidence,
      reason: [],
      isFitnessContent: false,
      isTechnicalError: false,
      notes: 'Content passed moderation check',
    }
  }

  // Technical error handling: never block due to API failure, flag for review
  if (technicalError) {
    return {
      approved: true,
      action: 'review',
      confidence: result.confidence,
      reason: result.reason,
      isFitnessContent: false,
      isTechnicalError: true,
      notes: 'Content flagged for manual review due to moderation service error',
    }
  }

  // Fitness allow-list: allow fitness imagery even if flagged
  if (fitnessContent && context === 'challenge_submission') {
    return {
      approved: true,
      action: 'approve',
      confidence: result.confidence,
      reason: result.reason,
      isFitnessContent: true,
      isTechnicalError: false,
      notes: 'Fitness content approved (allow-list bypass)',
    }
  }

  // Confidence-based decisions
  if (result.confidence >= MODERATION_CONFIG.STRICT_REJECTION_THRESHOLD) {
    // Very confident it's bad → reject
    return {
      approved: false,
      action: 'reject',
      confidence: result.confidence,
      reason: result.reason,
      isFitnessContent: false,
      isTechnicalError: false,
      notes: `Content rejected with ${result.confidence}% confidence`,
    }
  }

  if (result.confidence >= MODERATION_CONFIG.REVIEW_THRESHOLD) {
    // Moderately confident → flag for review
    return {
      approved: true,
      action: 'review',
      confidence: result.confidence,
      reason: result.reason,
      isFitnessContent: false,
      isTechnicalError: false,
      notes: `Content flagged for manual review (${result.confidence}% confidence)`,
    }
  }

  // Low confidence → approve
  return {
    approved: true,
    action: 'approve',
    confidence: result.confidence,
    reason: result.reason,
    isFitnessContent: false,
    isTechnicalError: false,
    notes: `Content approved (low confidence: ${result.confidence}%)`,
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { imageUrl, context = 'profile_picture' } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 })
    }

    console.log('🔍 Image moderation request:', { imageUrl: imageUrl.substring(0, 50) + '...', context })

    // Call moderation service
    const moderationResult = await moderationService.moderateImage(imageUrl, context)
    console.log('🛡️  Raw moderation result:', {
      flagged: moderationResult.flagged,
      confidence: moderationResult.confidence,
      reasons: moderationResult.reason,
    })

    // Apply context-aware logic
    const decision = applyContextLogic(moderationResult, context)
    console.log('✅ Moderation decision:', decision)

    // Return decision to client
    return NextResponse.json({
      success: true,
      moderation: {
        flagged: !decision.approved,
        action: decision.action,
        confidence: decision.confidence,
        reason: decision.reason,
        notes: decision.notes,
        isFitnessContent: decision.isFitnessContent,
        isTechnicalError: decision.isTechnicalError,
      },
    })
  } catch (error) {
    console.error('❌ Image moderation API error:', error)

    // On API error, flag for review rather than blocking
    // This ensures users aren't locked out if moderation service is down
    return NextResponse.json(
      {
        success: true,
        moderation: {
          flagged: false,
          action: 'review',
          confidence: 0,
          reason: ['moderation_service_error'],
          notes: 'Content flagged for manual review due to moderation service unavailability',
          isFitnessContent: false,
          isTechnicalError: true,
        },
      },
      { status: 200 } // Return 200 OK so upload proceeds, but flag for review
    )
  }
}
