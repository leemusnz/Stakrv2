// Core data types for the entire app - Updated for Stakr Business Model
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  credits: number
  activeStakes: number
  completedChallenges: number
  successRate: number
  currentStreak: number
  longestStreak: number
  // New business model fields
  trustScore: number // 0-100
  verificationTier: "auto" | "manual" | "review"
  falseClaims: number
  premiumSubscription: boolean
  premiumExpiresAt?: string
  isAdmin?: boolean
  createdAt: string
  updatedAt: string
}

export interface ProofRequirement {
  type: "photo" | "video" | "file" | "text" | "auto_sync"
  required: boolean
  cameraOnly?: boolean
  instructions: string
  examples?: string[]
  aiVerificationEnabled?: boolean
  minimumConfidenceScore?: number
}

export interface Challenge {
  id: string
  title: string
  description: string
  longDescription?: string
  category: string
  duration: string
  difficulty: "Easy" | "Medium" | "Hard"
  participants: number
  completionRate: number
  minStake: number
  maxStake: number
  totalPot: number
  startDate?: string
  endDate?: string
  rules?: string[]
  host?: ChallengeHost
  isJoined?: boolean
  isActive?: boolean
  progress?: number
  currentDay?: number
  totalDays?: number
  deadline?: string
  proofRequirements?: ProofRequirement[]
  generalInstructions?: string
  isOverdue?: boolean
  // New business model fields
  hostContribution: number
  entryFeePercentage: number // Platform fee (5%)
  failedStakeCut: number // Platform cut of failed stakes (20%)
  status: "pending" | "active" | "completed" | "cancelled"
  verificationType: "auto" | "manual" | "ai"
  insuranceAvailable: boolean
  createdAt: string
  updatedAt: string
}

export interface ChallengeParticipant {
  id: string
  challengeId: string
  userId: string
  stakeAmount: number
  entryFeePaid: number
  insurancePurchased: boolean
  insuranceFeePaid: number
  completionStatus: "active" | "completed" | "failed" | "disputed"
  proofSubmitted: boolean
  verificationStatus: "pending" | "approved" | "rejected"
  rewardEarned: number
  joinedAt: string
  completedAt?: string
}

export interface ChallengeHost {
  id: string
  name: string
  avatar: string
  bio: string
  completedChallenges: number
  successRate: number
  verified: boolean
  // New fields for creator economy
  totalEarnings?: number
  averageRating?: number
  followerCount?: number
}

export interface ActivityItem {
  id: string
  type: "joined" | "completed" | "verified" | "milestone" | "earned" | "failed" | "insurance_claim"
  title: string
  description: string
  timestamp: string
  amount?: number
  challenge?: string
  metadata?: Record<string, any>
}

export interface Deadline {
  id: string
  challengeTitle: string
  type: "verification" | "completion" | "milestone"
  dueDate: string
  timeLeft: string
  urgency: "high" | "medium" | "low"
  participantId?: string
  challengeId: string
}

export interface StatsData {
  title: string
  value: string | number
  subtitle?: string
  icon: any // LucideIcon type
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  color?: "primary" | "secondary" | "success" | "warning"
}

export interface ProofSubmission {
  id?: string
  type: "photo" | "video" | "text" | "auto_sync"
  file?: File
  fileUrl?: string
  text?: string
  description: string
  metadata?: Record<string, any>
  aiVerificationScore?: number
  status?: "pending" | "approved" | "rejected"
  submittedAt?: string
  reviewedAt?: string
  reviewedBy?: string
  adminNotes?: string
}

// New business model types

export interface Transaction {
  id: string
  userId: string
  challengeId?: string
  transactionType: "stake_entry" | "entry_fee" | "insurance" | "reward" | "cashout" | "deposit"
  amount: number
  platformRevenue: number
  stripePaymentId?: string
  status: "pending" | "completed" | "failed"
  createdAt: string
}

export interface CreditTransaction {
  id: string
  userId: string
  amount: number // Positive for credit, negative for debit
  transactionType: string
  relatedChallengeId?: string
  relatedTransactionId?: string
  description: string
  createdAt: string
}

export interface InsuranceClaim {
  id: string
  participantId: string
  claimReason: string
  supportingEvidence: any[]
  status: "pending" | "approved" | "denied"
  reviewedBy?: string
  claimAmount: number
  processedAt?: string
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: "challenge" | "verification" | "system" | "social"
  title: string
  message: string
  actionUrl?: string
  read: boolean
  metadata?: Record<string, any>
  createdAt: string
}

export interface RevenueStats {
  entryFees: number
  failedStakeCuts: number
  premiumSubscriptions: number
  insuranceFees: number
  cashoutFees: number
  totalRevenue: number
  period: string
}

