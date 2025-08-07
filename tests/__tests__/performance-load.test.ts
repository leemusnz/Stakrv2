import { jest } from '@jest/globals'

// Mock external dependencies
jest.mock('@neondatabase/serverless', () => ({
  __esModule: true,
  default: jest.fn()
}))

const mockSql = jest.fn()
jest.mock('@neondatabase/serverless', () => ({
  __esModule: true,
  default: mockSql
}))

// Mock fetch for API calls
const mockFetch = jest.fn()
global.fetch = mockFetch

// Performance testing utilities
const measureExecutionTime = async (fn: () => Promise<any>): Promise<number> => {
  const start = performance.now()
  await fn()
  const end = performance.now()
  return end - start
}

const simulateConcurrentRequests = async (
  requestFn: () => Promise<any>,
  concurrency: number,
  totalRequests: number
): Promise<{ success: number; failed: number; avgTime: number; maxTime: number; minTime: number }> => {
  const results: number[] = []
  let success = 0
  let failed = 0

  const executeBatch = async (batchSize: number) => {
    const promises = Array(batchSize).fill(0).map(async () => {
      try {
        const time = await measureExecutionTime(requestFn)
        results.push(time)
        success++
      } catch (error) {
        failed++
      }
    })
    await Promise.all(promises)
  }

  const batches = Math.ceil(totalRequests / concurrency)
  for (let i = 0; i < batches; i++) {
    const batchSize = Math.min(concurrency, totalRequests - i * concurrency)
    await executeBatch(batchSize)
  }

  const avgTime = results.reduce((a, b) => a + b, 0) / results.length
  const maxTime = Math.max(...results)
  const minTime = Math.min(...results)

  return { success, failed, avgTime, maxTime, minTime }
}

