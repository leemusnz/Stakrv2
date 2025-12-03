import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright Configuration for Stakr E2E Tests
 * 
 * Test Structure:
 * - tests/e2e/points/ - Points-only gamified challenges (app store compliant)
 * - tests/e2e/cash/ - Cash challenges with real money (web-only)
 * - tests/e2e/integration/ - Cross-platform flows
 */

export default defineConfig({
  testDir: './tests/e2e',
  
  // Maximum time one test can run
  timeout: 60 * 1000,
  
  // Maximum time for assertions
  expect: {
    timeout: 10 * 1000,
  },
  
  // Run tests in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Number of parallel workers
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-reports/e2e-results.json' }],
    ['list'],
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for your app
    baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    
    // Collect trace on first retry of failed test
    trace: 'on-first-retry',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Default timeout for actions
    actionTimeout: 15 * 1000,
    
    // Default timeout for navigation
    navigationTimeout: 30 * 1000,
  },

  // Configure projects for different browsers/contexts
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use authenticated state for logged-in tests
        storageState: 'tests/e2e/.auth/user.json',
      },
    },

    {
      name: 'chromium-unauthenticated',
      use: { 
        ...devices['Desktop Chrome'],
        // No auth state for signup/login tests
      },
    },

    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        storageState: 'tests/e2e/.auth/user.json',
      },
    },

    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 13'],
        storageState: 'tests/e2e/.auth/user.json',
      },
    },

    // Uncomment to test on other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Run local dev server before tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})


