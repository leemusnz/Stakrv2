/**
 * E2E Tests: Onboarding Flow (Points System)
 * 
 * Tests the user onboarding experience and XP rewards.
 * This flow is app-store compliant (no money involved).
 */

import { test, expect } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'
import { DashboardPage } from '../pages/dashboard.page'
import { TEST_USERS, EXPECTED_XP_REWARDS } from '../helpers/test-data'

test.describe('Onboarding Flow', () => {
  test.use({ storageState: { cookies: [], origins: [] } }) // Start unauthenticated

  test('should complete onboarding and earn 300 XP', async ({ page }) => {
    const authPage = new AuthPage(page)
    const dashboardPage = new DashboardPage(page)

    // Sign up or log in as demo user
    await authPage.goto()
    await authPage.login(TEST_USERS.demo.email, TEST_USERS.demo.password)

    // Should redirect to onboarding if not completed
    await page.waitForURL(/\/(onboarding|dashboard)/)

    // If on onboarding page, complete it
    if (page.url().includes('/onboarding')) {
      // Step 1: Welcome - earn 50 XP
      await expect(page.locator('text=/Welcome|Get Started/')).toBeVisible()
      await page.click('button:has-text("Next")')

      // Step 2: Goals - earn 100 XP
      await page.click('text=/Fitness|Health|Productivity/') // Select a goal
      await page.click('button:has-text("Next")')

      // Step 3: Complete profile
      await page.fill('input[name="name"]', 'Test User')
      await page.click('button:has-text("Complete")')

      // Should redirect to dashboard
      await page.waitForURL('/dashboard')
    }

    // Verify user is on dashboard
    await dashboardPage.goto()

    // Check that XP was awarded (should have at least onboarding XP)
    const xp = await dashboardPage.getXP()
    expect(xp).toBeGreaterThanOrEqual(EXPECTED_XP_REWARDS.onboarding)
  })

  test('should show level based on XP', async ({ page }) => {
    const authPage = new AuthPage(page)
    const dashboardPage = new DashboardPage(page)

    await authPage.goto()
    await authPage.login(TEST_USERS.demo.email, TEST_USERS.demo.password)

    await dashboardPage.goto()

    // Get current XP and level
    const xp = await dashboardPage.getXP()
    const level = await dashboardPage.getLevel()

    // Verify level calculation: Level = floor(XP / 200) + 1
    const expectedLevel = Math.floor(xp / 200) + 1
    expect(level).toBe(expectedLevel)
  })
})


