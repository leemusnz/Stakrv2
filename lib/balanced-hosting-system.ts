// Balanced Hosting System - Implements all strategic balance measures
import { constants } from './constants'

export interface HostBalance {
  financial: HostFinancialIncentives
  social: HostSocialIncentives
  limits: HostingLimits
  quality: QualityGates
  ratings: HostRatingSystem
}

// 1. MIRROR REWARDS - Hosts only win if they complete
export interface HostFinancialIncentives {
  // Always earned (regardless of completion)
  revenueShare: {
    percentage: number // 30% of platform revenue
    immediate: number   // 25% paid immediately
    vested: number      // 75% vested over 90 days
  }
  
  // Only earned if HOST completes their own challenge
  conditional: {
    contributionReturn: {
      threshold: number // 50% challenge success rate
      amount: number    // Full contribution back
      requiresHostCompletion: boolean // TRUE - key balance
    }
    successBonus: {
      threshold: number // 80% challenge success rate
      percentage: number // 20% bonus
      requiresHostCompletion: boolean // TRUE - key balance
    }
    participantWinnings: {
      stakeReturn: number
      winnings: number
      requiresHostCompletion: boolean // TRUE - prevents gaming
    }
  }
}

// 2. NON-FINANCIAL & DEFERRED INCENTIVES
export interface HostSocialIncentives {
  immediate: {
    xpMultiplier: number    // 2x XP boost
    trustBonus: number      // +5 trust per success
    badges: string[]        // ["Community Builder", "Mentor"]
    vanityPerks: string[]   // Profile highlights, special avatars
  }
  
  deferred: {
    hostingCredits: {
      earnRate: number      // Credits per successful challenge
      vestingDays: number   // 30 days to unlock
      uses: string[]        // ["Free challenge creation", "Premium features"]
    }
    revenueVesting: {
      immediate: number     // 25% immediate
      vested: number        // 75% over 90 days
      schedule: "linear" | "cliff"
    }
    tierUnlocks: {
      "Verified Host": { rating: 4.0, challenges: 5 }
      "Trusted Host": { rating: 4.5, challenges: 10 }
      "Elite Host": { rating: 4.8, challenges: 20 }
    }
  }
  
  socialStatus: {
    leaderboardPosition: boolean
    featuredHost: boolean
    communityRecognition: string[]
  }
}

// 3. CONCURRENT HOSTING LIMITS
export interface HostingLimits {
  maxConcurrent: {
    free: number        // 1 challenge
    premium: number     // 3 challenges
    elite: number       // 5 challenges (4.8+ rating)
  }
  
  qualityGates: {
    minTrustScore: number           // 25 minimum
    minAccountAge: number           // 7 days
    minDescriptionLength: number    // 50 characters
    minInstructionsLength: number   // 20 characters
    reviewPeriod: number           // 24 hours for new hosts
  }
  
  rateLimiting: {
    maxChallengesPerWeek: number   // Prevents spam
    cooldownBetweenCreations: number // Hours between challenges
  }
}

// 4. HOSTING FRICTION (Making hosting work)
export interface QualityGates {
  preCreation: {
    required: string[]  // ["detailed description", "clear rules", "daily instructions"]
    optional: string[]  // ["example submissions", "FAQ section"]
    review: boolean     // Manual review for new/low-rated hosts
  }
  
  duringChallenge: {
    responseRequirements: {
      maxResponseTime: number    // 24 hours to respond to questions
      minResponseRate: number    // 80% response rate required
      escalationAfterHours: number // Auto-escalate if no response
    }
    
    engagementMetrics: {
      minDailyCheckins: number      // Host should check in daily
      communityInteraction: boolean  // Encourage replies, support
      progressUpdates: boolean       // Share challenge insights
    }
  }
  
  postChallenge: {
    required: string[]  // ["verification review", "participant feedback"]
    timeLimit: number   // 48 hours to complete post-challenge tasks
    qualityScore: number // Based on completion rate, satisfaction
  }
}

// 5. SOCIAL FEEDBACK LOOP
export interface HostRatingSystem {
  ratings: {
    scale: [1, 2, 3, 4, 5]
    weights: {
      challengeQuality: number     // 40%
      communication: number        // 30%
      supportiveness: number       // 20%
      responsiveness: number       // 10%
    }
  }
  
  consequences: {
    lowRating: {
      threshold: number           // <3.0 average
      restrictions: string[]      // ["manual review", "limited hosting"]
      improvement: string[]       // ["coaching", "mentorship program"]
    }
    
    highRating: {
      thresholds: {
        "4.0+": string[]         // ["verified badge", "priority support"]
        "4.5+": string[]         // ["trusted host", "featured challenges"]
        "4.8+": string[]         // ["elite status", "increased limits"]
      }
    }
  }
  
  reviewSystem: {
    eligibility: string[]         // ["completed challenge", "participated 7+ days"]
    verification: boolean         // Prevent fake reviews
    moderation: boolean          // Review inappropriate comments
    incentives: string[]         // ["XP for helpful reviews"]
  }
}