export interface ChallengeRewards {
  totalPot: number
  completers: number
  rewardPerWinner: number
  platformCut: number
  distributionBreakdown: {
    completersShare: number
    platformRevenue: number
    hostContribution: number
  }
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}

// Form validation types
export interface ChallengeCreationData {
  basicInfo: {
    title: string
    description: string
    category: string
    duration: string
    difficulty: "Easy" | "Medium" | "Hard"
  }
  staking: {
    minStake: number
    maxStake: number
    hostContribution: number
    insuranceAvailable: boolean
  }
  verification: {
    verificationType: "auto" | "manual" | "ai"
    proofRequirements: ProofRequirement[]
    generalInstructions: string
  }
  rules: string[]
  startDate: string
  endDate: string
}

// Environment types
export interface AppConfig {
  apiUrl: string
  stripePublishableKey: string
  neonConnectionString: string
  awsBucketName: string
  awsRegion: string
  environment: "development" | "staging" | "production"
}

// Premium subscription benefits (EXPANDED FAIR MODEL - high value, no competitive advantages)
export interface PremiumBenefits {
  // 🎨 COSMETIC & PERSONALIZATION
  customBadges: string[]
  profileThemes: string[]
  celebrationEffects: string[]
  customProfileBanners: boolean
  animatedAvatars: boolean
  premiumEmojis: boolean
  
  // 📊 ANALYTICS & INSIGHTS (personal only)  
  detailedStats: boolean
  progressCharts: boolean
  streakInsights: boolean
  habitAnalytics: boolean
  performancePredictions: boolean
  customDashboards: boolean
  
  // 🎁 CUSTOM HOST REWARDS (the key new feature!)
  customHostRewards: {
    eligible: boolean // Can receive custom rewards from hosts
    types: string[] // e.g., ["digital_content", "recognition", "merchandise", "experiences"]
    maxValue: number // Optional cap to prevent abuse
  }
  
  // 🌟 ENHANCED SOCIAL FEATURES
  premiumCommunity: {
    access: boolean
    exclusiveChannels: string[]
    mentorshipProgram: boolean
    networkingEvents: boolean
  }
  
  // ⚡ PRIORITY ACCESS (not exclusive)
  priorityAccess: {
    challengeEarlyAccess: boolean // 24h early access to new challenges
    popularChallengeSpots: boolean // Priority queue for full challenges
    featurePreview: boolean // Beta features
    premiumSupport: boolean // Faster response times
  }
  
  // 🎓 EDUCATIONAL & TOOLS
  educationalContent: {
    challengeGuides: boolean
    motivationalContent: boolean
    expertTips: boolean
    habitScienceContent: boolean
    personalizedRecommendations: boolean
  }
  
  // 🔧 ADVANCED TOOLS
  advancedTools: {
    habitTracker: boolean
    goalPlanner: boolean
    streakRecovery: boolean // Mercy rule for technical issues
    customReminders: boolean
    advancedFilters: boolean
  }
  
  // 🏆 RECOGNITION & STATUS
  recognition: {
    premiumBadge: boolean
    leaderboardHighlights: boolean
    successStoryFeatures: boolean
    communitySpotlights: boolean
  }
  
  // 💝 EXCLUSIVE CONTENT
  exclusiveContent: {
    premiumChallenges: boolean // Special themed challenges
    guestExpertSessions: boolean
    monthlyRewards: boolean // Non-monetary recognition
    anniversaryRewards: boolean
  }
  
  // 🔒 STILL NO COMPETITIVE ADVANTAGES:
  // ❌ NO verification advantages
  // ❌ NO fee reductions  
  // ❌ NO higher stake limits
  // ❌ NO dispute resolution benefits
  // ❌ NO trust score bonuses
  // ❌ NO financial advantages in core game mechanics
}

// Host Custom Rewards System
export interface HostCustomReward {
  id: string
  challengeId: string
  hostId: string
  rewardType: "digital_content" | "recognition" | "merchandise" | "experience" | "custom"
  title: string
  description: string
  value?: string // Descriptive value, not monetary
  eligibilityRequirements: {
    premiumOnly: boolean
    minimumTrustScore?: number
    completionRequirement: "all" | "partial" | "custom"
  }
  deliveryMethod: "automatic" | "manual" | "email" | "platform"
  maxRecipients?: number // Optional limit
  createdAt: string
  isActive: boolean
}

// Premium Challenge Features
export interface PremiumChallengeFeatures {
  // Additional features hosts can enable for premium participants
  enhancedCommunication: boolean // Direct messaging with host
  progressInsights: boolean // Detailed progress analytics
  customMilestones: boolean // Host-defined milestone rewards
  prioritySupport: boolean // Faster help from host
  exclusiveUpdates: boolean // Special progress updates
  customCelebrations: boolean // Personalized completion celebrations
}
