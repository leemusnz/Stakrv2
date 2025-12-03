/**
 * Authentication Setup for E2E Tests
 * 
 * Creates authenticated sessions for testing protected routes.
 * Run this before other tests to generate auth state.
 */

import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '../.auth/user.json')

setup('authenticate as test user', async ({ page }) => {
  // Navigate to sign-in page
  await page.goto('/auth/signin')
  
  // Fill in credentials (using demo user)
  await page.fill('input[name="email"]', 'demo@stakr.app')
  await page.fill('input[name="password"]', 'demo123')
  
  // Click sign in
  await page.click('button[type="submit"]')
  
  // Wait for redirect to dashboard or onboarding
  await page.waitForURL(/\/(dashboard|onboarding)/)
  
  // Verify we're logged in
  await expect(page.locator('text=Demo User').or(page.locator('[data-testid="user-menu"]'))).toBeVisible({ timeout: 10000 })
  
  // Save authenticated state
  await page.context().storageState({ path: authFile })
  
  console.log('✅ Authentication state saved')
})


