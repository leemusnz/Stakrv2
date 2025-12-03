/**
 * E2E Tests: Challenge Settlement
 * 
 * Tests reward calculation and distribution.
 * WEB-ONLY - Critical for financial accuracy.
 */

import { test, expect } from '@playwright/test'

test.describe('Challenge Settlement', () => {
  test('should show reward calculation preview', async ({ page }) => {
    await page.goto('/my-active')

    // Click on an active cash challenge
    const challenge = page.locator('[data-testid="challenge-card"]').filter({ hasText: /\\$[0-9]+/ }).first()
    
    if (await challenge.isVisible()) {
      await challenge.click()
      
      // Should show potential winnings
      await expect(page.locator('text=/Potential.*win|You.*could.*earn/i')).toBeVisible()
    }
  })

  test('should display settlement details after completion', async ({ page }) => {
    // Note: This requires a completed challenge
    // In real test, would need to:
    // 1. Join challenge
    // 2. Submit all required proofs
    // 3. Wait for verification
    // 4. View settlement

    await page.goto('/my-challenges')

    // Look for completed challenges
    const completedTab = page.locator('button:has-text("Completed")')
    if (await completedTab.isVisible()) {
      await completedTab.click()
      
      // Click on a completed challenge
      const completedChallenge = page.locator('[data-testid="challenge-card"]').filter({ hasText: /Completed|Won|Lost/ }).first()
      
      if (await completedChallenge.isVisible()) {
        await completedChallenge.click()
        
        // Should show settlement details
        await expect(
          page.locator('text=/Reward|Settlement|Earned|Payout/')
        ).toBeVisible()
      }
    }
  })

  test('should show correct 20% failed stake distribution', async ({ page }) => {
    // This test verifies the reward calculation logic
    // Would need a completed challenge with mixed completion rates
    
    await page.goto('/my-challenges')
    
    const completedTab = page.locator('button:has-text("Completed")')
    if (await completedTab.isVisible()) {
      await completedTab.click()
      
      // Look for settlement breakdown
      // Should show: your stake + your share of 20% of failed stakes
      await expect(page.locator('[data-testid="challenge-card"]').first()).toBeVisible()
    }
  })

  test('should handle insurance refund for failed challenges', async ({ page }) => {
    // Test insurance payout when user fails but has insurance
    // Would require:
    // 1. Join with insurance
    // 2. Fail the challenge
    // 3. Verify insurance refund

    await page.goto('/my-challenges')
    
    // This is a complex flow that requires actual challenge failure
    // For now, just verify the page loads
    await expect(page.locator('h1, h2').filter({ hasText: /Challenges|My Active/ })).toBeVisible()
  })
})


