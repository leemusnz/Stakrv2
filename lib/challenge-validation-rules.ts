/**
 * Smart challenge validation rules for auto-sync
 * Interprets challenge requirements and validates activities
 */

export interface ValidationRule {
  activityTypes: string[]
  minDistance?: number // meters
  maxDistance?: number // meters  
  minDuration?: number // minutes
  maxDuration?: number // minutes
  sportSpecific?: any
}

/**
 * Parses challenge text to extract validation requirements
 */
export function parseChallenge(title: string, description: string): ValidationRule {
  const text = `${title} ${description}`.toLowerCase()
  
  // Default rule
  const rule: ValidationRule = {
    activityTypes: ['Walk', 'Run', 'Hike']
  }
  
  // Distance parsing
  const distancePatterns = [
    /(\d+)\s*m(?:eter)?s?\b/,     // "10m", "10 meters"
    /(\d+)\s*km\b/,               // "5km", "5 km" 
    /(\d+)\s*mile?s?\b/           // "3 miles"
  ]
  
  for (const pattern of distancePatterns) {
    const match = text.match(pattern)
    if (match) {
      const value = parseInt(match[1])
      if (text.includes('km')) {
        rule.minDistance = value * 1000 // km to meters
      } else if (text.includes('mile')) {
        rule.minDistance = value * 1609 // miles to meters
      } else {
        rule.minDistance = value // already meters
      }
      break
    }
  }
  
  // Duration parsing
  const durationPatterns = [
    /(\d+)\s*min(?:ute)?s?\b/,    // "30 minutes", "30min"
    /(\d+)\s*hour?s?\b/           // "1 hour", "2 hours"
  ]
  
  for (const pattern of durationPatterns) {
    const match = text.match(pattern)
    if (match) {
      const value = parseInt(match[1])
      rule.minDuration = text.includes('hour') ? value * 60 : value
      break
    }
  }
  
  // Activity type detection
  if (text.includes('walk')) {
    rule.activityTypes = ['Walk']
  } else if (text.includes('run')) {
    rule.activityTypes = ['Run']
  } else if (text.includes('cycle') || text.includes('bike')) {
    rule.activityTypes = ['Ride']
  } else if (text.includes('swim')) {
    rule.activityTypes = ['Swim']
  } else if (text.includes('fitness') || text.includes('workout')) {
    rule.activityTypes = ['Walk', 'Run', 'Ride', 'Workout']
  }
  
  return rule
}

/**
 * Validates if a Strava activity meets challenge requirements
 */
export function validateActivity(activity: any, rule: ValidationRule): {
  valid: boolean
  reasons: string[]
  metadata: any
} {
  const reasons: string[] = []
  let valid = true
  
  const activityType = activity.type
  const distance = activity.distance // meters
  const duration = activity.moving_time / 60 // minutes
  
  // Check activity type
  if (!rule.activityTypes.includes(activityType)) {
    valid = false
    reasons.push(`Activity type '${activityType}' not allowed. Need: ${rule.activityTypes.join(', ')}`)
  }
  
  // Check distance requirements
  if (rule.minDistance && distance < rule.minDistance) {
    valid = false
    reasons.push(`Distance ${distance}m < required ${rule.minDistance}m`)
  }
  
  if (rule.maxDistance && distance > rule.maxDistance) {
    valid = false  
    reasons.push(`Distance ${distance}m > maximum ${rule.maxDistance}m`)
  }
  
  // Check duration requirements
  if (rule.minDuration && duration < rule.minDuration) {
    valid = false
    reasons.push(`Duration ${duration.toFixed(1)}min < required ${rule.minDuration}min`)
  }
  
  if (rule.maxDuration && duration > rule.maxDuration) {
    valid = false
    reasons.push(`Duration ${duration.toFixed(1)}min > maximum ${rule.maxDuration}min`)
  }
  
  return {
    valid,
    reasons,
    metadata: {
      rule,
      activity: {
        type: activityType,
        distance,
        duration,
        date: activity.start_date
      }
    }
  }
}

/**
 * Test the parsing with example challenges
 */
export function testChallengeRules() {
  const examples = [
    "Waiai for 10", // Should require 10m walking
    "Walk 5km a day for 30 days", // Should require 5km walking  
    "Run 10k in under 60 minutes", // Should require 10km run in <60min
    "Cycle 20 miles", // Should require 20 mile cycling
    "30 minute workout daily" // Should require 30min any fitness activity
  ]
  
  examples.forEach(title => {
    const rule = parseChallenge(title, "")
    console.log(`"${title}" →`, rule)
  })
}


