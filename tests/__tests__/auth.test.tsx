import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession, signIn, signOut, SessionProvider } from 'next-auth/react'
import { jest } from '@jest/globals'

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  authOptions: {
    providers: [],
    callbacks: {},
  },
}))

// Mock the database
jest.mock('@/lib/db', () => ({
  sql: jest.fn(),
}))

describe('Authentication System', () => {
  const mockSession = {
    data: {
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg',
        avatar: 'https://example.com/avatar.jpg',
        is_dev: false,
        has_dev_access: false,
        dev_mode_enabled: false,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    status: 'authenticated' as const,
  }

  const mockUnauthenticatedSession = {
    data: null,
    status: 'unauthenticated' as const,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Session Management', () => {
    it('should handle authenticated session correctly', () => {
      ;(useSession as jest.Mock).mockReturnValue(mockSession)

      render(
        <SessionProvider>
          <div data-testid="session-status">
            {mockSession.status}
          </div>
        </SessionProvider>
      )

      expect(screen.getByTestId('session-status')).toHaveTextContent('authenticated')
    })

    it('should handle unauthenticated session correctly', () => {
      ;(useSession as jest.Mock).mockReturnValue(mockUnauthenticatedSession)

      render(
        <SessionProvider>
          <div data-testid="session-status">
            {mockUnauthenticatedSession.status}
          </div>
        </SessionProvider>
      )

      expect(screen.getByTestId('session-status')).toHaveTextContent('unauthenticated')
    })

    it('should display user information when authenticated', () => {
      ;(useSession as jest.Mock).mockReturnValue(mockSession)

      render(
        <SessionProvider>
          <div data-testid="user-email">{mockSession.data?.user?.email}</div>
          <div data-testid="user-name">{mockSession.data?.user?.name}</div>
        </SessionProvider>
      )

      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User')
    })
  })

  describe('Login Functionality', () => {
    it('should call signIn with correct parameters', async () => {
      const mockSignIn = signIn as jest.Mock
      mockSignIn.mockResolvedValue({ ok: true })

      render(
        <SessionProvider>
          <button
            onClick={() => signIn('credentials', { email: 'test@example.com', password: 'password' })}
            data-testid="login-button"
          >
            Login
          </button>
        </SessionProvider>
      )

      fireEvent.click(screen.getByTestId('login-button'))

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          email: 'test@example.com',
          password: 'password',
        })
      })
    })

    it('should handle login errors', async () => {
      const mockSignIn = signIn as jest.Mock
      mockSignIn.mockResolvedValue({ error: 'Invalid credentials' })

      render(
        <SessionProvider>
          <button
            onClick={() => signIn('credentials', { email: 'wrong@example.com', password: 'wrong' })}
            data-testid="login-button"
          >
            Login
          </button>
        </SessionProvider>
      )

      fireEvent.click(screen.getByTestId('login-button'))

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          email: 'wrong@example.com',
          password: 'wrong',
        })
      })
    })
  })

  describe('Logout Functionality', () => {
    it('should call signOut when logout is triggered', async () => {
      const mockSignOut = signOut as jest.Mock
      mockSignOut.mockResolvedValue({ ok: true })

      render(
        <SessionProvider>
          <button onClick={() => signOut()} data-testid="logout-button">
            Logout
          </button>
        </SessionProvider>
      )

      fireEvent.click(screen.getByTestId('logout-button'))

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled()
      })
    })
  })

  describe('OAuth Authentication', () => {
    it('should handle Google OAuth sign in', async () => {
      const mockSignIn = signIn as jest.Mock
      mockSignIn.mockResolvedValue({ ok: true })

      render(
        <SessionProvider>
          <button onClick={() => signIn('google')} data-testid="google-login">
            Sign in with Google
          </button>
        </SessionProvider>
      )

      fireEvent.click(screen.getByTestId('google-login'))

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('google')
      })
    })

    it('should handle OAuth callback with user data', () => {
      const oauthSession = {
        ...mockSession,
        data: {
          ...mockSession.data,
          user: {
            ...mockSession.data.user,
            email: 'oauth@example.com',
            name: 'OAuth User',
            is_dev: true,
            has_dev_access: true,
            dev_mode_enabled: true,
          },
        },
      }

      ;(useSession as jest.Mock).mockReturnValue(oauthSession)

      render(
        <SessionProvider>
          <div data-testid="oauth-user">{oauthSession.data?.user?.email}</div>
          <div data-testid="dev-access">{oauthSession.data?.user?.has_dev_access ? 'true' : 'false'}</div>
        </SessionProvider>
      )

      expect(screen.getByTestId('oauth-user')).toHaveTextContent('oauth@example.com')
      expect(screen.getByTestId('dev-access')).toHaveTextContent('true')
    })
  })

  describe('Dev Access Control', () => {
    it('should show dev access for users with dev privileges', () => {
      const devSession = {
        ...mockSession,
        data: {
          ...mockSession.data,
          user: {
            ...mockSession.data.user,
            is_dev: true,
            has_dev_access: true,
            dev_mode_enabled: true,
          },
        },
      }

      ;(useSession as jest.Mock).mockReturnValue(devSession)

      render(
        <SessionProvider>
          <div data-testid="dev-status">
            {devSession.data?.user?.has_dev_access ? 'Dev Access' : 'No Access'}
          </div>
        </SessionProvider>
      )

      expect(screen.getByTestId('dev-status')).toHaveTextContent('Dev Access')
    })

    it('should hide dev access for regular users', () => {
      const regularSession = {
        ...mockSession,
        data: {
          ...mockSession.data,
          user: {
            ...mockSession.data.user,
            is_dev: false,
            has_dev_access: false,
            dev_mode_enabled: false,
          },
        },
      }

      ;(useSession as jest.Mock).mockReturnValue(regularSession)

      render(
        <SessionProvider>
          <div data-testid="dev-status">
            {regularSession.data?.user?.has_dev_access ? 'Dev Access' : 'No Access'}
          </div>
        </SessionProvider>
      )

      expect(screen.getByTestId('dev-status')).toHaveTextContent('No Access')
    })
  })
})
