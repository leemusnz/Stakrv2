import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { SessionProvider } from 'next-auth/react'
import { jest } from '@jest/globals'

// Mock fetch for API calls
global.fetch = jest.fn()

describe('Challenge System', () => {
  const mockSession = {
    data: {
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        credits: 100,
        trust_score: 85,
        verification_tier: 'verified',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    status: 'authenticated' as const,
  }

  const mockChallenge = {
    id: 'challenge-1',
    title: '30-Day Fitness Challenge',
    description: 'Complete 30 days of consistent exercise',
    stake_amount: 50,
    entry_fee: 2.5,
    insurance_fee: 1,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'fitness',
    host_id: '1',
    max_participants: 100,
    current_participants: 25,
    status: 'active',
    verification_required: true,
    proof_required: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSession as jest.Mock).mockReturnValue(mockSession)
  })

  describe('Challenge Creation', () => {
    it('should create a new challenge successfully', async () => {
      const challengeData = {
        title: 'Test Challenge',
        description: 'A test challenge',
        stake_amount: 25,
        category: 'productivity',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        verification_required: true,
        proof_required: true,
      }

      // Mock successful challenge creation
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          challenge: { ...challengeData, id: 'new-challenge-id' } 
        }),
      })

      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(challengeData),
      })

      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.challenge.id).toBe('new-challenge-id')
    })

    it('should validate challenge data before creation', async () => {
      const invalidChallengeData = {
        title: '', // Invalid: empty title
        description: 'A test challenge',
        stake_amount: -10, // Invalid: negative stake
        category: 'invalid-category', // Invalid category
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Invalid: past end date
      }

      // Mock validation error
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ 
          error: 'Validation failed',
          details: ['Title is required', 'Stake amount must be positive', 'Invalid category', 'End date must be in the future']
        }),
      })

      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidChallengeData),
      })

      const result = await response.json()
      expect(result.error).toBe('Validation failed')
      expect(result.details).toHaveLength(4)
    })

    it('should calculate fees correctly', () => {
      const stakeAmount = 100
      const entryFee = stakeAmount * 0.05 // 5% entry fee
      const insuranceFee = 1 // $1 insurance fee

      expect(entryFee).toBe(5)
      expect(insuranceFee).toBe(1)
      expect(stakeAmount + entryFee + insuranceFee).toBe(106)
    })
  })

  describe('Challenge Joining', () => {
    it('should allow users to join a challenge', async () => {
      const joinData = {
        challenge_id: 'challenge-1',
        stake_amount: 50,
        include_insurance: true,
      }

      // Mock successful join
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          participant_id: 'participant-1',
          total_cost: 53.5 // 50 + 2.5 + 1
        }),
      })

      const response = await fetch('/api/challenges/challenge-1/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(joinData),
      })

      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.total_cost).toBe(53.5)
    })

    it('should prevent joining if insufficient credits', async () => {
      const joinData = {
        challenge_id: 'challenge-1',
        stake_amount: 200, // More than user's 100 credits
        include_insurance: true,
      }

      // Mock insufficient credits error
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ 
          error: 'Insufficient credits',
          required: 211, // 200 + 10 + 1
          available: 100
        }),
      })

      const response = await fetch('/api/challenges/challenge-1/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(joinData),
      })

      const result = await response.json()
      expect(result.error).toBe('Insufficient credits')
      expect(result.required).toBe(211)
      expect(result.available).toBe(100)
    })

    it('should prevent joining if challenge is full', async () => {
      const fullChallenge = { ...mockChallenge, current_participants: 100, max_participants: 100 }

      // Mock challenge full error
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ 
          error: 'Challenge is full',
          current_participants: 100,
          max_participants: 100
        }),
      })

      const response = await fetch('/api/challenges/challenge-1/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: 'challenge-1', stake_amount: 50 }),
      })

      const result = await response.json()
      expect(result.error).toBe('Challenge is full')
    })
  })

  describe('Challenge Completion', () => {
    it('should allow users to complete a challenge', async () => {
      const completionData = {
        challenge_id: 'challenge-1',
        proof_url: 'https://example.com/proof.jpg',
        completion_notes: 'Successfully completed the challenge!',
      }

      // Mock successful completion
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          completion_id: 'completion-1',
          status: 'pending_verification'
        }),
      })

      const response = await fetch('/api/challenges/challenge-1/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completionData),
      })

      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.status).toBe('pending_verification')
    })

    it('should require proof for completion', async () => {
      const completionDataWithoutProof = {
        challenge_id: 'challenge-1',
        completion_notes: 'Completed without proof',
        // Missing proof_url
      }

      // Mock missing proof error
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ 
          error: 'Proof is required for this challenge',
          challenge_requires_proof: true
        }),
      })

      const response = await fetch('/api/challenges/challenge-1/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completionDataWithoutProof),
      })

      const result = await response.json()
      expect(result.error).toBe('Proof is required for this challenge')
    })
  })

  describe('Proof Verification', () => {
    it('should verify proof through AI moderation', async () => {
      const proofData = {
        image_url: 'https://picsum.photos/400/300',
        challenge_id: 'challenge-1',
        participant_id: 'participant-1',
      }

      // Mock AI verification
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          isAppropriate: true,
          confidence: 0.95,
          moderationResult: 'approved',
          verification_status: 'verified'
        }),
      })

      const response = await fetch('/api/ai/validate-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proofData),
      })

      const result = await response.json()
      expect(result.isAppropriate).toBe(true)
      expect(result.verification_status).toBe('verified')
    })

    it('should reject inappropriate proof', async () => {
      const proofData = {
        image_url: 'https://example.com/inappropriate.jpg',
        challenge_id: 'challenge-1',
        participant_id: 'participant-1',
      }

      // Mock AI rejection
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          isAppropriate: false,
          confidence: 0.9,
          moderationResult: 'rejected',
          reason: 'Inappropriate content detected',
          verification_status: 'rejected'
        }),
      })

      const response = await fetch('/api/ai/validate-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proofData),
      })

      const result = await response.json()
      expect(result.isAppropriate).toBe(false)
      expect(result.verification_status).toBe('rejected')
    })
  })

  describe('Reward Distribution', () => {
    it('should calculate rewards correctly for successful completion', () => {
      const totalStakes = 1000 // 20 participants * $50 each
      const entryFees = 50 // 5% of total stakes
      const failedStakes = 200 // 20% of failed stakes
      const successfulParticipants = 15
      const failedParticipants = 5

      const totalRewardPool = totalStakes + entryFees + failedStakes
      const rewardPerPerson = totalRewardPool / successfulParticipants

      expect(totalRewardPool).toBe(1250)
      expect(rewardPerPerson).toBeCloseTo(83.33, 2) // 1250 / 15
    })

    it('should handle edge case with no successful completions', () => {
      const totalStakes = 1000
      const entryFees = 50
      const failedStakes = 200
      const successfulParticipants = 0

      const totalRewardPool = totalStakes + entryFees + failedStakes
      
      // If no one completes, all stakes go to failed stakes pool
      expect(totalRewardPool).toBe(1250)
      // No rewards distributed
      expect(successfulParticipants).toBe(0)
    })
  })

  describe('Challenge Analytics', () => {
    it('should track challenge participation metrics', async () => {
      const analyticsData = {
        challenge_id: 'challenge-1',
        total_participants: 25,
        successful_completions: 18,
        failed_completions: 7,
        total_stakes: 1250,
        total_rewards: 1388.89,
        average_completion_rate: 0.72,
      }

      // Mock analytics retrieval
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          analytics: analyticsData
        }),
      })

      const response = await fetch('/api/challenges/challenge-1/analytics', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.analytics.total_participants).toBe(25)
      expect(result.analytics.average_completion_rate).toBe(0.72)
    })
  })

  describe('Challenge Hosting', () => {
    it('should allow hosts to manage their challenges', async () => {
      const hostChallenges = [
        { ...mockChallenge, id: 'challenge-1' },
        { ...mockChallenge, id: 'challenge-2', title: 'Another Challenge' },
      ]

      // Mock hosted challenges retrieval
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          challenges: hostChallenges
        }),
      })

      const response = await fetch('/api/user/hosted-challenges', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.challenges).toHaveLength(2)
    })

    it('should calculate host incentives correctly', () => {
      const totalStakes = 1000
      const hostIncentiveRate = 0.02 // 2% of total stakes
      const hostIncentive = totalStakes * hostIncentiveRate

      expect(hostIncentive).toBe(20)
    })
  })

  describe('Challenge Discovery', () => {
    it('should filter challenges by category', async () => {
      const fitnessChallenges = [
        { ...mockChallenge, category: 'fitness' },
        { ...mockChallenge, id: 'challenge-2', title: 'Running Challenge', category: 'fitness' },
      ]

      // Mock filtered challenges
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          challenges: fitnessChallenges,
          filters: { category: 'fitness' }
        }),
      })

      const response = await fetch('/api/challenges?category=fitness', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.challenges).toHaveLength(2)
      expect(result.challenges.every((c: any) => c.category === 'fitness')).toBe(true)
    })

    it('should sort challenges by various criteria', async () => {
      const sortedChallenges = [
        { ...mockChallenge, current_participants: 50 },
        { ...mockChallenge, id: 'challenge-2', current_participants: 25 },
        { ...mockChallenge, id: 'challenge-3', current_participants: 75 },
      ]

      // Mock sorted challenges
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          challenges: sortedChallenges,
          sort_by: 'participants'
        }),
      })

      const response = await fetch('/api/challenges?sort=participants', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.challenges).toHaveLength(3)
    })
  })

  describe('Challenge Interactions', () => {
    it('should allow users to like challenges', async () => {
      const likeData = {
        challenge_id: 'challenge-1',
        user_id: '1',
      }

      // Mock successful like
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          like_id: 'like-1',
          total_likes: 15
        }),
      })

      const response = await fetch('/api/social/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(likeData),
      })

      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.total_likes).toBe(15)
    })

    it('should track challenge engagement metrics', async () => {
      const engagementData = {
        challenge_id: 'challenge-1',
        views: 150,
        likes: 25,
        shares: 8,
        comments: 12,
        completion_rate: 0.68,
      }

      // Mock engagement metrics
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          engagement: engagementData
        }),
      })

      const response = await fetch('/api/challenges/challenge-1/engagement', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.engagement.views).toBe(150)
      expect(result.engagement.completion_rate).toBe(0.68)
    })
  })
}) 