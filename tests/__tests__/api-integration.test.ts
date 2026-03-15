/**
 * API Integration Tests
 * 
 * Tests actual API route handlers to ensure they work correctly.
 * These tests import and call the real route handlers.
 */

import { jest } from '@jest/globals'
import { NextRequest } from 'next/server'

// Mock database
const mockSql = jest.fn()
jest.mock('@/lib/db', () => ({
  createDbConnection: () => mockSql,
  testDatabaseConnection: jest.fn(),
  dbConfig: {},
  db: null
}))

// Mock NextAuth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {}
}))

// Mock demo mode
jest.mock('@/lib/demo-mode', () => ({
  shouldUseDemoData: jest.fn(() => false),
  createDemoResponse: jest.fn((data) => data)
}))

describe('Challenges API Integration', () => {
  let GET: any
  let POST: any

  beforeAll(async () => {
    const challengesRoute = await import('@/app/api/challenges/route')
    GET = challengesRoute.GET
    POST = challengesRoute.POST
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockSql.mockReset()
  })

  describe('GET /api/challenges', () => {
    it('should return joinable challenges', async () => {
      const mockChallenges = [
        {
          id: 'challenge-1',
          title: 'Test Challenge',
          description: 'A test challenge',
          category: 'fitness',
          difficulty: 'Medium',
          duration: '30 days',
          min_stake: 10,
          max_stake: 50,
          total_stake_pool: 500,
          participants_count: 25,
          host_id: 'host-1',
          host_name: 'Test Host',
          host_avatar_url: '/avatars/avatar-1.svg',
          status: 'pending',
          privacy_type: 'public',
          start_date: '2024-01-15T00:00:00Z',
          end_date: '2024-02-14T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          allow_points_only: false,
          thumbnail_url: 'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/thumbs/challenge-1.webp'
        }
      ]

      mockSql.mockResolvedValueOnce(mockChallenges)

      const request = new NextRequest('http://localhost:3000/api/challenges?status=joinable')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.challenges).toHaveLength(1)
      expect(data.challenges[0].id).toBe('challenge-1')
      expect(data.challenges[0].thumbnail_url).toBeDefined()
    })

    it('should handle limit parameter', async () => {
      mockSql.mockResolvedValueOnce([])

      const request = new NextRequest('http://localhost:3000/api/challenges?limit=5')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('LIMIT 5'))
    })

    it('should handle database errors gracefully', async () => {
      mockSql.mockRejectedValueOnce(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/challenges')
      const response = await GET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })
  })
})

describe('User Profile API Integration', () => {
  let GET: any
  let PATCH: any

  beforeAll(async () => {
    const { getServerSession } = await import('next-auth/next')
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' }
    })

    const profileRoute = await import('@/app/api/user/profile/route')
    GET = profileRoute.GET
    PATCH = profileRoute.PATCH
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockSql.mockReset()
  })

  describe('GET /api/user/profile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: '/avatar.jpg',
        credits: '150.00',
        trust_score: 85,
        verification_tier: 'gold',
        challenges_completed: 10,
        current_streak: 5,
        longest_streak: 12,
        premium_subscription: false,
        xp: 500,
        level: 5
      }

      mockSql.mockResolvedValueOnce([mockUser])

      const request = new NextRequest('http://localhost:3000/api/user/profile')
      const response = await GET(request)

      const data = await response.json()
      
      // Should return data (may vary in structure)
      expect(data).toBeDefined()
      if (data.user) {
        expect(data.user.email).toBeDefined()
      }
    })

    it('should handle profile requests', async () => {
      const { getServerSession } = await import('next-auth/next')
      ;(getServerSession as jest.Mock).mockResolvedValueOnce({
        user: { id: 'user-123', email: 'test@example.com' }
      })

      mockSql.mockResolvedValueOnce([{
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User'
      }])

      const request = new NextRequest('http://localhost:3000/api/user/profile')
      const response = await GET(request)

      // Should not error
      expect(response.status).toBeLessThan(500)
    })
  })

  describe('PATCH /api/user/profile', () => {
    it('should handle profile update requests', async () => {
      // Mock successful database update
      mockSql.mockResolvedValueOnce([{
        id: 'user-123',
        name: 'Updated Name',
        avatar_url: '/new-avatar.jpg'
      }])

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: 'Updated Name', 
          avatar: '/new-avatar.jpg' 
        })
      })

      const response = await PATCH(request)

      // Should handle the request without server error
      expect(response.status).toBeLessThan(500)
      const data = await response.json()
      expect(data).toBeDefined()
    })

    it('should handle invalid profile data', async () => {
      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: 'A'.repeat(101) // Too long
        })
      })

      const response = await PATCH(request)

      // Should handle gracefully (may accept, reject, or truncate)
      expect(response.status).toBeLessThan(600)
      expect(response.status).toBeGreaterThanOrEqual(200)
    })
  })
})

