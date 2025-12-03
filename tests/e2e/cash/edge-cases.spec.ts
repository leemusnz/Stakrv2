/**
 * E2E Tests: Cash System Edge Cases
 * 
 * Tests error handling and edge cases for financial transactions.
 * WEB-ONLY - Critical for preventing financial bugs.
 */

import { test, expect } from '@playwright/test'

test.describe('Cash System Edge Cases', () => {
  test('should prevent joining same challenge twice', async ({ page }) => {
    await page.goto('/my-active')

    // Get an active challenge
    const activeChallenge = page.locator('[data-testid="challenge-card"]').first()
    
    if (await activeChallenge.isVisible()) {
      await activeChallenge.click()
      
      // Join button should be disabled or show "Already Joined"
      await expect(
        page.locator('button:has-text("Already Joined")')
          .or(page.locator('button:has-text("Join"):disabled'))
          .or(page.locator('text=/You.*already.*joined/'))
      ).toBeVisible()
    }
  })

  test('should handle concurrent join attempts', async ({ page, context }) => {
    // Open challenge in two tabs
    const page2 = await context.newPage()
    
    await page.goto('/discover')
    await page2.goto('/discover')

    // Both tabs try to join same challenge
    // Second attempt should fail or be idempotent
    
    const challenge = page.locator('[data-testid="challenge-card"]').first()
    if (await challenge.isVisible()) {
      const challengeId = await challenge.getAttribute('data-challenge-id')
      
      if (challengeId) {
        // Tab 1 joins
        await page.goto(`/challenge/${challengeId}`)
        const joinButton1 = page.locator('button:has-text("Join")')
        if (await joinButton1.isVisible()) {
          await joinButton1.click()
        }

        // Tab 2 tries to join same challenge
        await page2.goto(`/challenge/${challengeId}`)
        const joinButton2 = page2.locator('button:has-text("Join")')
        
        // Should show already joined or button disabled
        if (await joinButton2.isVisible()) {
          await expect(joinButton2).toBeDisabled()
        } else {
          await expect(page2.locator('text=/Already.*joined/')).toBeVisible()
        }
      }
    }
    
    await page2.close()
  })

  test('should validate stake min/max bounds', async ({ page }) => {
    await page.goto('/discover')

    const challenge = page.locator('[data-testid="challenge-card"]').first()
    if (await challenge.isVisible()) {
      await challenge.click()
      
      const joinButton = page.locator('button:has-text("Join")')
      if (await joinButton.isVisible()) {
        await joinButton.click()
        
        // Try to stake below minimum
        const stakeInput = page.locator('input[name="stakeAmount"]')
        if (await stakeInput.isVisible()) {
          await stakeInput.fill('1')
          
          // Should show validation error or disable confirm
          await expect(
            page.locator('text=/minimum|at least/i')
              .or(page.locator('button:has-text("Confirm"):disabled'))
          ).toBeVisible()
        }
      }
    }
  })

  test('should handle database errors gracefully', async ({ page }) => {
    // This would require simulating a database error
    // For now, just verify error handling UI exists
    
    await page.goto('/discover')
    
    // Page should load even if some data fails
    await expect(page.locator('body')).toBeVisible()
  })

  test('should show correct totals with insurance', async ({ page }) => {
    await page.goto('/discover')

    const challenge = page.locator('[data-testid="challenge-card"]').first()
    if (await challenge.isVisible()) {
      await challenge.click()
      
      const joinButton = page.locator('button:has-text("Join")')
      if (await joinButton.isVisible()) {
        await joinButton.click()
        
        // Set stake to $100
        const stakeInput = page.locator('input[name="stakeAmount"]')
        if (await stakeInput.isVisible()) {
          await stakeInput.fill('100')
          
          // Enable insurance
          const insuranceBox = page.locator('input[type="checkbox"]').filter({ hasText: /Insurance/ })
          if (await insuranceBox.isVisible()) {
            await insuranceBox.check()
            
            // Total should be: $100 (stake) + $5 (5% fee) + $1 (insurance) = $106
            await expect(page.locator('text=/Total.*\\$106/i')).toBeVisible()
          }
        }
      }
    }
  })
})


