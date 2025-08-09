/**
 * AI Verification Integration Test Suite
 * Tests the complete flow from challenge analysis to proof verification
 */

import { validateProofSubmission } from '@/lib/ai-anti-cheat'

// Mock database connection
jest.mock('@/lib/db', () => ({
  createDbConnection: jest.fn(() => ({
    query: jest.fn(),
    // Mock SQL template literal
    __proto__: {
      constructor: {
        prototype: {
          [Symbol.iterator]: function* () {
            yield mockChallengeData
          }
        }
      }
    }
  }))
}))

// Mock Enhanced AI Verification
jest.mock('@/lib/enhanced-ai-verification', () => ({
  EnhancedAIVerification: {
    verify: jest.fn()
  }
}))

const mockChallengeData = {
  title: "Handstand Walk Challenge",
  description: "Walk 10m on hands daily for 3 days",
  verification_type: "ai",
  ai_analysis: JSON.stringify({
    dailyRequirement: "Walk 10 meters on hands",
    evidenceRequirements: ["Side view", "Whole body visible"],
    validationMethod: "video_measurement",
    activityType: ["handstand", "walking"],
    minimumValue: 10,
    unit: "meters",
    confidence: 90
  }),
  selected_proof_types: ["video"],
  proof_instructions: "Record from side showing whole body"
}

