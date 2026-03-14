// Database connection imported dynamically to avoid requiring DATABASE_URL at startup
// Only loaded when actually needed for logging/queueing operations

// MVP Content Moderation - Ultra Lightweight Version
// This version costs $0 to run and provides basic protection

// Enhanced profanity filter for usernames and content
const BASIC_PROFANITY_LIST = [
  // Basic profanity
  'fuck', 'shit', 'bitch', 'asshole', 'damn', 'crap', 'bastard',
  'cock', 'dick', 'pussy', 'cunt', 'whore', 'slut', 'tits', 'boobs',
  
  // Sexual content
  'sex', 'porn', 'nude', 'naked', 'horny', 'orgasm', 'masturbat',
  'lick', 'suck', 'blow', 'cum', 'jizz', 'sperm', 'vagina', 'penis',
  
  // Hate speech and offensive terms
  'hate', 'kill', 'die', 'murder', 'rape', 'molest', 'pedo', 'nazi',
  'terrorist', 'bomb', 'shoot', 'stab', 'suicide', 'cancer',
  
  // Inappropriate usernames patterns
  'anal', 'oral', 'booty', 'sexy', 'milf', 'thot', 'simp', 'chad',
  'incel', 'femboy', 'trap', 'shemale', 'tranny', 'fag', 'gay',
  
  // Drug references
  'weed', 'cocaine', 'meth', 'heroin', 'crack', 'molly', 'ecstasy',
  'drug', 'dealer', 'high', 'stoned', 'junkie', 'addict',
  
  // General offensive
  'stupid', 'idiot', 'retard', 'moron', 'loser', 'fatty', 'ugly'
];

