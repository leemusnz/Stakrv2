# 🔧 Stakr Verification System - Technical Implementation

## 📊 Database Schema Implementation

### **1. Enhanced Verification Tables**

\`\`\`sql
-- Migration: Add comprehensive verification system tables
-- File: migrations/verification-system-v1.sql

-- Verification methods catalog
CREATE TABLE verification_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('wearable', 'photo', 'video', 'text', 'app', 'social', 'admin')),
  trust_score_min INTEGER NOT NULL CHECK (trust_score_min >= 0 AND trust_score_min <= 100),
  trust_score_max INTEGER NOT NULL CHECK (trust_score_max >= 0 AND trust_score_max <= 100),
  complexity_level VARCHAR(20) NOT NULL CHECK (complexity_level IN ('low', 'medium', 'high', 'premium')),
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Challenge-specific verification rules
CREATE TABLE challenge_verification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  verification_method_id UUID REFERENCES verification_methods(id),
  is_required BOOLEAN DEFAULT false,
  minimum_confidence_score DECIMAL(4,2) DEFAULT 70.00 CHECK (minimum_confidence_score >= 0 AND minimum_confidence_score <= 100),
  instructions TEXT,
  examples JSONB DEFAULT '[]',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(challenge_id, verification_method_id)
);

-- Enhanced verification submissions
CREATE TABLE verification_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES challenge_participants(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id),
  user_id UUID REFERENCES users(id),
  verification_method_id UUID REFERENCES verification_methods(id),
  submission_data JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  ai_confidence_score DECIMAL(4,2) CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 100),
  manual_review_score DECIMAL(4,2) CHECK (manual_review_score >= 0 AND manual_review_score <= 100),
  admin_review_score DECIMAL(4,2) CHECK (admin_review_score >= 0 AND admin_review_score <= 100),
  community_votes JSONB DEFAULT '{"approve": 0, "reject": 0, "votes": []}',
  final_status VARCHAR(20) DEFAULT 'pending' CHECK (final_status IN ('pending', 'approved', 'rejected', 'under_review', 'appealed')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Verification appeals system
CREATE TABLE verification_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES verification_submissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  appeal_reason TEXT NOT NULL,
  additional_evidence JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Verification method integrations (for wearables, apps, etc.)
CREATE TABLE verification_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method_id UUID REFERENCES verification_methods(id),
  integration_type VARCHAR(50) NOT NULL, -- 'apple_health', 'fitbit', 'strava', etc.
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_verification_submissions_status ON verification_submissions(final_status);
CREATE INDEX idx_verification_submissions_challenge ON verification_submissions(challenge_id);
CREATE INDEX idx_verification_submissions_user ON verification_submissions(user_id);
CREATE INDEX idx_verification_submissions_method ON verification_submissions(verification_method_id);
CREATE INDEX idx_verification_appeals_status ON verification_appeals(status);
CREATE INDEX idx_verification_appeals_submission ON verification_appeals(submission_id);
\`\`\`

### **2. TypeScript Interfaces**

\`\`\`typescript
// File: types/verification.ts

export interface VerificationMethod {
  id: string
  name: string
  type: 'wearable' | 'photo' | 'video' | 'text' | 'app' | 'social' | 'admin'
  trustScoreMin: number
  trustScoreMax: number
  complexityLevel: 'low' | 'medium' | 'high' | 'premium'
  isActive: boolean
  config: Record<string, any>
}

export interface ChallengeVerificationRule {
  id: string
  challengeId: string
  verificationMethodId: string
  isRequired: boolean
  minimumConfidenceScore: number
  instructions: string
  examples: string[]
  orderIndex: number
}

export interface VerificationSubmission {
  id: string
  participantId: string
  challengeId: string
  userId: string
  verificationMethodId: string
  submissionData: Record<string, any>
  metadata: Record<string, any>
  aiConfidenceScore?: number
  manualReviewScore?: number
  adminReviewScore?: number
  communityVotes: {
    approve: number
    reject: number
    votes: Array<{
      userId: string
      vote: 'approve' | 'reject'
      timestamp: string
    }>
  }
  finalStatus: 'pending' | 'approved' | 'rejected' | 'under_review' | 'appealed'
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
  createdAt: string
  updatedAt: string
}

export interface VerificationAppeal {
  id: string
  submissionId: string
  userId: string
  appealReason: string
  additionalEvidence: Record<string, any>
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy?: string
  reviewedAt?: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
}

export interface ProofSubmission {
  challengeId: string
  verificationMethodId: string
  submissionData: Record<string, any>
  metadata?: Record<string, any>
  description: string
}

export interface VerificationResult {
  submissionId: string
  status: 'pending' | 'approved' | 'rejected' | 'under_review'
  confidenceScore?: number
  reviewRequired: boolean
  estimatedReviewTime?: string
  nextSteps?: string[]
}
\`\`\`

## 🔌 API Implementation

### **1. Verification API Routes**

\`\`\`typescript
// File: app/api/verification/submit/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { validateProofSubmission } from '@/lib/verification/validation'
import { processVerification } from '@/lib/verification/engine'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const validation = validateProofSubmission(body)
    
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const sql = await createDbConnection()
    
    // Check if user is participant in challenge
    const participant = await sql`
      SELECT id FROM challenge_participants 
      WHERE challenge_id = ${body.challengeId} 
      AND user_id = ${session.user.id}
      AND completion_status = 'active'
    `

    if (!participant[0]) {
      return NextResponse.json({ error: 'Not a participant in this challenge' }, { status: 403 })
    }

    // Process verification
    const result = await processVerification({
      participantId: participant[0].id,
      challengeId: body.challengeId,
      userId: session.user.id,
      verificationMethodId: body.verificationMethodId,
      submissionData: body.submissionData,
      metadata: body.metadata || {}
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Verification submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
\`\`\`

### **2. Verification Engine**

\`\`\`typescript
// File: lib/verification/engine.ts

import { createDbConnection } from '@/lib/db'
import { analyzeMedia, analyzeText, verifyWearableData } from './ai'
import { calculateTrustScore } from './trust-scoring'

export async function processVerification(data: {
  participantId: string
  challengeId: string
  userId: string
  verificationMethodId: string
  submissionData: Record<string, any>
  metadata: Record<string, any>
}): Promise<VerificationResult> {
  const sql = await createDbConnection()

  // Get verification method details
  const method = await sql`
    SELECT * FROM verification_methods WHERE id = ${data.verificationMethodId}
  `

  if (!method[0]) {
    throw new Error('Invalid verification method')
  }

  // Get user trust score
  const user = await sql`
    SELECT trust_score FROM users WHERE id = ${data.userId}
  `

  const trustScore = user[0]?.trust_score || 50

  // Process based on verification method type
  let confidenceScore: number | undefined
  let reviewRequired = false

  switch (method[0].type) {
    case 'photo':
    case 'video':
      const mediaAnalysis = await analyzeMedia(data.submissionData.file, {
        type: method[0].type,
        requirements: method[0].config
      })
      confidenceScore = mediaAnalysis.confidenceScore
      reviewRequired = mediaAnalysis.reviewRequired
      break

    case 'text':
      const textAnalysis = await analyzeText(data.submissionData.content, {
        requirements: method[0].config
      })
      confidenceScore = textAnalysis.confidenceScore
      reviewRequired = textAnalysis.reviewRequired
      break

    case 'wearable':
      const wearableVerification = await verifyWearableData(data.submissionData, {
        deviceType: method[0].config.deviceType,
        requirements: method[0].config
      })
      confidenceScore = wearableVerification.confidenceScore
      reviewRequired = wearableVerification.reviewRequired
      break

    default:
      confidenceScore = 70 // Default confidence for unknown methods
      reviewRequired = true
  }

  // Determine final status based on confidence and trust score
  let finalStatus: VerificationSubmission['finalStatus'] = 'pending'
  let estimatedReviewTime: string | undefined

  if (confidenceScore && confidenceScore >= 90 && trustScore >= 80) {
    finalStatus = 'approved'
  } else if (confidenceScore && confidenceScore >= 70) {
    finalStatus = 'under_review'
    estimatedReviewTime = '24-48 hours'
  } else {
    finalStatus = 'rejected'
  }

  // Insert submission
  const submission = await sql`
    INSERT INTO verification_submissions (
      participant_id, challenge_id, user_id, verification_method_id,
      submission_data, metadata, ai_confidence_score, final_status
    ) VALUES (
      ${data.participantId}, ${data.challengeId}, ${data.userId},
      ${data.verificationMethodId}, ${JSON.stringify(data.submissionData)},
      ${JSON.stringify(data.metadata)}, ${confidenceScore}, ${finalStatus}
    ) RETURNING id
  `

  return {
    submissionId: submission[0].id,
    status: finalStatus,
    confidenceScore,
    reviewRequired,
    estimatedReviewTime,
    nextSteps: getNextSteps(finalStatus, method[0].type)
  }
}

function getNextSteps(status: string, methodType: string): string[] {
  switch (status) {
    case 'approved':
      return ['Your verification has been approved!', 'Check your challenge progress']
    case 'under_review':
      return ['Your submission is under review', 'You will be notified within 24-48 hours']
    case 'rejected':
      return ['Your submission was rejected', 'Please review the requirements and try again']
    default:
      return ['Processing your submission...']
  }
}
\`\`\`

### **3. AI Verification Engine**

\`\`\`typescript
// File: lib/verification/ai.ts

import OpenAI from 'openai'
import { analyzeImage, analyzeVideo } from './media-analysis'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function analyzeMedia(file: File, requirements: any): Promise<{
  confidenceScore: number
  reviewRequired: boolean
  analysis: any
}> {
  // Analyze media file for authenticity
  const analysis = await analyzeImage(file) // or analyzeVideo for videos
  
  // Check for common fraud indicators
  const fraudIndicators = [
    'metadata_tampering',
    'stock_photo_detection', 
    'gps_inconsistency',
    'timestamp_manipulation'
  ]

  let confidenceScore = 85 // Base score
  let reviewRequired = false

  // Reduce confidence based on fraud indicators
  fraudIndicators.forEach(indicator => {
    if (analysis[indicator]) {
      confidenceScore -= 20
      reviewRequired = true
    }
  })

  // Check if media meets requirements
  if (requirements.requiredElements) {
    const hasRequiredElements = requirements.requiredElements.every((element: string) => 
      analysis.detectedElements.includes(element)
    )
    
    if (!hasRequiredElements) {
      confidenceScore -= 30
      reviewRequired = true
    }
  }

  return {
    confidenceScore: Math.max(0, confidenceScore),
    reviewRequired,
    analysis
  }
}

export async function analyzeText(content: string, requirements: any): Promise<{
  confidenceScore: number
  reviewRequired: boolean
  analysis: any
}> {
  // Analyze text content for authenticity
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "Analyze this text for authenticity, consistency, and potential fraud indicators."
      },
      {
        role: "user", 
        content: `Analyze this text: ${content}`
      }
    ]
  })

  const analysis = JSON.parse(response.choices[0].message.content || '{}')
  
  let confidenceScore = 70 // Base score for text
  let reviewRequired = false

  // Adjust confidence based on analysis
  if (analysis.sentiment_consistency) confidenceScore += 10
  if (analysis.detail_level) confidenceScore += 10
  if (analysis.personal_touch) confidenceScore += 10
  
  if (analysis.suspicious_patterns) {
    confidenceScore -= 30
    reviewRequired = true
  }

  return {
    confidenceScore: Math.max(0, Math.min(100, confidenceScore)),
    reviewRequired,
    analysis
  }
}

export async function verifyWearableData(data: any, requirements: any): Promise<{
  confidenceScore: number
  reviewRequired: boolean
  analysis: any
}> {
  // Verify wearable device data
  const analysis = {
    data_consistency: true,
    device_authenticity: true,
    timestamp_validity: true,
    gps_accuracy: true
  }

  let confidenceScore = 90 // High base score for wearable data
  let reviewRequired = false

  // Check data consistency
  if (!data.consistency_check) {
    confidenceScore -= 20
    reviewRequired = true
  }

  // Check device authenticity
  if (!data.device_verified) {
    confidenceScore -= 15
    reviewRequired = true
  }

  return {
    confidenceScore: Math.max(0, confidenceScore),
    reviewRequired,
    analysis
  }
}
\`\`\`

## 🎯 Implementation Priority

### **Phase 1: Core System (Weeks 1-2)**
1. Database schema implementation
2. Basic verification API
3. Photo/video verification
4. Admin review system

### **Phase 2: AI Integration (Weeks 3-4)**
1. AI verification engine
2. Fraud detection
3. Confidence scoring
4. Automated approvals

### **Phase 3: Wearable Integration (Weeks 5-6)**
1. Device API integrations
2. Data verification
3. Real-time sync
4. Trust scoring

### **Phase 4: Community Features (Weeks 7-8)**
1. Peer review system
2. Community voting
3. Social verification
4. Appeal system

This technical implementation provides a solid foundation for a comprehensive verification system that can scale with Stakr's growth while maintaining trust and preventing fraud.
