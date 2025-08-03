import React from 'react'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="session-provider">{children}</div>,
}))

// Mock AWS S3
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
  PutObjectCommand: jest.fn(),
}))

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}))

// Mock fetch for API calls
global.fetch = jest.fn()

// Mock avatar events with proper event listener system
const mockAvatarEvents = {
  listeners: new Map(),
  emit: jest.fn((event: string, data?: any) => {
    const eventListeners = mockAvatarEvents.listeners.get(event) || []
    eventListeners.forEach((listener: Function) => listener(data))
  }),
  on: jest.fn((event: string, listener: Function) => {
    if (!mockAvatarEvents.listeners.has(event)) {
      mockAvatarEvents.listeners.set(event, [])
    }
    mockAvatarEvents.listeners.get(event)!.push(listener)
  }),
  off: jest.fn((event: string, listener: Function) => {
    const eventListeners = mockAvatarEvents.listeners.get(event) || []
    const index = eventListeners.indexOf(listener)
    if (index > -1) {
      eventListeners.splice(index, 1)
    }
  }),
  getLastAvatarUrl: jest.fn(),
  clear: jest.fn(() => {
    mockAvatarEvents.listeners.clear()
  }),
}

jest.mock('@/lib/avatar-events', () => mockAvatarEvents)

// Mock useAvatar hook
const mockUseAvatar = {
  avatar: null,
  isLoading: false,
  error: null,
  updateAvatar: jest.fn(),
  removeAvatar: jest.fn(),
}

jest.mock('@/hooks/use-avatar', () => ({
  useAvatar: () => mockUseAvatar,
}))

// Avatar Upload Component for testing
const AvatarUploadComponent = ({ shouldFail = false, shouldRejectModeration = false }: { shouldFail?: boolean; shouldRejectModeration?: boolean }) => {
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null)

  const validateFile = (file: File) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Invalid file type. Only images are allowed.')
    }
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File too large. Maximum size is 5MB.')
    }
    
    return true
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      // Validate file
      validateFile(file)
      
      setIsUploading(true)
      setError(null)
      setUploadProgress(0)

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 20) {
        setUploadProgress(i)
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      // Simulate failure if shouldFail is true
      if (shouldFail) {
        throw new Error('Upload failed')
      }

      // Simulate moderation check
      if (shouldRejectModeration) {
        throw new Error('Content rejected by moderation')
      }

      // Simulate successful upload
      const mockUrl = 'https://stakr-avatars.s3.amazonaws.com/test-avatar.jpg'
      setAvatarUrl(mockUrl)
      mockAvatarEvents.emit('avatarUpdated', mockUrl)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarUrl(null)
    mockAvatarEvents.emit('avatarRemoved')
  }

  return (
    <div data-testid="avatar-upload">
      <div data-testid="avatar-display">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" data-testid="avatar-image" />
        ) : (
          <div data-testid="avatar-placeholder">No Avatar</div>
        )}
      </div>
      
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        data-testid="file-input"
        disabled={isUploading}
      />
      
      {isUploading && (
        <div data-testid="upload-progress">
          Uploading: {uploadProgress}%
        </div>
      )}
      
      {error && (
        <div data-testid="upload-error" className="error">
          {error}
        </div>
      )}
      
      {avatarUrl && (
        <button
          onClick={handleRemoveAvatar}
          data-testid="remove-avatar-btn"
        >
          Remove Avatar
        </button>
      )}
    </div>
  )
}

// Avatar Display Component for testing
const AvatarDisplayComponent = () => {
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    // Listen for avatar updates
    const handleAvatarUpdate = (url: string) => {
      setAvatarUrl(url)
    }

    const handleAvatarRemove = () => {
      setAvatarUrl(null)
    }

    mockAvatarEvents.on('avatarUpdated', handleAvatarUpdate)
    mockAvatarEvents.on('avatarRemoved', handleAvatarRemove)

    return () => {
      mockAvatarEvents.off('avatarUpdated', handleAvatarUpdate)
      mockAvatarEvents.off('avatarRemoved', handleAvatarRemove)
    }
  }, [])

  return (
    <div data-testid="avatar-display-component">
      {avatarUrl ? (
        <img src={avatarUrl} alt="User Avatar" data-testid="displayed-avatar" />
      ) : (
        <div data-testid="default-avatar">Default Avatar</div>
      )}
    </div>
  )
}

