# 🚀 Stakr Verification System - Implementation Guide

## 📋 Quick Start Implementation

### **Step 1: Database Migration**

Create the migration file:

```sql
-- File: migrations/verification-system-v1.sql
-- Run this in your Neon SQL Editor

-- Add verification system tables
CREATE TABLE IF NOT EXISTS verification_methods (
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

-- Insert default verification methods
INSERT INTO verification_methods (name, type, trust_score_min, trust_score_max, complexity_level, config) VALUES
('Photo Proof', 'photo', 40, 80, 'low', '{"requiredElements": ["face", "activity"], "minDuration": 0}'),
('Video Proof', 'video', 60, 85, 'medium', '{"requiredElements": ["face", "activity"], "minDuration": 10}'),
('Text Journal', 'text', 30, 60, 'low', '{"minWords": 50, "requireSentiment": true}'),
('Wearable Data', 'wearable', 85, 95, 'medium', '{"supportedDevices": ["apple_watch", "fitbit", "garmin"]}'),
('App Integration', 'app', 70, 90, 'medium', '{"supportedApps": ["myfitnesspal", "strava", "headspace"]}'),
('Community Review', 'social', 50, 70, 'low', '{"minVotes": 3, "consensusRequired": true}'),
('Admin Review', 'admin', 0, 100, 'premium', '{"reviewTime": "24-72 hours"}');

-- Create challenge verification rules table
CREATE TABLE IF NOT EXISTS challenge_verification_rules (
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
CREATE TABLE IF NOT EXISTS verification_submissions (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_verification_submissions_status ON verification_submissions(final_status);
CREATE INDEX IF NOT EXISTS idx_verification_submissions_challenge ON verification_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_verification_submissions_user ON verification_submissions(user_id);
```

### **Step 2: TypeScript Types**

```typescript
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
```

### **Step 3: Core Verification Engine**

```typescript
// File: lib/verification/engine.ts

import { createDbConnection } from '@/lib/db'

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
      confidenceScore = await analyzePhoto(data.submissionData)
      reviewRequired = confidenceScore < 80
      break

    case 'video':
      confidenceScore = await analyzeVideo(data.submissionData)
      reviewRequired = confidenceScore < 75
      break

    case 'text':
      confidenceScore = await analyzeText(data.submissionData.content)
      reviewRequired = confidenceScore < 70
      break

    case 'wearable':
      confidenceScore = await analyzeWearableData(data.submissionData)
      reviewRequired = confidenceScore < 85
      break

    default:
      confidenceScore = 70
      reviewRequired = true
  }

  // Determine final status
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

// Simple analysis functions (replace with actual AI implementation)
async function analyzePhoto(data: any): Promise<number> {
  // Basic photo analysis - replace with actual AI
  return 85
}

async function analyzeVideo(data: any): Promise<number> {
  // Basic video analysis - replace with actual AI
  return 80
}

async function analyzeText(content: string): Promise<number> {
  // Basic text analysis - replace with actual AI
  return content.length > 100 ? 75 : 60
}

async function analyzeWearableData(data: any): Promise<number> {
  // Basic wearable analysis - replace with actual implementation
  return 90
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
```

### **Step 4: API Endpoint**

```typescript
// File: app/api/verification/submit/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { processVerification } from '@/lib/verification/engine'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.challengeId || !body.verificationMethodId || !body.submissionData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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
```

### **Step 5: Frontend Component**

