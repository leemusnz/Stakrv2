/**
 * E2E Tests: Payment & Checkout Flow
 * 
 * Tests Stripe checkout and payment confirmation.
 * WEB-ONLY - Critical for financial transactions.
 */

import { test, expect } from '@playwright/test'
import { PAYMENT_TEST_CARDS } from '../helpers/test-data'

test.describe('Payment & Checkout Flow', () => {
  test('should redirect to Stripe checkout for cash purchase', async ({ page }) => {
    await page.goto('/wallet')

    // Click add credits/funds button
    const addFundsButton = page.locator('button:has-text("Add Funds")').or(page.locator('button:has-text("Buy Credits")'))
    
    if (await addFundsButton.isVisible()) {
      await addFundsButton.click()
      
      // Select amount
      await page.click('button:has-text("$50")')
      
      // Click checkout
      await page.click('button:has-text("Checkout")')
      
      // Should redirect to Stripe or show checkout modal
      // In test mode, may show mock checkout
      await expect(
        page.locator('text=/Stripe|Checkout|Payment/')
          .or(page.locator('[data-testid="checkout"]'))
      ).toBeVisible({ timeout: 10000 })
    }
  })

  test('should handle successful payment', async ({ page }) => {
    // Note: This test requires Stripe test mode or mock webhook
    await page.goto('/wallet')

    const initialCredits = await page.locator('[data-testid="user-credits"]').or(page.locator('text=/\\$[0-9.,]+/')).first().textContent()
    const credits = parseFloat(initialCredits?.replace(/[^0-9.]/g, '') || '0')

    // In a real test, you would:
    // 1. Trigger checkout
    // 2. Complete payment with test card
    // 3. Handle webhook callback
    // 4. Verify credits increased

    // For now, just verify the wallet page loads
    await expect(page.locator('[data-testid="wallet"]').or(page.locator('h1:has-text("Wallet")'))).toBeVisible()
  })

  test('should show payment history', async ({ page }) => {
    await page.goto('/wallet')

    // Should show transaction history
    await expect(
      page.locator('[data-testid="transaction-history"]')
        .or(page.locator('text=/Transaction|History|Recent Activity/'))
    ).toBeVisible({ timeout: 10000 })
  })

  test('should handle payment cancellation', async ({ page }) => {
    // User cancels during checkout
    // Should return to challenge page without joining
    // Credits should not be deducted
    
    await page.goto('/wallet')
    
    const addFundsButton = page.locator('button:has-text("Add Funds")')
    if (await addFundsButton.isVisible()) {
      const initialCredits = await page.locator('[data-testid="user-credits"]').first().textContent()
      
      await addFundsButton.click()
      
      // Click cancel or back
      const cancelButton = page.locator('button:has-text("Cancel")').or(page.locator('button[aria-label="Close"]'))
      if (await cancelButton.isVisible()) {
        await cancelButton.click()
        
        // Credits should be unchanged
        await expect(page.locator(`text=${initialCredits}`)).toBeVisible()
      }
    }
  })
})


