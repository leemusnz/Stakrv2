/**
 * AI Challenge Analyzer
 * Interprets challenge descriptions and generates structured summaries for user confirmation
 */

export interface ChallengeAnalysis {
  // Core challenge understanding
  dailyRequirement: string
  activityType: string[]
  measurementType: 'distance' | 'duration' | 'count' | 'frequency' | 'completion'
  minimumValue?: number
  maximumValue?: number
  unit?: string
  
  // Challenge structure
  durationType: 'daily' | 'weekly' | 'one-time' | 'custom'
  totalDuration?: number
  durationUnit?: 'days' | 'weeks' | 'months'
  
  // Validation approach
  validationMethod: 'automatic' | 'manual' | 'hybrid'
  recommendedProofTypes: string[]
  evidenceRequirements: string[]
  
  // Design analysis
  stakesAppropriate: boolean
  verificationOptimal: boolean
  designRecommendations: string[]
  riskFactors: string[]
  
  // AI interpretation
  interpretation: string
  confidence: number
  potentialAmbiguities: string[]
  clarificationQuestions: string[]
  measurementTolerance?: string
  userClarifications?: string
}

export interface ChallengeAnalysisRequest {
  // Basic Info
  title: string
  description: string
  duration?: number
  difficulty?: string
  category?: string
  tags?: string[]
  
  // Dev Tools Settings (optional)
  devSettings?: {
    contextAwareness?: number // 0-100
    verbosityLevel?: number // 0-100
    criticalLevel?: number // 0-100
    challengeTypePreset?: 'auto' | 'physical_skills' | 'habits' | 'learning' | 'fitness_tracking' | 'creative'
    skipObviousQuestions?: boolean
    includeVerificationOptimization?: boolean
    includeRiskAnalysis?: boolean
    includeDesignRecommendations?: boolean
    customPromptAdditions?: string
    confidenceThreshold?: number
    responseFormat?: 'standard' | 'detailed' | 'minimal'
  }
  
  // Challenge Features
  privacyType?: string
  isPrivate?: boolean
  allowPointsOnly?: boolean
  minParticipants?: number
  maxParticipants?: number | null
  startDateType?: string
  startDateDays?: number
  joinDeadlineType?: string
  joinDeadlineDays?: number
  
  // Team & Social Features  
  enableTeamMode?: boolean
  teamAssignmentMethod?: string
  numberOfTeams?: number
  winningCriteria?: string
  losingTeamOutcome?: string
  enableReferralBonus?: boolean
  referralBonusPercentage?: number
  maxReferrals?: number
  
  // Rules & Instructions
  rules?: string[]
  dailyInstructions?: string
  generalInstructions?: string
  
  // Proof & Verification
  verificationType?: string
  selectedProofTypes?: string[]
  proofInstructions?: string
  cameraOnly?: boolean
  allowLateSubmissions?: boolean
  lateSubmissionHours?: number
  requireTimer?: boolean
  timerMinDuration?: number
  timerMaxDuration?: number
  randomCheckinsEnabled?: boolean
  randomCheckinProbability?: number
  
  // Stakes & Rewards
  minStake?: number
  maxStake?: number
  hostContribution?: number
  rewardDistribution?: string
}

export class AIChallengeAnalyzer {
  
  /**
   * Main analysis entry point
   */
  static async analyzeChallengeDescription(request: ChallengeAnalysisRequest): Promise<ChallengeAnalysis> {
    try {
      console.log('🔍 AI Analysis Input - Has Additional Context:', request.description?.includes('Additional Context:'))
      console.log('🔍 AI Analysis Input - Description preview:', request.description?.substring(0, 200) + '...')
      
      const prompt = this.buildAnalysisPrompt(request)
      
      // Apply dev settings if provided
      if (request.devSettings) {
        console.log('🛠️ Applying dev settings to analysis:', request.devSettings)
      }
      const aiResponse = await this.callAIService(prompt)
      const analysis = this.parseAIResponse(aiResponse)
      
      return {
        ...analysis,
        // Add fallback validation
        confidence: Math.min(analysis.confidence || 80, 100),
        potentialAmbiguities: analysis.potentialAmbiguities || [],
        clarificationQuestions: analysis.clarificationQuestions || []
      }
      
    } catch (error) {
      console.error('AI Challenge Analysis failed:', error)
      return this.createFallbackAnalysis(request)
    }
  }
  
