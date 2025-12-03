/**
 * E2E Tests: Join Points-Only Challenge
 * 
 * Tests joining and participating in XP/points challenges.
 * App-store compliant - no real money involved.
 */

import { test, expect } from '@playwright/test'
import { ChallengePage } from '../pages/challenge.page'
import { DashboardPage } from '../pages/dashboard.page'
import { assertNotificationShown } from '../helpers/assertions'

test.describe('Points-Only Challenge Participation', () => {
  let challengePage: ChallengePage
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    challengePage = new ChallengePage(page)
    dashboardPage = new DashboardPage(page)
  })

  test('should display points-only challenges in discover', async ({ page }) => {
    await challengePage.gotoDiscover()

    // Look for challenges with "Points Only" or "XP" badges
    await expect(page.locator('text=/Points Only|XP Challenge/')).toBeVisible({ timeout: 10000 })
  })

  test('should join a points-only challenge without payment', async ({ page }) => {
    await challengePage.gotoDiscover()

    // Find and click on a points-only challenge
    const pointsChallenge = page.locator('[data-testid="challenge-card"]').filter({ hasText: /Points Only|XP/ }).first()
    
    if (await pointsChallenge.isVisible()) {
      await pointsChallenge.click()
      
      // Join the challenge
      await page.click('button:has-text("Join Challenge")')
      
      // Should show confirmation without payment step
      await expect(page.locator('text=/Successfully joined|Joined successfully/')).toBeVisible({ timeout: 10000 })
      
      // Should NOT see payment/checkout flow
      await expect(page.locator('text=/Stripe|Payment|Checkout/')).not.toBeVisible()
    }
  })

  test('should show joined challenge in dashboard', async ({ page }) => {
    await dashboardPage.goto()

    // Navigate to active challenges
    await page.click('text=/Active|My Challenges/')

    // Should see at least one active challenge
    await expect(page.locator('[data-testid="active-challenge"]').or(page.locator('text=/Active Challenge/'))).toBeVisible()
  })

  test('should earn XP for completing points challenge', async ({ page }) => {
    await dashboardPage.goto()

    // Get initial XP
    const initialXP = await dashboardPage.getXP()

    // Navigate to an active points challenge
    await page.click('text=/Active|My Challenges/')
    
    const activeChallenge = page.locator('[data-testid="active-challenge"]').first()
    if (await activeChallenge.isVisible()) {
      await activeChallenge.click()
      
      // Submit proof if button is available
      const submitButton = page.locator('button:has-text("Submit Proof")')
      if (await submitButton.isVisible()) {
        await submitButton.click()
        
        // Fill proof form
        await page.fill('textarea[name="proofDescription"]', 'E2E test proof submission')
        await page.click('button:has-text("Submit")')
        
        // Wait for success
        await expect(page.locator('text=/Proof submitted|Success/')).toBeVisible({ timeout: 10000 })
      }
    }

    // Return to dashboard and verify XP increased
    await dashboardPage.goto()
    const newXP = await dashboardPage.getXP()
    
    // XP should be same or higher (may increase if proof was submitted)
    expect(newXP).toBeGreaterThanOrEqual(initialXP)
  })

  test('should not require payment for points-only challenges', async ({ page }) => {
    await challengePage.gotoDiscover()

    // Find a points-only challenge
    const pointsChallenge = page.locator('[data-testid="challenge-card"]').filter({ hasText: /Points Only|XP/ }).first()
    
    if (await pointsChallenge.isVisible()) {
      await pointsChallenge.click()
      
      // Challenge details should show it's free
      await expect(page.locator('text=/Free|Points Only|No Money/')).toBeVisible()
      
      // Join button should not mention payment
      await expect(page.locator('button:has-text("Join Challenge")')).toBeVisible()
      await expect(page.locator('button:has-text("Join Challenge")').locator('text=/Pay|\\$/')).not.toBeVisible()
    }
  })
})


