// Environment configuration for Stakr
import type { AppConfig } from './types'

// Default configuration
const defaultConfig: AppConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  neonConnectionString: process.env.DATABASE_URL || '',
  awsBucketName: process.env.AWS_BUCKET_NAME || 'stakr-uploads',
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development'
}

// Environment-specific overrides
const environmentConfigs = {
  development: {
    apiUrl: 'http://localhost:3000/api',
  },
  staging: {
    apiUrl: 'https://staging-api.stakr.app',
  },
  production: {
    apiUrl: 'https://api.stakr.app',
  }
}

// Merge configuration
export const config: AppConfig = {
  ...defaultConfig,
  ...environmentConfigs[defaultConfig.environment]
}

// Feature flags
export const featureFlags = {
  enableAIVerification: process.env.NEXT_PUBLIC_ENABLE_AI_VERIFICATION === 'true',
  enableRealPayments: process.env.NEXT_PUBLIC_ENABLE_REAL_PAYMENTS === 'true',
  enablePushNotifications: process.env.NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === 'true',
  enableMockData: process.env.NODE_ENV === 'development',
}

// Validation helper
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!config.apiUrl) {
    errors.push('NEXT_PUBLIC_API_URL is required')
  }
  
  if (featureFlags.enableRealPayments && !config.stripePublishableKey) {
    errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required when real payments are enabled')
  }
  
  if (config.environment === 'production' && !config.neonConnectionString) {
    errors.push('DATABASE_URL is required in production')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Constants
export const constants = {
  // Business model constants
  PLATFORM_ENTRY_FEE_PERCENTAGE: 5, // 5%
  PLATFORM_FAILED_STAKE_CUT: 20, // 20%
  INSURANCE_FEE: 1.00, // $1.00
  CASHOUT_FEE_PERCENTAGE: 3, // 3%
  PREMIUM_SUBSCRIPTION_PRICE: 9.99, // $9.99/month
  
  // Trust score constants
  INITIAL_TRUST_SCORE: 50,
  MAX_TRUST_SCORE: 100,
  MIN_TRUST_SCORE: 0,
  TRUST_SCORE_COMPLETION_BONUS: 2,
  TRUST_SCORE_FAILURE_PENALTY: 1,
  
  // Verification tiers
  AUTO_VERIFICATION_THRESHOLD: 80,
  MANUAL_VERIFICATION_THRESHOLD: 60,
  
  // Limits
  MIN_STAKE_AMOUNT: 10,
  MAX_STAKE_AMOUNT: 1000,
  MAX_CHALLENGE_DURATION_DAYS: 365,
  MIN_CHALLENGE_DURATION_DAYS: 1,
  
  // ANTI-FRAUD LIMITS (New)
  DAILY_CHALLENGE_JOIN_LIMIT: 5,
  MONTHLY_CHALLENGE_JOIN_LIMIT: 50,
  MAX_CONCURRENT_CHALLENGES: 10,
  MIN_ACCOUNT_AGE_FOR_VERIFICATION: 7, // days
  MIN_ACCOUNT_AGE_FOR_CHALLENGE_CREATION: 14, // days
  MIN_TRUST_SCORE_FOR_CHALLENGE_CREATION: 70,
  
  // Enhanced verification thresholds (stricter)
  AUTO_VERIFICATION_THRESHOLD_ENHANCED: 95, // was 80
  MANUAL_VERIFICATION_THRESHOLD_ENHANCED: 85, // was 60
  REVIEW_VERIFICATION_THRESHOLD: 60,
  
  // Trust score anti-gaming
  MAX_TRUST_SCORE_GAIN_PER_DAY: 10,
  RAPID_COMPLETION_PENALTY_THRESHOLD: 3, // challenges per 24h
  FALSE_CLAIM_TRUST_PENALTY: 5,
  FALSE_CLAIM_AUTO_REVIEW_THRESHOLD: 3,
  
  // File security (enhanced)
  MAX_FILE_SIZE_MB_SECURE: 10, // Reduced from 50MB
  ALLOWED_SECURE_IMAGE_TYPES: ['image/jpeg', 'image/png'], // Removed WebP
  SUSPICIOUS_FILENAME_PATTERNS: [
    /^(stock|shutterstock|getty|adobe|istockphoto|unsplash|pexels)/i,
    /(fake|test|sample|demo|generated|ai_?generated)/i
  ],
  
  // Economic safeguards
  MAX_INSURANCE_CLAIMS_PER_MONTH: 2,
  INSURANCE_CLAIM_REVIEW_THRESHOLD: 1, // Auto-review after 1 claim
  MIN_CHALLENGE_PARTICIPANTS_FOR_REWARDS: 3, // Prevent solo gaming
  
  // PREMIUM FEATURES (New)
  PREMIUM_EARLY_ACCESS_HOURS: 24, // 24h early access to challenges
  
  // Premium feature limits (anti-spam)
  MAX_CUSTOM_REWARDS_PER_CHALLENGE: 5,
  MAX_CUSTOM_REWARDS_PER_DAY: 3,
  MAX_CUSTOM_REWARDS_PER_MONTH: 20,
  MAX_PREMIUM_COMMUNITY_JOINS_PER_DAY: 10,
  MAX_PREMIUM_CHALLENGE_FEATURES_PER_DAY: 5,
  
  // Custom reward limits
  MAX_CUSTOM_REWARD_RECIPIENTS: 100,
  MIN_CUSTOM_REWARD_DESCRIPTION_LENGTH: 20,
  MAX_CUSTOM_REWARD_DESCRIPTION_LENGTH: 500,
  
  // Premium community limits
  MAX_PREMIUM_CHANNELS_PER_USER: 20,
  MAX_PREMIUM_CHANNEL_NAME_LENGTH: 50,
  
  // File upload limits
  MAX_FILE_SIZE_MB: 50,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime', 'video/webm'],
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
}

// API endpoints
export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
  },
  user: {
    profile: '/user/profile',
    credits: '/user/credits',
    trustScore: '/user/trust-score',
  },
  challenges: {
    list: '/challenges',
    create: '/challenges',
    join: (id: string) => `/challenges/${id}/join`,
    verify: (id: string) => `/challenges/${id}/verify`,
    rewards: (id: string) => `/challenges/${id}/rewards`,
  },
  payments: {
    purchaseCredits: '/payments/purchase-credits',
    withdraw: '/payments/withdraw',
    webhook: '/payments/webhook',
  },
  admin: {
    stats: '/admin/stats',
    users: '/admin/users',
    challenges: '/admin/challenges',
    revenue: '/admin/revenue',
  },
  premium: {
    // Custom rewards
    createCustomReward: (challengeId: string) => `/challenges/${challengeId}/custom-rewards`,
    getCustomRewards: (challengeId: string) => `/challenges/${challengeId}/custom-rewards`,
    
    // Community features
    communityChannels: '/premium/community/channels',
    joinChannel: (channelId: string) => `/premium/community/channels/${channelId}/join`,
    
    // Challenge features
    challengeFeatures: (challengeId: string) => `/challenges/${challengeId}/premium-features`,
    
    // Analytics and insights
    analytics: '/premium/analytics',
    rewardsHistory: '/premium/rewards/history',
    
    // Subscription management
    subscribe: '/premium/subscribe',
    cancelSubscription: '/premium/cancel',
    billingHistory: '/premium/billing',
  }
}

// Error messages
export const errorMessages = {
  INSUFFICIENT_CREDITS: 'Insufficient credits to join this challenge',
  CHALLENGE_FULL: 'This challenge is full',
  CHALLENGE_EXPIRED: 'This challenge has expired',
  INVALID_PROOF: 'Invalid proof submission',
  VERIFICATION_FAILED: 'Proof verification failed',
  PAYMENT_FAILED: 'Payment processing failed',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  NETWORK_ERROR: 'Network error. Please try again.',
  VALIDATION_ERROR: 'Please check your input and try again',
}

// Success messages
export const successMessages = {
  CHALLENGE_JOINED: 'Successfully joined challenge!',
  PROOF_SUBMITTED: 'Proof submitted successfully!',
  CREDITS_PURCHASED: 'Credits purchased successfully!',
  WITHDRAWAL_INITIATED: 'Withdrawal request initiated!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  CHALLENGE_CREATED: 'Challenge created successfully!',
}
