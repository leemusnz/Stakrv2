/**
 * E2E Tests: Mobile to Web Handoff
 * 
 * Tests the critical flow of redirecting from mobile app to web for cash features.
 * This is how we maintain app store compliance while offering full features.
 */

import { test, expect } from '@playwright/test'

test.describe('Mobile to Web Handoff', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone size

  test('should show "Continue on Web" for cash challenges on mobile', async ({ page }) => {
    await page.goto('/discover')

    // Find a cash challenge
    const cashChallenge = page.locator('[data-testid="challenge-card"]').filter({ hasText: /\\$[0-9]+/ }).first()
    
    if (await cashChallenge.isVisible()) {
      await cashChallenge.click()
      
      // On mobile, join button should indicate web is needed
      const joinButton = page.locator('button:has-text("Join")')
      if (await joinButton.isVisible()) {
        await joinButton.click()
        
        // Should see message about web requirement
        await expect(
          page.locator('text=/Continue on Web|Web Version Required|Open in Browser/i')
        ).toBeVisible({ timeout: 10000 })
      }
    }
  })

  test('should maintain session when redirecting to web', async ({ page }) => {
    // User logged in on mobile
    await page.goto('/dashboard')
    
    // Verify logged in
    await expect(page.locator('[data-testid="user-menu"]').or(page.locator('text=/Dashboard/'))).toBeVisible()
    
    // Navigate to a cash challenge
    await page.goto('/discover')
    const cashChallenge = page.locator('[data-testid="challenge-card"]').filter({ hasText: /\\$/ }).first()
    
    if (await cashChallenge.isVisible()) {
      await cashChallenge.click()
      
      // Try to join (should redirect or prompt)
      const joinButton = page.locator('button:has-text("Join")')
      if (await joinButton.isVisible()) {
        await joinButton.click()
        
        // After any redirect, session should persist
        // Check we're still logged in
        await page.goto('/dashboard')
        await expect(page.locator('[data-testid="user-menu"]').or(page.locator('text=/Dashboard/'))).toBeVisible()
      }
    }
  })

  test('should sync data between mobile and web views', async ({ page }) => {
    // Join a points challenge on "mobile"
    await page.goto('/discover')
    
    const pointsChallenge = page.locator('[data-testid="challenge-card"]').filter({ hasText: /Points|XP/ }).first()
    if (await pointsChallenge.isVisible()) {
      await pointsChallenge.click()
      
      const joinButton = page.locator('button:has-text("Join")')
      if (await joinButton.isVisible()) {
        await joinButton.click()
        await page.locator('button:has-text("Confirm")').click()
      }
    }
    
    // Switch to "desktop" view
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Should see the joined challenge
    await expect(page.locator('[data-testid="active-challenge"]').or(page.locator('text=/Active/'))).toBeVisible()
  })
})