```typescript
// File: components/verification-submission.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Camera, Upload, FileText } from 'lucide-react'

interface VerificationSubmissionProps {
  challengeId: string
  verificationMethods: VerificationMethod[]
  onSubmit: (result: VerificationResult) => void
}

export function VerificationSubmission({ 
  challengeId, 
  verificationMethods, 
  onSubmit 
}: VerificationSubmissionProps) {
  const [selectedMethod, setSelectedMethod] = useState<VerificationMethod | null>(null)
  const [submissionData, setSubmissionData] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!selectedMethod) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/verification/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          verificationMethodId: selectedMethod.id,
          submissionData,
          description: submissionData.description || ''
        })
      })

      const result = await response.json()
      if (response.ok) {
        onSubmit(result)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Verification submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderMethodInput = () => {
    if (!selectedMethod) return null

    switch (selectedMethod.type) {
      case 'photo':
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">Take a photo of your activity</p>
              <Button variant="outline" className="mt-2">
                Capture Photo
              </Button>
            </div>
            <Textarea
              placeholder="Describe what you're doing..."
              value={submissionData.description || ''}
              onChange={(e) => setSubmissionData({ ...submissionData, description: e.target.value })}
            />
          </div>
        )

      case 'text':
        return (
          <div className="space-y-4">
            <Textarea
              placeholder="Write about your progress..."
              value={submissionData.content || ''}
              onChange={(e) => setSubmissionData({ ...submissionData, content: e.target.value })}
              rows={6}
            />
          </div>
        )

      case 'wearable':
        return (
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Connect your wearable device</p>
              <Button variant="outline">
                Connect {selectedMethod.name}
              </Button>
            </div>
          </div>
        )

      default:
        return <p>Method not implemented yet</p>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Verification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Method Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Verification Method</label>
          <div className="grid grid-cols-2 gap-2">
            {verificationMethods.map((method) => (
              <Button
                key={method.id}
                variant={selectedMethod?.id === method.id ? 'default' : 'outline'}
                onClick={() => setSelectedMethod(method)}
                className="justify-start"
              >
                {method.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Method-specific input */}
        {renderMethodInput()}

        {/* Submit button */}
        <Button 
          onClick={handleSubmit} 
          disabled={!selectedMethod || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Verification'}
        </Button>
      </CardContent>
    </Card>
  )
}
```

## 🎯 Next Steps

### **Immediate Actions (This Week)**

1. **Run the database migration** in your Neon SQL Editor
2. **Create the TypeScript types** in `types/verification.ts`
3. **Implement the basic verification engine** in `lib/verification/engine.ts`
4. **Create the API endpoint** at `app/api/verification/submit/route.ts`
5. **Build the frontend component** in `components/verification-submission.tsx`

### **Week 2: AI Integration**

1. **Implement photo/video analysis** using OpenAI Vision API
2. **Add text analysis** for journal entries
3. **Create fraud detection** algorithms
4. **Build confidence scoring** system

### **Week 3: Wearable Integration**

1. **Research wearable APIs** (Apple Health, Fitbit, etc.)
2. **Implement data verification** for wearable devices
3. **Add real-time sync** capabilities
4. **Test with real devices**

### **Week 4: Community Features**

1. **Build peer review system**
2. **Implement community voting**
3. **Create appeal system**
4. **Add transparency features**

## 🔧 Testing Strategy

### **Unit Tests**
```typescript
// File: tests/verification.test.ts
import { processVerification } from '@/lib/verification/engine'

describe('Verification Engine', () => {
  test('should process photo verification', async () => {
    const result = await processVerification({
      participantId: 'test-participant',
      challengeId: 'test-challenge',
      userId: 'test-user',
      verificationMethodId: 'photo-method',
      submissionData: { file: 'test-photo.jpg' },
      metadata: {}
    })

    expect(result.status).toBe('under_review')
    expect(result.confidenceScore).toBeGreaterThan(0)
  })
})
```

### **Integration Tests**
```typescript
// File: tests/api/verification.test.ts
import { POST } from '@/app/api/verification/submit/route'

describe('Verification API', () => {
  test('should submit verification successfully', async () => {
    const request = new Request('http://localhost:3000/api/verification/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeId: 'test-challenge',
        verificationMethodId: 'photo-method',
        submissionData: { file: 'test-photo.jpg' }
      })
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.submissionId).toBeDefined()
  })
})
```

This implementation guide provides a solid foundation for building the verification system. Start with Phase 1 and gradually add more sophisticated features as you progress through the phases.
