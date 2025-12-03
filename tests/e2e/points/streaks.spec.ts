/**
 * E2E Tests: Streaks & Consistency
 * 
 * Tests streak tracking and daily consistency features.
 * Pure gamification - app-store compliant.
 */

import { test, expect } from '@playwright/test'
import { DashboardPage } from '../pages/dashboard.page'

test.describe('Streak System', () => {
  test('should display current streak on dashboard', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    await dashboardPage.goto()

    // Should show streak counter
    await expect(page.locator('text=/[0-9]+ day streak|Streak: [0-9]+/i')).toBeVisible({ timeout: 10000 })
  })

  test('should show streak milestone achievements', async ({ page }) => {
    await page.goto('/profile')

    // Check for streak-related achievements
    const achievementsLink = page.locator('text=/Achievements|Badges/')
    if (await achievementsLink.isVisible()) {
      await achievementsLink.click()
      
      // Look for streak achievements (7 day, 30 day, etc.)
      const streakAchievements = page.locator('text=/7.*day|30.*day|streak/i')
      await expect(streakAchievements.first()).toBeVisible()
    }
  })

  test('should show longest streak in profile', async ({ page }) => {
    await page.goto('/profile')

    // Should display longest streak stat
    await expect(page.locator('text=/Longest.*Streak|Best.*Streak/i')).toBeVisible()
  })
})


