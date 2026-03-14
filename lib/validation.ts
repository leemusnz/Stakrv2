// Validation utilities for Stakr using Zod
import { z } from 'zod'
import type { ChallengeCreationData } from './types'
import { constants } from './config'

// Base validation schemas
export const emailSchema = z.string().email('Please enter a valid email address')

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')

export const stakeAmountSchema = z
  .number()
  .min(constants.MIN_STAKE_AMOUNT, `Minimum stake is $${constants.MIN_STAKE_AMOUNT}`)
  .max(constants.MAX_STAKE_AMOUNT, `Maximum stake is $${constants.MAX_STAKE_AMOUNT}`)

export const trustScoreSchema = z
  .number()
  .min(constants.MIN_TRUST_SCORE)
  .max(constants.MAX_TRUST_SCORE)

// User schemas
export const userRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions')
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export const userProfileUpdateSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  username: z.string().min(3).max(50).optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  avatar: z.string().url('Please enter a valid URL').optional(),
})

// Challenge schemas
export const challengeBasicInfoSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(500, 'Description must be less than 500 characters'),
  category: z.string().min(1, 'Please select a category'),
  duration: z.string().min(1, 'Please select a duration'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard'], {
    errorMap: () => ({ message: 'Please select a difficulty level' })
  })
})

export const challengeStakingSchema = z.object({
  minStake: stakeAmountSchema,
  maxStake: stakeAmountSchema,
  hostContribution: z.number().min(0, 'Host contribution cannot be negative'),
  insuranceAvailable: z.boolean()
}).refine(data => data.maxStake >= data.minStake, {
  message: "Maximum stake must be greater than or equal to minimum stake",
  path: ["maxStake"]
})

export const challengeVerificationSchema = z.object({
  verificationType: z.enum(['auto', 'manual', 'ai']),
  proofRequirements: z.array(z.object({
    type: z.enum(['photo', 'video', 'file', 'text', 'auto_sync']),
    required: z.boolean(),
    instructions: z.string().min(10, 'Instructions must be at least 10 characters'),
    examples: z.array(z.string()).optional(),
    aiVerificationEnabled: z.boolean().optional(),
    minimumConfidenceScore: z.number().min(0).max(100).optional()
  })).min(1, 'At least one proof requirement is needed'),
  generalInstructions: z.string().min(20, 'General instructions must be at least 20 characters')
})

export const challengeCreationSchema = z.object({
  basicInfo: challengeBasicInfoSchema,
  staking: challengeStakingSchema,
  verification: challengeVerificationSchema,
  rules: z.array(z.string().min(5, 'Each rule must be at least 5 characters')).min(1, 'At least one rule is required'),
  startDate: z.string().refine(date => new Date(date) > new Date(), {
    message: 'Start date must be in the future'
  }),
  endDate: z.string()
}).refine(data => new Date(data.endDate) > new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate']
})

// Challenge join schema
export const challengeJoinSchema = z.object({
  stakeAmount: z.number().positive('Stake amount must be positive').optional(),
  insurancePurchased: z.boolean().default(false),
  referralCode: z.string().optional(),
  teamPreference: z.string().optional(),
  pointsOnly: z.boolean().default(false)
})

// Payment schemas
export const checkoutSessionSchema = z.object({
  challengeId: z.string().min(1, 'Challenge ID is required'),
  stakeAmount: z.number().positive('Stake amount must be positive')
})

export const creditPurchaseSchema = z.object({
  amount: z.number().min(10, 'Minimum purchase is $10').max(10000, 'Maximum purchase is $10,000'),
  paymentMethodId: z.string().min(1, 'Please select a payment method')
})

export const withdrawalSchema = z.object({
  amount: z.number().min(10, 'Minimum withdrawal is $10'),
  withdrawalMethodId: z.string().min(1, 'Please select a withdrawal method')
})

