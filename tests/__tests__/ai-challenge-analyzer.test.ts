/**
 * AI Challenge Analyzer Test Suite
 * Tests the complete AI challenge analysis system including dev settings
 */

import { AIChallengeAnalyzer } from '@/lib/ai-challenge-analyzer'

// Mock OpenAI
jest.mock('@/lib/openai-client', () => ({
  openai: {
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }
}))

describe('AI Challenge Analyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Analysis', () => {
    it('should analyze a handstand challenge correctly', async () => {
      // Mock OpenAI response
      const mockOpenAI = require('@/lib/openai-client').openai
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              dailyRequirement: "Walk 10 meters on hands daily",
              confidence: 90,
              validationMethod: "video_measurement",
              evidenceRequirements: ["Side view", "Whole body visible", "10m distance"],
              activityType: ["handstand", "walking"],
              potentialAmbiguities: ["Distance measurement method"],
              clarificationQuestions: ["How should distance be measured precisely?"]
            })
          }
        }]
      })

      const result = await AIChallengeAnalyzer.analyzeChallengeDescription({
        title: "Handstand Walk Challenge",
        description: "Walk 10m on your hands every day for 3 days",
        selectedProofTypes: ["video"],
        cameraOnly: true,
        proofInstructions: "Record from side showing whole body throughout 10m walk"
      })

      expect(result.dailyRequirement).toContain("10 meters")
      expect(result.confidence).toBeGreaterThan(80)
      expect(result.evidenceRequirements).toContain("Side view")
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1)
    })

    it('should apply dev settings correctly', async () => {
      const mockOpenAI = require('@/lib/openai-client').openai
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              dailyRequirement: "Practice guitar 30 minutes",
              confidence: 85,
              validationMethod: "video_demonstration"
            })
          }
        }]
      })

      await AIChallengeAnalyzer.analyzeChallengeDescription({
        title: "Guitar Practice",
        description: "Practice guitar 30 minutes daily",
        devSettings: {
          contextAwareness: 90,
          verbosityLevel: 40,
          challengeTypePreset: 'learning',
          skipObviousQuestions: true,
          customPromptAdditions: "Focus on chord progression quality"
        }
      })

      const promptCall = mockOpenAI.chat.completions.create.mock.calls[0][0]
      const prompt = promptCall.messages[0].content

      expect(prompt).toContain("Focus on chord progression quality")
      expect(prompt).toContain("learning")
    })
  })

  describe('Challenge Type Presets', () => {
    it('should apply physical_skills preset correctly', async () => {
      const mockOpenAI = require('@/lib/openai-client').openai
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: '{"dailyRequirement": "test", "confidence": 80}' } }]
      })

      await AIChallengeAnalyzer.analyzeChallengeDescription({
        title: "Handstand Challenge",
        description: "Hold handstand for 30 seconds",
        devSettings: {
          challengeTypePreset: 'physical_skills',
          contextAwareness: 85
        }
      })

      const prompt = mockOpenAI.chat.completions.create.mock.calls[0][0].messages[0].content
      expect(prompt).toContain("technique")
      expect(prompt).toContain("physical")
    })

    it('should apply habits preset correctly', async () => {
      const mockOpenAI = require('@/lib/openai-client').openai
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: '{"dailyRequirement": "test", "confidence": 80}' } }]
      })

      await AIChallengeAnalyzer.analyzeChallengeDescription({
        title: "Meditation Challenge",
        description: "Meditate 10 minutes daily",
        devSettings: {
          challengeTypePreset: 'habits',
          skipObviousQuestions: true
        }
      })

      const prompt = mockOpenAI.chat.completions.create.mock.calls[0][0].messages[0].content
      expect(prompt).toContain("habits")
      expect(prompt).toContain("completion")
    })
  })

  describe('Verification Analysis', () => {
    it('should recognize camera-only security correctly', async () => {
      const mockOpenAI = require('@/lib/openai-client').openai
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ 
          message: { 
            content: JSON.stringify({
              dailyRequirement: "Walk 10m on hands",
              confidence: 90,
              riskFactors: ["High stakes require precise measurement"]
            })
          } 
        }]
      })

      const result = await AIChallengeAnalyzer.analyzeChallengeDescription({
        title: "Handstand Walk",
        description: "Walk 10m on hands daily",
        selectedProofTypes: ["video"],
        cameraOnly: true,
        minStake: 100,
        maxStake: 500
      })

      const prompt = mockOpenAI.chat.completions.create.mock.calls[0][0].messages[0].content
      expect(prompt).toContain("Camera Only = Yes")
      expect(prompt).toContain("HIGH SECURITY")
    })
  })

  describe('Error Handling', () => {
    it('should handle AI service failures gracefully', async () => {
      const mockOpenAI = require('@/lib/openai-client').openai
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'))

      await expect(async () => {
        await AIChallengeAnalyzer.analyzeChallengeDescription({
          title: "Test Challenge",
          description: "Test description"
        })
      }).rejects.toThrow()
    })

    it('should handle malformed AI responses', async () => {
      const mockOpenAI = require('@/lib/openai-client').openai
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Invalid JSON response' } }]
      })

      await expect(async () => {
        await AIChallengeAnalyzer.analyzeChallengeDescription({
          title: "Test Challenge", 
          description: "Test description"
        })
      }).rejects.toThrow()
    })
  })
})