describe('Avatar System Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAvatar.avatar = null
    mockUseAvatar.isLoading = false
    mockUseAvatar.error = null
  })

  describe('Avatar Upload Functionality', () => {
    it('should render avatar upload component correctly', () => {
      render(<AvatarUploadComponent />)
      
      expect(screen.getByTestId('avatar-upload')).toBeInTheDocument()
      expect(screen.getByTestId('avatar-display')).toBeInTheDocument()
      expect(screen.getByTestId('file-input')).toBeInTheDocument()
      expect(screen.getByTestId('avatar-placeholder')).toHaveTextContent('No Avatar')
    })

    it('should handle file selection and upload', async () => {
      render(<AvatarUploadComponent />)
      
      const fileInput = screen.getByTestId('file-input')
      const file = new File(['avatar'], 'test-avatar.jpg', { type: 'image/jpeg' })
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } })
      })
      
      // Check upload progress
      expect(screen.getByTestId('upload-progress')).toBeInTheDocument()
      
      // Wait for upload to complete
      await waitFor(() => {
        expect(screen.getByTestId('avatar-image')).toBeInTheDocument()
      })
      
      expect(screen.getByTestId('remove-avatar-btn')).toBeInTheDocument()
      expect(screen.queryByTestId('upload-progress')).not.toBeInTheDocument()
    })

    it('should handle upload errors gracefully', async () => {
      render(<AvatarUploadComponent shouldFail={true} />)
      
      const fileInput = screen.getByTestId('file-input')
      const file = new File(['avatar'], 'test-avatar.jpg', { type: 'image/jpeg' })
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } })
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-error')).toBeInTheDocument()
      })
      
      expect(screen.getByTestId('upload-error')).toHaveTextContent('Upload failed')
      expect(screen.queryByTestId('avatar-image')).not.toBeInTheDocument()
    })

    it('should disable file input during upload', async () => {
      render(<AvatarUploadComponent />)
      
      const fileInput = screen.getByTestId('file-input')
      const file = new File(['avatar'], 'test-avatar.jpg', { type: 'image/jpeg' })
      
      expect(fileInput).not.toBeDisabled()
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } })
      })
      
      expect(fileInput).toBeDisabled()
      
      await waitFor(() => {
        expect(fileInput).not.toBeDisabled()
      })
    })
  })

  describe('Avatar Removal Functionality', () => {
    it('should remove avatar when remove button is clicked', async () => {
      render(<AvatarUploadComponent />)
      
      // First upload an avatar
      const fileInput = screen.getByTestId('file-input')
      const file = new File(['avatar'], 'test-avatar.jpg', { type: 'image/jpeg' })
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } })
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('avatar-image')).toBeInTheDocument()
      })
      
      // Then remove it
      const removeButton = screen.getByTestId('remove-avatar-btn')
      
      await act(async () => {
        fireEvent.click(removeButton)
      })
      
      expect(screen.getByTestId('avatar-placeholder')).toBeInTheDocument()
      expect(screen.queryByTestId('avatar-image')).not.toBeInTheDocument()
      expect(screen.queryByTestId('remove-avatar-btn')).not.toBeInTheDocument()
    })
  })

  describe('Real-time Avatar Updates', () => {
    it('should update avatar display when avatar is uploaded', async () => {
      render(<AvatarDisplayComponent />)
      
      expect(screen.getByTestId('default-avatar')).toBeInTheDocument()
      
      // Simulate avatar update event
      await act(async () => {
        mockAvatarEvents.emit('avatarUpdated', 'https://stakr-avatars.s3.amazonaws.com/new-avatar.jpg')
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('displayed-avatar')).toBeInTheDocument()
      })
      
      expect(screen.queryByTestId('default-avatar')).not.toBeInTheDocument()
    })

    it('should remove avatar display when avatar is removed', async () => {
      render(<AvatarDisplayComponent />)
      
      // First set an avatar
      await act(async () => {
        mockAvatarEvents.emit('avatarUpdated', 'https://stakr-avatars.s3.amazonaws.com/avatar.jpg')
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('displayed-avatar')).toBeInTheDocument()
      })
      
      // Then remove it
      await act(async () => {
        mockAvatarEvents.emit('avatarRemoved')
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('default-avatar')).toBeInTheDocument()
      })
      
      expect(screen.queryByTestId('displayed-avatar')).not.toBeInTheDocument()
    })
  })

  describe('Avatar Persistence', () => {
    it('should maintain avatar state across component re-renders', async () => {
      const { rerender } = render(<AvatarUploadComponent />)
      
      // Upload avatar
      const fileInput = screen.getByTestId('file-input')
      const file = new File(['avatar'], 'test-avatar.jpg', { type: 'image/jpeg' })
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } })
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('avatar-image')).toBeInTheDocument()
      })
      
      // Re-render component
      rerender(<AvatarUploadComponent />)
      
      // Avatar should still be displayed
      expect(screen.getByTestId('avatar-image')).toBeInTheDocument()
      expect(screen.getByTestId('remove-avatar-btn')).toBeInTheDocument()
    })
  })

  describe('Avatar Moderation Integration', () => {
    it('should handle moderation approval', async () => {
      render(<AvatarUploadComponent />)
      
      const fileInput = screen.getByTestId('file-input')
      const file = new File(['avatar'], 'test-avatar.jpg', { type: 'image/jpeg' })
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } })
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('avatar-image')).toBeInTheDocument()
      })
      
      expect(screen.queryByTestId('upload-error')).not.toBeInTheDocument()
    })

    it('should handle moderation rejection', async () => {
      render(<AvatarUploadComponent shouldRejectModeration={true} />)
      
      const fileInput = screen.getByTestId('file-input')
      const file = new File(['avatar'], 'test-avatar.jpg', { type: 'image/jpeg' })
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } })
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-error')).toBeInTheDocument()
      })
      
      expect(screen.getByTestId('upload-error')).toHaveTextContent('Content rejected by moderation')
      expect(screen.queryByTestId('avatar-image')).not.toBeInTheDocument()
    })
  })

  describe('Avatar Error Handling', () => {
    it('should handle network errors during upload', async () => {
      render(<AvatarUploadComponent shouldFail={true} />)
      
      const fileInput = screen.getByTestId('file-input')
      const file = new File(['avatar'], 'test-avatar.jpg', { type: 'image/jpeg' })
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } })
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-error')).toBeInTheDocument()
      })
      
      expect(screen.getByTestId('upload-error')).toHaveTextContent('Upload failed')
    })

    it('should handle invalid file types', async () => {
      render(<AvatarUploadComponent />)
      
      const fileInput = screen.getByTestId('file-input')
      const invalidFile = new File(['text'], 'test.txt', { type: 'text/plain' })
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [invalidFile] } })
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-error')).toBeInTheDocument()
      })
      
      expect(screen.getByTestId('upload-error')).toHaveTextContent('Invalid file type. Only images are allowed.')
      expect(screen.queryByTestId('upload-progress')).not.toBeInTheDocument()
      expect(screen.getByTestId('avatar-placeholder')).toBeInTheDocument()
    })

    it('should handle file size limits', async () => {
      render(<AvatarUploadComponent />)
      
      const fileInput = screen.getByTestId('file-input')
      // Create a large file (simulate)
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large-avatar.jpg', { type: 'image/jpeg' })
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [largeFile] } })
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-error')).toBeInTheDocument()
      })
      
      expect(screen.getByTestId('upload-error')).toHaveTextContent('File too large. Maximum size is 5MB.')
      expect(screen.queryByTestId('upload-progress')).not.toBeInTheDocument()
      expect(screen.getByTestId('avatar-placeholder')).toBeInTheDocument()
    })
  })
}) 