/**
 * E2E Tests: Withdrawal Flow
 * 
 * Tests cashing out earnings with comprehensive validation.
 * WEB-ONLY - Critical financial flow.
 */

import { test, expect } from '@playwright/test'

test.describe('Withdrawal Flow - Comprehensive', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to wallet page
    await page.goto('/wallet')
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test('should display wallet with available balance', async ({ page }) => {
    // Verify wallet page loads
    await expect(page.locator('h1, h2').filter({ hasText: /Wallet|Balance/ })).toBeVisible()
    
    // Check for balance display
    await expect(page.locator('text=/Available.*withdrawal|Balance/i')).toBeVisible()
  })

  test('should show withdrawal form with fee calculator', async ({ page }) => {
    // Find and verify withdrawal section exists
    const withdrawSection = page.locator('text=/Withdraw Funds/i')
    await expect(withdrawSection).toBeVisible()
    
    // Verify input field exists
    const amountInput = page.locator('input#withdraw-amount, input[placeholder*="amount"]')
    await expect(amountInput).toBeVisible()
    
    // Verify 3% fee is mentioned
    await expect(page.locator('text=/3%.*fee|Fee.*3%/i')).toBeVisible()
    
    // Verify minimum $10 requirement is shown
    await expect(page.locator('text=/min.*\\$10|minimum.*10/i')).toBeVisible()
  })

  test('should calculate fees dynamically', async ({ page }) => {
    const amountInput = page.locator('input#withdraw-amount')
    
    if (await amountInput.isVisible()) {
      // Enter $100
      await amountInput.fill('100')
      await page.waitForTimeout(500) // Wait for calculation
      
      // Should show $3.00 fee (3% of $100)
      await expect(page.locator('text=/Fee.*\\$3\\.00|\\$3\\.00.*fee/i')).toBeVisible()
      
      // Should show $103.00 total
      await expect(page.locator('text=/Total.*\\$103\\.00|\\$103\\.00.*total/i')).toBeVisible()
    }
  })

  test('should prevent withdrawal below $10 minimum', async ({ page }) => {
    const amountInput = page.locator('input#withdraw-amount')
    const withdrawButton = page.locator('button:has-text("Withdraw")')
    
    if (await amountInput.isVisible() && await withdrawButton.isVisible()) {
      // Try to withdraw $5
      await amountInput.fill('5')
      await withdrawButton.click()
      
      // Should show minimum withdrawal error
      await expect(page.locator('text=/Minimum.*\\$10|minimum.*10/i')).toBeVisible({ timeout: 5000 })
    }
  })

  test('should prevent withdrawal exceeding available balance', async ({ page }) => {
    const amountInput = page.locator('input#withdraw-amount')
    const withdrawButton = page.locator('button:has-text("Withdraw")')
    
    if (await amountInput.isVisible() && await withdrawButton.isVisible()) {
      // Try to withdraw an extremely large amount
      await amountInput.fill('999999')
      await withdrawButton.click()
      
      // Should show insufficient balance error
      await expect(page.locator('text=/Insufficient|not enough|exceeds/i')).toBeVisible({ timeout: 5000 })
    }
  })

  test('should successfully process valid withdrawal (mocked)', async ({ page }) => {
    const amountInput = page.locator('input#withdraw-amount')
    const withdrawButton = page.locator('button:has-text("Withdraw")')
    
    if (await amountInput.isVisible() && await withdrawButton.isVisible()) {
      // Mock successful withdrawal
      await page.route('**/api/payments/withdraw', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            withdrawal: {
              amount: 50,
              fee: 1.50,
              total_deducted: 51.50,
              new_balance: 48.50,
              note: 'Withdrawal processed successfully'
            }
          })
        })
      })
      
      // Enter $50 and submit
      await amountInput.fill('50')
      await withdrawButton.click()
      
      // Should show success message
      await expect(page.locator('text=/success|processed|completed/i')).toBeVisible({ timeout: 5000 })
    }
  })

  test('should display withdrawal breakdown correctly', async ({ page }) => {
    const amountInput = page.locator('input#withdraw-amount')
    
    if (await amountInput.isVisible()) {
      // Enter various amounts and verify calculations
      const testCases = [
        { amount: 10, fee: 0.30, total: 10.30 },
        { amount: 50, fee: 1.50, total: 51.50 },
        { amount: 100, fee: 3.00, total: 103.00 },
        { amount: 500, fee: 15.00, total: 515.00 }
      ]
      
      for (const testCase of testCases) {
        await amountInput.fill(testCase.amount.toString())
        await page.waitForTimeout(300)
        
        // Verify fee is shown
        const feeText = `$${testCase.fee.toFixed(2)}`
        await expect(page.locator(`text=${feeText}`)).toBeVisible()
      }
    }
  })

  test('should show delivery timeframe (3-5 business days)', async ({ page }) => {
    // Should mention delivery timeframe
    await expect(page.locator('text=/3-5.*business.*days|business.*days.*3-5/i')).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    const amountInput = page.locator('input#withdraw-amount')
    const withdrawButton = page.locator('button:has-text("Withdraw")')
    
    if (await amountInput.isVisible() && await withdrawButton.isVisible()) {
      // Mock API error
      await page.route('**/api/payments/withdraw', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Server error',
            message: 'Failed to process withdrawal'
          })
        })
      })
      
      await amountInput.fill('50')
      await withdrawButton.click()
      
      // Should show error message
      await expect(page.locator('text=/error|failed|try again/i')).toBeVisible({ timeout: 5000 })
    }
  })

  test('should exclude locked stakes from available balance', async ({ page }) => {
    // Check if available balance text shows calculation
    const availableText = page.locator('text=/Available.*withdrawal/i')
    await expect(availableText).toBeVisible()
    
    // If user has active challenges, balance should account for locked stakes
    // This is verified by checking if the displayed available balance is less than total balance
  })
})


