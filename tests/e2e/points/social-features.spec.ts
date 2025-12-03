/**
 * E2E Tests: Social Features (Points System)
 * 
 * Tests social feed, likes, follows, and community features.
 * App-store compliant - standard social features.
 */

import { test, expect } from '@playwright/test'

test.describe('Social Features', () => {
  test('should display social feed', async ({ page }) => {
    await page.goto('/social')

    // Should show feed of posts
    await expect(page.locator('[data-testid="social-feed"]').or(page.locator('[data-testid="post"]'))).toBeVisible({ timeout: 10000 })
  })

  test('should like a post', async ({ page }) => {
    await page.goto('/social')

    // Find first post and like it
    const likeButton = page.locator('[data-testid="like-button"]').or(page.locator('button[aria-label*="like"]')).first()
    
    if (await likeButton.isVisible()) {
      // Get initial like count
      const likeCount = page.locator('[data-testid="like-count"]').first()
      const initialLikes = await likeCount.textContent()
      
      // Click like
      await likeButton.click()
      
      // Like button should change state
      await expect(likeButton).toHaveAttribute('data-liked', 'true', { timeout: 5000 })
    }
  })

  test('should create a post', async ({ page }) => {
    await page.goto('/social')

    // Click create post button
    const createButton = page.locator('button:has-text("Create Post")').or(page.locator('button:has-text("New Post")'))
    
    if (await createButton.isVisible()) {
      await createButton.click()
      
      // Fill in post content
      await page.fill('textarea[name="content"]', 'E2E test post - Testing social features!')
      
      // Submit
      await page.click('button:has-text("Post")')
      
      // Should see success or post appears in feed
      await expect(page.locator('text=E2E test post - Testing social features!')).toBeVisible({ timeout: 10000 })
    }
  })

  test('should follow/unfollow users', async ({ page }) => {
    await page.goto('/social')

    // Find a user profile or post
    const userProfile = page.locator('[data-testid="user-profile"]').or(page.locator('button:has-text("Follow")')).first()
    
    if (await userProfile.isVisible()) {
      const followButton = page.locator('button:has-text("Follow")').first()
      
      if (await followButton.isVisible()) {
        await followButton.click()
        
        // Button should change to "Following" or "Unfollow"
        await expect(page.locator('button:has-text("Following")').or(page.locator('button:has-text("Unfollow")'))).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('should view user profiles', async ({ page }) => {
    await page.goto('/social')

    // Click on a user's name or avatar
    const userLink = page.locator('[data-testid="user-link"]').or(page.locator('a[href*="/profile/"]')).first()
    
    if (await userLink.isVisible()) {
      await userLink.click()
      
      // Should navigate to profile page
      await page.waitForURL(/\/profile\//)
      
      // Should show user stats
      await expect(page.locator('text=/Challenge|Streak|Level/')).toBeVisible()
    }
  })
})


