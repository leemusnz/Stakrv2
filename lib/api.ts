// API abstraction layer - easy to swap mock for real API calls
import type { User, Challenge, ActivityItem, Deadline, StatsData, ProofSubmission, HostCustomReward, PremiumChallengeFeatures } from "./types"
import {
  mockUser,
  mockChallenges,
  mockActivities,
  mockDeadlines,
  mockStats,
  getChallengeById,
  getActiveChallenges,
  getTrendingChallenges,
} from "./mock-data"

// Configuration - Use real data where endpoints exist, mock data as fallback
const USE_MOCK_DATA = false // We have real endpoints now!

// API Base URL (for when we connect real backend)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

// Generic API wrapper with fallback
async function apiCall<T>(endpoint: string, options?: RequestInit, mockFallback?: () => Promise<T>): Promise<T> {
  try {
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
  } catch (error) {
    // If real API fails and we have a mock fallback, use it
    if (mockFallback) {
      console.log(`📡 API ${endpoint} failed, using mock data fallback`)
      return mockFallback()
    }
    throw error
  }
}

// User API
export const userApi = {
  getCurrentUser: async (): Promise<User> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      return mockUser
    }
    return apiCall<User>("/user/me")
  },

  updateUser: async (userData: Partial<User>): Promise<User> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return { ...mockUser, ...userData }
    }
    return apiCall<User>("/user/me", {
      method: "PUT",
      body: JSON.stringify(userData),
    })
  },

  getUserTrustScore: async (userId: string): Promise<{ score: number; tier: string }> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      return { score: 75, tier: 'manual' }
    }
    return apiCall(`/user/${userId}/trust-score`)
  },

  getUserCredits: async (): Promise<{ balance: number; pendingRewards: number }> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      return { balance: 250, pendingRewards: 45 }
    }
    return apiCall("/user/credits")
  }
}

// Challenge API
export const challengeApi = {
  getAllChallenges: async (): Promise<Challenge[]> => {
    return apiCall<Challenge[]>("/challenges", {}, async () => {
      await new Promise((resolve) => setTimeout(resolve, 400))
      return mockChallenges
    })
  },

  getChallengeById: async (id: string): Promise<Challenge | null> => {
    try {
      return await apiCall<Challenge>(`/challenges/${id}`)
    } catch (error) {
      // Fallback to mock data
      await new Promise((resolve) => setTimeout(resolve, 300))
      return getChallengeById(id) || null
    }
  },

  getTrendingChallenges: async (): Promise<Challenge[]> => {
    return apiCall<Challenge[]>("/challenges/trending", {}, async () => {
      await new Promise((resolve) => setTimeout(resolve, 350))
      return getTrendingChallenges()
    })
  },

  getActiveChallenges: async (): Promise<Challenge[]> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      return getActiveChallenges()
    }
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
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 800))
      const entryFee = stakeAmount * 0.05 // 5% platform fee
      const insuranceFee = purchaseInsurance ? 1.00 : 0
      const totalCost = stakeAmount + entryFee + insuranceFee
      const estimatedBonus = stakeAmount * 0.23 // Typical 23% bonus
      
      console.log(`Joined challenge ${challengeId} with transparent breakdown:`, {
        stakeAmount,
        entryFee,
        insuranceFee,
        totalCost,
        estimatedBonus
      })
      
      return { 
        success: true, 
        entryFee, 
        insuranceFee,
        totalCost,
        breakdown: {
          stakeAmount,
          entryFeePercentage: 5,
          platformFeeCut: 20,
          estimatedBonus
        }
      }
    }
    return apiCall(`/challenges/${challengeId}/join`, {
      method: "POST",
      body: JSON.stringify({ stakeAmount, purchaseInsurance }),
    })
  },

  getChallengeRewards: async (challengeId: string): Promise<{ totalPot: number; completers: number; rewardPerWinner: number }> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      return { totalPot: 12450, completers: 45, rewardPerWinner: 276.67 }
    }
    return apiCall(`/challenges/${challengeId}/rewards`)
  },

  searchChallenges: async (query: string): Promise<Challenge[]> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      return mockChallenges.filter(
        (challenge) =>
          challenge.title.toLowerCase().includes(query.toLowerCase()) ||
          challenge.description.toLowerCase().includes(query.toLowerCase()) ||
          challenge.category.toLowerCase().includes(query.toLowerCase()),
      )
    }
    return apiCall<Challenge[]>(`/challenges/search?q=${encodeURIComponent(query)}`)
  },

  filterChallenges: async (filters: {
    categories?: string[]
    difficulty?: string
    duration?: string
    stakeRange?: string
  }): Promise<Challenge[]> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      let filtered = [...mockChallenges]

      if (filters.categories?.length) {
        filtered = filtered.filter((c) => filters.categories!.includes(c.category.toLowerCase()))
      }
      if (filters.difficulty) {
        filtered = filtered.filter((c) => c.difficulty === filters.difficulty)
      }
      // Add more filter logic as needed

      return filtered
    }
    return apiCall<Challenge[]>("/challenges/filter", {
      method: "POST",
      body: JSON.stringify(filters),
    })
  },
}

