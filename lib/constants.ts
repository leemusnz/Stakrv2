// Challenge and business constants
export const constants = {
  PLATFORM_ENTRY_FEE_PERCENTAGE: 5, // 5% of stake amount
  PLATFORM_FAILED_STAKE_CUT: 20, // 20% of failed stakes
  INSURANCE_FEE: 1.00, // $1 flat fee
  CASHOUT_FEE_PERCENTAGE: 3, // 3% of withdrawal
  PREMIUM_SUBSCRIPTION_MONTHLY: 9.99,
  
  // Host Incentives (NEW)
  HOST_REVENUE_SHARE_PERCENTAGE: 30, // 30% of platform revenue from their challenge
  HOST_CONTRIBUTION_RETURN_THRESHOLD: 50, // Return contribution if >50% completion
  HOST_BONUS_THRESHOLD: 80, // Extra bonus if >80% completion
  HOST_SUCCESS_BONUS_PERCENTAGE: 20, // 20% bonus for highly successful challenges
  
  // Host Limits & Quality Control (NEW)
  MAX_CONCURRENT_CHALLENGES_FREE: 1, // Free users: 1 active challenge
  MAX_CONCURRENT_CHALLENGES_PREMIUM: 3, // Premium users: 3 active challenges
  MIN_HOST_TRUST_SCORE: 25, // Minimum trust score to host
  HOST_XP_MULTIPLIER: 2.0, // 2x XP for hosting
  HOST_TRUST_BONUS_PER_SUCCESS: 5, // +5 trust per successful challenge
  MIN_HOSTING_ACCOUNT_AGE_DAYS: 7, // Account must be 7+ days old to host
  
  // Challenge Quality Gates
  MIN_CHALLENGE_DESCRIPTION_LENGTH: 50, // Minimum description length
  MIN_DAILY_INSTRUCTIONS_LENGTH: 20, // Minimum daily instructions
  HOSTING_REVIEW_PERIOD_HOURS: 24, // Manual review period for new hosts
  
  // Verification and trust
  MIN_TRUST_SCORE: 10,
  MAX_TRUST_SCORE: 100,
  DEFAULT_TRUST_SCORE: 50,
  TRUST_SCORE_PENALTY: -5,
  TRUST_SCORE_BONUS: 2,
  
  // Limits
  MAX_STAKE_AMOUNT: 1000,
  MIN_STAKE_AMOUNT: 5,
  MAX_CHALLENGE_DURATION_DAYS: 365,
  MIN_CHALLENGE_DURATION_DAYS: 1,
  MAX_PARTICIPANTS: 10000,
  MIN_PARTICIPANTS: 1
} 