describe('AI Verification Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Challenge Context Retrieval', () => {
    it('should retrieve and parse challenge analysis data correctly', async () => {
      const { createDbConnection } = require('@/lib/db')
      const mockSql = createDbConnection()
      
      // Mock the SQL template literal call
      mockSql[Symbol.for('sql')] = jest.fn().mockResolvedValue([mockChallengeData])
      
      // Mock successful verification
      const { EnhancedAIVerification } = require('@/lib/enhanced-ai-verification')
      EnhancedAIVerification.verify.mockResolvedValue({
        approved: true,
        confidence: 85,
        reasoning: "Video shows proper handstand walk meeting requirements"
      })

      const result = await validateProofSubmission(
        'user-123',
        'challenge-456', 
        {
          type: 'video',
          content: 'mock-video-content',
          fileUrl: 'https://example.com/video.mp4'
        }
      )

      expect(result.confidence).toBeGreaterThan(80)
      expect(EnhancedAIVerification.verify).toHaveBeenCalledWith(
        expect.objectContaining({
          aiChallengeAnalysis: expect.objectContaining({
            dailyRequirement: "Walk 10 meters on hands",
            evidenceRequirements: ["Side view", "Whole body visible"],
            minimumValue: 10,
            unit: "meters"
          })
        })
      )
    })

    it('should handle missing challenge analysis gracefully', async () => {
      const { createDbConnection } = require('@/lib/db')
      const mockSql = createDbConnection()
      
      // Mock challenge without AI analysis
      const challengeWithoutAnalysis = {
        ...mockChallengeData,
        ai_analysis: null
      }
      
      mockSql[Symbol.for('sql')] = jest.fn().mockResolvedValue([challengeWithoutAnalysis])
      
      const { EnhancedAIVerification } = require('@/lib/enhanced-ai-verification')
      EnhancedAIVerification.verify.mockResolvedValue({
        approved: true,
        confidence: 70,
        reasoning: "Basic verification without challenge context"
      })

      const result = await validateProofSubmission(
        'user-123',
        'challenge-456',
        { type: 'video', content: 'mock-video' }
      )

      expect(result.confidence).toBeGreaterThan(60)
      // Should still call verification but without AI analysis context
      expect(EnhancedAIVerification.verify).toHaveBeenCalled()
    })
  })

  describe('Context-Aware Verification', () => {
    it('should pass challenge context to Enhanced AI Verification', async () => {
      const { createDbConnection } = require('@/lib/db')
      const mockSql = createDbConnection()
      mockSql[Symbol.for('sql')] = jest.fn().mockResolvedValue([mockChallengeData])

      const { EnhancedAIVerification } = require('@/lib/enhanced-ai-verification')
      EnhancedAIVerification.verify.mockResolvedValue({
        approved: true,
        confidence: 92,
        reasoning: "Handstand walk meets all requirements: proper form, 10m distance, side view"
      })

      await validateProofSubmission(
        'user-123', 
        'challenge-456',
        {
          type: 'video',
          content: 'handstand-video-content',
          metadata: { duration: 30, fileSize: 1024000 }
        }
      )

      const verifyCall = EnhancedAIVerification.verify.mock.calls[0][0]
      
      expect(verifyCall.challengeText).toContain("Handstand Walk Challenge")
      expect(verifyCall.aiChallengeAnalysis.dailyRequirement).toBe("Walk 10 meters on hands")
      expect(verifyCall.aiChallengeAnalysis.evidenceRequirements).toContain("Side view")
      expect(verifyCall.aiChallengeAnalysis.minimumValue).toBe(10)
      expect(verifyCall.aiChallengeAnalysis.unit).toBe("meters")
      expect(verifyCall.manualData.type).toBe("video")
    })

    it('should handle different challenge types appropriately', async () => {
      const guitarChallengeData = {
        ...mockChallengeData,
        title: "Guitar Practice Challenge",
        description: "Practice guitar 30 minutes daily",
        ai_analysis: JSON.stringify({
          dailyRequirement: "Practice guitar for 30 minutes",
          evidenceRequirements: ["Audio recording", "Finger positioning visible"],
          validationMethod: "audio_analysis",
          activityType: ["music", "practice"],
          minimumValue: 30,
          unit: "minutes"
        })
      }

      const { createDbConnection } = require('@/lib/db')
      const mockSql = createDbConnection()
      mockSql[Symbol.for('sql')] = jest.fn().mockResolvedValue([guitarChallengeData])

      const { EnhancedAIVerification } = require('@/lib/enhanced-ai-verification')
      EnhancedAIVerification.verify.mockResolvedValue({
        approved: true,
        confidence: 88,
        reasoning: "Audio shows 30+ minutes of guitar practice with proper technique"
      })

      await validateProofSubmission(
        'user-123',
        'guitar-challenge-789',
        { type: 'video', content: 'guitar-practice-video' }
      )

      const verifyCall = EnhancedAIVerification.verify.mock.calls[0][0]
      expect(verifyCall.aiChallengeAnalysis.validationMethod).toBe("audio_analysis")
      expect(verifyCall.aiChallengeAnalysis.activityType).toContain("music")
    })
  })

  describe('Verification Outcomes', () => {
    it('should return approval with high confidence', async () => {
      const { createDbConnection } = require('@/lib/db')
      const mockSql = createDbConnection()
      mockSql[Symbol.for('sql')] = jest.fn().mockResolvedValue([mockChallengeData])

      const { EnhancedAIVerification } = require('@/lib/enhanced-ai-verification')
      EnhancedAIVerification.verify.mockResolvedValue({
        approved: true,
        confidence: 95,
        reasoning: "Excellent form, perfect distance, clear video quality"
      })

      const result = await validateProofSubmission(
        'user-123',
        'challenge-456',
        { type: 'video', content: 'excellent-submission' }
      )

      expect(result.action).toBe('approve')
      expect(result.confidence).toBeGreaterThan(90)
    })

    it('should return rejection with clear reasoning', async () => {
      const { createDbConnection } = require('@/lib/db')
      const mockSql = createDbConnection()
      mockSql[Symbol.for('sql')] = jest.fn().mockResolvedValue([mockChallengeData])

      const { EnhancedAIVerification } = require('@/lib/enhanced-ai-verification')
      EnhancedAIVerification.verify.mockResolvedValue({
        approved: false,
        confidence: 82,
        reasoning: "Distance appears to be only 7-8 meters, requirement is 10 meters minimum"
      })

      const result = await validateProofSubmission(
        'user-123',
        'challenge-456', 
        { type: 'video', content: 'short-distance-video' }
      )

      expect(result.action).toBe('review') // Should go to human review
      expect(result.layerResults).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should fallback gracefully when Enhanced AI Verification fails', async () => {
      const { createDbConnection } = require('@/lib/db')
      const mockSql = createDbConnection()
      mockSql[Symbol.for('sql')] = jest.fn().mockResolvedValue([mockChallengeData])

      const { EnhancedAIVerification } = require('@/lib/enhanced-ai-verification')
      EnhancedAIVerification.verify.mockRejectedValue(new Error('AI Service Error'))

      const result = await validateProofSubmission(
        'user-123',
        'challenge-456',
        { type: 'video', content: 'test-video' }
      )

      // Should still return a result, not crash
      expect(result).toBeDefined()
      expect(result.confidence).toBeDefined()
    })

    it('should handle database connection failures', async () => {
      const { createDbConnection } = require('@/lib/db')
      createDbConnection.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const result = await validateProofSubmission(
        'user-123',
        'challenge-456',
        { type: 'video', content: 'test-video' }
      )

      // Should fallback to basic validation
      expect(result).toBeDefined()
    })
  })
})

