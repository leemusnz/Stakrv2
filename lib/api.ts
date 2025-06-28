// API abstraction layer - easy to swap mock for real API calls
import type { User, Challenge, ActivityItem, Deadline, StatsData, ProofSubmission } from "./types"
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

// Configuration - easily switch between mock and real API
const USE_MOCK_DATA = true // Set to false when connecting real backend

// API Base URL (for when we connect real backend)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

// Generic API wrapper
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  if (USE_MOCK_DATA) {
    // Return mock data immediately
    await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate network delay
    throw new Error("Mock data should be handled by specific functions")
  }

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
}

// Challenge API
export const challengeApi = {
  getAllChallenges: async (): Promise<Challenge[]> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 400))
      return mockChallenges
    }
    return apiCall<Challenge[]>("/challenges")
  },

  getChallengeById: async (id: string): Promise<Challenge | null> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      return getChallengeById(id) || null
    }
    return apiCall<Challenge>(`/challenges/${id}`)
  },

  getTrendingChallenges: async (): Promise<Challenge[]> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 350))
      return getTrendingChallenges()
    }
    return apiCall<Challenge[]>("/challenges/trending")
  },

  getActiveChallenges: async (): Promise<Challenge[]> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      return getActiveChallenges()
    }
    return apiCall<Challenge[]>("/challenges/active")
  },

  joinChallenge: async (challengeId: string, stakeAmount: number): Promise<void> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 800))
      console.log(`Joined challenge ${challengeId} with stake $${stakeAmount}`)
      return
    }
    return apiCall<void>(`/challenges/${challengeId}/join`, {
      method: "POST",
      body: JSON.stringify({ stakeAmount }),
    })
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
}
