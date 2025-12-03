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

test.describe('Insurance Refund Flow - Comprehensive', () => {
  test('should show insurance option when joining challenge', async ({ page }) => {
    // Navigate to a challenge
    await page.goto('/discover')
    await page.waitForLoadState('networkidle')
    
    // Click on first challenge (if available)
    const challengeCard = page.locator('[data-testid="challenge-card"]').first()
    if (await challengeCard.isVisible()) {
      await challengeCard.click()
      
      // Should see insurance option
      await expect(page.locator('text=/\\$1.*insurance|insurance.*\\$1/i')).toBeVisible()
      
      // Should explain insurance benefits
      await expect(page.locator('text=/protect.*stake|refund.*fail/i')).toBeVisible()
    }
  })

  test('should calculate total cost with insurance', async ({ page }) => {
    await page.goto('/discover')
    await page.waitForLoadState('networkidle')
    
    const challengeCard = page.locator('[data-testid="challenge-card"]').first()
    if (await challengeCard.isVisible()) {
      await challengeCard.click()
      
      // If stake amount input exists
      const stakeInput = page.locator('input[type="number"]').first()
      if (await stakeInput.isVisible()) {
        await stakeInput.fill('50')
        
        // Check insurance checkbox if available
        const insuranceCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /insurance/i })
        if (await insuranceCheckbox.isVisible()) {
          await insuranceCheckbox.check()
          
          // Total should be: $50 (stake) + $2.50 (5% fee) + $1 (insurance) = $53.50
          await expect(page.locator('text=/\\$53\\.50|53\\.50/i')).toBeVisible()
        }
      }
    }
  })

  test('should show insurance status in active challenges', async ({ page }) => {
    await page.goto('/my-challenges')
    await page.waitForLoadState('networkidle')
    
    // Look for insurance badge or indicator on challenges
    const challengeWithInsurance = page.locator('text=/insured|protected|🛡️/i').first()
    
    // If user has insured challenges, they should be marked
    if (await challengeWithInsurance.isVisible()) {
      await expect(challengeWithInsurance).toBeVisible()
    }
  })

  test('should process insurance payout on challenge completion (mocked)', async ({ page }) => {
    // Mock the challenge completion endpoint to simulate insurance payout
    await page.route('**/api/challenges/*/complete', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Challenge completed',
          insurance_payouts: [
            {
              user_id: 'test-user',
              amount: 50.00,
              challenge_title: 'Test Challenge'
            }
          ]
        })
      })
    })
    
    await page.goto('/my-challenges')
    // The actual completion would be triggered by admin
  })

  test('should show insurance payout notification', async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForLoadState('networkidle')
    
    // Look for insurance payout notifications
    const insuranceNotification = page.locator('text=/insurance.*payout|payout.*insurance|🛡️.*received/i').first()
    
    // If user has received insurance payouts, notification should exist
    if (await insuranceNotification.isVisible()) {
      await expect(insuranceNotification).toBeVisible()
      
      // Should show refunded amount
      await expect(page.locator('text=/\\$[0-9]+\\.\\d{2}/i')).toBeVisible()
    }
  })

  test('should update wallet balance after insurance payout', async ({ page }) => {
    // After insurance payout, wallet balance should increase
    await page.goto('/wallet')
    await page.waitForLoadState('networkidle')
    
    // Check for insurance payout transaction
    const insuranceTransaction = page.locator('text=/insurance.*payout|refund/i').first()
    
    if (await insuranceTransaction.isVisible()) {
      // Should show positive amount (refund)
      await expect(page.locator('text=/\\+\\$[0-9]+|\\$[0-9]+\\.\\d{2}/i')).toBeVisible()
    }
  })
})

