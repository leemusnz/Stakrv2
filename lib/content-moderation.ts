import { createDbConnection } from '@/lib/db'

// Content moderation service using OpenAI Moderation API + AWS Rekognition
export class ContentModerationService {
  private static instance: ContentModerationService
  private openaiApiKey: string
  private awsAccessKey: string
  private awsSecretKey: string
  private awsRegion: string

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || ''
    this.awsAccessKey = process.env.AWS_ACCESS_KEY_ID || ''
    this.awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY || ''
    this.awsRegion = process.env.AWS_REGION || 'ap-southeast-2'
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

  // Image moderation using AWS Rekognition
  async moderateImage(imageUrl: string, context: string = 'general'): Promise<ModerationResult> {
    try {
      if (!this.awsAccessKey || !this.awsSecretKey) {
        console.warn('AWS credentials not configured for image moderation')
        return { flagged: false, reason: [], confidence: 0, action: 'approve' }
      }

      // Import AWS SDK dynamically to avoid bundle size issues
      const { RekognitionClient, DetectModerationLabelsCommand } = await import('@aws-sdk/client-rekognition')
      
      const client = new RekognitionClient({
        region: this.awsRegion,
        credentials: {
          accessKeyId: this.awsAccessKey,
          secretAccessKey: this.awsSecretKey,
        },
      })

      const command = new DetectModerationLabelsCommand({
        Image: {
          S3Object: {
            Bucket: process.env.AWS_BUCKET_NAME || 'stakr-verification-files',
            Name: this.extractS3KeyFromUrl(imageUrl),
          },
        },
        MinConfidence: 75, // Confidence threshold
      })

      const response = await client.send(command)
      const result = this.parseRekognitionResult(response.ModerationLabels || [])
      
      await this.logModeration({
        content: imageUrl,
        context,
        type: 'image',
        result,
        service: 'aws_rekognition'
      })
      
      return result

    } catch (error) {
      console.error('Image moderation error:', error)
      // Fail safe - flag for manual review
      return {
        flagged: true,
        reason: ['moderation_error'],
        confidence: 0,
        action: 'review'
      }
    }
  }

  // Video moderation (similar to image but with video analysis)
  async moderateVideo(videoUrl: string, context: string = 'general'): Promise<ModerationResult> {
    try {
      // For now, extract frames and moderate as images
      // In production, use AWS Rekognition Video for full video analysis
      return {
        flagged: false,
        reason: [],
        confidence: 0,
        action: 'review', // Always review videos manually for now
        notes: 'Video content requires manual review'
      }
    } catch (error) {
      console.error('Video moderation error:', error)
      return {
        flagged: true,
        reason: ['moderation_error'],
        confidence: 0,
        action: 'review'
      }
    }
  }

  // Comprehensive content check (text + image if applicable)
  async moderateContent(content: ContentToModerate): Promise<ModerationSummary> {
    const results: ModerationResult[] = []
    let overallAction: ModerationAction = 'approve'
    
    // Moderate text content
    if (content.text) {
      const textResult = await this.moderateText(content.text, content.context)
      results.push({ ...textResult, type: 'text' })
      if (textResult.action === 'reject') overallAction = 'reject'
      else if (textResult.action === 'review' && overallAction === 'approve') overallAction = 'review'
    }

    // Moderate images
    if (content.images && content.images.length > 0) {
      for (const imageUrl of content.images) {
        const imageResult = await this.moderateImage(imageUrl, content.context)
        results.push({ ...imageResult, type: 'image', content: imageUrl })
        if (imageResult.action === 'reject') overallAction = 'reject'
        else if (imageResult.action === 'review' && overallAction === 'approve') overallAction = 'review'
      }
    }

    // Moderate videos
    if (content.videos && content.videos.length > 0) {
      for (const videoUrl of content.videos) {
        const videoResult = await this.moderateVideo(videoUrl, content.context)
        results.push({ ...videoResult, type: 'video', content: videoUrl })
        if (videoResult.action === 'reject') overallAction = 'reject'
        else if (videoResult.action === 'review' && overallAction === 'approve') overallAction = 'review'
      }
    }

    return {
      action: overallAction,
      results,
      flagged: results.some(r => r.flagged),
      needsReview: overallAction === 'review',
      summary: this.generateModerationSummary(results)
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

  private parseRekognitionResult(labels: any[]): ModerationResult {
    const flaggedLabels = labels.filter(label => label.Confidence > 75)
    const reasons = flaggedLabels.map(label => label.Name.toLowerCase().replace(/\s+/g, '_'))
    
    return {
      flagged: flaggedLabels.length > 0,
      reason: reasons,
      confidence: flaggedLabels.length > 0 ? Math.max(...flaggedLabels.map(l => l.Confidence)) : 0,
      action: flaggedLabels.length > 0 ? 'reject' : 'approve',
      details: { labels }
    }
  }

  private extractS3KeyFromUrl(url: string): string {
    // Extract S3 key from full S3 URL
    const match = url.match(/amazonaws\.com\/(.+)$/)
    return match ? match[1] : url
  }

  private generateModerationSummary(results: ModerationResult[]): string {
    const flagged = results.filter(r => r.flagged)
    if (flagged.length === 0) return 'Content approved - no issues detected'
    
    const reasons = [...new Set(flagged.flatMap(r => r.reason))]
    return `Content flagged for: ${reasons.join(', ')}`
  }

  private async logModeration(log: ModerationLog): Promise<void> {
    try {
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
      console.error('Failed to log moderation result:', error)
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
  challengeId?: string
}

export interface ModerationLog {
  content: string
  context: string
  type: 'text' | 'image' | 'video'
  result: ModerationResult
  service: string
}

export type ModerationAction = 'approve' | 'review' | 'reject'

// Export singleton instance
export const moderationService = ContentModerationService.getInstance()