  /**
   * Build comprehensive analysis prompt
   */
  private static buildAnalysisPrompt(request: ChallengeAnalysisRequest): string {
    return `
You are an expert challenge analyst. Analyze this fitness/habit challenge and provide a structured interpretation.

CHALLENGE TO ANALYZE:

${request.description.includes('Additional Context:') ? `
🔄 RE-ANALYSIS MODE: The user has provided additional clarifications. Your job is to INCORPORATE their feedback, NOT to question it again.

CRITICAL: This is a COMPREHENSIVE RE-ANALYSIS using ALL provided challenge data:
- The user has updated challenge settings across multiple steps
- REVIEW and INTEGRATE all sections: Basic Info, Features, Team/Social, Rules, Proof Settings, Stakes
- If the user has clarified measurement tolerance, validation methods, or evidence requirements in the "Additional Context" section, ACCEPT and INTEGRATE those clarifications
- Do not ask for further clarification on points they've already addressed
- Consider how ALL challenge settings work together (privacy, teams, referrals, timing, etc.)
` : `
🔍 INITIAL ANALYSIS MODE: Comprehensive analysis of all provided challenge data.

CRITICAL: Consider ALL provided information from the challenge creation process:
- Basic challenge details (title, description, category, duration, difficulty)
- Privacy and participant settings
- Team mode and social features
- Referral bonus programs
- Rules and instructions (daily, general)
- Proof and verification settings
- Stakes and reward distribution
- Timing settings (start dates, join deadlines)
`}

BASIC INFO:
- Title: "${request.title}"
- Description: "${request.description}"
- Duration: ${request.duration || 'Not specified'} days
- Difficulty: ${request.difficulty || 'Not specified'}
- Category: ${request.category || 'Not specified'}
- Tags: ${request.tags?.join(', ') || 'None'}

CHALLENGE FEATURES:
- Privacy: ${request.isPrivate ? 'Private challenge' : 'Public challenge'} ${request.privacyType ? `(${request.privacyType})` : ''}
- Points Only: ${request.allowPointsOnly ? 'Yes' : 'No'}
- Participants: ${request.minParticipants || 'Not specified'} to ${request.maxParticipants || 'unlimited'}
- Start Date: ${request.startDateType === 'manual' ? 'Manual start' : `${request.startDateDays || 2} days from creation`}
- Join Deadline: ${request.joinDeadlineType === 'manual' ? 'Manual deadline' : `${request.joinDeadlineDays || 1} days before start`}

TEAM & SOCIAL:
- Team Mode: ${request.enableTeamMode ? 'Yes' : 'No'}
${request.enableTeamMode ? `- Team Assignment: ${request.teamAssignmentMethod || 'auto-balance'}
- Number of Teams: ${request.numberOfTeams || 2}
- Winning Criteria: ${request.winningCriteria || 'completion-rate'}
- Losing Outcome: ${request.losingTeamOutcome || 'lose-stake'}` : ''}
- Referral Bonus: ${request.enableReferralBonus ? `Yes (${request.referralBonusPercentage || 10}% up to ${request.maxReferrals || 5} people)` : 'No'}

RULES & INSTRUCTIONS:
- Rules: ${request.rules?.length ? request.rules.join('; ') : 'None specified'}
- Daily Instructions: "${request.dailyInstructions || 'None'}"
- General Instructions: "${request.generalInstructions || 'None'}"

PROOF & VERIFICATION:
- Verification Type: ${request.verificationType || 'Not specified'}
- Selected Proof Types: ${request.selectedProofTypes?.join(', ') || 'Not specified'}
- Proof Instructions: "${request.proofInstructions || 'None'}"
- Camera Only: ${request.cameraOnly ? 'Yes (PREVENTS gallery uploads - more secure)' : 'No (allows gallery uploads - less secure)'}
- Late Submissions: ${request.allowLateSubmissions ? `Yes (${request.lateSubmissionHours}h window)` : 'No'}
- Timer Required: ${request.requireTimer ? `Yes (${request.timerMinDuration}-${request.timerMaxDuration} min)` : 'No'}
- Random Check-ins: ${request.randomCheckinsEnabled ? `Yes (${request.randomCheckinProbability}% probability)` : 'No'}

VERIFICATION SECURITY ANALYSIS REQUIRED:
- If Camera Only = Yes + Video selected: This is HIGH SECURITY (live camera capture only)
- If Camera Only = No: This allows gallery uploads (lower security)
- Factor this into your gaming/security analysis!

STAKES & REWARDS:
- Stake Range: ${request.allowPointsOnly ? 'Points only' : `$${request.minStake || 25} - $${request.maxStake || 200}`}
- Host Contribution: ${request.allowPointsOnly ? 'N/A' : `$${request.hostContribution || 0}`}
- Reward Distribution: ${request.rewardDistribution || 'equal-split'}

ANALYSIS FRAMEWORK:

🛡️ YOU ARE A COMPETITOR ADVOCATE: Analyze this challenge from the participant's perspective. Ensure fairness, clarity, and achievable requirements. Protect users from unfair rejections or unclear rules.

🧠 BE CONTEXTUALLY INTELLIGENT: Don't ask obvious questions! Apply common sense based on activity type:
- Handstand walks: focus on technique, measurement, safety - NOT "what equipment do you need"
- Guitar practice: focus on progress measurement, practice quality - NOT "you need a guitar"
- Brushing teeth: focus on completion definition, timing - NOT "you need a toothbrush"
- Running: focus on distance accuracy, weather policies - auto-sync from fitness apps makes sense
- Journaling: focus on quality standards, privacy - NOT technology requirements

🔥 BE SELECTIVELY CRITICAL: Focus on genuine ambiguities that could cause unfair failures or disputes. Skip obvious requirements that any reasonable person would understand.

🎯 UNIVERSAL CHALLENGE ANALYSIS - Works for ANY challenge type (fitness, habits, learning, creative, productivity, etc.):
- What are the unstated assumptions that could trip up participants?
- What resources, skills, or circumstances are taken for granted?
- What could prevent someone from participating fairly?
- What interpretation differences could arise between participants?

🎯 DAILY REQUIREMENT EXTRACTION:
- What specific action must users perform each day?
- What is the minimum threshold (distance, time, count, etc.)?
- What activity types are acceptable?
- What constitutes completion vs failure? (Be VERY specific)
- Are multiple attempts allowed per day?
- Must the requirement be completed in one continuous session?
- What tolerance exists for partial completion (90% vs 100%)?
- Are rest breaks allowed during the activity?
- What time window is allowed for completion each day?
- Can the activity be split across multiple sessions?

📏 MEASUREMENT INTERPRETATION:
- Units: "10m" = 10 meters (distance), "10min" = 10 minutes (duration)
- Activity types: walking, running, exercise, meditation, reading, etc.
- Thresholds: minimum requirements vs. target goals
- Edge cases: What tolerance should be allowed? (9.8m vs 10.1m)

📹 EVIDENCE REQUIREMENTS (CRITICAL FOR VALIDATION):
- If detailed proof instructions are provided, EXTRACT specific requirements from them
- Camera positioning: Where should the camera be placed? (Extract from proof instructions if specified)
- Framing: What must be visible throughout the activity? (Look for "whole body", "full frame", etc.)
- Duration: Must the entire activity be recorded or just key moments? (Check for "entire time", "continuous", etc.)
- Quality: What video/photo quality is needed for validation? (Look for resolution, lighting requirements)
- Distance measurement: How should distance be measured? (Check for "AI analysis", "estimation", specific tools)
- Continuous requirements: Any requirements about maintaining visibility? (Look for "no part goes out of frame")
- Multiple angles: Are different viewpoints needed?

PROOF INSTRUCTION EXTRACTION PRIORITY:
- If proof instructions contain specific filming requirements, USE THOSE as evidence requirements
- If proof instructions mention measurement methods (e.g., "AI analysis"), include that in measurement tolerance
- Extract all specific positioning, framing, and quality requirements from proof instructions
- Look for key phrases like "filmed to the side", "whole body must be in frame", "entire time", "10m distance", "AI analysis"
- Convert detailed proof instructions into structured evidence requirements list

🔄 CHALLENGE STRUCTURE:
- Is this daily, weekly, or one-time?
- How long does the challenge run?
- Are there rest days or continuous requirements?
- What flexibility should participants have?

🤖 VALIDATION APPROACH ANALYSIS:
- Can this be automatically verified via apps/wearables?
- What proof types make sense (photo, video, text, auto-sync)?
- Are there measurement challenges that need clarification?
- How can validation be consistent and fair across all participants?

🎯 SMART VERIFICATION ANALYSIS (CONTEXT-AWARE - Analyze ACTUAL configured settings):
- **Currently Selected Types**: Review the ACTUAL selectedProofTypes configured for this challenge
- **Camera Settings Analysis**: If cameraOnly=true, acknowledge this prevents fake photos/videos from gallery
- **Activity-Appropriate Verification**: 
  * Physical skills (handstands, specific exercises): Video/photo perfect, wearables NOT applicable for technique verification
  * General fitness (running, walking, steps): Auto-sync from wearables/fitness apps ideal
  * Habits (brushing teeth, meditation, journaling): Photo/text appropriate, auto-sync rarely available
  * Learning (guitar, reading, studying): Video for skills, text for reflection, some app integrations possible
- **Smart Optimization**: Only suggest alternatives if current method has genuine flaws for THIS specific activity
- **Gaming Resistance**: Given the ACTUAL verification settings, how secure is this setup?

CRITICAL: Base all verification analysis on the ACTUAL configured settings, not generic assumptions!

⚠️ SMART AMBIGUITY DETECTION (CONTEXT-AWARE PARTICIPANT PROTECTION):
Apply intelligence - don't ask obvious questions! Consider the activity type:

**Physical Skills (handstands, specific exercises):**
- Focus on: technique definitions, measurement precision, safety considerations, form requirements
- Skip: obvious equipment needs, basic tech requirements, general fitness warnings

**Habits (brushing teeth, journaling, meditation):**
- Focus on: definition of "completion", timing requirements, quality standards
- Skip: equipment needs (toothbrush = obvious), location requirements (anywhere is fine)

**Learning Activities (guitar practice, reading, language study):**
- Focus on: progress measurement, practice quality vs quantity, demonstration requirements
- Skip: obvious resources (books for reading, guitar for guitar practice)

**Fitness Tracking (running, walking, general exercise):**
- Focus on: measurement accuracy, weather policies, rest days, injury protocols
- Skip: basic fitness equipment needs, general health warnings

**Creative/Productive (writing, art, work tasks):**
- Focus on: quality standards, originality requirements, submission formats
- Skip: basic tools and technology that the activity obviously requires

CRITICAL: Only flag genuine ambiguities that could lead to disputes or unfair failures. Don't be pedantic about obvious requirements.
- What accessibility accommodations might be needed?
- What cultural, geographic, or resource barriers exist?

📝 USER CLARIFICATION PROCESSING:
- If the user has provided "Additional Context", treat it as authoritative clarification
- Do NOT ask questions that the additional context has already answered
- If additional context addresses measurement tolerance, accept it and don't request stricter verification
- If user specifies "AI estimation" or "approximate", don't demand precise measurement tools
- Incorporate user clarifications into your interpretation rather than questioning them again

🔍 COMPREHENSIVE CHALLENGE DESIGN ANALYSIS (Based on ACTUAL Settings):
- **Stakes vs Risk**: Are stakes (${request.minStake}-${request.maxStake}) proportional to challenge difficulty/duration/commitment?
- **Stakes vs Verification**: Do stakes justify the verification method complexity/intrusiveness?
- **Verification Fit**: Is the chosen verification method (${request.selectedProofTypes?.join(', ') || 'not specified'}) optimal for this activity type?
- **Verification Feasibility**: Can the selected proof types actually validate completion?
- **Gaming Potential**: Given cameraOnly=${request.cameraOnly} and selectedProofTypes=${request.selectedProofTypes?.join(', ')}, how secure is this?
- **Camera-Only Security**: If cameraOnly=true, this prevents gallery uploads and significantly reduces gaming potential
- **Verification Cost**: Do verification requirements create barriers (time, privacy, tech)?
- **Scalability**: Will verification work with the expected participant count?
- **Fairness Across Demographics**: Do requirements disadvantage certain groups?
- **Host Burden**: Are verification/management requirements realistic for hosts?
- **Platform Integration**: Do chosen proof types integrate well with Stakr's systems?
- **Alternative Methods**: Are there better verification approaches available?
- **Risk-Reward Balance**: Is the challenge structure fundamentally fair?
- **Timing Alignment**: Do all timing elements (duration, deadlines, submission windows) make sense together?

CRITICAL REMINDER: If video verification + cameraOnly=true is configured, do NOT suggest "easy to game with fake photos" - this setup is actually quite secure!

🌍 SMART PRACTICAL CONSIDERATIONS (Context-Aware Analysis):
Apply common sense - don't over-analyze simple activities:

**Only flag practical concerns if they're NON-OBVIOUS or SIGNIFICANT:**
- Complex/expensive equipment needs (not basic tools like toothbrush, guitar, phone)
- Costly requirements (gym memberships, specialized gear, subscriptions over ~$10)
- Weather/location dependencies that could prevent completion
- Safety concerns beyond common sense (advanced skills, dangerous activities)
- Skill barriers that could exclude participants unfairly
- Time zone issues for global challenges with strict deadlines
- Accessibility barriers for physical limitations

**DON'T flag obvious things:**
- "You need a guitar for guitar practice"
- "You need a toothbrush for brushing teeth"  
- "You need internet for the app" (they're already using the app)
- General health warnings for normal activities
- Basic tools everyone has access to
- Obvious skill requirements (reading for a reading challenge)

**Focus on REAL barriers that could cause unfair failures or prevent legitimate participation.**

EXAMPLES OF THOROUGH ANALYSIS ACROSS CHALLENGE TYPES:

Input: "Read 20 pages daily"
Missing Info Analysis:
- What counts as a "page"? (Book pages vs articles vs PDFs with different layouts)
- Are there content restrictions? (Any book vs specific genres)
- What about audiobooks or digital formats?
- How is reading tracked/verified?
- What happens with non-English content for non-native speakers?

Input: "Meditate for 10 minutes daily"  
Missing Info Analysis:
- What constitutes meditation? (Guided vs silent vs movement-based)
- Are meditation apps required or can it be self-guided?
- What about different time zones for "daily" completion?
- How is meditation verified without being intrusive?
- What accommodations exist for different spiritual/religious backgrounds?

Input: "Learn a new skill"
Missing Info Analysis:
- What qualifies as "learning"? (Watching videos vs hands-on practice)
- How is progress measured and verified?
- What resources are participants expected to have access to?
- Are there cost barriers for learning materials or courses?
- What skill level starting point is assumed?

Input: "Post daily on social media"
Missing Info Analysis:
- Which platforms are accepted?
- What if someone doesn't have social media accounts?
- Are there content requirements or restrictions?
- How is privacy handled for verification?
- What about platform outages or account issues?

Respond ONLY in JSON:
{
  "dailyRequirement": "Clear description of what users must do each day",
  "activityType": ["activity1", "activity2"],
  "measurementType": "distance|duration|count|frequency|completion",
  "minimumValue": 10,
  "maximumValue": null,
  "unit": "meters|minutes|times|etc",
  "durationType": "daily|weekly|one-time|custom",
  "totalDuration": 30,
  "durationUnit": "days|weeks|months",
  "validationMethod": "automatic|manual|hybrid",
  "recommendedProofTypes": ["auto_sync", "photo", "text"],
  "evidenceRequirements": ["Extract specific requirements from proof instructions - e.g., filming to the side, whole body in frame", "Include distance measurement methods if specified", "Note any continuous visibility requirements"],
  "stakesAppropriate": true,
  "verificationOptimal": false,
  "designRecommendations": ["Consider auto-sync with fitness apps for better verification", "Stakes may be too high for difficulty level", "Add backup verification methods"],
  "riskFactors": ["Risk factors based on ACTUAL settings - if cameraOnly=true + video, note HIGH SECURITY not gaming concerns", "High barrier to entry", "Verification burden assessment"],
  "interpretation": "Natural language summary of how the challenge works",
  "confidence": 95,
  "potentialAmbiguities": ["Only non-obvious issues like: measurement precision, quality standards, edge cases", "NOT obvious things like needing a guitar for guitar practice", "Focus on genuine dispute risks"],
  "clarificationQuestions": ["Smart, activity-specific questions that prevent unfair failures", "NOT obvious resource questions", "Focus on measurement, standards, and edge cases"],
  "measurementTolerance": "If user specified tolerance (e.g., 'AI estimation', 'approximate'), include their preference here",
  "userClarifications": "Summary of any Additional Context the user provided"
}
`
  }
  