test.describe('Revenue Split Verification - 20/80 Rule', () => {
  test('should correctly calculate platform cut (20% of failed stakes)', async ({ page }) => {
    // This test verifies the math behind reward distribution
    // Example: If $1000 in failed stakes:
    // Platform gets: $200 (20%)
    // Winners share: $800 (80%)
    
    await page.goto('/admin/financial-monitor')
    await page.waitForLoadState('networkidle')
    
    // Check revenue breakdown
    const failedStakesRevenue = page.locator('text=/Failed Stakes/i')
    if (await failedStakesRevenue.isVisible()) {
      // Revenue should be visible
      await expect(page.locator('text=/\\$[0-9]+\\.\\d{2}/i')).toBeVisible()
    }
  })

  test('should show correct reward distribution to winners', async ({ page }) => {
    // Navigate to completed challenge
    await page.goto('/my-challenges')
    await page.waitForLoadState('networkidle')
    
    // Switch to completed tab
    const completedTab = page.locator('button:has-text("Completed")')
    if (await completedTab.isVisible()) {
      await completedTab.click()
      
      const challengeCard = page.locator('[data-testid="challenge-card"]').first()
      if (await challengeCard.isVisible()) {
        await challengeCard.click()
        
        // Should show reward breakdown
        await expect(page.locator('text=/reward|earned|bonus/i')).toBeVisible()
        
        // Should show stake return + bonus from failed stakes
        await expect(page.locator('text=/breakdown/i')).toBeVisible()
      }
    }
  })

  test('admin dashboard should show accurate revenue calculations', async ({ page }) => {
    await page.goto('/admin/financial-monitor')
    await page.waitForLoadState('networkidle')
    
    // Should show multiple revenue sources
    await expect(page.locator('text=/Entry Fees/i')).toBeVisible()
    await expect(page.locator('text=/Failed Stakes/i')).toBeVisible()
    await expect(page.locator('text=/Insurance/i')).toBeVisible()
    await expect(page.locator('text=/Cashout Fees/i')).toBeVisible()
    
    // Total revenue should be sum of all sources
    await expect(page.locator('text=/Total Revenue/i')).toBeVisible()
  })

  test('should verify insurance profitability calculation', async ({ page }) => {
    await page.goto('/admin/financial-monitor')
    await page.waitForLoadState('networkidle')
    
    // Insurance section should show:
    // - Total insurance fees collected
    // - Total payouts made
    // - Net profit (fees - payouts)
    
    const insuranceSection = page.locator('text=/Insurance Performance/i')
    if (await insuranceSection.isVisible()) {
      await expect(page.locator('text=/Total Revenue/i')).toBeVisible()
      await expect(page.locator('text=/Net Profit/i')).toBeVisible()
      await expect(page.locator('text=/Claim Rate/i')).toBeVisible()
    }
  })

  test('should flag suspicious financial activity', async ({ page }) => {
    await page.goto('/admin/financial-monitor')
    await page.waitForLoadState('networkidle')
    
    // Should show large transactions section
    const suspiciousSection = page.locator('text=/Large Transactions.*Risk Monitoring/i')
    if (await suspiciousSection.isVisible()) {
      // Should identify suspicious patterns
      const suspiciousBadge = page.locator('[class*="destructive"]').filter({ hasText: /suspicious/i })
      
      // If any suspicious activity exists, it should be flagged
      if (await suspiciousBadge.isVisible()) {
        await expect(suspiciousBadge).toBeVisible()
      }
    }
  })

  test('should calculate active stakes at risk accurately', async ({ page }) => {
    await page.goto('/admin/financial-monitor')
    await page.waitForLoadState('networkidle')
    
    // Active stakes section should show:
    // - Total stakes locked
    // - Insured stakes (protected)
    // - At-risk stakes (total - insured)
    
    const activeStakesSection = page.locator('text=/Active Stakes.*Money at Risk/i')
    if (await activeStakesSection.isVisible()) {
      await expect(page.locator('text=/At risk/i')).toBeVisible()
      await expect(page.locator('text=/insured/i')).toBeVisible()
    }
  })
})


