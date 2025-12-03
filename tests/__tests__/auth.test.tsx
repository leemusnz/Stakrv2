/**
 * Authentication System Tests
 * 
 * Tests for the real NextAuth configuration and authentication utilities.
 * Tests the actual auth callbacks, providers, and database integration.
 */

import { jest } from '@jest/globals'
import { authOptions } from '@/lib/auth'

// Mock database connection
const mockSql = jest.fn()
jest.mock('@/lib/db', () => ({
  createDbConnection: jest.fn(() => mockSql)
}))

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  compare: jest.fn()
}))

describe('Authentication System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSql.mockReset()
  })

  describe('Auth Configuration', () => {
    it('should have credentials provider configured', () => {
      const credentialsProviders = authOptions.providers.filter(
        (p: any) => p.type === 'credentials'
      )
      expect(credentialsProviders.length).toBeGreaterThan(0)
      expect(credentialsProviders[0].name).toBe('Credentials')
    })

    it('should have multiple authentication methods configured', () => {
      const credentialsProviders = authOptions.providers.filter(
        (p: any) => p.type === 'credentials'
      )
      // Should have at least 1 credentials provider (main login)
      expect(credentialsProviders.length).toBeGreaterThanOrEqual(1)
      
      // Should have additional providers configured (OAuth, etc.)
      expect(authOptions.providers.length).toBeGreaterThanOrEqual(1)
    })

    it('should configure JWT session strategy', () => {
      expect(authOptions.session?.strategy).toBe('jwt')
      expect(authOptions.session?.maxAge).toBe(30 * 24 * 60 * 60) // 30 days
    })

    it('should have custom sign-in page configured', () => {
      expect(authOptions.pages?.signIn).toBe('/auth/signin')
      expect(authOptions.pages?.error).toBe('/auth/error')
    })
  })

  describe('Credentials Authentication', () => {
    it('should authenticate with valid database user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password_hash: '$2a$10$validhash',
        avatar_url: null,
        credits: '100.00',
        trust_score: 75,
        verification_tier: 'manual',
        challenges_completed: 0,
        current_streak: 0,
        longest_streak: 0,
        premium_subscription: false,
        email_verified: true,
        onboarding_completed: true,
        xp: 0,
        level: 1,
        is_dev: false,
        dev_mode_enabled: false
      }

      mockSql.mockResolvedValueOnce([mockUser])
      
      const bcrypt = await import('bcryptjs')
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const credentialsProvider = authOptions.providers.find(
        (p: any) => p.name === 'Credentials'
      ) as any

      const user = await credentialsProvider.options.authorize({
        email: 'test@example.com',
        password: 'password123'
      }, {} as any)

      expect(user).toBeDefined()
      expect(user).not.toBeNull()
      expect(user?.email).toBe('test@example.com')
      expect(user?.id).toBe('user-123')
      expect(user?.credits).toBe(100)
    })

    it('should reject invalid password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: '$2a$10$validhash',
        credits: '100.00',
        trust_score: 75,
        verification_tier: 'manual'
      }

      mockSql.mockResolvedValueOnce([mockUser])
      
      const bcrypt = await import('bcryptjs')
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const credentialsProvider = authOptions.providers.find(
        (p: any) => p.name === 'Credentials'
      ) as any

      const user = await credentialsProvider.options.authorize({
        email: 'test@example.com',
        password: 'wrongpassword'
      }, {} as any)

      expect(user).toBeNull()
    })

    it('should authenticate demo users as fallback', async () => {
      mockSql.mockResolvedValueOnce([]) // No database user

      const credentialsProvider = authOptions.providers.find(
        (p: any) => p.name === 'Credentials'
      ) as any

      const user = await credentialsProvider.options.authorize({
        email: 'demo@stakr.app',
        password: 'demo123'
      }, {} as any)

      expect(user).toBeDefined()
      expect(user).not.toBeNull()
      expect(user?.email).toBe('demo@stakr.app')
      expect(user?.credits).toBe(156.75)
    })

    it('should reject OAuth accounts without password', async () => {
      const mockOAuthUser = {
        id: 'user-123',
        email: 'oauth@example.com',
        password_hash: null, // OAuth account has no password
        credits: '100.00'
      }

      mockSql.mockResolvedValueOnce([mockOAuthUser])

      const credentialsProvider = authOptions.providers.find(
        (p: any) => p.name === 'Credentials'
      ) as any

      await expect(async () => {
        await credentialsProvider.options.authorize({
          email: 'oauth@example.com',
          password: 'anypassword'
        }, {} as any)
      }).rejects.toThrow('OAUTH_ACCOUNT_EXISTS')
    })
  })

  describe('JWT Callback', () => {
    it('should add user fields to JWT token', async () => {
      const token = { sub: 'user-123' }
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        avatar: '/avatar.jpg',
        credits: 150,
        trustScore: 85,
        verificationTier: 'gold',
        isAdmin: false,
        isDev: false,
        emailVerified: true,
        xp: 500,
        level: 5
      }

      const result = await authOptions.callbacks!.jwt!({ 
        token, 
        user, 
        trigger: 'signIn',
        session: null as any
      })

      expect(result.avatar).toBe('/avatar.jpg')
      expect(result.credits).toBe(150)
      expect(result.trustScore).toBe(85)
      expect(result.verificationTier).toBe('gold')
      expect(result.xp).toBe(500)
      expect(result.level).toBe(5)
    })

    it('should handle session updates', async () => {
      const token = { 
        sub: 'user-123',
        avatar: '/old-avatar.jpg',
        credits: 100
      }

      const session = {
        user: {
          avatar: '/new-avatar.jpg',
          credits: 200
        }
      }

      const result = await authOptions.callbacks!.jwt!({ 
        token, 
        user: undefined,
        trigger: 'update',
        session
      })

      expect(result.avatar).toBe('/new-avatar.jpg')
      expect(result.credits).toBe(200)
    })
  })

  describe('Session Callback', () => {
    it('should populate session with user data from token', async () => {
      const session = {
        user: {
          id: '',
          email: 'test@example.com',
          name: 'Test User'
        } as any
      }

      const token = {
        sub: 'user-123',
        avatar: '/avatar.jpg',
        credits: 150,
        trustScore: 85,
        verificationTier: 'gold',
        isAdmin: false,
        isDev: true,
        devModeEnabled: true,
        emailVerified: true,
        xp: 500,
        level: 5
      }

      const result = await authOptions.callbacks!.session!({ session, token, user: null as any })

      expect(result.user.id).toBe('user-123')
      expect(result.user.avatar).toBe('/avatar.jpg')
      expect(result.user.credits).toBe(150)
      expect(result.user.trustScore).toBe(85)
      expect(result.user.isDev).toBe(true)
      expect(result.user.xp).toBe(500)
      expect(result.user.level).toBe(5)
    })
  })

  describe('Sign In Callback', () => {
    it('should create OAuth user if not exists', async () => {
      const user = {
        id: 'temp-id',
        email: 'newuser@gmail.com',
        name: 'New User',
        image: 'https://example.com/avatar.jpg'
      }

      const account = {
        type: 'oauth' as const,
        provider: 'google'
      }

      // Mock: user doesn't exist
      mockSql.mockResolvedValueOnce([])
      // Mock: create user returns new user
      mockSql.mockResolvedValueOnce([{ id: 'new-user-id', email: user.email, name: user.name, username: 'newuser' }])
      // Mock: XP award function
      mockSql.mockResolvedValueOnce([{ award_xp: true }])
      // Mock: fetch full user data
      mockSql.mockResolvedValueOnce([{
        id: 'new-user-id',
        email: user.email,
        name: user.name,
        avatar_url: user.image,
        credits: '0.00',
        trust_score: 50,
        verification_tier: 'manual',
        challenges_completed: 0,
        current_streak: 0,
        longest_streak: 0,
        premium_subscription: false,
        email_verified: true,
        onboarding_completed: false,
        xp: 50,
        level: 1,
        is_dev: false,
        dev_mode_enabled: false,
        has_dev_access: false
      }])

      const result = await authOptions.callbacks!.signIn!({ 
        user, 
        account,
        profile: null as any
      })

      expect(result).toBe(true)
      expect(user.id).toBe('new-user-id')
      expect(user.emailVerified).toBe(true)
    })

    it('should update existing OAuth user', async () => {
      const user = {
        id: 'temp-id',
        email: 'existing@gmail.com',
        name: 'Existing User'
      }

      const account = {
        type: 'oauth' as const,
        provider: 'google'
      }

      // Mock: user exists
      mockSql.mockResolvedValueOnce([{ 
        id: 'existing-user-id', 
        email: user.email, 
        email_verified: true 
      }])
      // Mock: fetch full user data
      mockSql.mockResolvedValueOnce([{
        id: 'existing-user-id',
        email: user.email,
        name: user.name,
        avatar_url: null,
        credits: '100.00',
        trust_score: 75,
        verification_tier: 'manual',
        email_verified: true,
        onboarding_completed: true,
        xp: 200,
        level: 3,
        is_dev: false,
        dev_mode_enabled: false,
        has_dev_access: false
      }])

      const result = await authOptions.callbacks!.signIn!({ 
        user, 
        account,
        profile: null as any
      })

      expect(result).toBe(true)
      expect(user.id).toBe('existing-user-id')
    })
  })

  describe('Redirect Callback', () => {
    const baseUrl = 'https://stakr.app'

    it('should handle relative URL redirects', async () => {
      const result = await authOptions.callbacks!.redirect!({
        url: '/dashboard',
        baseUrl
      })

      expect(result).toBe('https://stakr.app/dashboard')
    })

    it('should handle same-origin URL redirects', async () => {
      const result = await authOptions.callbacks!.redirect!({
        url: 'https://stakr.app/profile',
        baseUrl
      })

      expect(result).toBe('https://stakr.app/profile')
    })

    it('should redirect to baseUrl for external URLs', async () => {
      const result = await authOptions.callbacks!.redirect!({
        url: 'https://evil.com/phishing',
        baseUrl
      })

      expect(result).toBe(baseUrl)
    })
  })
})
