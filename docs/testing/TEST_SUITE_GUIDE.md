# Stakr Test Suite Guide

## 🚀 Overview

The Stakr test suite provides comprehensive testing coverage for all aspects of the application, from unit tests to end-to-end testing. This guide covers setup, usage, and best practices for maintaining high code quality.

## 📋 Test Categories

### 1. Unit Tests
- **Purpose**: Test individual functions, utilities, and business logic
- **Location**: `tests/__tests__/unit/`, `lib/__tests__/`
- **Framework**: Jest + Testing Library
- **Coverage**: Core functionality, data processing, calculations

### 2. Integration Tests
- **Purpose**: Test API endpoints and data flow between components
- **Location**: `tests/__tests__/`
- **Framework**: Jest + Supertest
- **Coverage**: API routes, database interactions, external services

### 3. Component Tests
- **Purpose**: Test React components and user interactions
- **Location**: `components/__tests__/`, `app/__tests__/`
- **Framework**: Jest + React Testing Library
- **Coverage**: UI components, user interactions, state management

### 4. End-to-End Tests
- **Purpose**: Test complete user journeys
- **Location**: `tests/e2e/`
- **Framework**: Playwright
- **Coverage**: Full user workflows, cross-browser compatibility

### 5. Performance Tests
- **Purpose**: Test application performance and load handling
- **Location**: `tests/performance/`
- **Framework**: Jest + Custom performance utilities
- **Coverage**: Response times, memory usage, scalability

### 6. Security Tests
- **Purpose**: Test authentication, authorization, and security measures
- **Location**: `tests/security/`
- **Framework**: Jest + Security testing utilities
- **Coverage**: Authentication, input validation, data protection

## 🛠️ Setup

