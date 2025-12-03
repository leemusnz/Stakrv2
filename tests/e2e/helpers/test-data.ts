/**
 * Test Data Helpers
 * 
 * Provides consistent test data for E2E tests.
 */

export const TEST_USERS = {
  demo: {
    email: 'demo@stakr.app',
    password: 'demo123',
    name: 'Demo User',
  },
  admin: {
    email: 'alex@stakr.app',
    password: 'password123',
    name: 'Alex Rodriguez',
  },
}

export const TEST_CHALLENGES = {
  pointsOnly: {
    title: 'E2E Test Points Challenge',
    description: 'A test challenge for automated testing - points only',
    category: 'fitness',
    difficulty: 'easy',
    duration: '7',
    minStake: 0,
    maxStake: 0,
    allowPointsOnly: true,
  },
  cashChallenge: {
    title: 'E2E Test Cash Challenge',
    description: 'A test challenge for automated testing - real money',
    category: 'productivity',
    difficulty: 'medium',
    duration: '14',
    minStake: 25,
    maxStake: 100,
    allowPointsOnly: false,
  },
}

export const EXPECTED_XP_REWARDS = {
  onboarding: 300,
  easyChallenge7Days: 100,
  mediumChallenge14Days: 195, // 150 * 1.3
  hardChallenge30Days: 400,
}

export const PAYMENT_TEST_CARDS = {
  success: {
    number: '4242424242424242',
    exp: '12/34',
    cvc: '123',
  },
  declined: {
    number: '4000000000000002',
    exp: '12/34',
    cvc: '123',
  },
  insufficientFunds: {
    number: '4000000000009995',
    exp: '12/34',
    cvc: '123',
  },
}

export function generateUniqueEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@stakr-test.com`
}

export function generateUniqueChallengeTitle(): string {
  return `Test Challenge ${Date.now()}`
}

export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}


