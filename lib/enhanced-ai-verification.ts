/**
 * Enhanced AI Verification System
 * Extends existing AI verification to handle wearable/app integration data
 */

import { ContentModerationService } from './content-moderation'

export interface EnhancedVerificationRequest {
  challengeId: string
  challengeText: string // title + description
  submissionType: 'manual' | 'auto_sync'
  
  // AI Challenge Analysis for enhanced validation
  aiChallengeAnalysis?: {
    dailyRequirement: string
    activityType: string[]
    measurementType: string
    minimumValue?: number
    unit?: string
    validationMethod: string
    evidenceRequirements: string[]
    interpretation: string
    confidence: number
  }
  
  // Manual submission data
  manualData?: {
    type: 'photo' | 'video' | 'text'
    content: string
    fileUrl?: string
    metadata?: any
  }
  
  // Auto-sync data (Strava, Spotify, etc.)
  autoSyncData?: {
    provider: 'strava' | 'spotify' | 'fitbit' | 'garmin'
    activity: any
    rawData: any
    challengeContext?: any
  }
}

export interface EnhancedVerificationResponse {
  approved: boolean
  confidence: number // 0-100
  reasoning: string
  flags: string[]
  suggestions?: string[]
  metadata: {
    verificationMethod: 'ai_challenge_match' | 'ai_content_analysis' | 'activity_validation'
    processingTime: number
    fallbackUsed: boolean
  }
}

/**
 * Enhanced AI verification that handles both manual and auto-sync submissions
 */
export class EnhancedAIVerification {
  
  /**
   * Main verification entry point
   */
  static async verify(request: EnhancedVerificationRequest): Promise<EnhancedVerificationResponse> {
    const startTime = Date.now()
    
    try {
      let result: EnhancedVerificationResponse
      
      if (request.submissionType === 'auto_sync') {
        result = await this.verifyAutoSyncSubmission(request)
      } else {
        result = await this.verifyManualSubmission(request)
      }
      
      result.metadata.processingTime = Date.now() - startTime
      return result
      
    } catch (error) {
      console.error('AI verification failed:', error)
      return this.createFallbackResponse(startTime)
    }
  }
  
  /**
   * AI verification for auto-sync data (Strava, Spotify, etc.)
   */
  private static async verifyAutoSyncSubmission(
    request: EnhancedVerificationRequest
  ): Promise<EnhancedVerificationResponse> {
    
    const { challengeText, autoSyncData } = request
    
    if (!autoSyncData) {
      throw new Error('Auto-sync data required')
    }
    
    // Use existing OpenAI infrastructure to analyze challenge vs activity
    const prompt = this.buildAutoSyncPrompt(request)
    
    try {
      const aiResponse = await this.callAIService(prompt)
      const parsed = JSON.parse(aiResponse)
      
      return {
        approved: parsed.approved,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
        flags: parsed.flags || [],
        suggestions: parsed.suggestions,
        metadata: {
          verificationMethod: 'activity_validation',
          processingTime: 0, // Will be set by caller
          fallbackUsed: false
        }
      }
      
    } catch (error) {
      console.error('AI auto-sync verification failed:', error)
      // Fallback to rule-based validation
      return this.fallbackAutoSyncValidation(challengeText, autoSyncData)
    }
  }
  
