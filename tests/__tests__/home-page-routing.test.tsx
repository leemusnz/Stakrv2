import React from 'react'
import { render, waitFor } from '@testing-library/react'
import HomePage from '@/app/page'

const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}))

const mockUseSession = jest.fn()

jest.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}))

jest.mock('@/components/loading-screen', () => ({
  AppSplashScreen: () => <div>Loading...</div>,
}))

describe('HomePage routing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects unauthenticated users to sign in instead of alpha gate', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(<HomePage />)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/auth/signin?callbackUrl=/onboarding')
    })
  })

  it('redirects authenticated users with incomplete onboarding to onboarding', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          email: 'tester@example.com',
          onboardingCompleted: false,
        },
      },
      status: 'authenticated',
    })

    render(<HomePage />)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/onboarding')
    })
  })
})
