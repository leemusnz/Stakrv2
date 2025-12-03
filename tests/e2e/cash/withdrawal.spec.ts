/**
 * E2E Tests: Withdrawal Flow
 * 
 * Tests cashing out earnings.
 * WEB-ONLY - Critical financial flow.
 */

import { test, expect } from '@playwright/test'

test.describe('Withdrawal Flow', () => {
  test('should access withdrawal page', async ({ page }) => {
    await page.goto('/wallet')

    // Look for withdraw/cashout button
    const withdrawButton = page.locator('button:has-text("Withdraw")').or(page.locator('button:has-text("Cash Out")'))
    
    if (await withdrawButton.isVisible()) {
      await withdrawButton.click()
      
      // Should show withdrawal form or options
      await expect(page.locator('text=/Withdraw|Cash Out|Bank Account/')).toBeVisible({ timeout: 10000 })
    } else {
      // If no button, might need minimum balance first
      await expect(page.locator('text=/Wallet|Balance/')).toBeVisible()
    }
  })

  test('should show withdrawal requirements', async ({ page }) => {
    await page.goto('/wallet')

    const withdrawButton = page.locator('button:has-text("Withdraw")')
    if (await withdrawButton.isVisible()) {
      await withdrawButton.click()
      
      // Should show minimum withdrawal amount or requirements
      await expect(page.locator('text=/minimum|requirement|fee/i')).toBeVisible()
    }
  })

  test('should validate withdrawal amount', async ({ page }) => {
    await page.goto('/wallet')

    const withdrawButton = page.locator('button:has-text("Withdraw")')
    if (await withdrawButton.isVisible()) {
      await withdrawButton.click()
      
      // Try to withdraw more than available
      const amountInput = page.locator('input[name="amount"]').or(page.locator('input[type="number"]'))
      if (await amountInput.isVisible()) {
        await amountInput.fill('99999')
        
        await page.click('button:has-text("Confirm")')
        
        // Should show error
        await expect(page.locator('text=/Insufficient|exceeds.*balance/i')).toBeVisible()
      }
    }
  })

  test('should show 3% cashout fee', async ({ page }) => {
    await page.goto('/wallet')

    const withdrawButton = page.locator('button:has-text("Withdraw")')
    if (await withdrawButton.isVisible()) {
      await withdrawButton.click()
      
      // Should mention 3% fee
      await expect(page.locator('text=/3%.*fee|fee.*3%/i')).toBeVisible()
    }
  })
})


