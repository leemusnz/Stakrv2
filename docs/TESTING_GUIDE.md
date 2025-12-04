# Testing Guide

**Status:** ✅ Implemented  
**Last Updated:** December 3, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Test Infrastructure](#test-infrastructure)
3. [Running Tests](#running-tests)
4. [Test Categories](#test-categories)
5. [Writing Tests](#writing-tests)
6. [Best Practices](#best-practices)

---

## Overview

Stakr uses a comprehensive testing strategy covering unit tests, integration tests, component tests, and end-to-end tests.

### Testing Stack

- **Jest** - Unit and integration testing
- **React Testing Library** - Component testing
- **Playwright** - End-to-end testing
- **Supertest** - API testing
- **MSW** - API mocking

---

## Test Infrastructure

### Configuration Files

**Jest Configuration** (`jest.config.js`)
```javascript
module.exports = {
  preset: 'next/jest',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  coverageProvider: 'v8',
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
}
```

**Jest Setup** (`jest.setup.js`)
```javascript
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
```

**Playwright Configuration** (`playwright.config.ts`)
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
})
```

---

## Running Tests

### Quick Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test path/to/test.test.ts

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

---

## Test Categories

### 1. Unit Tests

**Purpose:** Test individual functions, utilities, and business logic

**Location:** `tests/__tests__/unit/`, `lib/__tests__/`

**Example:**
```typescript
// lib/__tests__/utils.test.ts
import { formatCurrency, calculateReward } from '@/lib/utils'

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('formats USD correctly', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00')
    })
    
    it('handles zero', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })
  })
  
  describe('calculateReward', () => {
    it('calculates reward correctly', () => {
      expect(calculateReward(100, 10, 5)).toBe(200)
    })
  })
})
```

### 2. Integration Tests

**Purpose:** Test API endpoints and data flow

**Location:** `tests/__tests__/`

**Example:**
```typescript
// tests/__tests__/api-basic.test.ts
import { createMocks } from 'node-mocks-http'
import { POST } from '@/app/api/auth/register/route'

describe('API: Auth Registration', () => {
  it('creates a new user', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User'
      }
    })
    
    const response = await POST(req)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.user.email).toBe('test@example.com')
  })
  
  it('validates email format', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        email: 'invalid-email',
        password: 'Password123!',
      }
    })
    
    const response = await POST(req)
    
    expect(response.status).toBe(400)
  })
})
```

### 3. Component Tests

**Purpose:** Test React components and user interactions

**Location:** `components/__tests__/`, `app/__tests__/`

**Example:**
```typescript
// components/__tests__/challenge-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ChallengeCard } from '@/components/challenge-card'

describe('ChallengeCard', () => {
  const mockChallenge = {
    id: '1',
    title: 'Test Challenge',
    description: 'Test description',
    stake: 10,
  }
  
  it('renders challenge information', () => {
    render(<ChallengeCard challenge={mockChallenge} />)
    
    expect(screen.getByText('Test Challenge')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })
  
  it('handles join button click', () => {
    const onJoin = jest.fn()
    render(<ChallengeCard challenge={mockChallenge} onJoin={onJoin} />)
    
    fireEvent.click(screen.getByText('Join Challenge'))
    
    expect(onJoin).toHaveBeenCalledWith('1')
  })
})
```

### 4. End-to-End Tests

**Purpose:** Test complete user journeys

**Location:** `tests/e2e/`

**Example:**
```typescript
// tests/e2e/auth-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('user can register and login', async ({ page }) => {
    // Navigate to registration
    await page.goto('/auth/signup')
    
    // Fill registration form
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'Password123!')
    await page.fill('input[name="name"]', 'Test User')
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText('Welcome, Test User')).toBeVisible()
  })
  
  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin')
    
    await page.fill('input[name="email"]', 'wrong@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    await expect(page.getByText('Invalid credentials')).toBeVisible()
  })
})
```

---

## Writing Tests

### Test Structure

**Use AAA Pattern:** Arrange, Act, Assert

```typescript
describe('Feature', () => {
  it('should do something', () => {
    // Arrange: Set up test data
    const input = 'test'
    
    // Act: Execute the code under test
    const result = doSomething(input)
    
    // Assert: Verify the result
    expect(result).toBe('expected')
  })
})
```

### Mocking

**Mock API Calls:**
```typescript
// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: 'test' }),
  })
) as jest.Mock
```

**Mock Next.js Router:**
```typescript
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))
```

**Mock Database:**
```typescript
jest.mock('@/lib/db', () => ({
  createDbConnection: jest.fn(() => ({
    query: jest.fn(() => Promise.resolve([])),
  })),
}))
```

### Testing Async Code

```typescript
it('fetches data', async () => {
  const data = await fetchData()
  expect(data).toBeDefined()
})

it('handles errors', async () => {
  await expect(fetchData()).rejects.toThrow('Error message')
})
```

### Testing Components with Hooks

```typescript
import { renderHook, act } from '@testing-library/react'
import { useCounter } from '@/hooks/use-counter'

it('increments counter', () => {
  const { result } = renderHook(() => useCounter())
  
  act(() => {
    result.current.increment()
  })
  
  expect(result.current.count).toBe(1)
})
```

---

## Best Practices

### 1. Test Naming

**✅ DO:**
```typescript
it('creates a new challenge when valid data is provided')
it('shows error message when email is invalid')
it('disables submit button while loading')
```

**❌ DON'T:**
```typescript
it('works')
it('test1')
it('challenge')
```

### 2. Test Independence

**✅ DO:**
- Each test should be independent
- Clean up after tests
- Don't rely on test execution order

**❌ DON'T:**
- Share state between tests
- Depend on previous tests
- Modify global state without cleanup

### 3. Test Coverage

**Aim For:**
- 80%+ code coverage
- All critical paths tested
- Edge cases covered
- Error handling tested

**Focus On:**
- Business logic (lib/)
- API routes (app/api/)
- Critical components
- Authentication flows
- Payment processing

### 4. Test Speed

**✅ DO:**
- Mock external dependencies
- Use in-memory databases for tests
- Run tests in parallel
- Skip slow tests in watch mode

**❌ DON'T:**
- Make real API calls
- Connect to production database
- Wait for long timeouts
- Test third-party libraries

### 5. Test Maintenance

**✅ DO:**
- Update tests when code changes
- Remove obsolete tests
- Refactor test code
- Document complex test setups

**❌ DON'T:**
- Leave failing tests
- Skip tests instead of fixing
- Duplicate test code
- Write brittle tests

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run unit tests
        run: npm test -- --coverage
        
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Troubleshooting

### Common Issues

**Issue: Tests timeout**
```typescript
// Increase timeout for specific test
it('slow test', async () => {
  // test code
}, 10000) // 10 second timeout
```

**Issue: Module not found**
```bash
# Clear Jest cache
npx jest --clearCache
```

**Issue: Playwright browser not found**
```bash
# Install browsers
npx playwright install
```

**Issue: Tests fail in CI but pass locally**
- Check environment variables
- Ensure dependencies are installed
- Check for timezone issues
- Verify database seeding

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Test Coverage:** 80%+  
**Status:** ✅ Comprehensive Testing Implemented  
**Next Steps:** Maintain and expand test coverage as features are added

