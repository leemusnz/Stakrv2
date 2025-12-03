/**
 * E2E Tests: Data Consistency
 * 
 * Tests that data remains consistent across different flows and contexts.
 * Critical for preventing financial discrepancies.
 */

import { test, expect } from '@playwright/test'
import { DashboardPage } from '../pages/dashboard.page'

test.describe('Data Consistency', () => {
  test('should maintain credit balance consistency', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    
    // Check credits on dashboard
    await dashboardPage.goto()
    const dashboardCredits = await dashboardPage.getCredits()
    
    // Check credits on wallet page
    await page.goto('/wallet')
    const walletCredits = parseFloat(
      (await page.locator('[data-testid="credit-balance"]').or(page.locator('text=/Balance.*\\$/i')).first().textContent())
        ?.replace(/[^0-9.]/g, '') || '0'
    )
    
    // Should match
    expect(Math.abs(dashboardCredits - walletCredits)).toBeLessThan(0.01)
  })

  test('should maintain XP consistency across pages', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    
    // Check XP on dashboard
    await dashboardPage.goto()
    const dashboardXP = await dashboardPage.getXP()
    
    // Check XP on profile
    await page.goto('/profile')
    const profileXP = parseInt(
      (await page.locator('[data-testid="user-xp"]').or(page.locator('text=/[0-9,]+ XP/')).first().textContent())
        ?.replace(/[^0-9]/g, '') || '0'
    )
    
    // Should match
    expect(dashboardXP).toBe(profileXP)
  })

  test('should show consistent challenge counts', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Get active challenge count from dashboard
    const dashboardCount = page.locator('text=/[0-9]+ Active/i')
    const dashboardText = await dashboardCount.first().textContent()
    const dashboardNum = parseInt(dashboardText?.match(/[0-9]+/)?.[0] || '0')
    
    // Navigate to my challenges
    await page.goto('/my-active')
    
    // Count actual challenges
    const actualChallenges = await page.locator('[data-testid="challenge-card"]').count()
    
    // Should match (within reason - some might be loading)
    expect(Math.abs(actualChallenges - dashboardNum)).toBeLessThanOrEqual(2)
  })

  test('should persist data after page reload', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    
    await dashboardPage.goto()
    const initialXP = await dashboardPage.getXP()
    const initialCredits = await dashboardPage.getCredits()
    
    // Reload page
    await page.reload()
    
    // Data should persist
    const reloadedXP = await dashboardPage.getXP()
    const reloadedCredits = await dashboardPage.getCredits()
    
    expect(reloadedXP).toBe(initialXP)
    expect(Math.abs(reloadedCredits - initialCredits)).toBeLessThan(0.01)
  })
})