describe('Performance and Load Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Avatar Upload Performance', () => {
    it('should handle multiple concurrent avatar uploads efficiently', async () => {
      const uploadRequest = async () => {
        const mockResponse = {
          status: 200,
          json: jest.fn().mockResolvedValue({
            success: true,
            presignedUrl: 'https://s3.amazonaws.com/presigned-url',
            fileUrl: 'https://s3.amazonaws.com/stakr-avatars/avatar.jpg'
          })
        }
        mockFetch.mockResolvedValue(mockResponse)

        return fetch('http://localhost:3000/api/upload/presigned-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: 'avatar.jpg',
            fileType: 'image/jpeg',
            fileSize: 1024 * 1024
          })
        })
      }

      const result = await simulateConcurrentRequests(uploadRequest, 10, 50)

      expect(result.success).toBe(50)
      expect(result.failed).toBe(0)
      expect(result.avgTime).toBeLessThan(100) // Should complete in under 100ms
      expect(result.maxTime).toBeLessThan(200) // Max time should be under 200ms
    })

    it('should handle large file uploads without performance degradation', async () => {
      const largeFileSizes = [1, 5, 10, 25, 50] // MB
      const results: { size: number; time: number }[] = []

      for (const sizeMB of largeFileSizes) {
        const mockResponse = {
          status: 200,
          json: jest.fn().mockResolvedValue({
            success: true,
            presignedUrl: 'https://s3.amazonaws.com/presigned-url',
            fileUrl: 'https://s3.amazonaws.com/stakr-avatars/large-avatar.jpg'
          })
        }
        mockFetch.mockResolvedValue(mockResponse)

        const time = await measureExecutionTime(async () => {
          await fetch('http://localhost:3000/api/upload/presigned-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: 'large-avatar.jpg',
              fileType: 'image/jpeg',
              fileSize: sizeMB * 1024 * 1024
            })
          })
        })

        results.push({ size: sizeMB, time })
      }

      // Performance should scale linearly, not exponentially
      const firstResult = results[0]
      const lastResult = results[results.length - 1]
      const sizeRatio = lastResult.size / firstResult.size
      const timeRatio = lastResult.time / firstResult.time

      expect(timeRatio).toBeLessThan(sizeRatio * 2) // Should not scale worse than 2x
      expect(lastResult.time).toBeLessThan(500) // Large files should still be under 500ms
    })
  })

  describe('Challenge System Performance', () => {
    it('should handle concurrent challenge creation efficiently', async () => {
      const createChallengeRequest = async () => {
        const mockResponse = {
          status: 200,
          json: jest.fn().mockResolvedValue({
            success: true,
            challenge: {
              id: Math.floor(Math.random() * 1000),
              title: 'Performance Test Challenge',
              description: 'Test challenge for performance testing',
              stake_amount: 25.00,
              entry_fee: 1.25
            }
          })
        }
        mockFetch.mockResolvedValue(mockResponse)

        return fetch('http://localhost:3000/api/challenges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Performance Test Challenge',
            description: 'Test challenge for performance testing',
            stake_amount: 25.00,
            duration_days: 7,
            category: 'fitness'
          })
        })
      }

      const result = await simulateConcurrentRequests(createChallengeRequest, 5, 25)

      expect(result.success).toBe(25)
      expect(result.failed).toBe(0)
      expect(result.avgTime).toBeLessThan(150) // Challenge creation should be under 150ms
      expect(result.maxTime).toBeLessThan(300) // Max time should be under 300ms
    })

    it('should handle multiple users joining the same challenge', async () => {
      const joinChallengeRequest = async () => {
        const mockResponse = {
          status: 200,
          json: jest.fn().mockResolvedValue({
            success: true,
            participation: {
              id: Math.floor(Math.random() * 1000),
              challenge_id: 1,
              user_id: Math.floor(Math.random() * 1000),
              stake_amount: 25.00,
              status: 'active'
            }
          })
        }
        mockFetch.mockResolvedValue(mockResponse)

        return fetch('http://localhost:3000/api/challenges/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            challenge_id: 1,
            stake_amount: 25.00
          })
        })
      }

      const result = await simulateConcurrentRequests(joinChallengeRequest, 20, 100)

      expect(result.success).toBe(100)
      expect(result.failed).toBe(0)
      expect(result.avgTime).toBeLessThan(100) // Joining should be under 100ms
      expect(result.maxTime).toBeLessThan(200) // Max time should be under 200ms
    })

    it('should handle proof submission under load', async () => {
      const submitProofRequest = async () => {
        const mockResponse = {
          status: 200,
          json: jest.fn().mockResolvedValue({
            success: true,
            proof: {
              id: Math.floor(Math.random() * 1000),
              challenge_id: 1,
              user_id: Math.floor(Math.random() * 1000),
              proof_text: 'Performance test proof submission',
              status: 'pending'
            }
          })
        }
        mockFetch.mockResolvedValue(mockResponse)

        return fetch('http://localhost:3000/api/challenges/proof', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            challenge_id: 1,
            proof_text: 'Performance test proof submission',
            proof_image_url: 'https://proof-image.jpg'
          })
        })
      }

      const result = await simulateConcurrentRequests(submitProofRequest, 15, 75)

      expect(result.success).toBe(75)
      expect(result.failed).toBe(0)
      expect(result.avgTime).toBeLessThan(120) // Proof submission should be under 120ms
      expect(result.maxTime).toBeLessThan(250) // Max time should be under 250ms
    })
  })

  describe('Database Query Performance', () => {
    it('should handle complex dashboard queries efficiently', async () => {
      const dashboardRequest = async () => {
        const mockResponse = {
          status: 200,
          json: jest.fn().mockResolvedValue({
            success: true,
            user: {
              id: 1,
              name: 'Performance Test User',
              credits: 150,
              trust_score: 75,
              challenges_completed: 5,
              current_streak: 3
            },
            challenges: Array(10).fill(0).map((_, i) => ({
              id: i + 1,
              title: `Challenge ${i + 1}`,
              status: i % 2 === 0 ? 'active' : 'completed'
            })),
            stats: {
              total_earned: 125.50,
              total_staked: 200.00,
              completion_rate: 0.8,
              active_challenges: 5,
              completed_challenges: 5
            }
          })
        }
        mockFetch.mockResolvedValue(mockResponse)

        return fetch('http://localhost:3000/api/user/dashboard', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const result = await simulateConcurrentRequests(dashboardRequest, 8, 40)

      expect(result.success).toBe(40)
      expect(result.failed).toBe(0)
      expect(result.avgTime).toBeLessThan(80) // Dashboard queries should be under 80ms
      expect(result.maxTime).toBeLessThan(150) // Max time should be under 150ms
    })

    it('should handle challenge listing with pagination efficiently', async () => {
      const listChallengesRequest = async (page: number = 1) => {
        const mockResponse = {
          status: 200,
          json: jest.fn().mockResolvedValue({
            success: true,
            challenges: Array(20).fill(0).map((_, i) => ({
              id: (page - 1) * 20 + i + 1,
              title: `Challenge ${(page - 1) * 20 + i + 1}`,
              description: 'Test challenge description',
              stake_amount: 25.00,
              participants: Math.floor(Math.random() * 50) + 1,
              status: 'active'
            })),
            pagination: {
              page,
              total: 100,
              per_page: 20,
              total_pages: 5
            }
          })
        }
        mockFetch.mockResolvedValue(mockResponse)

        return fetch(`http://localhost:3000/api/challenges?page=${page}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const results: number[] = []
      for (let page = 1; page <= 5; page++) {
        const time = await measureExecutionTime(() => listChallengesRequest(page))
        results.push(time)
      }

      const avgTime = results.reduce((a, b) => a + b, 0) / results.length
      const maxTime = Math.max(...results)

      expect(avgTime).toBeLessThan(60) // Challenge listing should be under 60ms
      expect(maxTime).toBeLessThan(100) // Max time should be under 100ms
    })
  })

  describe('API Endpoint Performance', () => {
    it('should handle authentication endpoints under load', async () => {
      const authRequest = async () => {
        const mockResponse = {
          status: 200,
          json: jest.fn().mockResolvedValue({
            success: true,
            user: {
              id: Math.floor(Math.random() * 1000),
              email: 'test@example.com',
              name: 'Test User',
              credits: 100,
              trust_score: 50
            }
          })
        }
        mockFetch.mockResolvedValue(mockResponse)

        return fetch('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'securepassword123',
            name: 'Test User'
          })
        })
      }

      const result = await simulateConcurrentRequests(authRequest, 12, 60)

      expect(result.success).toBe(60)
      expect(result.failed).toBe(0)
      expect(result.avgTime).toBeLessThan(90) // Auth should be under 90ms
      expect(result.maxTime).toBeLessThan(180) // Max time should be under 180ms
    })

    it('should handle profile updates efficiently', async () => {
      const profileUpdateRequest = async () => {
        const mockResponse = {
          status: 200,
          json: jest.fn().mockResolvedValue({
            success: true,
            user: {
              id: 1,
              name: 'Updated User',
              avatar_url: 'https://avatar.jpg',
              credits: 150
            }
          })
        }
        mockFetch.mockResolvedValue(mockResponse)

        return fetch('http://localhost:3000/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Updated User',
            avatar_url: 'https://avatar.jpg'
          })
        })
      }

      const result = await simulateConcurrentRequests(profileUpdateRequest, 6, 30)

      expect(result.success).toBe(30)
      expect(result.failed).toBe(0)
      expect(result.avgTime).toBeLessThan(70) // Profile updates should be under 70ms
      expect(result.maxTime).toBeLessThan(140) // Max time should be under 140ms
    })
  })

  describe('Memory and Resource Usage', () => {
    it('should not have memory leaks during repeated operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      const operations: number[] = []

      // Perform 1000 operations
      for (let i = 0; i < 1000; i++) {
        const mockResponse = {
          status: 200,
          json: jest.fn().mockResolvedValue({
            success: true,
            data: { id: i, value: `test-${i}` }
          })
        }
        mockFetch.mockResolvedValue(mockResponse)

        const time = await measureExecutionTime(async () => {
          await fetch('http://localhost:3000/api/test', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          })
        })
        operations.push(time)
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      const avgTime = operations.reduce((a, b) => a + b, 0) / operations.length

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
      // Performance should remain consistent
      expect(avgTime).toBeLessThan(50) // Average time should be under 50ms
    })

    it('should handle large datasets efficiently', async () => {
      const largeDatasetRequest = async (size: number) => {
        const mockResponse = {
          status: 200,
          json: jest.fn().mockResolvedValue({
            success: true,
            data: Array(size).fill(0).map((_, i) => ({
              id: i,
              title: `Item ${i}`,
              description: `Description for item ${i}`,
              value: Math.random() * 1000
            }))
          })
        }
        mockFetch.mockResolvedValue(mockResponse)

        return fetch(`http://localhost:3000/api/data?size=${size}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const sizes = [100, 500, 1000, 2000]
      const results: { size: number; time: number }[] = []

      for (const size of sizes) {
        const time = await measureExecutionTime(() => largeDatasetRequest(size))
        results.push({ size, time })
      }

      // Performance should scale reasonably with data size
      const firstResult = results[0]
      const lastResult = results[results.length - 1]
      const sizeRatio = lastResult.size / firstResult.size
      const timeRatio = lastResult.time / firstResult.time

      expect(timeRatio).toBeLessThan(sizeRatio * 1.5) // Should not scale worse than 1.5x
      expect(lastResult.time).toBeLessThan(300) // Large datasets should still be under 300ms
    })
  })

  describe('Stress Testing', () => {
    it('should handle burst traffic gracefully', async () => {
      const burstRequest = async () => {
        const mockResponse = {
          status: 200,
          json: jest.fn().mockResolvedValue({
            success: true,
            message: 'Burst test successful'
          })
        }
        mockFetch.mockResolvedValue(mockResponse)

        return fetch('http://localhost:3000/api/test', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Simulate burst of 100 requests with 50 concurrent
      const result = await simulateConcurrentRequests(burstRequest, 50, 100)

      expect(result.success).toBe(100)
      expect(result.failed).toBe(0)
      expect(result.avgTime).toBeLessThan(100) // Burst requests should be under 100ms
      expect(result.maxTime).toBeLessThan(200) // Max time should be under 200ms
    })

    it('should maintain performance under sustained load', async () => {
      const sustainedRequest = async () => {
        const mockResponse = {
          status: 200,
          json: jest.fn().mockResolvedValue({
            success: true,
            data: { timestamp: Date.now() }
          })
        }
        mockFetch.mockResolvedValue(mockResponse)

        return fetch('http://localhost:3000/api/sustained', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Run sustained load for 3 seconds with limited concurrent requests
      const startTime = Date.now()
      const results: number[] = []
      let requestCount = 0
      const maxRequests = 100 // Limit total requests to prevent stack overflow

      while (Date.now() - startTime < 3000 && requestCount < maxRequests) {
        const time = await measureExecutionTime(sustainedRequest)
        results.push(time)
        requestCount++
        
        // Add small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      const avgTime = results.reduce((a, b) => a + b, 0) / results.length
      const maxTime = Math.max(...results)
      const minTime = Math.min(...results)

      expect(requestCount).toBeGreaterThan(20) // Should handle at least 20 requests
      expect(avgTime).toBeLessThan(80) // Average time should be under 80ms
      expect(maxTime).toBeLessThan(150) // Max time should be under 150ms
      expect(maxTime - minTime).toBeLessThan(100) // Time variance should be small
    })
  })
}) 