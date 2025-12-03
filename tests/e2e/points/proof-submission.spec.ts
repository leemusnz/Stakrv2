/**
 * E2E Tests: Proof Submission (Points Challenges)
 * 
 * Tests submitting and verifying proof for points-only challenges.
 * App-store compliant - no payment involved.
 */

import { test, expect } from '@playwright/test'
import { ChallengePage } from '../pages/challenge.page'

test.describe('Proof Submission - Points Challenges', () => {
  let challengePage: ChallengePage

  test.beforeEach(async ({ page }) => {
    challengePage = new ChallengePage(page)
  })

  test('should submit text proof for points challenge', async ({ page }) => {
    // Navigate to my active challenges
    await page.goto('/my-active')

    // Find a points-only challenge
    const pointsChallenge = page.locator('[data-testid="challenge-card"]').filter({ hasText: /Points|XP/ }).first()
    
    if (await pointsChallenge.isVisible()) {
      await pointsChallenge.click()
      
      // Click submit proof
      const submitButton = page.locator('button:has-text("Submit Proof")')
      if (await submitButton.isVisible()) {
        await submitButton.click()
        
        // Fill in proof details
        await page.fill('textarea[name="proofDescription"]', 'E2E test: Completed daily challenge task')
        
        // Submit
        await page.click('button:has-text("Submit")')
        
        // Wait for success message
        await expect(page.locator('text=/Proof submitted|Success/')).toBeVisible({ timeout: 15000 })
      }
    }
  })

  test('should show proof submission history', async ({ page }) => {
    await page.goto('/my-active')

    // Click on a challenge
    const challenge = page.locator('[data-testid="challenge-card"]').first()
    if (await challenge.isVisible()) {
      await challenge.click()
      
      // Look for proof history or activity log
      const historySection = page.locator('text=/History|Activity|Submissions/')
      if (await historySection.isVisible()) {
        await historySection.click()
        
        // Should show previous submissions
        await expect(page.locator('[data-testid="proof-item"]').or(page.locator('text=/Submitted|Approved/'))).toBeVisible()
      }
    }
  })

  test('should track completion progress', async ({ page }) => {
    await page.goto('/my-active')

    // Click on an active challenge
    const challenge = page.locator('[data-testid="challenge-card"]').first()
    if (await challenge.isVisible()) {
      await challenge.click()
      
      // Should show progress bar or completion percentage
      await expect(
        page.locator('[data-testid="progress-bar"]')
          .or(page.locator('text=/[0-9]+%|[0-9]+\/[0-9]+/'))
      ).toBeVisible()
    }
  })

  test('should validate proof submission requirements', async ({ page }) => {
    await page.goto('/my-active')

    const challenge = page.locator('[data-testid="challenge-card"]').first()
    if (await challenge.isVisible()) {
      await challenge.click()
      
      const submitButton = page.locator('button:has-text("Submit Proof")')
      if (await submitButton.isVisible()) {
        await submitButton.click()
        
        // Try to submit empty proof
        await page.click('button:has-text("Submit")')
        
        // Should show validation error
        await expect(page.locator('text=/required|cannot be empty/i')).toBeVisible()
      }
    }
  })
})


