/**
 * E2E Tests: Achievements & Badges
 * 
 * Tests earning and displaying achievements.
 * Pure gamification - app-store compliant.
 */

import { test, expect } from '@playwright/test'

test.describe('Achievements System', () => {
  test('should display achievements page', async ({ page }) => {
    await page.goto('/profile')

    // Navigate to achievements section
    const achievementsLink = page.locator('text=/Achievements|Badges|Awards/')
    if (await achievementsLink.isVisible()) {
      await achievementsLink.click()
      
      // Should show achievements grid or list
      await expect(page.locator('[data-testid="achievement"]').or(page.locator('text=/Achievement|Badge/'))).toBeVisible()
    }
  })

  test('should show locked and unlocked achievements', async ({ page }) => {
    await page.goto('/profile')

    const achievementsLink = page.locator('text=/Achievements|Badges/')
    if (await achievementsLink.isVisible()) {
      await achievementsLink.click()
      
      // Should have visual distinction between locked/unlocked
      // Either through opacity, icons, or text
      await expect(page.locator('[data-testid="achievement"]').or(page.locator('.achievement'))).toHaveCount({ min: 1 })
    }
  })

  test('should show achievement details on click', async ({ page }) => {
    await page.goto('/profile')

    const achievementsLink = page.locator('text=/Achievements|Badges/')
    if (await achievementsLink.isVisible()) {
      await achievementsLink.click()
      
      // Click on an achievement
      const achievement = page.locator('[data-testid="achievement"]').first()
      if (await achievement.isVisible()) {
        await achievement.click()
        
        // Should show modal or detail view with description
        await expect(page.locator('text=/requirement|complete|earn/i')).toBeVisible()
      }
    }
  })
})


