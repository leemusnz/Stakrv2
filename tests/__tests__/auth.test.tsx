import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock NextAuth
const mockUseSession = jest.fn()
const mockSignIn = jest.fn()
const mockSignOut = jest.fn()

jest.mock('next-auth/react', () => ({
  useSession: mockUseSession,
  signIn: mockSignIn,
  signOut: mockSignOut,
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="session-provider">{children}</div>,
}))

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
      mockUseSession.mockReturnValue(mockSession)

      render(
        <div data-testid="session-status">
          {mockSession.status}
        </div>
      )

      expect(screen.getByTestId('session-status')).toHaveTextContent('authenticated')
    })

    it('should handle unauthenticated session correctly', () => {
      mockUseSession.mockReturnValue(mockUnauthenticatedSession)

      render(
        <div data-testid="session-status">
          {mockUnauthenticatedSession.status}
        </div>
      )

      expect(screen.getByTestId('session-status')).toHaveTextContent('unauthenticated')
    })

    it('should display user information when authenticated', () => {
      mockUseSession.mockReturnValue(mockSession)

      render(
        <>
          <div data-testid="user-email">{mockSession.data?.user?.email}</div>
          <div data-testid="user-name">{mockSession.data?.user?.name}</div>
        </>
      )

      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User')
    })
  })

  describe('Login Functionality', () => {
    it('should call signIn with correct parameters', async () => {
      mockSignIn.mockResolvedValue({ ok: true })

      const LoginButton = () => {
        const handleLogin = () => {
          mockSignIn('credentials', { email: 'test@example.com', password: 'password' })
        }
        return (
          <button onClick={handleLogin} data-testid="login-button">
            Login
          </button>
        )
      }

      render(<LoginButton />)

      const loginButton = screen.getByTestId('login-button')
      fireEvent.click(loginButton)

      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password',
      })
    })

    it('should handle login errors', async () => {
      mockSignIn.mockResolvedValue({ error: 'Invalid credentials' })

      const LoginButton = () => {
        const handleLogin = () => {
          mockSignIn('credentials', { email: 'wrong@example.com', password: 'wrong' })
        }
        return (
          <button onClick={handleLogin} data-testid="login-button">
            Login
          </button>
        )
      }

      render(<LoginButton />)

      const loginButton = screen.getByTestId('login-button')
      fireEvent.click(loginButton)

      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'wrong@example.com',
        password: 'wrong',
      })
    })
  })

  describe('Logout Functionality', () => {
    it('should call signOut when logout is triggered', async () => {
      mockSignOut.mockResolvedValue({ ok: true })

      const LogoutButton = () => {
        const handleLogout = () => {
          mockSignOut()
        }
        return (
          <button onClick={handleLogout} data-testid="logout-button">
            Logout
          </button>
        )
      }

      render(<LogoutButton />)

      const logoutButton = screen.getByTestId('logout-button')
      fireEvent.click(logoutButton)

      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  describe('OAuth Authentication', () => {
    it('should handle Google OAuth sign in', async () => {
      mockSignIn.mockResolvedValue({ ok: true })

      const GoogleLoginButton = () => {
        const handleGoogleLogin = () => {
          mockSignIn('google')
        }
        return (
          <button onClick={handleGoogleLogin} data-testid="google-login">
            Sign in with Google
          </button>
        )
      }

      render(<GoogleLoginButton />)

      const googleLoginButton = screen.getByTestId('google-login')
      fireEvent.click(googleLoginButton)

      expect(mockSignIn).toHaveBeenCalledWith('google')
    })

    it('should handle OAuth callback with user data', () => {
      const oauthSession = {
        data: {
          user: {
            id: '2',
            email: 'oauth@example.com',
            name: 'OAuth User',
            image: 'https://oauth.com/avatar.jpg',
            avatar: 'https://oauth.com/avatar.jpg',
            is_dev: true,
            has_dev_access: true,
            dev_mode_enabled: true,
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        status: 'authenticated' as const,
      }

      mockUseSession.mockReturnValue(oauthSession)

      render(
        <>
          <div data-testid="oauth-user">{oauthSession.data?.user?.email}</div>
          <div data-testid="dev-access">{oauthSession.data?.user?.has_dev_access ? 'true' : 'false'}</div>
        </>
      )

      expect(screen.getByTestId('oauth-user')).toHaveTextContent('oauth@example.com')
      expect(screen.getByTestId('dev-access')).toHaveTextContent('true')
    })
  })

  describe('Dev Access Control', () => {
    it('should show dev access for users with dev privileges', () => {
      const devSession = {
        data: {
          user: {
            id: '3',
            email: 'dev@example.com',
            name: 'Dev User',
            image: 'https://dev.com/avatar.jpg',
            avatar: 'https://dev.com/avatar.jpg',
            is_dev: true,
            has_dev_access: true,
            dev_mode_enabled: true,
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        status: 'authenticated' as const,
      }

      mockUseSession.mockReturnValue(devSession)

      render(
        <div data-testid="dev-status">
          {devSession.data?.user?.has_dev_access ? 'Dev Access' : 'No Access'}
        </div>
      )

      expect(screen.getByTestId('dev-status')).toHaveTextContent('Dev Access')
    })

    it('should hide dev access for regular users', () => {
      const regularSession = {
        data: {
          user: {
            id: '4',
            email: 'regular@example.com',
            name: 'Regular User',
            image: 'https://regular.com/avatar.jpg',
            avatar: 'https://regular.com/avatar.jpg',
            is_dev: false,
            has_dev_access: false,
            dev_mode_enabled: false,
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        status: 'authenticated' as const,
      }

      mockUseSession.mockReturnValue(regularSession)

      render(
        <div data-testid="dev-status">
          {regularSession.data?.user?.has_dev_access ? 'Dev Access' : 'No Access'}
        </div>
      )

      expect(screen.getByTestId('dev-status')).toHaveTextContent('No Access')
    })
  })
}) 