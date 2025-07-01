// Database connection imported dynamically to avoid requiring DATABASE_URL at startup
// Only loaded when actually needed for logging/queueing operations

// MVP Content Moderation - Ultra Lightweight Version
// This version costs $0 to run and provides basic protection

// Simple profanity filter for MVP
const BASIC_PROFANITY_LIST = [
  'fuck', 'shit', 'bitch', 'asshole', 'damn', 'crap',
  'hate', 'kill', 'die', 'stupid', 'idiot'
];

// Common spam patterns
const SPAM_PATTERNS = [
  /(.)\1{4,}/g, // Repeated characters (aaaaa)
  /[A-Z]{10,}/g, // Excessive caps
  /(buy now|click here|free money|make money fast)/gi,
  /(.{1,10})\1{3,}/g // Repeated phrases
];

export class MVPModerationService {
  // Basic text moderation - completely free
  static moderateText(content: string): { 
    flagged: boolean; 
    reason?: string; 
    confidence: number 
  } {
    const lowerContent = content.toLowerCase();
    
    // Check for basic profanity
    for (const word of BASIC_PROFANITY_LIST) {
      if (lowerContent.includes(word)) {
        return {
          flagged: true,
          reason: 'Inappropriate language detected',
          confidence: 0.8
        };
      }
    }
    
    // Check for spam patterns
    for (const pattern of SPAM_PATTERNS) {
      if (pattern.test(content)) {
        return {
          flagged: true,
          reason: 'Spam pattern detected',
          confidence: 0.7
        };
      }
    }
    
    // Check for excessive length (potential spam)
    if (content.length > 2000) {
      return {
        flagged: true,
        reason: 'Content too long',
        confidence: 0.6
      };
    }
    
    return { flagged: false, confidence: 0.9 };
  }

  // Profile name validation - free
  static validateProfileName(name: string): { valid: boolean; reason?: string } {
    if (!name || name.trim().length < 2) {
      return { valid: false, reason: 'Name too short' };
    }
    
    if (name.length > 50) {
      return { valid: false, reason: 'Name too long' };
    }
    
    // Check for profanity in name
    const modResult = this.moderateText(name);
    if (modResult.flagged) {
      return { valid: false, reason: 'Inappropriate name' };
    }
    
    return { valid: true };
  }

  // Community reporting - free database storage
  static async reportContent(params: {
    reporterId: string;
    contentType: 'post' | 'profile' | 'challenge';
    contentId: string;
    reason: string;
    description?: string;
  }) {
    // Just log to database for manual review
    // No AI processing = $0 cost
    console.log('Content reported:', params);
    return { success: true, reportId: Date.now().toString() };
  }
}

// Usage in your APIs:
export function moderateUserContent(content: string) {
  return MVPModerationService.moderateText(content);
}

export function validateUserProfileName(name: string) {
  return MVPModerationService.validateProfileName(name);
}