// IMPLEMENTATION HELPER FUNCTIONS
export class BalancedHostingSystem {
  
  // Check if host can earn conditional rewards
  static canEarnConditionalRewards(
    hostId: string, 
    challengeId: string,
    hostCompletionStatus: boolean,
    challengeSuccessRate: number
  ): boolean {
    // Core balance principle: Host must complete their own challenge
    return hostCompletionStatus
  }
  
  // Calculate host earnings with balance principles
  static calculateHostEarnings(
    platformRevenue: number,
    hostContribution: number,
    challengeSuccessRate: number,
    hostCompleted: boolean,
    hostRating: number
  ) {
    const baseRevenueShare = platformRevenue * constants.HOST_REVENUE_SHARE_PERCENTAGE / 100
    
    return {
      // Always earned (builds sustainable hosting ecosystem)
      guaranteedEarnings: {
        revenueShareImmediate: baseRevenueShare * 0.25, // 25% immediate
        revenueShareVested: baseRevenueShare * 0.75,   // 75% vested over 90 days
      },
      
      // Only if host completes (prevents gaming)
      conditionalEarnings: hostCompleted ? {
        contributionReturn: challengeSuccessRate > 50 ? hostContribution : 0,
        successBonus: challengeSuccessRate > 80 ? baseRevenueShare * 0.20 : 0,
        participantWinnings: 0, // Would come from their stake pool participation
      } : {
        contributionReturn: 0,
        successBonus: 0,
        participantWinnings: 0,
      },
      
      // Social rewards (always earned to encourage community building)
      socialRewards: {
        xpEarned: constants.HOST_XP_MULTIPLIER,
        trustBonus: challengeSuccessRate > 70 ? constants.HOST_TRUST_BONUS_PER_SUCCESS : 0,
        badgesEarned: this.calculateBadgesEarned(hostRating, challengeSuccessRate),
      }
    }
  }
  
  // Quality gate checker
  static passesQualityGates(hostData: any, challengeData: any): {
    passes: boolean,
    failedGates: string[],
    requiresReview: boolean
  } {
    const failedGates: string[] = []
    
    // Trust score gate
    if (hostData.trustScore < constants.MIN_HOST_TRUST_SCORE) {
      failedGates.push('trust_score')
    }
    
    // Account age gate
    if (hostData.accountAgeDays < constants.MIN_HOSTING_ACCOUNT_AGE_DAYS) {
      failedGates.push('account_age')
    }
    
    // Concurrent challenges gate
    const maxAllowed = hostData.isPremium ? 
      constants.MAX_CONCURRENT_CHALLENGES_PREMIUM : 
      constants.MAX_CONCURRENT_CHALLENGES_FREE
    
    if (hostData.activeChallenges >= maxAllowed) {
      failedGates.push('concurrent_limit')
    }
    
    // Description quality gate
    if (challengeData.description.length < constants.MIN_CHALLENGE_DESCRIPTION_LENGTH) {
      failedGates.push('description_quality')
    }
    
    // Instructions quality gate
    if (challengeData.dailyInstructions.length < constants.MIN_DAILY_INSTRUCTIONS_LENGTH) {
      failedGates.push('instructions_quality')
    }
    
    const passes = failedGates.length === 0
    const requiresReview = hostData.challengesHosted < 3 || hostData.rating < 4.0
    
    return { passes, failedGates, requiresReview }
  }
  
  private static calculateBadgesEarned(rating: number, successRate: number): string[] {
    const badges: string[] = []
    
    if (rating >= 4.8) badges.push("Elite Host")
    else if (rating >= 4.5) badges.push("Trusted Host") 
    else if (rating >= 4.0) badges.push("Verified Host")
    
    if (successRate >= 80) badges.push("Success Coach")
    if (successRate >= 90) badges.push("Excellence Mentor")
    
    return badges
  }
}

// ANTI-GAMING MEASURES
export const antiGamingMeasures = {
  // Prevent hosts from creating easy challenges
  difficultyAnalysis: {
    enabled: true,
    flagEasyStakes: true,      // Flag challenges with unusually high success rates
    communityReporting: true,   // Allow participants to report "too easy" challenges
    algorithmicDetection: true, // ML to detect pattern of easy challenges
  },
  
  // Prevent fake participation
  verificationRequirements: {
    hostMustStake: true,        // Hosts must put their own money down
    sameProofStandards: true,   // Same verification requirements as participants
    noSelfVerification: true,   // Hosts cannot verify their own submissions
    communityOversight: true,   // Other participants can flag host submissions
  },
  
  // Prevent collusion
  participantDiversity: {
    maxFriendsPercentage: 30,   // Max 30% of participants can be host's friends
    newUserLimits: true,        // Limits on brand new accounts joining
    behaviorAnalysis: true,     // Flag suspicious participation patterns
  }
}

export default BalancedHostingSystem