// Activity API
export const activityApi = {
  getUserActivity: async (): Promise<ActivityItem[]> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 250))
      return mockActivities
    }
    return apiCall<ActivityItem[]>("/activity")
  },
}

// Verification API
export const verificationApi = {
  submitProof: async (challengeId: string, proof: ProofSubmission): Promise<void> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate upload time
      console.log(`Proof submitted for challenge ${challengeId}:`, proof)
      return
    }

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
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      return []
    }
    return apiCall(`/challenges/${challengeId}/proofs`)
  }
}

// Payment & Credits API
export const paymentApi = {
  purchaseCredits: async (amount: number, paymentMethodId: string): Promise<{ success: boolean; transactionId: string }> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      console.log(`Purchasing $${amount} credits with payment method ${paymentMethodId}`)
      return { success: true, transactionId: `txn_${Date.now()}` }
    }
    return apiCall("/payments/purchase-credits", {
      method: "POST",
      body: JSON.stringify({ amount, paymentMethodId }),
    })
  },

  withdrawCredits: async (amount: number, withdrawalMethodId: string): Promise<{ success: boolean; fee: number }> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      const fee = amount * 0.03 // 3% withdrawal fee
      console.log(`Withdrawing $${amount} credits, fee: $${fee}`)
      return { success: true, fee }
    }
    return apiCall("/payments/withdraw", {
      method: "POST",
      body: JSON.stringify({ amount, withdrawalMethodId }),
    })
  },

  getCreditTransactions: async (): Promise<any[]> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      return []
    }
    return apiCall("/user/credit-transactions")
  }
}

// Insurance API
export const insuranceApi = {
  submitClaim: async (participantId: string, reason: string, evidence: any[]): Promise<{ claimId: string; status: string }> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log(`Insurance claim submitted for participant ${participantId}: ${reason}`)
      return { claimId: `claim_${Date.now()}`, status: 'pending' }
    }
    return apiCall("/insurance/claim", {
      method: "POST",
      body: JSON.stringify({ participantId, reason, evidence }),
    })
  },

  getClaimStatus: async (claimId: string): Promise<{ status: string; reviewNotes?: string }> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      return { status: 'pending' }
    }
    return apiCall(`/insurance/claim/${claimId}`)
  }
}

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<StatsData[]> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      return mockStats
    }
    return apiCall<StatsData[]>("/dashboard/stats")
  },

  getDeadlines: async (): Promise<Deadline[]> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 250))
      return mockDeadlines
    }
    return apiCall<Deadline[]>("/dashboard/deadlines")
  },

  getRevenueStats: async (): Promise<{ 
    entryFees: number; 
    failedStakeCuts: number; 
    premiumSubscriptions: number; 
    insuranceFees: number;
    cashoutFees: number;
  }> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 400))
      return {
        entryFees: 2340,
        failedStakeCuts: 8760,
        premiumSubscriptions: 1240,
        insuranceFees: 450,
        cashoutFees: 890
      }
    }
    return apiCall("/admin/revenue-stats")
  }
}

