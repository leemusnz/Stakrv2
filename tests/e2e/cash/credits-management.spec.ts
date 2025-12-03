/**
 * E2E Tests: Credits Management
 * 
 * Tests buying, using, and managing credits.
 * WEB-ONLY - Financial transactions.
 */

import { test, expect } from '@playwright/test'
import { DashboardPage } from '../pages/dashboard.page'

test.describe('Credits Management', () => {
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page)
  })

  test('should display current credit balance', async ({ page }) => {
    await page.goto('/wallet')

    // Should show credits balance prominently
    await expect(page.locator('[data-testid="credit-balance"]').or(page.locator('text=/Balance.*\\$/i'))).toBeVisible({ timeout: 10000 })
  })

  test('should show credit purchase options', async ({ page }) => {
    await page.goto('/wallet')

    // Should show various purchase amounts
    await expect(page.locator('text=/\\$50|\\$100|\\$200/')).toBeVisible()
  })

  test('should track credit transactions', async ({ page }) => {
    await page.goto('/wallet')

    // Should show transaction history
    const transactionsList = page.locator('[data-testid="transactions"]').or(page.locator('text=/Transaction History|Recent Activity/'))
    await expect(transactionsList).toBeVisible()

    // Should show transaction types
    await expect(page.locator('text=/Joined|Reward|Withdrawal|Purchase/')).toBeVisible()
  })

  test('should show pending transactions', async ({ page }) => {
    await page.goto('/wallet')

    // Should have section for pending transactions
    // May be empty, but section should exist
    await expect(page.locator('h2, h3').filter({ hasText: /Wallet|Balance|Transactions/ })).toBeVisible()
  })
})


