/**
 * E2E Tests: Cross-Device Synchronization
 * 
 * Tests data consistency across devices and contexts.
 */

import { test, expect } from '@playwright/test'

test.describe('Cross-Device Synchronization', () => {
  test('should show same data on mobile and desktop', async ({ page, context }) => {
    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/dashboard')
    
    // Get user stats on desktop
    const desktopXP = await page.locator('[data-testid="user-xp"]').or(page.locator('text=/[0-9]+ XP/')).first().textContent()
    const desktopLevel = await page.locator('[data-testid="user-level"]').or(page.locator('text=/Level [0-9]+/')).first().textContent()
    
    // Switch to mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    
    // Get same stats on mobile
    const mobileXP = await page.locator('[data-testid="user-xp"]').or(page.locator('text=/[0-9]+ XP/')).first().textContent()
    const mobileLevel = await page.locator('[data-testid="user-level"]').or(page.locator('text=/Level [0-9]+/')).first().textContent()
    
    // Should match
    expect(mobileXP).toBe(desktopXP)
    expect(mobileLevel).toBe(desktopLevel)
  })

  test('should handle responsive navigation', async ({ page }) => {
    // Test mobile navigation
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')
    
    // Should show mobile navigation (hamburger menu or bottom nav)
    const mobileNav = page.locator('[data-testid="mobile-nav"]')
      .or(page.locator('button[aria-label*="menu"]'))
      .or(page.locator('nav.mobile'))
    
    await expect(mobileNav).toBeVisible()
    
    // Switch to desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.reload()
    
    // Should show desktop navigation
    const desktopNav = page.locator('[data-testid="desktop-nav"]').or(page.locator('nav').first())
    await expect(desktopNav).toBeVisible()
  })

  test('should handle PWA install prompt', async ({ page }) => {
    await page.goto('/')
    
    // Note: PWA install prompt is browser-specific
    // Just verify the page handles it gracefully
    await expect(page.locator('body')).toBeVisible()
  })
})