// Premium Features API
export const premiumApi = {
  // Host Custom Rewards
  createCustomReward: async (challengeId: string, reward: Partial<HostCustomReward>): Promise<HostCustomReward> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return {
        id: `reward-${Date.now()}`,
        challengeId,
        hostId: 'mock-host-id',
        rewardType: reward.rewardType || 'recognition',
        title: reward.title || 'Custom Reward',
        description: reward.description || 'A special reward for premium participants',
        eligibilityRequirements: {
          premiumOnly: true,
          completionRequirement: 'all'
        },
        deliveryMethod: 'platform',
        isActive: true,
        createdAt: new Date().toISOString()
      } as HostCustomReward
    }
    return apiCall<HostCustomReward>(`/challenges/${challengeId}/custom-rewards`, {
      method: "POST",
      body: JSON.stringify(reward),
    })
  },

  getChallengeCustomRewards: async (challengeId: string): Promise<HostCustomReward[]> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      return [
        {
          id: 'reward-1',
          challengeId,
          hostId: 'host-1',
          rewardType: 'digital_content',
          title: 'Exclusive Workout Plan',
          description: 'Custom workout plan designed specifically for premium completers',
          value: 'Personalized 30-day fitness routine',
          eligibilityRequirements: {
            premiumOnly: true,
            completionRequirement: 'all'
          },
          deliveryMethod: 'email',
          maxRecipients: 50,
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'reward-2',
          challengeId,
          hostId: 'host-1',
          rewardType: 'recognition',
          title: 'Hall of Fame Feature',
          description: 'Feature your success story on my social media',
          eligibilityRequirements: {
            premiumOnly: true,
            minimumTrustScore: 80,
            completionRequirement: 'all'
          },
          deliveryMethod: 'manual',
          maxRecipients: 10,
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ]
    }
    return apiCall<HostCustomReward[]>(`/challenges/${challengeId}/custom-rewards`)
  },

  // Premium Community
  getPremiumCommunityChannels: async (): Promise<any[]> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      return [
        {
          id: 'channel-1',
          name: 'Premium Motivation',
          description: 'Daily motivation and success stories from premium members',
          channelType: 'general',
          memberCount: 1247
        },
        {
          id: 'channel-2',
          name: 'Mentor Network',
          description: 'Connect with experienced Stakr mentors',
          channelType: 'mentorship',
          memberCount: 543
        },
        {
          id: 'channel-3',
          name: 'Exclusive Events',
          description: 'Premium-only virtual events and workshops',
          channelType: 'exclusive',
          memberCount: 890
        }
      ]
    }
    return apiCall<any[]>('/premium/community/channels')
  },

  joinPremiumChannel: async (channelId: string): Promise<void> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      return
    }
    return apiCall<void>(`/premium/community/channels/${channelId}/join`, {
      method: "POST",
    })
  },

  // Premium Challenge Features
  enablePremiumFeatures: async (challengeId: string, features: Partial<PremiumChallengeFeatures>): Promise<void> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 400))
      return
    }
    return apiCall<void>(`/challenges/${challengeId}/premium-features`, {
      method: "POST",
      body: JSON.stringify(features),
    })
  },

  getPremiumChallengeFeatures: async (challengeId: string): Promise<PremiumChallengeFeatures> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      return {
        enhancedCommunication: true,
        progressInsights: true,
        customMilestones: true,
        prioritySupport: true,
        exclusiveUpdates: true,
        customCelebrations: true
      }
    }
    return apiCall<PremiumChallengeFeatures>(`/challenges/${challengeId}/premium-features`)
  },

  // Premium Analytics
  getPremiumAnalytics: async (): Promise<any> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      return {
        habitAnalytics: {
          streakPrediction: 85, // % chance of maintaining streak
          optimalChallengeTime: 'Morning',
          bestPerformanceDay: 'Tuesday',
          improvementAreas: ['Consistency', 'Documentation']
        },
        performancePredictions: {
          nextChallengeSuccess: 92,
          recommendedDifficulty: 'Medium',
          suggestedDuration: '21 days'
        },
        customInsights: [
          'You perform 23% better in fitness challenges',
          'Your success rate increases by 15% with insurance',
          'You complete 89% of challenges started on weekends'
        ]
      }
    }
    return apiCall<any>('/premium/analytics')
  },

  // Premium Rewards History
  getPremiumRewardsHistory: async (): Promise<any[]> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      return [
        {
          id: 'reward-hist-1',
          challengeTitle: '30-Day Fitness Challenge',
          rewardTitle: 'Custom Meal Plan',
          rewardType: 'digital_content',
          receivedAt: '2024-01-15T10:30:00Z',
          status: 'delivered'
        },
        {
          id: 'reward-hist-2',
          challengeTitle: 'Meditation Mastery',
          rewardTitle: 'Featured Success Story',
          rewardType: 'recognition',
          receivedAt: '2024-01-10T14:20:00Z',
          status: 'delivered'
        }
      ]
    }
    return apiCall<any[]>('/premium/rewards/history')
  }
}