  /**
   * AI verification for manual submissions (photos, videos, text)
   */
  private static async verifyManualSubmission(
    request: EnhancedVerificationRequest
  ): Promise<EnhancedVerificationResponse> {
    
    const { challengeText, manualData } = request
    
    if (!manualData) {
      throw new Error('Manual data required')
    }
    
    // Use existing content moderation for basic checks
    const moderation = ContentModerationService.getInstance()
    
    // First check if content is appropriate
    const moderationResult = await moderation.moderateText(manualData.content)
    if (moderationResult.flagged) {
      return {
        approved: false,
        confidence: 95,
        reasoning: `Content flagged by moderation: ${moderationResult.reason?.join(', ')}`,
        flags: ['inappropriate_content'],
        metadata: {
          verificationMethod: 'ai_content_analysis',
          processingTime: 0,
          fallbackUsed: false
        }
      }
    }
    
    // Then verify if it meets challenge requirements
    const prompt = this.buildManualVerificationPrompt(challengeText, manualData)
    
    try {
      const aiResponse = await this.callAIService(prompt)
      const parsed = JSON.parse(aiResponse)
      
      return {
        approved: parsed.approved,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
        flags: parsed.flags || [],
        suggestions: parsed.suggestions,
        metadata: {
          verificationMethod: 'ai_challenge_match',
          processingTime: 0,
          fallbackUsed: false
        }
      }
      
    } catch (error) {
      console.error('AI manual verification failed:', error)
      return this.fallbackManualValidation(challengeText, manualData)
    }
  }
  
  /**
   * Build AI prompt for auto-sync verification
   */
  private static buildAutoSyncPrompt(request: EnhancedVerificationRequest): string {
    const aiAnalysis = request.aiChallengeAnalysis
    const autoSyncData = request.autoSyncData
    
    return `
You are an intelligent challenge validation system. Analyze if this activity meets the challenge requirements.

CHALLENGE: "${request.challengeText}"

${aiAnalysis ? `
AI CHALLENGE ANALYSIS (Use this for enhanced validation):
- Daily Requirement: ${aiAnalysis.dailyRequirement}
- Activity Types Expected: ${aiAnalysis.activityType.join(', ')}
- Measurement Method: ${aiAnalysis.measurementType}
- Minimum Value: ${aiAnalysis.minimumValue || 'Not specified'} ${aiAnalysis.unit || ''}
- Validation Approach: ${aiAnalysis.validationMethod}
- AI Interpretation: ${aiAnalysis.interpretation}
- Evidence Requirements: ${aiAnalysis.evidenceRequirements.join('; ')}
- AI Analysis Confidence: ${aiAnalysis.confidence}%
` : 'No AI analysis available - use general challenge text analysis'}

ACTIVITY DATA:
Provider: ${autoSyncData?.provider}
Type: ${autoSyncData?.activity.type}
Distance: ${autoSyncData?.activity.distance}m
Duration: ${Math.round((autoSyncData?.activity.duration || 0) / 60)}min
Date: ${autoSyncData?.activity.date}

CORE VALIDATION PRINCIPLES:

🎯 CHALLENGE INTERPRETATION:
- Parse the challenge naturally - understand the intent, not just literal words
- "10m" in fitness contexts = 10 meters (distance), not 10 minutes (time)  
- "daily", "every day", "each day" = repeating requirement, not one-time bulk completion
- Focus on what the creator wants users to achieve TODAY

🔄 PROGRESSIVE CHALLENGE LOGIC:
- Multi-day challenges (e.g., "30 days", "every day for a week") are completed incrementally
- Each submission represents ONE DAY'S progress toward the total goal
- Evaluate: "Does this activity satisfy today's portion of the challenge?"
- Previous days' completion status is irrelevant to today's validation

📊 FLEXIBLE VALIDATION FRAMEWORK:
1. IDENTIFY the daily/single requirement (distance, duration, activity type, intensity)
2. CHECK if today's activity meets or exceeds that requirement
3. APPROVE if the activity type and quantity are appropriate
4. IGNORE multi-day context - focus only on daily compliance

✅ ADAPTIVE EXAMPLES:
Challenge Type → Daily Requirement → Validation Logic
"Walk 10m daily for 30 days" → Walk ≥10m today → Approve any walk ≥10m
"Run 5km every day" → Run ≥5km today → Approve any run ≥5km  
"Exercise 30min daily" → Any exercise ≥30min today → Approve any qualifying activity ≥30min
"Meditate for 10 days" → Any meditation today → Approve any meditation session
"10,000 steps daily" → Walk with ≥10k steps → Approve if step count sufficient
"Bike to work for a week" → Bike commute today → Approve any bike ride during commute hours

🧠 INTELLIGENT REASONING:
- Be flexible with challenge descriptions - understand creator intent
- Don't reject activities that clearly meet the spirit of the challenge
- Consider activity intensity, duration, and type appropriateness
- Allow reasonable interpretations of ambiguous requirements

Analyze this specific submission:
1. What is the daily requirement extracted from this challenge?
2. Does today's activity meet or exceed that requirement?
3. Is the activity type appropriate for the challenge intent?
4. Should this be approved as a valid daily contribution?

Respond ONLY in JSON:
{
  "approved": true/false,
  "confidence": 0-100,
  "reasoning": "Clear explanation of decision based on daily requirement analysis",
  "flags": ["flag1", "flag2"],
  "suggestions": ["suggestion1"]
}
`
  }
  
