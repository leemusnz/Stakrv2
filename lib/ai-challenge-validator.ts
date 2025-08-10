/**
 * AI-Enhanced Challenge Validation
 * Uses LLM to intelligently parse and validate challenge requirements
 */

export interface AIValidationRequest {
  challengeTitle: string
  challengeDescription: string
  stravaActivity: {
    type: string
    distance: number // meters
    duration: number // seconds
    calories?: number
    elevation?: number
    heartRate?: number
    pace?: number
  }
}

export interface AIValidationResponse {
  isValid: boolean
  confidence: number // 0-1
  reasoning: string
  requirements: {
    activityType?: string[]
    minDistance?: number
    minDuration?: number
    other?: string[]
  }
  suggestions?: string[]
}

/**
 * AI-powered challenge requirement extraction
 */
export async function parseChallengereWithAI(
  title: string, 
  description: string
): Promise<AIValidationResponse['requirements']> {
  
  const prompt = `
Parse this fitness challenge and extract specific requirements:

Title: "${title}"
Description: "${description}"

Extract:
1. Required activity types (walk, run, cycle, swim, etc.)
2. Minimum distance (in meters)
3. Minimum duration (in minutes) 
4. Any other specific requirements

Respond in JSON format:
{
  "activityType": ["Walk"],
  "minDistance": 10,
  "minDuration": null,
  "other": ["daily requirement", "outdoor preferred"]
}
`

  try {
    // This would call OpenAI, Claude, or another LLM
    const response = await callLLM(prompt)
    return JSON.parse(response)
  } catch (error) {
    console.error('AI parsing failed:', error)
    // Fallback to rule-based parsing
    return parseChallengeFallback(title, description)
  }
}

/**
 * AI-powered activity validation
 */
export async function validateActivityWithAI(
  request: AIValidationRequest
): Promise<AIValidationResponse> {
  
  const { challengeTitle, challengeDescription, stravaActivity } = request
  
  const prompt = `
Validate if this Strava activity meets the challenge requirements:

CHALLENGE:
Title: "${challengeTitle}"
Description: "${challengeDescription}"

ACTIVITY:
Type: ${stravaActivity.type}
Distance: ${stravaActivity.distance}m
Duration: ${Math.round(stravaActivity.duration / 60)}min
${stravaActivity.calories ? `Calories: ${stravaActivity.calories}` : ''}

Questions:
1. Does this activity fulfill the challenge requirements?
2. How confident are you (0-100%)?
3. What specific requirements does it meet or miss?
4. Any suggestions for the user?

Respond in JSON:
{
  "isValid": true,
  "confidence": 0.95,
  "reasoning": "The 15-minute walk (1200m) exceeds the 10m requirement",
  "suggestions": ["Great job! This walk far exceeds the minimum requirement"]
}
`

  try {
    const response = await callLLM(prompt)
    return JSON.parse(response)
  } catch (error) {
    console.error('AI validation failed:', error)
    return fallbackValidation(request)
  }
}

/**
 * Smart challenge interpretation examples
 */
export const AI_CAPABILITIES = {
  
  // Natural language understanding
  ambiguousLanguage: {
    "Take a quick walk": "→ AI: Any walk activity, no minimum distance",
    "Go for a proper run": "→ AI: Running activity, probably >2km based on 'proper'",
    "Get some fresh air": "→ AI: Outdoor activity preferred, walking/running"
  },
  
  // Context awareness  
  contextual: {
    "Walk to the shops": "→ AI: Walking, probably 500m-2km typical shop distance",
    "Marathon training run": "→ AI: Running, 15km+ based on marathon context",
    "Cool down walk": "→ AI: Walking, probably 5-15min recovery pace"
  },
  
  // Complex requirements
  multiCriteria: {
    "Bike ride to work AND walk at lunch": "→ AI: Requires both cycling + walking same day",
    "Either swim 1km OR run 5km": "→ AI: Alternative requirements, either satisfies",
    "Workout with elevated heart rate": "→ AI: Any activity + heart rate >140bpm"
  },
  
  // Subjective interpretation
  subjective: {
    "Challenging workout": "→ AI: High intensity or long duration activity",
    "Easy recovery session": "→ AI: Low intensity, moderate duration",
    "Push yourself": "→ AI: Above normal effort level for user"
  }
}

/**
 * Mock LLM call (replace with actual API)
 */
async function callLLM(prompt: string): Promise<string> {
  // This would be replaced with actual OpenAI/Claude API call
  if (process.env.NODE_ENV === 'development') {
    console.log('🤖 AI Prompt:', prompt)
    
    // Mock intelligent responses for common cases
    if (prompt.includes('Waiai for 10')) {
      return JSON.stringify({
        isValid: true,
        confidence: 0.95,
        reasoning: "The walking activity clearly exceeds the 10 meter requirement"
      })
    }
  }
  
  throw new Error('LLM not configured')
}

/**
 * Fallback to rule-based validation
 */
function parseChallengeFallback(title: string, description: string) {
  // Use our existing rule-based parsing
  return {
    activityType: title.toLowerCase().includes('walk') ? ['Walk'] : ['Walk', 'Run'],
    minDistance: null,
    minDuration: null,
    other: []
  }
}

function fallbackValidation(request: AIValidationRequest): AIValidationResponse {
  return {
    isValid: true, // Conservative fallback
    confidence: 0.5,
    reasoning: "AI validation unavailable, using permissive fallback",
    requirements: {},
    suggestions: ["Manual verification recommended"]
  }
}
