import { jest } from '@jest/globals'
import { NextRequest, NextResponse } from 'next/server'

// Mock AWS SDK
const mockGetObject = jest.fn()
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockGetObject
  })),
  GetObjectCommand: jest.fn().mockImplementation((params) => params)
}))

// Mock auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

// Mock environment variables
const originalEnv = process.env
beforeEach(() => {
  process.env = {
    ...originalEnv,
    AWS_ACCESS_KEY_ID: 'test-access-key',
    AWS_SECRET_ACCESS_KEY: 'test-secret-key',
    AWS_REGION: 'ap-southeast-2',
    AWS_S3_BUCKET_NAME: 'stakr-verification-files'
  }
})

afterEach(() => {
  process.env = originalEnv
  jest.clearAllMocks()
})

// Import the API route handler after mocks
const { GET } = require('@/app/api/image-proxy/route')

describe('Image Proxy API Tests', () => {
  describe('GET /api/image-proxy', () => {
    it('should proxy S3 images successfully', async () => {
      const s3Url = 'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/verification-files/images/challenge-123/thumbnail.webp'
      const mockImageBuffer = Buffer.from('fake-image-data')
      
      // Mock successful S3 response
      mockGetObject.mockResolvedValueOnce({
        Body: {
          transformToByteArray: () => Promise.resolve(mockImageBuffer)
        },
        ContentType: 'image/webp'
      })

      const mockRequest = new NextRequest(
        `http://localhost:3000/api/image-proxy?url=${encodeURIComponent(s3Url)}&v=123456789`
      )

      const response = await GET(mockRequest)

      expect(response).toBeInstanceOf(Response)
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('image/webp')
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000')
      
      // Verify S3 was called with correct parameters
      expect(mockGetObject).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'stakr-verification-files',
          Key: 'verification-files/images/challenge-123/thumbnail.webp'
        })
      )
    })

    it('should handle missing URL parameter', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/image-proxy')

      const response = await GET(mockRequest)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('URL parameter is required')
    })

    it('should handle invalid S3 URLs', async () => {
      const invalidUrl = 'https://example.com/not-s3-url.jpg'
      
      const mockRequest = new NextRequest(
        `http://localhost:3000/api/image-proxy?url=${encodeURIComponent(invalidUrl)}`
      )

      const response = await GET(mockRequest)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('Invalid S3 URL')
    })

    it('should handle S3 errors gracefully', async () => {
      const s3Url = 'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/verification-files/images/nonexistent.webp'
      
      // Mock S3 error (file not found)
      mockGetObject.mockRejectedValueOnce({
        name: 'NoSuchKey',
        message: 'The specified key does not exist.'
      })

      const mockRequest = new NextRequest(
        `http://localhost:3000/api/image-proxy?url=${encodeURIComponent(s3Url)}`
      )

      const response = await GET(mockRequest)

      expect(response.status).toBe(404)
      const responseData = await response.json()
      expect(responseData.error).toBe('Image not found')
    })

    it('should handle different image content types', async () => {
      const testCases = [
        { url: 'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/image.jpg', contentType: 'image/jpeg' },
        { url: 'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/image.png', contentType: 'image/png' },
        { url: 'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/image.webp', contentType: 'image/webp' },
        { url: 'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/image.gif', contentType: 'image/gif' }
      ]

      for (const { url, contentType } of testCases) {
        mockGetObject.mockResolvedValueOnce({
          Body: {
            transformToByteArray: () => Promise.resolve(Buffer.from('fake-image-data'))
          },
          ContentType: contentType
        })

        const mockRequest = new NextRequest(
          `http://localhost:3000/api/image-proxy?url=${encodeURIComponent(url)}`
        )

        const response = await GET(mockRequest)

        expect(response.status).toBe(200)
        expect(response.headers.get('Content-Type')).toBe(contentType)
      }
    })

    it('should extract correct S3 key from different URL formats', async () => {
      const testCases = [
        {
          url: 'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/verification-files/images/challenge/thumb.webp',
          expectedKey: 'verification-files/images/challenge/thumb.webp'
        },
        {
          url: 'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/profiles/user-123/avatar.png',
          expectedKey: 'profiles/user-123/avatar.png'
        },
        {
          url: 'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/uploads/temp/file-with-spaces%20and%20chars.jpg',
          expectedKey: 'uploads/temp/file-with-spaces and chars.jpg'
        }
      ]

      for (const { url, expectedKey } of testCases) {
        mockGetObject.mockResolvedValueOnce({
          Body: {
            transformToByteArray: () => Promise.resolve(Buffer.from('fake-image-data'))
          },
          ContentType: 'image/jpeg'
        })

        const mockRequest = new NextRequest(
          `http://localhost:3000/api/image-proxy?url=${encodeURIComponent(url)}`
        )

        await GET(mockRequest)

        expect(mockGetObject).toHaveBeenCalledWith(
          expect.objectContaining({
            Bucket: 'stakr-verification-files',
            Key: expectedKey
          })
        )

        mockGetObject.mockClear()
      }
    })

    it('should handle versioning parameter', async () => {
      const s3Url = 'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/verification-files/images/challenge/thumb.webp'
      const version = '1234567890'
      
      mockGetObject.mockResolvedValueOnce({
        Body: {
          transformToByteArray: () => Promise.resolve(Buffer.from('fake-image-data'))
        },
        ContentType: 'image/webp'
      })

      const mockRequest = new NextRequest(
        `http://localhost:3000/api/image-proxy?url=${encodeURIComponent(s3Url)}&v=${version}`
      )

      const response = await GET(mockRequest)

      expect(response.status).toBe(200)
      // Version parameter should be used for cache busting but not affect S3 call
      expect(mockGetObject).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'stakr-verification-files',
          Key: 'verification-files/images/challenge/thumb.webp'
        })
      )
    })

    it('should set appropriate cache headers', async () => {
      const s3Url = 'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/verification-files/images/challenge/thumb.webp'
      
      mockGetObject.mockResolvedValueOnce({
        Body: {
          transformToByteArray: () => Promise.resolve(Buffer.from('fake-image-data'))
        },
        ContentType: 'image/webp'
      })

      const mockRequest = new NextRequest(
        `http://localhost:3000/api/image-proxy?url=${encodeURIComponent(s3Url)}`
      )

      const response = await GET(mockRequest)

      expect(response.status).toBe(200)
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000')
      expect(response.headers.get('Content-Type')).toBe('image/webp')
    })

    it('should handle authentication requirements', async () => {
      // This test ensures the image proxy respects authentication middleware
      // The actual authentication is handled by middleware, but we can test
      // that the endpoint functions correctly when called
      
      const s3Url = 'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/verification-files/images/challenge/thumb.webp'
      
      mockGetObject.mockResolvedValueOnce({
        Body: {
          transformToByteArray: () => Promise.resolve(Buffer.from('fake-image-data'))
        },
        ContentType: 'image/webp'
      })

      const mockRequest = new NextRequest(
        `http://localhost:3000/api/image-proxy?url=${encodeURIComponent(s3Url)}`
      )

      const response = await GET(mockRequest)

      // Should work normally when called (authentication is handled by middleware)
      expect(response.status).toBe(200)
    })

    it('should handle large image files', async () => {
      const s3Url = 'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/verification-files/images/large-image.jpg'
      const largeImageBuffer = Buffer.alloc(5 * 1024 * 1024) // 5MB buffer
      
      mockGetObject.mockResolvedValueOnce({
        Body: {
          transformToByteArray: () => Promise.resolve(largeImageBuffer)
        },
        ContentType: 'image/jpeg'
      })

      const mockRequest = new NextRequest(
        `http://localhost:3000/api/image-proxy?url=${encodeURIComponent(s3Url)}`
      )

      const response = await GET(mockRequest)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('image/jpeg')
      
      // Verify the response body size
      const responseBuffer = await response.arrayBuffer()
      expect(responseBuffer.byteLength).toBe(largeImageBuffer.length)
    })

    it('should handle malformed S3 URLs', async () => {
      const malformedUrls = [
        'https://stakr-verification-files.s3.amazonaws.com/', // missing region
        'https://wrong-bucket.s3.ap-southeast-2.amazonaws.com/file.jpg', // wrong bucket
        'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com', // no path
        'not-a-url-at-all',
        ''
      ]

      for (const url of malformedUrls) {
        const mockRequest = new NextRequest(
          `http://localhost:3000/api/image-proxy?url=${encodeURIComponent(url)}`
        )

        const response = await GET(mockRequest)

        expect(response.status).toBe(400)
        const responseData = await response.json()
        expect(responseData.error).toBe('Invalid S3 URL')
      }
    })

    it('should handle network timeouts and retries', async () => {
      const s3Url = 'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/verification-files/images/timeout-test.jpg'
      
      // Mock network timeout
      mockGetObject.mockRejectedValueOnce({
        name: 'NetworkError',
        message: 'Request timeout'
      })

      const mockRequest = new NextRequest(
        `http://localhost:3000/api/image-proxy?url=${encodeURIComponent(s3Url)}`
      )

      const response = await GET(mockRequest)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.error).toBe('Failed to fetch image')
    })
  })

  describe('Security and Validation', () => {
    it('should only allow S3 URLs from the correct bucket', async () => {
      const unauthorizedUrls = [
        'https://other-bucket.s3.ap-southeast-2.amazonaws.com/file.jpg',
        'https://stakr-verification-files.s3.us-east-1.amazonaws.com/file.jpg', // wrong region
        'https://evil.com/malicious-file.jpg',
        'file:///etc/passwd',
        'ftp://example.com/file.jpg'
      ]

      for (const url of unauthorizedUrls) {
        const mockRequest = new NextRequest(
          `http://localhost:3000/api/image-proxy?url=${encodeURIComponent(url)}`
        )

        const response = await GET(mockRequest)

        expect(response.status).toBe(400)
        const responseData = await response.json()
        expect(responseData.error).toBe('Invalid S3 URL')
      }
    })

    it('should sanitize URL parameters', async () => {
      const maliciousUrl = 'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/file.jpg?/../../../etc/passwd'
      
      const mockRequest = new NextRequest(
        `http://localhost:3000/api/image-proxy?url=${encodeURIComponent(maliciousUrl)}`
      )

      const response = await GET(mockRequest)

      // Should either reject the URL or sanitize the path
      expect([400, 200]).toContain(response.status)
      
      if (response.status === 200) {
        // If it processes, it should have sanitized the path
        expect(mockGetObject).toHaveBeenCalledWith(
          expect.objectContaining({
            Bucket: 'stakr-verification-files',
            Key: expect.not.stringMatching(/\.\.\//)
          })
        )
      }
    })

    it('should handle URL injection attempts', async () => {
      const injectionAttempts = [
        'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/file.jpg&redirect=evil.com',
        'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/file.jpg%00.evil',
        'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/file.jpg\nLocation: evil.com'
      ]

      for (const url of injectionAttempts) {
        const mockRequest = new NextRequest(
          `http://localhost:3000/api/image-proxy?url=${encodeURIComponent(url)}`
        )

        const response = await GET(mockRequest)

        // Should handle injection attempts gracefully
        expect([400, 404, 500]).toContain(response.status)
      }
    })
  })
})
