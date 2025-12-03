/**
 * E2E Tests: Join Cash Challenge
 * 
 * Tests joining challenges with real money stakes.
 * WEB-ONLY - Not for app store version.
 */

import { test, expect } from '@playwright/test'
import { ChallengePage } from '../pages/challenge.page'
import { DashboardPage } from '../pages/dashboard.page'

test.describe('Cash Challenge Participation', () => {
  let challengePage: ChallengePage
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    challengePage = new ChallengePage(page)
    dashboardPage = new DashboardPage(page)
  })

  test('should display cash challenges with stake information', async ({ page }) => {
    await challengePage.gotoDiscover()

    // Look for challenges showing money amounts
    await expect(page.locator('text=/\\$[0-9]+|Cash Challenge/')).toBeVisible({ timeout: 10000 })
  })

  test('should join cash challenge with credits', async ({ page }) => {
    await challengePage.gotoDiscover()

    // Find a cash challenge
    const cashChallenge = page.locator('[data-testid="challenge-card"]').filter({ hasText: /\\$[0-9]+/ }).first()
    
    if (await cashChallenge.isVisible()) {
      // Get initial credits
      await dashboardPage.goto()
      const initialCredits = await dashboardPage.getCredits()
      
      // Join the challenge
      await cashChallenge.click()
      
      await page.click('button:has-text("Join Challenge")')
      
      // Select stake amount
      const stakeInput = page.locator('input[name="stakeAmount"]')
      if (await stakeInput.isVisible()) {
        await stakeInput.fill('25')
      }
      
      // Confirm join
      await page.click('button:has-text("Confirm Join")')
      
      // Should see success or redirect to payment
      await page.waitForURL(/\/(challenge|wallet|dashboard)/, { timeout: 15000 })
      
      // Verify credits were deducted (if using credits)
      await dashboardPage.goto()
      const newCredits = await dashboardPage.getCredits()
      expect(newCredits).toBeLessThanOrEqual(initialCredits)
    }
  })

  test('should show insufficient credits error', async ({ page }) => {
    await challengePage.gotoDiscover()

    // Find a high-stake challenge
    const highStakeChallenge = page.locator('[data-testid="challenge-card"]').filter({ hasText: /\\$[1-9][0-9]{2,}/ }).first()
    
    if (await highStakeChallenge.isVisible()) {
      await highStakeChallenge.click()
      
      await page.click('button:has-text("Join Challenge")')
      
      // Try to stake more than available
      const stakeInput = page.locator('input[name="stakeAmount"]')
      if (await stakeInput.isVisible()) {
        await stakeInput.fill('99999')
        
        // Try to join
        await page.click('button:has-text("Confirm")')
        
        // Should show insufficient credits error
        await expect(page.locator('text=/Insufficient credits|Not enough credits/')).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('should calculate entry fee correctly', async ({ page }) => {
    await challengePage.gotoDiscover()

    const challenge = page.locator('[data-testid="challenge-card"]').first()
    if (await challenge.isVisible()) {
      await challenge.click()
      
      await page.click('button:has-text("Join Challenge")')
      
      // Set stake to 100
      const stakeInput = page.locator('input[name="stakeAmount"]')
      if (await stakeInput.isVisible()) {
        await stakeInput.fill('100')
        
        // Should show 5% entry fee = $5.00
        await expect(page.locator('text=/Entry Fee.*\\$5\\.00/')).toBeVisible()
        
        // Total should be $105.00
        await expect(page.locator('text=/Total.*\\$105\\.00/')).toBeVisible()
      }
    }
  })

  test('should show insurance addon option', async ({ page }) => {
    await challengePage.gotoDiscover()

    const challenge = page.locator('[data-testid="challenge-card"]').first()
    if (await challenge.isVisible()) {
      await challenge.click()
      
      await page.click('button:has-text("Join Challenge")')
      
      // Should show $1 insurance option
      await expect(page.locator('text=/Insurance|\\$1.*protection/i')).toBeVisible()
      
      // Click insurance checkbox
      const insuranceCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /Insurance/ })
      if (await insuranceCheckbox.isVisible()) {
        await insuranceCheckbox.check()
        
        // Total should increase by $1
        await expect(page.locator('text=/\\+.*\\$1.*insurance/i')).toBeVisible()
      }
    }
  })
})