  /**
   * Build AI prompt for manual verification
   */
  private static buildManualVerificationPrompt(challengeText: string, manualData: any): string {
    return `
Verify if this submission meets the challenge requirements:

CHALLENGE: "${challengeText}"

SUBMISSION:
Type: ${manualData.type}
Content: "${manualData.content}"
${manualData.fileUrl ? `Image: ${manualData.fileUrl}` : ''}

Analyze:
1. Does this submission prove challenge completion?
2. How confident are you (0-100)?
3. What evidence supports/contradicts completion?
4. Any signs of fake/misleading content?

Respond ONLY in JSON:
{
  "approved": true/false,
  "confidence": 0-100,
  "reasoning": "explanation", 
  "flags": ["flag1", "flag2"],
  "suggestions": ["suggestion1"]
}
`
  }
  
  /**
   * Call AI service (leverages existing OpenAI infrastructure)
   */
  private static async callAIService(prompt: string): Promise<string> {
    // This would use the existing OpenAI setup from ContentModerationService
    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured')
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1, // Low temperature for consistent verification
        max_tokens: 500
      }),
    })
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.choices[0].message.content
  }
  
  /**
   * Fallback validation for auto-sync when AI fails
   */
  private static fallbackAutoSyncValidation(
    challengeText: string, 
    autoSyncData: any
  ): EnhancedVerificationResponse {
    // Use simple rule-based validation as fallback
    const isWalkingChallenge = challengeText.toLowerCase().includes('walk')
    const isWalkingActivity = autoSyncData.activity.type === 'Walk'
    
    return {
      approved: isWalkingChallenge ? isWalkingActivity : true, // Permissive fallback
      confidence: 60,
      reasoning: 'AI verification unavailable, using basic rule matching',
      flags: ['fallback_validation'],
      metadata: {
        verificationMethod: 'activity_validation',
        processingTime: 0,
        fallbackUsed: true
      }
    }
  }
  
  /**
   * Fallback validation for manual submissions when AI fails
   */
  private static fallbackManualValidation(
    challengeText: string,
    manualData: any
  ): EnhancedVerificationResponse {
    return {
      approved: true, // Conservative fallback - approve and let human review
      confidence: 50,
      reasoning: 'AI verification unavailable, requires manual review',
      flags: ['fallback_validation', 'requires_human_review'],
      metadata: {
        verificationMethod: 'ai_challenge_match',
        processingTime: 0,
        fallbackUsed: true
      }
    }
  }
  
  /**
   * Create fallback response when entire system fails
   */
  private static createFallbackResponse(startTime: number): EnhancedVerificationResponse {
    return {
      approved: false, // Fail safe
      confidence: 0,
      reasoning: 'Verification system unavailable',
      flags: ['system_error'],
      metadata: {
        verificationMethod: 'ai_challenge_match',
        processingTime: Date.now() - startTime,
        fallbackUsed: true
      }
    }
  }
}