// Proof submission schemas
export const proofSubmissionSchema = z.object({
  type: z.enum(['photo', 'video', 'text', 'auto_sync']),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description must be less than 500 characters'),
  file: z.instanceof(File).optional(),
  text: z.string().optional(),
  metadata: z.record(z.any()).optional()
}).refine(data => {
  if (data.type === 'text' && !data.text) {
    return false
  }
  if ((data.type === 'photo' || data.type === 'video') && !data.file) {
    return false
  }
  return true
}, {
  message: 'Please provide the required proof data',
  path: ['file']
})

// Enhanced proof submission validation with anti-fraud measures
export const enhancedProofSubmissionSchema = z.object({
  type: z.enum(['photo', 'video', 'text', 'auto_sync']),
  description: z.string().min(20, 'Description must be at least 20 characters').max(500, 'Description must be less than 500 characters'),
  file: z.instanceof(File).optional(),
  text: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  // New anti-fraud fields
  deviceFingerprint: z.string().optional(),
  gpsCoordinates: z.tuple([z.number(), z.number()]).optional(),
  captureTimestamp: z.string().datetime().optional(),
  cameraUsed: z.boolean().default(false), // True if camera was used vs file upload
}).refine(data => {
  if (data.type === 'text' && !data.text) {
    return false
  }
  if ((data.type === 'photo' || data.type === 'video') && !data.file) {
    return false
  }
  // Require camera usage for higher trust verification
  if (data.type === 'photo' && data.cameraUsed === false) {
    return false // Force camera usage to prevent stock photos
  }
  return true
}, {
  message: 'Please use camera to capture live proof',
  path: ['cameraUsed']
})

// Insurance claim schemas
export const insuranceClaimSchema = z.object({
  participantId: z.string().uuid('Invalid participant ID'),
  claimReason: z.string().min(20, 'Claim reason must be at least 20 characters').max(1000, 'Claim reason must be less than 1000 characters'),
  supportingEvidence: z.array(z.any()).optional()
})

// Upload presigned URL schema
export const uploadPresignedUrlSchema = z.object({
  fileName: z.string().min(1, 'File name is required').max(255, 'File name is too long'),
  fileType: z.string().min(1, 'File type is required'),
  fileSize: z.number().positive('File size must be positive').max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  challengeId: z.string().min(1, 'Challenge ID is required')
})

// Social follow schema
export const socialFollowSchema = z.object({
  targetUserId: z.string().min(1, 'Target user ID is required'),
  action: z.enum(['follow', 'unfollow'], {
    errorMap: () => ({ message: 'Action must be "follow" or "unfollow"' })
  })
})

// Admin schemas
export const adminUserUpdateSchema = z.object({
  trustScore: trustScoreSchema.optional(),
  verificationTier: z.enum(['auto', 'manual', 'review']).optional(),
  premiumSubscription: z.boolean().optional(),
  isAdmin: z.boolean().optional()
})

// File validation
export const validateFileSize = (file: File, maxSizeMB: number = constants.MAX_FILE_SIZE_MB): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024
}

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type)
}

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  if (!validateFileType(file, constants.ALLOWED_IMAGE_TYPES)) {
    return { valid: false, error: 'Invalid image format. Please use JPEG, PNG, or WebP.' }
  }
  if (!validateFileSize(file)) {
    return { valid: false, error: `Image must be smaller than ${constants.MAX_FILE_SIZE_MB}MB` }
  }
  return { valid: true }
}

export const validateVideoFile = (file: File): { valid: boolean; error?: string } => {
  if (!validateFileType(file, constants.ALLOWED_VIDEO_TYPES)) {
    return { valid: false, error: 'Invalid video format. Please use MP4, QuickTime, or WebM.' }
  }
  if (!validateFileSize(file)) {
    return { valid: false, error: `Video must be smaller than ${constants.MAX_FILE_SIZE_MB}MB` }
  }
  return { valid: true }
}

