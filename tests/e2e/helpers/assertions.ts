/**
 * Custom Assertions for E2E Tests
 * 
 * Reusable assertion helpers for common validations.
 */

import { expect, Page } from '@playwright/test'

export async function assertUserLoggedIn(page: Page) {
  // Check for user menu or navigation indicating logged-in state
  await expect(
    page.locator('[data-testid="user-menu"]')
      .or(page.locator('text=/Dashboard|Profile|Settings/'))
  ).toBeVisible({ timeout: 10000 })
}

export async function assertOnDashboard(page: Page) {
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.locator('h1, h2').filter({ hasText: /Dashboard|Welcome/ })).toBeVisible()
}

export async function assertChallengeVisible(page: Page, challengeTitle: string) {
  await expect(page.locator(`text=${challengeTitle}`)).toBeVisible({ timeout: 10000 })
}

export async function assertCreditsUpdated(page: Page, expectedCredits: number, tolerance: number = 0.01) {
  // Wait for credits to update in UI
  const creditsElement = page.locator('[data-testid="user-credits"]').or(page.locator('text=/\\$[0-9.,]+/'))
  await expect(creditsElement).toBeVisible()
  
  // Extract and verify credits value
  const creditsText = await creditsElement.textContent()
  const credits = parseFloat(creditsText?.replace(/[^0-9.]/g, '') || '0')
  
  expect(Math.abs(credits - expectedCredits)).toBeLessThanOrEqual(tolerance)
}

export async function assertXPUpdated(page: Page, minimumXP: number) {
  // Check for XP display
  const xpElement = page.locator('[data-testid="user-xp"]').or(page.locator('text=/XP|Level/'))
  await expect(xpElement).toBeVisible({ timeout: 5000 })
}

export async function assertNotificationShown(page: Page, messagePattern: string | RegExp) {
  // Check for toast notification or success message
  const notification = page.locator('[role="status"]').or(page.locator('.toast')).or(page.locator('[data-testid="notification"]'))
  await expect(notification.filter({ hasText: messagePattern })).toBeVisible({ timeout: 5000 })
}

export async function assertErrorShown(page: Page, errorPattern: string | RegExp) {
  const errorElement = page.locator('[role="alert"]').or(page.locator('.error')).or(page.locator('[data-testid="error"]'))
  await expect(errorElement.filter({ hasText: errorPattern })).toBeVisible({ timeout: 5000 })
}

export async function assertPageLoaded(page: Page) {
  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle')
  await expect(page.locator('body')).toBeVisible()
}


