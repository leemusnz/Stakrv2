/**
 * Utility functions for challenge-related logic
 */

export interface Challenge {
  id: string
  title: string
  verificationType?: 'auto' | 'manual' | 'ai'
  proofRequirements?: Array<{
    type: 'photo' | 'video' | 'file' | 'text' | 'auto_sync' | 'wearable' | 'fitness_apps' | 'learning_apps'
    required: boolean
    instructions?: string
  }>
  selectedProofTypes?: string[]
  proof_types?: string[]
  verificationRequirements?: {
    types: string[]
    [key: string]: any
  }
}

/**
 * Determines if a challenge uses automatic verification (apps/wearables)
 * vs manual proof submission (photos, videos, etc.)
 */
export function usesAutomaticVerification(challenge: Challenge): boolean {
  // Check verificationType first
  if (challenge.verificationType === 'auto') {
    return true
  }
  
  // Check if verificationType itself is an automatic type
  const automaticVerificationTypes = ['fitness_apps', 'wearable', 'learning_apps', 'auto_sync', 'strava', 'fitbit', 'spotify']
  if (challenge.verificationType && automaticVerificationTypes.includes(challenge.verificationType)) {
    return true
  }
  
  // Check proof requirements for automatic types
  if (challenge.proofRequirements?.length) {
    const automaticTypes = ['auto_sync', 'wearable', 'fitness_apps', 'learning_apps', 'strava', 'fitbit', 'spotify']
    return challenge.proofRequirements.some(req => 
      automaticTypes.includes(req.type)
    )
  }
  
  // Check selectedProofTypes (used in creation flow)
  if (challenge.selectedProofTypes?.length) {
    const automaticTypes = ['wearable', 'fitness_apps', 'learning_apps', 'auto_sync', 'strava', 'fitbit', 'spotify']
    return challenge.selectedProofTypes.some(type => 
      automaticTypes.includes(type)
    )
  }
  
  // Check proof_types (API response format)
  if (challenge.proof_types?.length) {
    const automaticTypes = ['wearable', 'fitness_apps', 'learning_apps', 'auto_sync', 'strava', 'fitbit', 'spotify']
    return challenge.proof_types.some(type => 
      automaticTypes.includes(type)
    )
  }
  
  // Check verificationRequirements types array (database format)
  if (challenge.verificationRequirements?.types?.length) {
    const automaticTypes = ['wearable', 'fitness_apps', 'learning_apps', 'auto_sync', 'strava', 'fitbit', 'spotify']
    return challenge.verificationRequirements.types.some((type: string) => 
      automaticTypes.includes(type)
    )
  }
  
  return false
}

/**
 * Determines if a challenge uses manual verification (photos, videos, etc.)
 */
export function usesManualVerification(challenge: Challenge): boolean {
  // Check verificationType first
  if (challenge.verificationType === 'manual') {
    return true
  }
  
  // Check proof requirements for manual types
  if (challenge.proofRequirements?.length) {
    const manualTypes = ['photo', 'video', 'file', 'text']
    return challenge.proofRequirements.some(req => 
      manualTypes.includes(req.type)
    )
  }
  
  // Check selectedProofTypes (used in creation flow)
  if (challenge.selectedProofTypes?.length) {
    const manualTypes = ['photo', 'video', 'file', 'text']
    return challenge.selectedProofTypes.some(type => 
      manualTypes.includes(type)
    )
  }
  
  // Check proof_types (API response format)
  if (challenge.proof_types?.length) {
    const manualTypes = ['photo', 'video', 'file', 'text']
    return challenge.proof_types.some(type => 
      manualTypes.includes(type)
    )
  }
  
  return false
}

/**
 * Gets the appropriate action text for a challenge based on verification type
 */
export function getChallengeActionText(challenge: Challenge, completed: boolean = false): {
  action: string
  icon: 'camera' | 'sync' | 'eye'
} {
  if (completed) {
    return {
      action: usesAutomaticVerification(challenge) ? 'View Sync Status' : 'View Submission',
      icon: 'eye'
    }
  }
  
  if (usesAutomaticVerification(challenge)) {
    return {
      action: 'Synchronize Data',
      icon: 'sync'
    }
  }
  
  return {
    action: 'Submit Proof',
    icon: 'camera'
  }
}

/**
 * Gets the verification type display name
 */
export function getVerificationTypeDisplay(challenge: Challenge): string {
  if (usesAutomaticVerification(challenge)) {
    return 'Automatic Sync'
  }
  
  if (challenge.verificationType === 'ai') {
    return 'AI Verification'
  }
  
  return 'Manual Submission'
}

/**
 * Gets the integrated apps/wearables for a challenge
 */
export function getIntegratedServices(challenge: Challenge): string[] {
  const services: string[] = []
  
  const allProofTypes = [
    ...(challenge.proofRequirements?.map(req => req.type) || []),
    ...(challenge.selectedProofTypes || []),
    ...(challenge.proof_types || [])
  ]
  
  if (allProofTypes.includes('wearable')) {
    services.push('Apple Watch', 'Fitbit', 'Garmin', 'Strava')
  }
  
  if (allProofTypes.includes('fitness_apps')) {
    services.push('MyFitnessPal', 'Strava', 'Nike Run Club')
  }
  
  if (allProofTypes.includes('learning_apps')) {
    services.push('Duolingo', 'Khan Academy', 'Coursera')
  }
  
  return [...new Set(services)] // Remove duplicates
}
