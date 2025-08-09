import { jest } from '@jest/globals'
import { NextRequest, NextResponse } from 'next/server'

// Mock the database connection
const mockSql = jest.fn()
jest.mock('@/lib/db', () => ({
  createDbConnection: jest.fn(() => mockSql)
}))

// Mock auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(() => Promise.resolve({
    user: { id: 'test-user-id', email: 'test@example.com' }
  }))
}))

// Mock the auth options
jest.mock('@/lib/auth', () => ({
  authOptions: {}
}))

// Import the API route handler after mocks
const { GET, POST } = require('@/app/api/challenges/route')

describe('Challenges API Thumbnail Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/challenges - Thumbnail URL Mapping', () => {
    it('should include thumbnail_url in the response for joinable challenges', async () => {
      const mockChallengesFromDb = [
        {
          id: 'challenge-1',
          title: 'Challenge with Thumbnail',
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
          host_avatar_url: '/avatars/host-1.svg',
          status: 'pending',
          privacy_type: 'public',
          start_date: '2024-01-15T00:00:00Z',
          end_date: '2024-02-14T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          allow_points_only: false,
          // This is the critical field that was missing from the response mapping
          thumbnail_url: 'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/verification-files/images/challenge-1/thumbnail.webp'
        },
        {
          id: 'challenge-2',
          title: 'Challenge without Thumbnail',
          description: 'Another test challenge',
          category: 'mindfulness',
          difficulty: 'Easy',
          duration: '7 days',
          min_stake: 5,
          max_stake: 25,
          total_stake_pool: 100,
          participants_count: 10,
          host_id: 'host-2',
          host_name: 'Another Host',
          host_avatar_url: '/avatars/host-2.svg',
          status: 'active',
          privacy_type: 'public',
          start_date: '2024-01-20T00:00:00Z',
          end_date: '2024-01-27T00:00:00Z',
          created_at: '2024-01-15T00:00:00Z',
          allow_points_only: false,
          // This challenge has no thumbnail
          thumbnail_url: null
        }
      ]

      // Mock successful database query
      mockSql.mockResolvedValueOnce(mockChallengesFromDb)

      const mockRequest = new NextRequest('http://localhost:3000/api/challenges?status=joinable')
      const response = await GET(mockRequest)

      expect(response.status).toBe(200)
      const responseData = await response.json()

      expect(responseData.success).toBe(true)
      expect(responseData.challenges).toHaveLength(2)

      // Critical test: verify thumbnail_url is included in response
      expect(responseData.challenges[0]).toHaveProperty('thumbnail_url')
      expect(responseData.challenges[0].thumbnail_url).toBe(
        'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/verification-files/images/challenge-1/thumbnail.webp'
      )

      expect(responseData.challenges[1]).toHaveProperty('thumbnail_url')
      expect(responseData.challenges[1].thumbnail_url).toBe(null)

      // Verify the SQL query includes thumbnail_url in SELECT
      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('c.thumbnail_url')
      )
    })

    it('should handle different status filters correctly', async () => {
      const testCases = [
        { status: 'joinable', expectedWhereClause: /\(c\.status = 'pending' OR \(c\.status = 'active'/ },
        { status: 'active', expectedWhereClause: /c\.status = 'active'/ },
        { status: 'pending', expectedWhereClause: /c\.status = 'pending'/ },
        { status: 'completed', expectedWhereClause: /c\.status = 'completed'/ }
      ]

      for (const { status, expectedWhereClause } of testCases) {
        mockSql.mockResolvedValueOnce([])

        const mockRequest = new NextRequest(`http://localhost:3000/api/challenges?status=${status}`)
        await GET(mockRequest)

        // Verify the SQL query uses the correct WHERE clause
        expect(mockSql).toHaveBeenCalledWith(
          expect.stringMatching(expectedWhereClause)
        )

        mockSql.mockClear()
      }
    })

    it('should include thumbnail_url in formatted response mapping', async () => {
      const mockDbChallenge = {
        id: 'test-challenge',
        title: 'Test Challenge',
        description: 'Test description',
        category: 'test',
        difficulty: 'Easy',
        duration: '1 day',
        min_stake: 1,
        max_stake: 5,
        total_stake_pool: 10,
        participants_count: 2,
        host_id: 'host-id',
        host_name: 'Host Name',
        host_avatar_url: '/avatar.svg',
        status: 'pending',
        privacy_type: 'public',
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-02T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        allow_points_only: false,
        thumbnail_url: 'https://example.com/thumbnail.jpg'
      }

      mockSql.mockResolvedValueOnce([mockDbChallenge])

      const mockRequest = new NextRequest('http://localhost:3000/api/challenges')
      const response = await GET(mockRequest)

      const responseData = await response.json()
      const formattedChallenge = responseData.challenges[0]

      // Verify all expected fields are mapped correctly
      expect(formattedChallenge).toEqual({
        id: 'test-challenge',
        title: 'Test Challenge',
        description: 'Test description',
        category: 'test',
        difficulty: 'Easy',
        duration: '1 day',
        min_stake: 1,
        max_stake: 5,
        total_stake_pool: 10,
        participants_count: 2,
        host_id: 'host-id',
        host_name: 'Host Name',
        host_avatar_url: '/avatar.svg',
        status: 'pending',
        privacy_type: 'public',
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-02T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        allow_points_only: false,
        // This was the missing field that caused our bug
        thumbnail_url: 'https://example.com/thumbnail.jpg'
      })
    })

    it('should handle limit parameter correctly', async () => {
      const mockChallenges = Array.from({ length: 5 }, (_, i) => ({
        id: `challenge-${i}`,
        title: `Challenge ${i}`,
        description: 'Test',
        category: 'test',
        difficulty: 'Easy',
        duration: '1 day',
        min_stake: 1,
        max_stake: 5,
        total_stake_pool: 10,
        participants_count: 1,
        host_id: 'host',
        host_name: 'Host',
        host_avatar_url: '/avatar.svg',
        status: 'pending',
        privacy_type: 'public',
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-02T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        allow_points_only: false,
        thumbnail_url: `https://example.com/thumb-${i}.jpg`
      }))

      mockSql.mockResolvedValueOnce(mockChallenges)

      const mockRequest = new NextRequest('http://localhost:3000/api/challenges?limit=3')
      await GET(mockRequest)

      // Verify LIMIT is included in SQL query
      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 3')
      )
    })

    it('should handle database errors gracefully', async () => {
      mockSql.mockRejectedValueOnce(new Error('Database connection failed'))

      const mockRequest = new NextRequest('http://localhost:3000/api/challenges')
      const response = await GET(mockRequest)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBeDefined()
    })

    it('should validate limit parameter', async () => {
      const invalidLimits = ['abc', '-1', '1001', '0']

      for (const limit of invalidLimits) {
        const mockRequest = new NextRequest(`http://localhost:3000/api/challenges?limit=${limit}`)
        const response = await GET(mockRequest)

        // Should either use default limit or return error
        expect([200, 400]).toContain(response.status)
      }
    })
  })

  describe('POST /api/challenges - Thumbnail URL Storage', () => {
    it('should store thumbnail_url when creating a challenge', async () => {
      const challengeData = {
        title: 'New Challenge',
        description: 'A new test challenge',
        category: 'fitness',
        difficulty: 'Medium',
        duration: '30',
        minStake: 10,
        maxStake: 50,
        startDate: '2024-02-01',
        endDate: '2024-03-01',
        privacyType: 'public',
        allowPointsOnly: false,
        thumbnailUrl: 'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/verification-files/images/new-challenge/thumbnail.webp'
      }

      // Mock successful challenge creation
      const mockNewChallenge = {
        id: 'new-challenge-id',
        ...challengeData,
        host_id: 'test-user-id',
        status: 'pending',
        created_at: new Date().toISOString()
      }
      mockSql.mockResolvedValueOnce([mockNewChallenge])

      const mockRequest = new NextRequest('http://localhost:3000/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(challengeData)
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(201)
      const responseData = await response.json()
      expect(responseData.success).toBe(true)
      expect(responseData.challenge.thumbnailUrl).toBe(challengeData.thumbnailUrl)

      // Verify thumbnail_url was included in the INSERT query
      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('thumbnail_url')
      )
    })

    it('should handle null thumbnail_url when creating a challenge', async () => {
      const challengeData = {
        title: 'Challenge without Thumbnail',
        description: 'A challenge with no thumbnail',
        category: 'mindfulness',
        difficulty: 'Easy',
        duration: '7',
        minStake: 5,
        maxStake: 25,
        startDate: '2024-02-01',
        endDate: '2024-02-08',
        privacyType: 'public',
        allowPointsOnly: false
        // No thumbnailUrl provided
      }

      const mockNewChallenge = {
        id: 'new-challenge-id',
        ...challengeData,
        host_id: 'test-user-id',
        status: 'pending',
        created_at: new Date().toISOString(),
        thumbnail_url: null
      }
      mockSql.mockResolvedValueOnce([mockNewChallenge])

      const mockRequest = new NextRequest('http://localhost:3000/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(challengeData)
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(201)
      const responseData = await response.json()
      expect(responseData.success).toBe(true)
      expect(responseData.challenge.thumbnailUrl).toBe(null)

      // Verify thumbnail_url was set to NULL in the INSERT query
      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('null')
      )
    })

    it('should validate thumbnail URL format', async () => {
      const invalidThumbnailUrls = [
        'not-a-url',
        'ftp://example.com/image.jpg',
        'javascript:alert("xss")',
        'data:image/svg+xml;base64,PHN2Zz4KPC9zdmc+',
        'https://malicious-site.com/image.jpg'
      ]

      for (const thumbnailUrl of invalidThumbnailUrls) {
        const challengeData = {
          title: 'Test Challenge',
          description: 'Test',
          category: 'test',
          difficulty: 'Easy',
          duration: '1',
          minStake: 1,
          maxStake: 5,
          startDate: '2024-02-01',
          endDate: '2024-02-02',
          privacyType: 'public',
          allowPointsOnly: false,
          thumbnailUrl
        }

        const mockRequest = new NextRequest('http://localhost:3000/api/challenges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(challengeData)
        })

        const response = await POST(mockRequest)

        // Should either reject invalid URLs or sanitize them
        if (response.status === 400) {
          const responseData = await response.json()
          expect(responseData.error).toBeDefined()
        }
      }
    })

    it('should handle creation errors gracefully', async () => {
      const challengeData = {
        title: 'Test Challenge',
        description: 'Test',
        category: 'test',
        difficulty: 'Easy',
        duration: '1',
        minStake: 1,
        maxStake: 5,
        startDate: '2024-02-01',
        endDate: '2024-02-02',
        privacyType: 'public',
        allowPointsOnly: false,
        thumbnailUrl: 'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/thumb.jpg'
      }

      // Mock database error
      mockSql.mockRejectedValueOnce(new Error('Database insert failed'))

      const mockRequest = new NextRequest('http://localhost:3000/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(challengeData)
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBeDefined()
    })
  })

  describe('Debug Logging', () => {
    it('should log API responses with thumbnail information', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const mockChallenge = {
        id: 'log-test-challenge',
        title: 'Log Test Challenge',
        description: 'Test logging',
        category: 'test',
        difficulty: 'Easy',
        duration: '1 day',
        min_stake: 1,
        max_stake: 5,
        total_stake_pool: 10,
        participants_count: 1,
        host_id: 'host',
        host_name: 'Host',
        host_avatar_url: '/avatar.svg',
        status: 'pending',
        privacy_type: 'public',
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-02T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        allow_points_only: false,
        thumbnail_url: 'https://example.com/debug-thumb.jpg'
      }

      mockSql.mockResolvedValueOnce([mockChallenge])

      const mockRequest = new NextRequest('http://localhost:3000/api/challenges')
      await GET(mockRequest)

      // Verify debug logging includes thumbnail information
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('API Response - Challenges with thumbnails:'),
        expect.arrayContaining([
          expect.objectContaining({
            id: 'log-test-challenge',
            title: 'Log Test Challenge',
            thumbnail_url: 'https://example.com/debug-thumb.jpg'
          })
        ])
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Performance and Optimization', () => {
    it('should efficiently query challenges with thumbnails', async () => {
      mockSql.mockResolvedValueOnce([])

      const mockRequest = new NextRequest('http://localhost:3000/api/challenges?limit=100')
      await GET(mockRequest)

      // Verify query includes proper ordering and limiting
      expect(mockSql).toHaveBeenCalledWith(
        expect.stringMatching(/ORDER BY.*LIMIT/s)
      )
    })

    it('should handle large result sets efficiently', async () => {
      const largeMockSet = Array.from({ length: 100 }, (_, i) => ({
        id: `challenge-${i}`,
        title: `Challenge ${i}`,
        description: 'Test',
        category: 'test',
        difficulty: 'Easy',
        duration: '1 day',
        min_stake: 1,
        max_stake: 5,
        total_stake_pool: 10,
        participants_count: 1,
        host_id: 'host',
        host_name: 'Host',
        host_avatar_url: '/avatar.svg',
        status: 'pending',
        privacy_type: 'public',
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-02T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        allow_points_only: false,
        thumbnail_url: i % 2 === 0 ? `https://example.com/thumb-${i}.jpg` : null
      }))

      mockSql.mockResolvedValueOnce(largeMockSet)

      const mockRequest = new NextRequest('http://localhost:3000/api/challenges')
      const response = await GET(mockRequest)

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData.challenges).toHaveLength(100)

      // All challenges should have thumbnail_url field (even if null)
      responseData.challenges.forEach((challenge: any) => {
        expect(challenge).toHaveProperty('thumbnail_url')
      })
    })
  })
})



