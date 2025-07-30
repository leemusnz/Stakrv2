// API abstraction layer - real data only
import type { User, Challenge, ActivityItem, Deadline, StatsData, ProofSubmission, HostCustomReward, PremiumChallengeFeatures } from "./types"

// Configuration - Use real data only
// Note: All mock fallbacks have been removed as real endpoints are implemented

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

// Generic API wrapper - real data only
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }

  return response.json()
}

// User API
export const userApi = {
  getCurrentUser: async (): Promise<User> => {
    return apiCall<User>("/user/me")
  },

  updateUser: async (userData: Partial<User>): Promise<User> => {
    return apiCall<User>("/user/me", {
      method: "PUT",
      body: JSON.stringify(userData),
    })
  },

  getUserTrustScore: async (userId: string): Promise<{ score: number; tier: string }> => {
    return apiCall(`/user/${userId}/trust-score`)
  },

  getUserCredits: async (): Promise<{ balance: number; pendingRewards: number }> => {
    return apiCall("/user/credits")
  }
}

// Challenge API
export const challengeApi = {
  getAllChallenges: async (): Promise<Challenge[]> => {
    return apiCall<Challenge[]>("/challenges")
  },

  getChallengeById: async (id: string): Promise<Challenge | null> => {
    try {
      return await apiCall<Challenge>(`/challenges/${id}`)
    } catch (error) {
      console.error(`Failed to fetch challenge ${id}:`, error)
      return null
    }
  },

  getTrendingChallenges: async (): Promise<Challenge[]> => {
    return apiCall<Challenge[]>("/challenges/trending")
  },

  getActiveChallenges: async (): Promise<Challenge[]> => {
    return apiCall<Challenge[]>("/challenges/active")
  },

  joinChallenge: async (challengeId: string, stakeAmount: number, purchaseInsurance: boolean = false): Promise<{ 
    success: boolean; 
    entryFee: number; 
    insuranceFee: number;
    totalCost: number;
    breakdown: {
      stakeAmount: number;
      entryFeePercentage: number;
      platformFeeCut: number;
      estimatedBonus: number;
    }
  }> => {
    return apiCall(`/challenges/${challengeId}/join`, {
      method: "POST",
      body: JSON.stringify({ stakeAmount, purchaseInsurance }),
    })
  },

  getChallengeRewards: async (challengeId: string): Promise<{ totalPot: number; completers: number; rewardPerWinner: number }> => {
    return apiCall(`/challenges/${challengeId}/rewards`)
  },

  searchChallenges: async (query: string): Promise<Challenge[]> => {
    return apiCall<Challenge[]>(`/challenges/search?q=${encodeURIComponent(query)}`)
  },

  filterChallenges: async (filters: {
    categories?: string[]
    difficulty?: string
    duration?: string
    stakeRange?: string
  }): Promise<Challenge[]> => {
    return apiCall<Challenge[]>("/challenges/filter", {
      method: "POST",
      body: JSON.stringify(filters),
    })
  },
}

// Activity API
export const activityApi = {
  getUserActivity: async (): Promise<ActivityItem[]> => {
    return apiCall<ActivityItem[]>("/activity")
  },
}

// Verification API
export const verificationApi = {
  submitProof: async (challengeId: string, proof: ProofSubmission): Promise<void> => {
    const formData = new FormData()
    if (proof.file) {
      formData.append("file", proof.file)
    }
    if (proof.text) {
      formData.append("text", proof.text)
    }
    formData.append("description", proof.description)
    formData.append("type", proof.type)

    return apiCall<void>(`/challenges/${challengeId}/verify`, {
      method: "POST",
      body: formData,
      headers: {}, // Don't set Content-Type for FormData
    })
  },

  getVerificationHistory: async (challengeId: string): Promise<ProofSubmission[]> => {
    return apiCall(`/challenges/${challengeId}/proofs`)
  }
}

// Payment & Credits API
export const paymentApi = {
  purchaseCredits: async (amount: number, paymentMethodId: string): Promise<{ success: boolean; transactionId: string }> => {
    return apiCall("/payments/purchase-credits", {
      method: "POST",
      body: JSON.stringify({ amount, paymentMethodId }),
    })
  },

  withdrawCredits: async (amount: number, withdrawalMethodId: string): Promise<{ success: boolean; fee: number }> => {
    return apiCall("/payments/withdraw", {
      method: "POST",
      body: JSON.stringify({ amount, withdrawalMethodId }),
    })
  },

  getCreditTransactions: async (): Promise<any[]> => {
    return apiCall("/user/credit-transactions")
  }
}

// Insurance API
export const insuranceApi = {
  submitClaim: async (participantId: string, reason: string, evidence: any[]): Promise<{ claimId: string; status: string }> => {
    return apiCall("/insurance/claim", {
      method: "POST",
      body: JSON.stringify({ participantId, reason, evidence }),
    })
  },

  getClaimStatus: async (claimId: string): Promise<{ status: string; reviewNotes?: string }> => {
    return apiCall(`/insurance/claim/${claimId}`)
  }
}

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<StatsData[]> => {
    return apiCall<StatsData[]>("/dashboard/stats")
  },

  getDeadlines: async (): Promise<Deadline[]> => {
    return apiCall<Deadline[]>("/dashboard/deadlines")
  },

  getRevenueStats: async (): Promise<{ 
    entryFees: number; 
    failedStakeCuts: number; 
    premiumSubscriptions: number; 
    insuranceFees: number;
    cashoutFees: number;
  }> => {
    return apiCall("/admin/revenue-stats")
  }
}

// Premium Features API
export const premiumApi = {
  // Host Custom Rewards
  createCustomReward: async (challengeId: string, reward: Partial<HostCustomReward>): Promise<HostCustomReward> => {
    return apiCall<HostCustomReward>(`/challenges/${challengeId}/custom-rewards`, {
      method: "POST",
      body: JSON.stringify(reward),
    })
  },

  getChallengeCustomRewards: async (challengeId: string): Promise<HostCustomReward[]> => {
    return apiCall<HostCustomReward[]>(`/challenges/${challengeId}/custom-rewards`)
  },

  // Premium Community
  getPremiumCommunityChannels: async (): Promise<any[]> => {
    return apiCall<any[]>('/premium/community/channels')
  },

  joinPremiumChannel: async (channelId: string): Promise<void> => {
    return apiCall<void>(`/premium/community/channels/${channelId}/join`, {
      method: "POST",
    })
  },

  // Premium Challenge Features
  enablePremiumFeatures: async (challengeId: string, features: Partial<PremiumChallengeFeatures>): Promise<void> => {
    return apiCall<void>(`/challenges/${challengeId}/premium-features`, {
      method: "POST",
      body: JSON.stringify(features),
    })
  },

  getPremiumChallengeFeatures: async (challengeId: string): Promise<PremiumChallengeFeatures> => {
    return apiCall<PremiumChallengeFeatures>(`/challenges/${challengeId}/premium-features`)
  },

  // Premium Analytics
  getPremiumAnalytics: async (): Promise<any> => {
    return apiCall<any>('/premium/analytics')
  },

  // Premium Rewards History
  getPremiumRewardsHistory: async (): Promise<any[]> => {
    return apiCall<any[]>('/premium/rewards/history')
  }
}