  /**
   * Call AI service (leverages existing OpenAI infrastructure)
   */
  private static async callAIService(prompt: string): Promise<string> {
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
        model: 'gpt-4o-mini', // Fast and cost-effective for analysis
        messages: [
          {
            role: 'system',
            content: 'You are a precise challenge analysis system. Respond only with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Low temperature for consistent analysis
        max_tokens: 1000
      })
    })
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }
  
  /**
   * Parse AI response into structured format
   */
  private static parseAIResponse(response: string): ChallengeAnalysis {
    try {
      // Clean up the response (remove any markdown code blocks)
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleanResponse)
      
      // Validate required fields
      if (!parsed.dailyRequirement || !parsed.interpretation) {
        throw new Error('Missing required fields in AI response')
      }
      
      return parsed as ChallengeAnalysis
    } catch (error) {
      console.error('Failed to parse AI response:', error)
      throw new Error('Invalid AI response format')
    }
  }
  
  /**
   * Create fallback analysis when AI fails
   */
  private static createFallbackAnalysis(request: ChallengeAnalysisRequest): ChallengeAnalysis {
    return {
      dailyRequirement: `Complete the challenge: ${request.title}`,
      activityType: ['general'],
      measurementType: 'completion',
      durationType: 'daily',
      totalDuration: request.duration || 30,
      durationUnit: 'days',
      validationMethod: 'manual',
      recommendedProofTypes: ['photo', 'text'],
      interpretation: `This challenge requires daily completion of: ${request.title}. ${request.description}`,
      confidence: 50,
      potentialAmbiguities: ['AI analysis failed - manual review recommended'],
      clarificationQuestions: [
        'What specific action should users perform daily?',
        'How should progress be measured?',
        'What proof types would work best?'
      ]
    }
  }
  
  /**
   * Generate user-friendly summary text
   */
  static generateSummaryText(analysis: ChallengeAnalysis): string {
    const durationType = analysis.durationType === 'daily' ? 'every day' : 
                        analysis.durationType === 'weekly' ? 'every week' : 
                        'as specified'
    
    const duration = analysis.totalDuration ? 
      `for ${analysis.totalDuration} ${analysis.durationUnit}` : 
      'for the specified duration'
    
    const measurement = analysis.minimumValue ? 
      `at least ${analysis.minimumValue} ${analysis.unit}` : 
      'as described'
    
    return `${analysis.dailyRequirement} (${measurement}) ${durationType} ${duration}. Validation will be ${analysis.validationMethod}.`
  }
}
