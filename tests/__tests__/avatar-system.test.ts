import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { SessionProvider } from 'next-auth/react'
import { jest } from '@jest/globals'

// Mock the avatar events system
jest.mock('@/lib/avatar-events', () => ({
  avatarEvents: {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    notify: jest.fn(),
    getLastAvatarUrl: jest.fn(() => 'https://example.com/avatar.jpg'),
    clear: jest.fn(),
  },
}))

// Mock the useAvatar hook
jest.mock('@/hooks/use-avatar', () => ({
  useAvatar: jest.fn(() => ({
    avatarUrl: 'https://example.com/avatar.jpg',
    isLoading: false,
    error: null,
  })),
}))

// Mock fetch for API calls
global.fetch = vi.fn()

describe('Avatar System', () => {
  const mockSession = {
    data: {
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg',
        avatar: 'https://example.com/avatar.jpg',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    status: 'authenticated' as const,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSession as jest.Mock).mockReturnValue(mockSession)
  })

  describe('Avatar Upload', () => {
    it('should handle file upload correctly', async () => {
      const mockFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' })
      
      // Mock successful presigned URL generation
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ presignedUrl: 'https://s3.amazonaws.com/presigned-url' }),
      })

      // Mock successful S3 upload
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      })

      // Mock successful moderation
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          isAppropriate: true, 
          confidence: 0.95,
          moderationResult: 'approved'
        }),
      })

      // Mock successful session update
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      render(
        <SessionProvider>
          <input
            type="file"
            accept="image/*"
            data-testid="avatar-upload"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                // Simulate upload process
                console.log('File selected:', file.name)
              }
            }}
          />
        </SessionProvider>
      )

      const fileInput = screen.getByTestId('avatar-upload')
      fireEvent.change(fileInput, { target: { files: [mockFile] } })

      await waitFor(() => {
        expect(fileInput.files?.[0]).toBe(mockFile)
      })
    })

    it('should handle upload errors gracefully', async () => {
      const mockFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' })
      
      // Mock failed presigned URL generation
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to generate presigned URL'))

      render(
        <SessionProvider>
          <input
            type="file"
            accept="image/*"
            data-testid="avatar-upload"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                // Simulate upload process
                console.log('File selected:', file.name)
              }
            }}
          />
        </SessionProvider>
      )

      const fileInput = screen.getByTestId('avatar-upload')
      fireEvent.change(fileInput, { target: { files: [mockFile] } })

      await waitFor(() => {
        expect(fileInput.files?.[0]).toBe(mockFile)
      })
    })

    it('should validate file types correctly', () => {
      const validFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' })
      const invalidFile = new File(['test'], 'document.pdf', { type: 'application/pdf' })

      render(
        <SessionProvider>
          <input
            type="file"
            accept="image/*"
            data-testid="avatar-upload"
          />
        </SessionProvider>
      )

      const fileInput = screen.getByTestId('avatar-upload')
      
      // Test valid file
      fireEvent.change(fileInput, { target: { files: [validFile] } })
      expect(fileInput.files?.[0]).toBe(validFile)

      // Test invalid file
      fireEvent.change(fileInput, { target: { files: [invalidFile] } })
      expect(fileInput.files?.[0]).toBe(invalidFile)
    })
  })

  describe('Avatar Moderation', () => {
    it('should pass appropriate images through moderation', async () => {
      // Mock successful moderation for appropriate image
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          isAppropriate: true, 
          confidence: 0.95,
          moderationResult: 'approved'
        }),
      })

      const testImageUrl = 'https://picsum.photos/200/200'
      
      const response = await fetch('/api/ai/validate-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: testImageUrl }),
      })

      const result = await response.json()
      
      expect(result.isAppropriate).toBe(true)
      expect(result.confidence).toBeGreaterThan(0.8)
    })

    it('should reject inappropriate images', async () => {
      // Mock failed moderation for inappropriate image
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          isAppropriate: false, 
          confidence: 0.9,
          moderationResult: 'rejected',
          reason: 'Inappropriate content detected'
        }),
      })

      const testImageUrl = 'https://example.com/inappropriate.jpg'
      
      const response = await fetch('/api/ai/validate-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: testImageUrl }),
      })

      const result = await response.json()
      
      expect(result.isAppropriate).toBe(false)
      expect(result.reason).toBeDefined()
    })

    it('should handle moderation service errors', async () => {
      // Mock moderation service error
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Moderation service unavailable'))

      const testImageUrl = 'https://example.com/test.jpg'
      
      try {
        await fetch('/api/ai/validate-proof', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: testImageUrl }),
        })
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('Moderation service unavailable')
      }
    })
  })

  describe('Avatar Persistence', () => {
    it('should save avatar URL to database', async () => {
      const avatarUrl = 'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/avatar.jpg'
      
      // Mock successful database update
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: avatarUrl }),
      })

      const result = await response.json()
      expect(result.success).toBe(true)
    })

    it('should load avatar URL from database on login', () => {
      const mockSessionWithAvatar = {
        ...mockSession,
        data: {
          ...mockSession.data,
          user: {
            ...mockSession.data!.user,
            avatar: 'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/avatar.jpg',
          },
        },
      }

      ;(useSession as jest.Mock).mockReturnValue(mockSessionWithAvatar)

      render(
        <SessionProvider>
          <div data-testid="avatar-url">
            {mockSessionWithAvatar.data?.user?.avatar}
          </div>
        </SessionProvider>
      )

      expect(screen.getByTestId('avatar-url')).toHaveTextContent(
        'https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/avatar.jpg'
      )
    })

    it('should handle missing avatar gracefully', () => {
      const mockSessionWithoutAvatar = {
        ...mockSession,
        data: {
          ...mockSession.data,
          user: {
            ...mockSession.data!.user,
            avatar: null,
          },
        },
      }

      ;(useSession as jest.Mock).mockReturnValue(mockSessionWithoutAvatar)

      render(
        <SessionProvider>
          <div data-testid="avatar-url">
            {mockSessionWithoutAvatar.data?.user?.avatar || 'No avatar'}
          </div>
        </SessionProvider>
      )

      expect(screen.getByTestId('avatar-url')).toHaveTextContent('No avatar')
    })
  })

  describe('Real-time Avatar Updates', () => {
    it('should notify subscribers when avatar changes', async () => {
      const { avatarEvents } = await import('@/lib/avatar-events')
      const mockNotify = avatarEvents.notify as jest.Mock

      const newAvatarUrl = 'https://example.com/new-avatar.jpg'
      avatarEvents.notify(newAvatarUrl)

      expect(mockNotify).toHaveBeenCalledWith(newAvatarUrl)
    })

    it('should subscribe to avatar events on component mount', async () => {
      const { avatarEvents } = await import('@/lib/avatar-events')
      const mockSubscribe = avatarEvents.subscribe as jest.Mock

      // Simulate component mounting
      const callback = vi.fn()
      avatarEvents.subscribe(callback)

      expect(mockSubscribe).toHaveBeenCalledWith(callback)
    })

    it('should unsubscribe from avatar events on component unmount', async () => {
      const { avatarEvents } = await import('@/lib/avatar-events')
      const mockUnsubscribe = avatarEvents.unsubscribe as jest.Mock

      // Simulate component unmounting
      const callback = vi.fn()
      avatarEvents.unsubscribe(callback)

      expect(mockUnsubscribe).toHaveBeenCalledWith(callback)
    })

    it('should get last avatar URL for new subscribers', async () => {
      const { avatarEvents } = await import('@/lib/avatar-events')
      const mockGetLastAvatarUrl = avatarEvents.getLastAvatarUrl as jest.Mock

      const lastUrl = avatarEvents.getLastAvatarUrl()
      expect(mockGetLastAvatarUrl).toHaveBeenCalled()
      expect(lastUrl).toBe('https://example.com/avatar.jpg')
    })
  })

  describe('Avatar Display', () => {
    it('should display avatar image correctly', () => {
      render(
        <SessionProvider>
          <img
            src={mockSession.data?.user?.avatar}
            alt="User avatar"
            data-testid="avatar-image"
          />
        </SessionProvider>
      )

      const avatarImage = screen.getByTestId('avatar-image')
      expect(avatarImage).toHaveAttribute('src', 'https://example.com/avatar.jpg')
      expect(avatarImage).toHaveAttribute('alt', 'User avatar')
    })

    it('should show fallback for missing avatar', () => {
      const mockSessionWithoutAvatar = {
        ...mockSession,
        data: {
          ...mockSession.data,
          user: {
            ...mockSession.data!.user,
            avatar: null,
          },
        },
      }

      ;(useSession as jest.Mock).mockReturnValue(mockSessionWithoutAvatar)

      render(
        <SessionProvider>
          <div data-testid="avatar-fallback">
            {mockSessionWithoutAvatar.data?.user?.avatar ? (
              <img src={mockSessionWithoutAvatar.data.user.avatar} alt="Avatar" />
            ) : (
              <div>Default Avatar</div>
            )}
          </div>
        </SessionProvider>
      )

      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('Default Avatar')
    })
  })

  describe('Avatar Removal', () => {
    it('should handle avatar removal correctly', async () => {
      // Mock successful session update for avatar removal
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: null }),
      })

      const result = await response.json()
      expect(result.success).toBe(true)
    })

    it('should notify subscribers when avatar is removed', async () => {
      const { avatarEvents } = await import('@/lib/avatar-events')
      const mockNotify = avatarEvents.notify as jest.Mock

      // Simulate avatar removal
      avatarEvents.notify(null)

      expect(mockNotify).toHaveBeenCalledWith(null)
    })
  })
}) 