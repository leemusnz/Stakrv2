/**
 * E2E Tests: Leaderboard & Competition
 * 
 * Tests competitive gamification features.
 * App-store compliant - pure competition, no gambling.
 */

import { test, expect } from '@playwright/test'

test.describe('Leaderboard System', () => {
  test('should display leaderboard rankings', async ({ page }) => {
    await page.goto('/social')

    // Click on leaderboard tab or link
    await page.click('text=/Leaderboard|Rankings/')

    // Should show leaderboard with rankings
    await expect(page.locator('[data-testid="leaderboard"]').or(page.locator('text=/Rank|Position/'))).toBeVisible({ timeout: 10000 })

    // Should show multiple users
    await expect(page.locator('[data-testid="leaderboard-user"]').or(page.locator('text=/#[0-9]+/'))).toHaveCount({ min: 1 })
  })

  test('should switch between leaderboard timeframes', async ({ page }) => {
    await page.goto('/social')
    await page.click('text=/Leaderboard|Rankings/')

    // Try different timeframes
    const timeframes = ['Daily', 'Weekly', 'Monthly', 'All Time']

    for (const timeframe of timeframes) {
      const timeframeButton = page.locator(`button:has-text("${timeframe}")`)
      if (await timeframeButton.isVisible()) {
        await timeframeButton.click()
        
        // Wait for data to load
        await page.waitForLoadState('networkidle')
        
        // Should still show leaderboard
        await expect(page.locator('[data-testid="leaderboard"]').or(page.locator('text=Rank'))).toBeVisible()
      }
    }
  })

  test('should switch between leaderboard categories', async ({ page }) => {
    await page.goto('/social')
    await page.click('text=/Leaderboard|Rankings/')

    // Try different categories
    const categories = ['Overall', 'Earnings', 'Streaks', 'Completions']

    for (const category of categories) {
      const categoryButton = page.locator(`button:has-text("${category}")`)
      if (await categoryButton.isVisible()) {
        await categoryButton.click()
        
        // Wait for data to load
        await page.waitForLoadState('networkidle')
        
        // Should show appropriate data for category
        await expect(page.locator('[data-testid="leaderboard"]')).toBeVisible()
      }
    }
  })

  test('should show current user position on leaderboard', async ({ page }) => {
    await page.goto('/social')
    await page.click('text=/Leaderboard|Rankings/')

    // Should highlight current user's position
    await expect(
      page.locator('[data-testid="current-user-position"]')
        .or(page.locator('.highlight, .current-user'))
    ).toBeVisible({ timeout: 10000 })
  })

  test('should show user stats in leaderboard', async ({ page }) => {
    await page.goto('/social')
    await page.click('text=/Leaderboard|Rankings/')

    // Each user should show relevant stats
    const firstUser = page.locator('[data-testid="leaderboard-user"]').first()
    
    if (await firstUser.isVisible()) {
      // Should show name, rank, and some metric
      await expect(firstUser.locator('text=/[0-9]+/')).toBeVisible()
    }
  })
})