### Prerequisites
\`\`\`bash
# Install dependencies
npm install

# Install testing dependencies
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D jest jest-environment-jsdom
npm install -D @playwright/test  # For E2E tests
\`\`\`

### Environment Setup
\`\`\`bash
# Copy environment template
cp .env.example .env.test

# Configure test environment variables
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/stakr_test
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=test-secret
\`\`\`

### Database Setup for Tests
\`\`\`bash
# Create test database
createdb stakr_test

# Run migrations for test database
npm run db:migrate:test
\`\`\`

## 🏃‍♂️ Running Tests

### Quick Start
\`\`\`bash
# Run all tests
npm run test:all

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:components
npm run test:e2e
\`\`\`

### Advanced Usage
\`\`\`bash
# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- tests/__tests__/auth.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should handle login"

# Generate test reports
npm run test:report
\`\`\`

### Test Runner Script
\`\`\`bash
# Run comprehensive test suite
node scripts/run-tests.js

# Run specific test types
node scripts/run-tests.js --unit
node scripts/run-tests.js --integration
node scripts/run-tests.js --components
node scripts/run-tests.js --e2e
node scripts/run-tests.js --performance
node scripts/run-tests.js --security

# Generate coverage reports
node scripts/run-tests.js --coverage
\`\`\`

## 📊 Test Coverage

### Current Coverage Targets
- **Overall Coverage**: 70% minimum
- **Business Logic**: 80% minimum
- **API Endpoints**: 90% minimum
- **Critical Paths**: 95% minimum

### Coverage Reports
\`\`\`bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
\`\`\`

## 🧪 Test Structure

### File Naming Convention
\`\`\`
tests/
├── __tests__/
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── e2e/           # End-to-end tests
├── fixtures/           # Test data
├── mocks/             # Mock implementations
└── utils/             # Test utilities
\`\`\`

### Test File Structure
\`\`\`typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

describe('Component/Function Name', () => {
  beforeEach(() => {
    // Setup before each test
  })

  afterEach(() => {
    // Cleanup after each test
  })

  it('should do something specific', () => {
    // Test implementation
  })

  describe('specific feature', () => {
    it('should handle specific case', () => {
      // Test implementation
    })
  })
})
\`\`\`

## 🔧 Test Utilities

### Custom Test Helpers
\`\`\`typescript
// tests/utils/test-helpers.ts
export const createMockSession = (overrides = {}) => ({
  data: {
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      ...overrides
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  status: 'authenticated' as const,
})

export const createMockChallenge = (overrides = {}) => ({
  id: 'challenge-1',
  title: 'Test Challenge',
  description: 'A test challenge',
  stake_amount: 50,
  ...overrides,
})
\`\`\`

### Mock Data
\`\`\`typescript
// tests/fixtures/mock-data.ts
export const mockUsers = [
  { id: '1', email: 'user1@example.com', name: 'User 1' },
  { id: '2', email: 'user2@example.com', name: 'User 2' },
]

export const mockChallenges = [
  { id: '1', title: 'Challenge 1', category: 'fitness' },
  { id: '2', title: 'Challenge 2', category: 'productivity' },
]
\`\`\`

## 🎯 Testing Best Practices

### 1. Test Organization
- Group related tests using `describe` blocks
- Use descriptive test names that explain the expected behavior
- Keep tests focused and single-purpose
- Use `beforeEach` and `afterEach` for setup and cleanup

### 2. Mocking Strategy
- Mock external dependencies (APIs, databases)
- Use realistic mock data
- Avoid over-mocking - test the actual behavior
- Mock at the right level (unit vs integration)

### 3. Assertions
- Test one thing per test case
- Use specific assertions over generic ones
- Test both happy path and error cases
- Verify side effects and state changes

### 4. Performance Considerations
- Keep tests fast and focused
- Use parallel test execution where possible
- Avoid unnecessary setup/teardown
- Mock heavy operations (file I/O, network calls)

## 🔍 Debugging Tests

### Common Issues
1. **Async Tests**: Use `waitFor` for asynchronous operations
2. **Component Rendering**: Ensure proper provider wrapping
3. **Mock Data**: Verify mock data matches expected format
4. **Environment Variables**: Check test environment configuration

### Debug Commands
\`\`\`bash
# Run tests with verbose output
npm test -- --verbose

# Run single test file with debugging
npm test -- tests/__tests__/auth.test.ts --verbose

# Run tests with coverage and watch
npm test -- --coverage --watch
\`\`\`

## 📈 Continuous Integration

### GitHub Actions Example
\`\`\`yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:all
      - run: npm run test:coverage
\`\`\`

### Pre-commit Hooks
\`\`\`json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:unit",
      "pre-push": "npm run test:all"
    }
  }
}
\`\`\`

## 🚨 Test Maintenance

### Regular Tasks
- [ ] Review and update test coverage monthly
- [ ] Update mock data when APIs change
- [ ] Refactor tests when components change
- [ ] Add tests for new features
- [ ] Remove obsolete tests

### Quality Checklist
- [ ] All critical paths have tests
- [ ] Error cases are covered
- [ ] Tests are fast and reliable
- [ ] Mock data is realistic
- [ ] Test names are descriptive
- [ ] Coverage meets targets

## 📚 Additional Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)

### Testing Patterns
- [Testing React Components](https://testing-library.com/docs/example-react-component)
- [Testing Async Code](https://testing-library.com/docs/dom-testing-library/api-async)
- [Testing User Interactions](https://testing-library.com/docs/user-event/intro)

## 🤝 Contributing to Tests

### Adding New Tests
1. Identify the component/function to test
2. Choose appropriate test category
3. Create test file following naming convention
4. Write tests covering main functionality and edge cases
5. Ensure tests pass and add to CI pipeline

### Test Review Process
1. Code review includes test review
2. Verify test coverage for new features
3. Ensure tests are maintainable and readable
4. Check that tests add value and aren't redundant

---

**Remember**: Good tests are an investment in code quality and developer productivity. They help catch bugs early, document expected behavior, and make refactoring safer.