// File security validation
export const validateFileForFraud = (file: File): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  // Size limits to prevent expensive processing
  if (file.size > 10 * 1024 * 1024) { // 10MB max, reduced from 50MB
    errors.push('File size too large (max 10MB)')
  }
  
  // Strict type checking
  const allowedTypes = ['image/jpeg', 'image/png'] // Removed webp due to AI generation concerns
  if (!allowedTypes.includes(file.type)) {
    errors.push('Only JPEG and PNG images allowed')
  }
  
  // File name pattern analysis
  if (file.name.match(/^(stock|shutterstock|getty|adobe|istockphoto|unsplash|pexels)/i)) {
    errors.push('Stock photo names not allowed')
  }
  
  // Suspicious file names
  if (file.name.match(/(fake|test|sample|demo|generated|ai_?generated)/i)) {
    errors.push('Suspicious file name detected')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Business logic validation
export const validateChallengeJoin = (
  userCredits: number,
  stakeAmount: number,
  insurancePurchased: boolean = false
): { valid: boolean; error?: string } => {
  const entryFee = stakeAmount * (constants.PLATFORM_ENTRY_FEE_PERCENTAGE / 100)
  const insuranceFee = insurancePurchased ? constants.INSURANCE_FEE : 0
  const totalCost = stakeAmount + entryFee + insuranceFee

  if (userCredits < totalCost) {
    return { 
      valid: false, 
      error: `Insufficient credits. You need $${totalCost.toFixed(2)} but have $${userCredits.toFixed(2)}` 
    }
  }

  return { valid: true }
}

// Enhanced trust score validation with fraud detection
export const validateTrustScoreForVerificationEnhanced = (
  trustScore: number,
  verificationType: 'auto' | 'manual' | 'review',
  falseClaims: number = 0,
  accountAge: number = 0 // days since account creation
): { valid: boolean; error?: string; requiredReview?: boolean } => {
  
  // Account age requirements
  if (accountAge < 7) {
    return { 
      valid: false, 
      error: 'Account must be at least 7 days old for verification',
      requiredReview: true
    }
  }
  
  // False claims penalty
  if (falseClaims >= 3) {
    return { 
      valid: false, 
      error: 'Too many false claims - account under review',
      requiredReview: true
    }
  }
  
  // Stricter thresholds
  const AUTO_THRESHOLD = 90 // Increased from 80
  const MANUAL_THRESHOLD = 70 // Increased from 60
  
  if (verificationType === 'auto' && trustScore < AUTO_THRESHOLD) {
    return { 
      valid: false, 
      error: `Auto verification requires a trust score of ${AUTO_THRESHOLD} or higher. Your score: ${trustScore}`
    }
  }

  if (verificationType === 'manual' && trustScore < MANUAL_THRESHOLD) {
    return { 
      valid: false, 
      error: `Manual verification requires a trust score of ${MANUAL_THRESHOLD} or higher. Your score: ${trustScore}`
    }
  }

  return { valid: true }
}

// Helper function to format validation errors
export const formatValidationErrors = (error: z.ZodError): Record<string, string> => {
  const formattedErrors: Record<string, string> = {}
  
  error.errors.forEach((err: unknown) => {
    const path = (err as any).path.join('.')
    formattedErrors[path] = (err as any).message
  })
  
  return formattedErrors
}

// Type exports for form validation
export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>
export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>
export type ChallengeCreationInput = z.infer<typeof challengeCreationSchema>
export type ChallengeJoinInput = z.infer<typeof challengeJoinSchema>
export type CheckoutSessionInput = z.infer<typeof checkoutSessionSchema>
export type CreditPurchaseInput = z.infer<typeof creditPurchaseSchema>
export type WithdrawalInput = z.infer<typeof withdrawalSchema>
export type ProofSubmissionInput = z.infer<typeof proofSubmissionSchema>
export type InsuranceClaimInput = z.infer<typeof insuranceClaimSchema>
export type UploadPresignedUrlInput = z.infer<typeof uploadPresignedUrlSchema>
export type SocialFollowInput = z.infer<typeof socialFollowSchema>

// Keep original function for backward compatibility
export const validateTrustScoreForVerification = (
  trustScore: number,
  verificationType: 'auto' | 'manual' | 'review'
): { valid: boolean; error?: string } => {
  if (verificationType === 'auto' && trustScore < constants.AUTO_VERIFICATION_THRESHOLD) {
    return { 
      valid: false, 
      error: `Auto verification requires a trust score of ${constants.AUTO_VERIFICATION_THRESHOLD} or higher. Your score: ${trustScore}` 
    }
  }

  if (verificationType === 'manual' && trustScore < constants.MANUAL_VERIFICATION_THRESHOLD) {
    return { 
      valid: false, 
      error: `Manual verification requires a trust score of ${constants.MANUAL_VERIFICATION_THRESHOLD} or higher. Your score: ${trustScore}` 
    }
  }

  return { valid: true }
}

// Premium Features Validation Schemas

// Host custom reward validation
export const hostCustomRewardSchema = z.object({
  challengeId: z.string().uuid('Invalid challenge ID'),
  rewardType: z.enum(['digital_content', 'recognition', 'merchandise', 'experience', 'custom']),
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(500, 'Description must be less than 500 characters'),
  value: z.string().max(200, 'Value description must be less than 200 characters').optional(),
  eligibilityRequirements: z.object({
    premiumOnly: z.boolean(),
    minimumTrustScore: z.number().min(0).max(100).optional(),
    completionRequirement: z.enum(['all', 'partial', 'custom'])
  }),
  deliveryMethod: z.enum(['automatic', 'manual', 'email', 'platform']),
  maxRecipients: z.number().min(1).max(1000).optional()
})

// Premium challenge features validation
export const premiumChallengeFeaturesSchema = z.object({
  enhancedCommunication: z.boolean().optional(),
  progressInsights: z.boolean().optional(),
  customMilestones: z.boolean().optional(),
  prioritySupport: z.boolean().optional(),
  exclusiveUpdates: z.boolean().optional(),
  customCelebrations: z.boolean().optional()
})

// Premium community channel validation
export const premiumCommunityChannelSchema = z.object({
  name: z.string().min(3, 'Channel name must be at least 3 characters').max(50, 'Channel name must be less than 50 characters'),
  description: z.string().max(200, 'Description must be less than 200 characters').optional(),
  channelType: z.enum(['general', 'mentorship', 'networking', 'exclusive'])
})

// Business rule validation for premium features
export const validatePremiumRewardEligibility = (
  userPremium: boolean,
  userTrustScore: number,
  rewardRequirements: {
    premiumOnly: boolean
    minimumTrustScore?: number
  }
): { eligible: boolean; reason?: string } => {
  
  if (rewardRequirements.premiumOnly && !userPremium) {
    return { 
      eligible: false, 
      reason: 'This reward is only available to premium subscribers' 
    }
  }
  
  if (rewardRequirements.minimumTrustScore && userTrustScore < rewardRequirements.minimumTrustScore) {
    return { 
      eligible: false, 
      reason: `This reward requires a trust score of ${rewardRequirements.minimumTrustScore} or higher. Your score: ${userTrustScore}` 
    }
  }
  
  return { eligible: true }
}

// Validate premium feature limits (prevent abuse)
export const validatePremiumFeatureLimits = (
  userId: string,
  featureType: 'custom_reward' | 'premium_challenge' | 'community_channel'
): { withinLimits: boolean; reason?: string } => {
  
  // Example limits (would be dynamic based on user history)
  const limits = {
    custom_reward: { daily: 3, monthly: 20 },
    premium_challenge: { daily: 5, monthly: 50 },
    community_channel: { daily: 10, monthly: 100 }
  }
  
  // In real implementation, check against database usage
  // For now, assume within limits
  return { withinLimits: true }
}

// Anti-abuse validation for premium features
export const validatePremiumFeatureAntiabus = (
  hostId: string,
  rewardData: any
): { valid: boolean; warnings: string[] } => {
  const warnings: string[] = []
  
  // Check for suspicious patterns
  if (rewardData.maxRecipients && rewardData.maxRecipients > 100) {
    warnings.push('High recipient count may indicate spam')
  }
  
  if (rewardData.title.match(/(money|cash|bitcoin|crypto|investment)/i)) {
    warnings.push('Monetary rewards are not allowed')
  }
  
  if (rewardData.description.length < 20) {
    warnings.push('Reward description should be more detailed')
  }
  
  return {
    valid: warnings.length === 0,
    warnings
  }
}