// Content moderation service using OpenAI Moderation API + AWS Rekognition
export class ContentModerationService {
  private static instance: ContentModerationService
  private openaiApiKey: string

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || ''
    console.log('🔧 ContentModerationService initialized:', {
      hasOpenAIKey: !!this.openaiApiKey,
      keyPrefix: this.openaiApiKey ? this.openaiApiKey.substring(0, 7) + '...' : 'none'
    })
  }

  static getInstance(): ContentModerationService {
    if (!ContentModerationService.instance) {
      ContentModerationService.instance = new ContentModerationService()
    }
    return ContentModerationService.instance
  }

  // Text content moderation using OpenAI Moderation API
  async moderateText(content: string, context: string = 'general'): Promise<ModerationResult> {
    try {
      // Check against profanity list first (fast local check)
      const profanityCheck = this.checkProfanity(content)
      if (profanityCheck.flagged) {
        await this.logModeration({
          content,
          context,
          type: 'text',
          result: profanityCheck,
          service: 'local_profanity'
        })
        return profanityCheck
      }

      // OpenAI Moderation API check
      if (this.openaiApiKey) {
        const response = await fetch('https://api.openai.com/v1/moderations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: content,
            model: 'text-moderation-latest'
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const result = this.parseOpenAIModerationResult(data.results[0])
          
          await this.logModeration({
            content,
            context,
            type: 'text',
            result,
            service: 'openai'
          })
          
          return result
        }
      }

      // Fallback to basic checks
      const basicResult = this.basicTextModeration(content)
      await this.logModeration({
        content,
        context,
        type: 'text',
        result: basicResult,
        service: 'basic'
      })
      
      return basicResult

    } catch (error) {
      console.error('Text moderation error:', error)
      // Fail safe - allow content but log error
      return {
        flagged: false,
        reason: [],
        confidence: 0,
        action: 'approve'
      }
    }
  }

  // Profile name specific moderation (stricter rules)
  async moderateProfileName(name: string): Promise<ModerationResult> {
    const result = await this.moderateText(name, 'profile_name')
    
    // Additional checks for profile names
    if (!result.flagged) {
      // Check for impersonation patterns
      const impersonationCheck = this.checkImpersonation(name)
      if (impersonationCheck.flagged) {
        return impersonationCheck
      }
      
      // Check for inappropriate length or characters
      if (name.length > 50 || name.length < 2) {
        return {
          flagged: true,
          reason: ['invalid_length'],
          confidence: 100,
          action: 'reject'
        }
      }
    }
    
    return result
  }

  // Image moderation using OpenAI Vision API
  async moderateImage(imageUrl: string, context: string = 'profile_picture'): Promise<ModerationResult> {
    try {
      console.log('🔑 Checking OpenAI API key:', this.openaiApiKey ? 'Present' : 'Missing')
      
      if (!this.openaiApiKey) {
        console.warn('OpenAI API key not configured for image moderation')
        // For profile pictures, be more conservative when API is not available
        if (context === 'profile_picture') {
          console.warn('🚫 Blocking profile picture upload due to missing moderation API')
          return {
            flagged: true,
            reason: ['moderation_unavailable'],
            confidence: 100,
            action: 'reject'
          }
        }
        return {
          flagged: false,
          reason: [],
          confidence: 0,
          action: 'approve'
        }
      }

      // Download image and convert to base64 (needed because localhost URLs aren't accessible to OpenAI)
      console.log('📥 Downloading image for base64 conversion:', imageUrl)
      let base64Image: string
      
      try {
        const imageResponse = await fetch(imageUrl)
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`)
        }
        
        const imageBuffer = await imageResponse.arrayBuffer()
        const base64Data = Buffer.from(imageBuffer).toString('base64')
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
        base64Image = `data:${contentType};base64,${base64Data}`
        
        console.log('✅ Image converted to base64, size:', base64Data.length, 'chars')
      } catch (downloadError) {
        console.error('❌ Failed to download image for moderation:', downloadError)
        // Fall back to blocking upload when image can't be downloaded
        if (context === 'profile_picture') {
          return {
            flagged: true,
            reason: ['moderation_download_failed'],
            confidence: 100,
            action: 'reject'
          }
        }
        return {
          flagged: false,
          reason: [],
          confidence: 0,
          action: 'approve'
        }
      }

      const requestBody = {
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image for appropriateness as a professional profile picture. Respond with a JSON object containing:
- "flagged": boolean (true if inappropriate for a profile picture)
- "reason": array of strings (categories like "sexual", "nudity", "violence", "harassment", "weapons", "minors", "medical_genitalia", "personal_info", "screenshots", "text_heavy", "low_quality", "political", "drugs", "drug_paraphernalia", "tobacco", "gambling", "unprofessional")
- "confidence": number 1-100 (confidence in the assessment)
- "explanation": string (brief explanation)

STRICT PROFILE PICTURE RULES - Flag as inappropriate if the image contains:
- Sexual content, nudity, or sexually suggestive material
- Violence, harassment, hate symbols, or threatening gestures
- Weapons (guns, knives, etc.) even if legally owned
- Images of minors/children (privacy and safety concerns)
- Medical diagrams, illustrations, or photos of genitalia/reproductive organs (even if educational)
- Personal information (QR codes, phone numbers, addresses)
- Screenshots of apps, websites, or other digital content
- Images that are primarily text, memes, or low-quality/blurry
- Political figures, campaign materials, or divisive political content
- Drug use, drug paraphernalia, pills, syringes, or substance abuse imagery
- Tobacco use, smoking, vaping, or gambling imagery
- Group photos where the account owner cannot be clearly identified
- Any content that would be inappropriate in a professional workplace setting

This is for a PROFILE PICTURE on a social platform - be more conservative than for general content moderation.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: base64Image,
                  detail: 'low'
                }
              }
            ]
          }
        ],
        max_tokens: 300,
        temperature: 0.1
      }

      console.log('🔍 OpenAI Vision API request with base64 image:', { model: requestBody.model, imageSize: base64Image.length })

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices[0]?.message?.content

        // Clean the response - remove markdown code blocks if present
        let cleanContent = content.trim()
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }
        
        console.log('🧹 Cleaned OpenAI response for parsing:', cleanContent)

        try {
          
          // Parse the JSON response
          const analysis = JSON.parse(cleanContent)
          
          const result: ModerationResult = {
            flagged: analysis.flagged || false,
            reason: analysis.reason || [],
            confidence: analysis.confidence || 0,
            action: analysis.flagged ? 'reject' : 'approve',
            details: {
              explanation: analysis.explanation,
              service: 'openai_vision'
            }
          }

          console.log('✅ Successfully parsed moderation result:', result)

          await this.logModeration({
            content: imageUrl,
            context,
            type: 'image',
            result,
            service: 'openai_vision'
          })

          return result

        } catch (parseError) {
          console.error('❌ Failed to parse OpenAI vision response after cleaning:', cleanContent)
          console.error('Parse error:', parseError)
          
          // For profile pictures, be conservative when parsing fails
          if (context === 'profile_picture') {
            console.warn('🚫 Blocking profile picture upload due to moderation parsing failure')
            return {
              flagged: true,
              reason: ['moderation_parse_failed'],
              confidence: 100,
              action: 'reject'
            }
          }
          
          // Fallback to safe approval for other content
          return {
            flagged: false,
            reason: [],
            confidence: 0,
            action: 'approve'
          }
        }
      }

      // API call failed - be more conservative for profile pictures
      const errorText = await response.text()
      console.error('OpenAI Vision API call failed:', response.status, response.statusText)
      console.error('OpenAI Error Response:', errorText)
      
      // For profile pictures, block uploads when moderation fails (safer approach)
      if (context === 'profile_picture') {
        console.warn('🚫 Blocking profile picture upload due to moderation API failure')
        return {
          flagged: true,
          reason: ['moderation_api_failed'],
          confidence: 100,
          action: 'reject'
        }
      }
      
      return {
        flagged: false,
        reason: [],
        confidence: 0,
        action: 'approve'
      }

    } catch (error) {
      console.error('Image moderation error:', error)
      
      // For profile pictures, be conservative when errors occur
      if (context === 'profile_picture') {
        console.warn('🚫 Blocking profile picture upload due to moderation error')
        return {
          flagged: true,
          reason: ['moderation_error'],
          confidence: 100,
          action: 'reject'
        }
      }
      
      // Fail safe - approve but log error for other content
      return {
        flagged: false,
        reason: [],
        confidence: 0,
        action: 'approve'
      }
    }
  }

  // Add content to moderation queue for human review
  async addToModerationQueue(item: ModerationQueueItem): Promise<void> {
    try {
      // Check if database URL is available before attempting to queue
      if (!process.env.DATABASE_URL) {
        console.log('📋 Moderation queue item (no DB):', {
          contentType: item.contentType,
          priority: item.priority,
          flaggedReasons: item.flaggedReasons,
          aiConfidence: item.aiConfidence
        })
        return
      }

      const { createDbConnection } = await import('@/lib/db')
      const sql = await createDbConnection()
      await sql`
        INSERT INTO moderation_queue (
          content_type,
          content_id,
          user_id,
          priority,
          flagged_reasons,
          ai_confidence,
          content_preview,
          content_url,
          status
        ) VALUES (
          ${item.contentType},
          ${item.contentId},
          ${item.userId},
          ${item.priority || 5},
          ${JSON.stringify(item.flaggedReasons)},
          ${item.aiConfidence || 0},
          ${item.contentPreview || ''},
          ${item.contentUrl || ''},
          'pending'
        )
      `
    } catch (error) {
      console.error('Failed to add item to moderation queue, continuing anyway:', error)
      // Don't throw - allow moderation to continue even if queueing fails
    }
  }

  // Process moderation for all content types
  async moderateContent(content: ContentToModerate): Promise<ModerationSummary> {
    const results: ModerationResult[] = []
    let overallAction: ModerationAction = 'approve'
    
    // Moderate text content
    if (content.text) {
      const textResult = await this.moderateText(content.text, content.context)
      results.push({ ...textResult, type: 'text' })
      
      if (textResult.action === 'reject') {
        overallAction = 'reject'
      } else if (textResult.action === 'review' && overallAction === 'approve') {
        overallAction = 'review'
      }
    }

    // If content needs review or is rejected, add to moderation queue
    if (overallAction !== 'approve' && content.userId && content.contentId) {
      await this.addToModerationQueue({
        contentType: content.context as any,
        contentId: content.contentId,
        userId: content.userId,
        priority: overallAction === 'reject' ? 1 : 3,
        flaggedReasons: results.flatMap(r => r.reason),
        aiConfidence: Math.max(...results.map(r => r.confidence)),
        contentPreview: content.text?.substring(0, 200),
        contentUrl: content.images?.[0] || content.videos?.[0]
      })
    }

    return {
      action: overallAction,
      results,
      flagged: results.some(r => r.flagged),
      needsReview: overallAction === 'review',
      summary: this.generateModerationSummary(results)
    }
  }

  // Private helper methods
  private checkProfanity(content: string): ModerationResult {
    const profanityList = [
      // Common profanity patterns (basic list - expand as needed)
      /\b(fuck|shit|damn|ass|bitch|cunt|dick|pussy|cock|tits)\b/gi,
      /\b(nigger|faggot|retard|spic|chink|kike)\b/gi, // Slurs
      /\b(nazi|hitler|kkk)\b/gi, // Hate symbols
    ]

    for (const pattern of profanityList) {
      if (pattern.test(content)) {
        return {
          flagged: true,
          reason: ['profanity'],
          confidence: 100,
          action: 'reject'
        }
      }
    }

    return {
      flagged: false,
      reason: [],
      confidence: 0,
      action: 'approve'
    }
  }

  private basicTextModeration(content: string): ModerationResult {
    const flags: string[] = []
    let confidence = 0

    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length
    if (capsRatio > 0.7 && content.length > 10) {
      flags.push('excessive_caps')
      confidence += 30
    }

    // Check for repeated characters
    if (/(.)\1{4,}/.test(content)) {
      flags.push('spam_pattern')
      confidence += 40
    }

    // Check for suspicious URLs
    if (/https?:\/\/(?!stakr\.app)/.test(content)) {
      flags.push('external_link')
      confidence += 20
    }

    return {
      flagged: flags.length > 0 && confidence > 50,
      reason: flags,
      confidence,
      action: flags.length > 0 && confidence > 50 ? 'review' : 'approve'
    }
  }

  private checkImpersonation(name: string): ModerationResult {
    const suspiciousPatterns = [
      /\b(admin|moderator|staff|stakr|official)\b/gi,
      /\b(support|help|customer.?service)\b/gi,
      /\b(elon.?musk|bill.?gates|jeff.?bezos)\b/gi, // Celebrity names
    ]

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(name)) {
        return {
          flagged: true,
          reason: ['impersonation'],
          confidence: 90,
          action: 'reject'
        }
      }
    }

    return {
      flagged: false,
      reason: [],
      confidence: 0,
      action: 'approve'
    }
  }

  private parseOpenAIModerationResult(result: any): ModerationResult {
    const categories = result.categories || {}
    const categoryScores = result.category_scores || {}
    
    const flaggedCategories = Object.keys(categories).filter(key => categories[key])
    const maxScore = Math.max(...Object.values(categoryScores) as number[])
    
    return {
      flagged: result.flagged,
      reason: flaggedCategories,
      confidence: Math.round(maxScore * 100),
      action: result.flagged ? 'reject' : 'approve',
      details: {
        categories,
        categoryScores
      }
    }
  }

  private generateModerationSummary(results: ModerationResult[]): string {
    const flagged = results.filter(r => r.flagged)
    if (flagged.length === 0) return 'Content approved - no issues detected'
    
    const reasons = [...new Set(flagged.flatMap(r => r.reason))]
    return `Content flagged for: ${reasons.join(', ')}`
  }

  private async logModeration(log: ModerationLog): Promise<void> {
    try {
      // Check if database URL is available before attempting to log
      if (!process.env.DATABASE_URL) {
        console.log('📝 Moderation result (no DB):', {
          type: log.type,
          context: log.context,
          service: log.service,
          flagged: log.result.flagged,
          confidence: log.result.confidence,
          action: log.result.action
        })
        return
      }

      const { createDbConnection } = await import('@/lib/db')
      const sql = await createDbConnection()
      await sql`
        INSERT INTO moderation_logs (
          content_hash,
          content_type,
          context,
          service,
          flagged,
          reasons,
          confidence,
          action,
          details,
          created_at
        ) VALUES (
          ${this.hashContent(log.content)},
          ${log.type},
          ${log.context},
          ${log.service},
          ${log.result.flagged},
          ${JSON.stringify(log.result.reason)},
          ${log.result.confidence},
          ${log.result.action},
          ${JSON.stringify(log.result.details || {})},
          NOW()
        )
      `
    } catch (error) {
      console.error('Failed to log moderation result, continuing anyway:', error)
      // Don't throw - allow moderation to continue even if logging fails
    }
  }

  private hashContent(content: string): string {
    // Simple hash for content identification (not for security)
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }
}

// Type definitions
export interface ModerationResult {
  flagged: boolean
  reason: string[]
  confidence: number
  action: ModerationAction
  type?: 'text' | 'image' | 'video'
  content?: string
  details?: any
  notes?: string
}

export interface ModerationSummary {
  action: ModerationAction
  results: ModerationResult[]
  flagged: boolean
  needsReview: boolean
  summary: string
}

export interface ContentToModerate {
  text?: string
  images?: string[]
  videos?: string[]
  context: string
  userId?: string
  contentId?: string
}

export interface ModerationLog {
  content: string
  context: string
  type: 'text' | 'image' | 'video'
  result: ModerationResult
  service: string
}

export interface ModerationQueueItem {
  contentType: 'text' | 'image' | 'video' | 'profile' | 'post' | 'challenge'
  contentId: string
  userId: string
  priority?: number
  flaggedReasons: string[]
  aiConfidence?: number
  contentPreview?: string
  contentUrl?: string
}

export type ModerationAction = 'approve' | 'review' | 'reject'

// Export singleton instance
export const moderationService = ContentModerationService.getInstance() 