// Patterns to catch variations and bypass attempts
const PROFANITY_PATTERNS = [
  // Letter substitutions (@ for a, 3 for e, etc.)
  /[p]+[u]+[s]+[s]+[y]/gi,
  /[f]+[u]+[c]+[k]/gi,
  /[s]+[h]+[i]+[t]/gi,
  /[b]+[i]+[t]+[c]+[h]/gi,
  /[c]+[u]+[n]+[t]/gi,
  /[d]+[i]+[c]+[k]/gi,
  /[c]+[o]+[c]+[k]/gi,
  
  // Common substitutions
  /p[u@0]ss[y1!]/gi,
  /f[u@0]ck/gi,
  /sh[i1!]t/gi,
  /b[i1!]tch/gi,
  /[a@4]ssh[o0]l[e3]/gi,
  /d[i1!]ck/gi,
  /c[o0]ck/gi,
  
  // Sexual content patterns
  /se[x×]/gi,
  /p[o0]rn/gi,
  /h[o0]rny/gi,
  /n[u@0]de/gi,
  
  // Spacing and special characters to bypass filters
  /p\s*u\s*s\s*s\s*y/gi,
  /f\s*u\s*c\s*k/gi,
  /s\s*h\s*i\s*t/gi,
  /b\s*i\s*t\s*c\s*h/gi
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
    
    // Check for basic profanity words
    for (const word of BASIC_PROFANITY_LIST) {
      if (lowerContent.includes(word)) {
        return {
          flagged: true,
          reason: `Inappropriate language detected: contains "${word}"`,
          confidence: 0.9
        };
      }
    }
    
    // Check for profanity patterns (catches variations and bypasses)
    for (const pattern of PROFANITY_PATTERNS) {
      if (pattern.test(content)) {
        return {
          flagged: true,
          reason: 'Inappropriate language pattern detected',
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
      return { valid: false, reason: 'Name too short (minimum 2 characters)' };
    }
    
    if (name.length > 50) {
      return { valid: false, reason: 'Name too long (maximum 50 characters)' };
    }
    
    // Check for profanity in name
    const modResult = this.moderateText(name);
    if (modResult.flagged) {
      return { 
        valid: false, 
        reason: `Username not allowed: ${modResult.reason}. Please choose a respectful username.` 
      };
    }
    
    // Additional username-specific checks
    if (/^\d+$/.test(name)) {
      return { valid: false, reason: 'Username cannot be only numbers' };
    }
    
    if (/^[^a-zA-Z0-9]+$/.test(name)) {
      return { valid: false, reason: 'Username must contain at least some letters or numbers' };
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
        
        // Different behavior based on environment
        const isDevelopment = process.env.NODE_ENV === 'development'
        
        if (context === 'profile_picture' && !isDevelopment) {
          // Only block in production when API is unavailable
          console.warn('🚫 Blocking profile picture upload due to missing moderation API (production)')
          return {
            flagged: true,
            reason: ['moderation_unavailable'],
            confidence: 100,
            action: 'reject'
          }
        } else if (context === 'profile_picture' && isDevelopment) {
          // Allow in development for better developer experience
          console.warn('🔧 Development mode: Allowing profile picture despite missing moderation API')
          return {
            flagged: false,
            reason: ['dev_mode_override'],
            confidence: 0,
            action: 'approve'
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
        // Try to download image - handles both proxy URLs and direct URLs
        let imageResponse: Response
        let downloadUrl = imageUrl
        
        // Check if it's a proxy URL or direct S3 URL
        let actualS3Url = imageUrl
        let isS3Url = false
        
        // Handle proxy URLs that wrap S3 URLs
        if (imageUrl.includes('/api/image-proxy?url=')) {
          console.log('🔗 Detected proxy URL, extracting S3 URL')
          const urlParams = new URL(imageUrl)
          const wrappedUrl = urlParams.searchParams.get('url')
          if (wrappedUrl && wrappedUrl.includes('stakr-verification-files.s3.ap-southeast-2.amazonaws.com')) {
            actualS3Url = wrappedUrl
            isS3Url = true
            console.log('📤 Extracted S3 URL from proxy:', actualS3Url)
          }
        } else if (imageUrl.includes('stakr-verification-files.s3.ap-southeast-2.amazonaws.com')) {
          isS3Url = true
          console.log('🪣 Detected direct S3 URL')
        }
        
        // If it's an S3 URL (direct or via proxy), we need to handle it specially in production
        if (isS3Url) {
          console.log('🪣 S3 URL detected, checking AWS credentials for direct access')
          
          // In production, try to access S3 directly if we have credentials
          if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
            console.log('🔑 AWS credentials available, attempting direct S3 access')
            
            try {
              const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3')
              
                             // Extract S3 key from URL
               const urlParts = actualS3Url.split('.amazonaws.com/')
               const s3Key = urlParts[1]
              
              const s3Client = new S3Client({
                region: process.env.AWS_REGION || 'ap-southeast-2',
                credentials: {
                  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                },
              })
              
              const command = new GetObjectCommand({
                Bucket: 'stakr-verification-files',
                Key: s3Key,
              })
              
              const s3Response = await s3Client.send(command)
              
              if (s3Response.Body) {
                // Convert stream to buffer for S3
                const chunks: Uint8Array[] = []
                const reader = s3Response.Body.transformToWebStream().getReader()
                
                while (true) {
                  const { done, value } = await reader.read()
                  if (done) break
                  chunks.push(value)
                }
                
                const imageBuffer = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
                let offset = 0
                for (const chunk of chunks) {
                  imageBuffer.set(chunk, offset)
                  offset += chunk.length
                }
                
                const base64Data = Buffer.from(imageBuffer).toString('base64')
                const contentType = s3Response.ContentType || 'image/jpeg'
                base64Image = `data:${contentType};base64,${base64Data}`
                
                console.log('✅ Direct S3 access successful, image size:', base64Data.length, 'chars')
              } else {
                throw new Error('No image data in S3 response')
              }
            } catch (s3Error) {
              console.warn('⚠️ Direct S3 access failed, falling back to HTTP fetch:', s3Error)
              // Fall back to regular HTTP fetch
              imageResponse = await fetch(downloadUrl)
              if (!imageResponse.ok) {
                throw new Error(`Failed to download image via HTTP: ${imageResponse.status}`)
              }
              
              const imageBuffer = await imageResponse.arrayBuffer()
              const base64Data = Buffer.from(imageBuffer).toString('base64')
              const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
              base64Image = `data:${contentType};base64,${base64Data}`
              
              console.log('✅ HTTP fallback successful, image size:', base64Data.length, 'chars')
            }
          } else {
            console.log('⚠️ No AWS credentials, using HTTP fetch')
            imageResponse = await fetch(downloadUrl)
            if (!imageResponse.ok) {
              throw new Error(`Failed to download image: ${imageResponse.status}`)
            }
            
            const imageBuffer = await imageResponse.arrayBuffer()
            const base64Data = Buffer.from(imageBuffer).toString('base64')
            const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
            base64Image = `data:${contentType};base64,${base64Data}`
            
            console.log('✅ HTTP fetch successful, image size:', base64Data.length, 'chars')
          }
        } else {
          // For non-S3 URLs, use regular fetch
          imageResponse = await fetch(downloadUrl)
          if (!imageResponse.ok) {
            throw new Error(`Failed to download image: ${imageResponse.status}`)
          }
          
          const imageBuffer = await imageResponse.arrayBuffer()
          const base64Data = Buffer.from(imageBuffer).toString('base64')
          const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
          base64Image = `data:${contentType};base64,${base64Data}`
          
          console.log('✅ Image converted to base64, size:', base64Data.length, 'chars')
        }
        
      } catch (downloadError) {
        console.error('❌ Failed to download image for moderation:', downloadError)
        
        // CRITICAL: No overrides - let real moderation results stand
        console.error('🚨 BLOCKING upload due to download failure - no override applied')
        return {
          flagged: true,
          reason: ['moderation_download_failed'],
          confidence: 100,
          action: 'reject'
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
                text: `Analyze this image for appropriateness as a profile picture on a social platform. Respond with a JSON object containing:
- "flagged": boolean (true if inappropriate for a profile picture)
- "reason": array of strings (categories like "sexual", "nudity", "violence", "harassment", "weapons", "minors", "medical_genitalia", "personal_info", "screenshots", "text_heavy", "low_quality", "political", "drugs", "drug_paraphernalia", "tobacco", "gambling")
- "confidence": number 1-100 (confidence in the assessment)
- "explanation": string (brief explanation)

PROFILE PICTURE SAFETY RULES - Flag as inappropriate ONLY if the image contains:
- Sexual content, nudity, or sexually suggestive material
- Violence, harassment, hate symbols, or threatening gestures
- Weapons (guns, knives, etc.) even if legally owned
- Images of minors/children (privacy and safety concerns)
- Medical diagrams, illustrations, or photos of genitalia/reproductive organs (even if educational)
- Personal information (QR codes, phone numbers, addresses, documents)
- Screenshots of apps, websites, or other digital content
- Images that are primarily text or very low-quality/unrecognizable
- Political figures, campaign materials, or divisive political content
- Drug use, drug paraphernalia, pills, syringes, or substance abuse imagery
- Tobacco use, smoking, vaping, or gambling imagery

EXPLICITLY ALLOWED (do NOT flag):
- Cartoon characters, anime, or illustrated avatars
- Animals, pets, or nature photos  
- AI-generated portraits or characters
- Artwork, drawings, or creative imagery
- Humorous or meme content (if not violating other rules)
- Brand logos or symbols (if not violating other rules)

This is for a social challenge platform - focus on safety, not professionalism. Allow creative expression.`
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

      console.log('📡 OpenAI API response status:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📥 OpenAI API response structure:', {
          choices: data.choices?.length || 0,
          hasContent: !!data.choices?.[0]?.message?.content,
          usage: data.usage,
          model: data.model
        })
        
        const content = data.choices[0]?.message?.content

        if (!content) {
          console.error('❌ No content in OpenAI response:', JSON.stringify(data, null, 2))
          return {
            flagged: true,
            reason: ['moderation_no_content'],
            confidence: 100,
            action: 'reject'
          }
        }

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
          console.error('❌ CRITICAL: Failed to parse OpenAI vision response')
          console.error('📋 Raw response status:', response.status)
          console.error('📋 Raw response headers:', Object.fromEntries(response.headers.entries()))
          console.error('📋 Raw response content:', content)
          console.error('📋 Cleaned content for parsing:', cleanContent)
          console.error('📋 Parse error details:', parseError)
          
          // Log first 500 chars of response for debugging
          console.error('📋 Response preview:', content.substring(0, 500))
          
          // CRITICAL: Block all uploads when parsing fails - no overrides
          console.error('🚨 BLOCKING upload due to moderation parsing failure - no override applied')
          return {
            flagged: true,
            reason: ['moderation_parse_failed'],
            confidence: 100,
            action: 'reject'
          }
        }
      }

      // API call failed - capture detailed error info
      const errorText = await response.text()
      console.error('❌ CRITICAL: OpenAI Vision API call failed')
      console.error('📋 Status:', response.status, response.statusText)
      console.error('📋 Headers:', Object.fromEntries(response.headers.entries()))
      console.error('📋 Error response body:', errorText)
      console.error('📋 Request was for image context:', context)
      
      // Try to parse error as JSON for more details
      try {
        const errorData = JSON.parse(errorText)
        console.error('📋 Parsed error details:', errorData)
        
        // Check for specific OpenAI error types
        if (errorData.error?.type === 'insufficient_quota') {
          console.error('💰 OpenAI quota exceeded!')
        } else if (errorData.error?.type === 'invalid_request_error') {
          console.error('📝 Invalid request to OpenAI:', errorData.error.message)
        } else if (errorData.error?.type === 'rate_limit_exceeded') {
          console.error('⚡ Rate limit exceeded for OpenAI API')
        }
      } catch {
        console.error('📋 Error response is not JSON')
      }
      
      // CRITICAL: Block all uploads when API fails - no overrides
      console.error('🚨 BLOCKING upload due to OpenAI API failure - no override applied')
      return {
        flagged: true,
        reason: ['moderation_api_failed'],
        confidence: 100,
        action: 'reject'
      }

    } catch (error) {
      console.error('❌ CRITICAL: Image moderation general error:', error)
      console.error('📋 Error context:', context)
      console.error('📋 Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      
      // CRITICAL: Block all uploads when general errors occur - no overrides
      console.error('🚨 BLOCKING upload due to moderation general error - no override applied')
      return {
        flagged: true,
        reason: ['moderation_error'],
        confidence: 100,
        action: 'reject'
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
        contentType: content.context as 'text' | 'image' | 'video' | 'profile' | 'post' | 'challenge',
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
