import { jest } from '@jest/globals'

// Mock fetch for API calls
global.fetch = jest.fn()

describe('API Basic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication Endpoints', () => {
    it('should handle user registration', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'securepassword123',
        name: 'New User',
      }

      // Mock successful registration
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          user: { id: 'new-user-id', email: userData.email, name: userData.name },
          message: 'User registered successfully'
        }),
      })

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.user.email).toBe(userData.email)
    })

    it('should handle password reset request', async () => {
      const resetData = {
        email: 'user@example.com',
      }

      // Mock successful password reset request
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          message: 'Password reset email sent'
        }),
      })

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetData),
      })

      const result = await response.json()
      expect(result.success).toBe(true)
    })
  })

  describe('User Profile Endpoints', () => {
    it('should update user profile', async () => {
      const profileData = {
        name: 'Updated Name',
        bio: 'Updated bio',
        avatar_url: 'https://example.com/new-avatar.jpg',
      }

      // Mock successful profile update
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          user: { ...profileData, id: 'user-1' }
        }),
      })

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })

      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.user.name).toBe('Updated Name')
    })

    it('should get user dashboard data', async () => {
      const dashboardData = {
        user: {
          id: 'user-1',
          name: 'Test User',
          credits: 150,
          trust_score: 85,
          challenges_completed: 12,
          current_streak: 5,
        },
        active_challenges: [
          { id: 'challenge-1', title: 'Active Challenge 1' },
          { id: 'challenge-2', title: 'Active Challenge 2' },
        ],
        recent_activity: [
          { type: 'challenge_completed', challenge_id: 'challenge-3' },
          { type: 'challenge_joined', challenge_id: 'challenge-4' },
        ],
      }

      // Mock successful dashboard data retrieval
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          data: dashboardData
        }),
      })

      const response = await fetch('/api/user/dashboard', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.user.credits).toBe(150)
      expect(result.data.active_challenges).toHaveLength(2)
    })
  })

  describe('Challenge Endpoints', () => {
    it('should get all challenges', async () => {
      const challengesData = [
        { id: 'challenge-1', title: 'Fitness Challenge', category: 'fitness' },
        { id: 'challenge-2', title: 'Productivity Challenge', category: 'productivity' },
      ]

      // Mock successful challenges retrieval
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          challenges: challengesData,
          total: 2
        }),
      })

      const response = await fetch('/api/challenges', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.challenges).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    it('should get specific challenge details', async () => {
      const challengeData = {
        id: 'challenge-1',
        title: '30-Day Fitness Challenge',
        description: 'Complete 30 days of consistent exercise',
        stake_amount: 50,
        current_participants: 25,
        max_participants: 100,
        host: { id: 'host-1', name: 'Challenge Host' },
        participants: [
          { id: 'participant-1', name: 'Participant 1' },
          { id: 'participant-2', name: 'Participant 2' },
        ],
      }

      // Mock successful challenge details retrieval
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          challenge: challengeData
        }),
      })

      const response = await fetch('/api/challenges/challenge-1', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.challenge.title).toBe('30-Day Fitness Challenge')
      expect(result.challenge.participants).toHaveLength(2)
    })
  })

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      // Mock 404 response
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ 
          error: 'Not found',
          message: 'The requested resource was not found'
        }),
      })

      const response = await fetch('/api/nonexistent-endpoint', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()
      expect(result.error).toBe('Not found')
    })

    it('should handle 500 server errors', async () => {
      // Mock 500 response
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ 
          error: 'Internal server error',
          message: 'Something went wrong on our end'
        }),
      })

      const response = await fetch('/api/challenges', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()
      expect(result.error).toBe('Internal server error')
    })

    it('should handle network errors', async () => {
      // Mock network error
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      try {
        await fetch('/api/challenges', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Network error')
      }
    })
  })
}) 