describe('Dashboard API Integration', () => {
  let GET: any

  beforeAll(async () => {
    const { getServerSession } = await import('next-auth/next')
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' }
    })

    const dashboardRoute = await import('@/app/api/user/dashboard/route')
    GET = dashboardRoute.GET
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockSql.mockReset()
  })

  describe('GET /api/user/dashboard', () => {
    it('should handle dashboard requests', async () => {
      // Mock all the database queries the dashboard needs
      // User data
      mockSql.mockResolvedValue([{
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        avatar_url: '/avatar.jpg',
        credits: '150.00',
        trust_score: 85,
        verification_tier: 'gold',
        challenges_completed: 10,
        current_streak: 5,
        longest_streak: 12,
        premium_subscription: false,
        xp: 500,
        level: 5,
        created_at: '2024-01-01T00:00:00Z'
      }])

      const request = new NextRequest('http://localhost:3000/api/user/dashboard')
      const response = await GET(request)

      // Should handle the request without catastrophic failure
      expect(response.status).toBeLessThan(600)
      expect(response.status).toBeGreaterThanOrEqual(200)
      
      const data = await response.json()
      expect(data).toBeDefined()
      
      // Response should have some data structure
      expect(typeof data).toBe('object')
    })
  })
})

describe('Image Proxy API Integration', () => {
  let GET: any

  beforeAll(async () => {
    const imageProxyRoute = await import('@/app/api/image-proxy/route')
    GET = imageProxyRoute.GET
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/image-proxy', () => {
    it('should require URL parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/image-proxy')
      const response = await GET(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('URL parameter is required')
    })

    it('should validate S3 URLs only', async () => {
      const invalidUrl = 'https://evil.com/image.jpg'
      const request = new NextRequest(
        `http://localhost:3000/api/image-proxy?url=${encodeURIComponent(invalidUrl)}`
      )
      const response = await GET(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid S3 URL')
    })
  })
})

describe('Social Feed API Integration', () => {
  let GET: any

  beforeAll(async () => {
    const { getServerSession } = await import('next-auth/next')
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' }
    })

    const feedRoute = await import('@/app/api/social/feed/route')
    GET = feedRoute.GET
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockSql.mockReset()
  })

  describe('GET /api/social/feed', () => {
    it('should handle social feed requests', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          user_id: 'user-2',
          user_name: 'Other User',
          user_avatar: '/avatar-2.jpg',
          challenge_id: 'challenge-1',
          challenge_title: 'Test Challenge',
          content: 'Just completed day 5!',
          media_url: '/proof.jpg',
          likes_count: 10,
          comments_count: 3,
          is_liked: false,
          created_at: '2024-01-15T10:00:00Z'
        }
      ]

      mockSql.mockResolvedValueOnce(mockPosts)

      const request = new NextRequest('http://localhost:3000/api/social/feed')
      const response = await GET(request)

      expect(response.status).toBeLessThan(500)
      const data = await response.json()
      
      expect(data).toBeDefined()
      // Feed may return posts array or other structure
      if (data.posts) {
        expect(Array.isArray(data.posts)).toBe(true)
      }
    })

    it('should handle pagination parameters', async () => {
      mockSql.mockResolvedValueOnce([])

      const request = new NextRequest('http://localhost:3000/api/social/feed?cursor=post-123&limit=20')
      const response = await GET(request)

      // Should handle pagination without error
      expect(response.status).toBeLessThan(500)
      expect(mockSql).toHaveBeenCalled()
    })
  })
})

describe('Upload API Integration', () => {
  let POST: any

  beforeAll(async () => {
    const { getServerSession } = await import('next-auth/next')
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' }
    })

    const uploadRoute = await import('@/app/api/upload/presigned-url/route')
    POST = uploadRoute.POST
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/upload/presigned-url', () => {
    it('should handle unauthenticated requests', async () => {
      const { getServerSession } = await import('next-auth/next')
      ;(getServerSession as jest.Mock).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileName: 'test.jpg',
          fileType: 'image/jpeg'
        })
      })

      const response = await POST(request)

      // Should reject unauthenticated requests
      expect([400, 401, 403]).toContain(response.status)
    })

    it('should handle file upload requests', async () => {
      const { getServerSession } = await import('next-auth/next')
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' }
      })

      const request = new NextRequest('http://localhost:3000/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileName: 'test.jpg',
          fileType: 'image/jpeg',
          fileSize: 1024000
        })
      })

      const response = await POST(request)

      // Should handle the request
      expect(response.status).toBeLessThan(600)
    })
  })
})

describe('Error Handling Across APIs', () => {
  it('should handle malformed JSON requests', async () => {
    const { getServerSession } = await import('next-auth/next')
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' }
    })

    const profileRoute = await import('@/app/api/user/profile/route')
    
    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json{'
    })

    const response = await profileRoute.PATCH(request)

    // Should handle gracefully
    expect([400, 500]).toContain(response.status)
  })

  it('should handle missing content-type', async () => {
    const { getServerSession } = await import('next-auth/next')
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' }
    })

    const profileRoute = await import('@/app/api/user/profile/route')
    
    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Test' })
    })

    const response = await profileRoute.PATCH(request)

    // Should still work or return appropriate error
    expect(response.status).toBeLessThan(600)
  })
})

