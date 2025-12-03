/**
 * Challenge Page Object
 * 
 * Handles challenge browsing, viewing, joining, and completion
 */

import { Page, expect } from '@playwright/test'

export class ChallengePage {
  constructor(private page: Page) {}

  async gotoDiscover() {
    await this.page.goto('/discover')
    await this.page.waitForLoadState('networkidle')
  }

  async gotoCreateChallenge() {
    await this.page.goto('/create-challenge')
  }

  async viewChallenge(challengeId: string) {
    await this.page.goto(`/challenge/${challengeId}`)
    await this.page.waitForLoadState('networkidle')
  }

  async joinPointsChallenge(challengeId: string) {
    await this.viewChallenge(challengeId)
    
    // Click join button
    await this.page.click('button:has-text("Join Challenge")')
    
    // Ensure points-only is selected
    const pointsOnlyToggle = this.page.locator('input[type="checkbox"]').filter({ hasText: /Points Only|XP/ })
    if (await pointsOnlyToggle.isVisible()) {
      await pointsOnlyToggle.check()
    }
    
    // Confirm join
    await this.page.click('button:has-text("Confirm")')
    
    // Wait for success confirmation
    await expect(this.page.locator('text=/Successfully joined|Joined successfully/')).toBeVisible({ timeout: 10000 })
  }

  async joinCashChallenge(challengeId: string, stakeAmount: number, useInsurance: boolean = false) {
    await this.viewChallenge(challengeId)
    
    // Click join button
    await this.page.click('button:has-text("Join Challenge")')
    
    // Set stake amount
    await this.page.fill('input[name="stakeAmount"]', stakeAmount.toString())
    
    // Toggle insurance if requested
    if (useInsurance) {
      await this.page.click('input[type="checkbox"]:near(text=/Insurance/)')
    }
    
    // Confirm join
    await this.page.click('button:has-text("Confirm")')
    
    // For cash challenges, should redirect to payment or show success
    await this.page.waitForURL(/\/(wallet|challenge)/, { timeout: 15000 })
  }

  async createPointsChallenge(data: {
    title: string
    description: string
    category: string
    difficulty: string
    duration: string
  }) {
    await this.gotoCreateChallenge()
    
    // Step through challenge creation wizard
    // Privacy type
    await this.page.click('button:has-text("Public")')
    await this.page.click('button:has-text("Next")')
    
    // Category
    await this.page.click(`button:has-text("${data.category}")`)
    await this.page.click('button:has-text("Next")')
    
    // Basic details
    await this.page.fill('input[name="title"]', data.title)
    await this.page.fill('textarea[name="description"]', data.description)
    await this.page.selectOption('select[name="difficulty"]', data.difficulty)
    await this.page.fill('input[name="duration"]', data.duration)
    await this.page.click('button:has-text("Next")')
    
    // Features - enable points only
    await this.page.check('input[name="allowPointsOnly"]')
    await this.page.click('button:has-text("Next")')
    
    // Skip through remaining steps quickly
    await this.page.click('button:has-text("Next")')
    await this.page.click('button:has-text("Next")')
    
    // Set stakes to 0 for points only
    await this.page.fill('input[name="minStake"]', '0')
    await this.page.fill('input[name="maxStake"]', '0')
    await this.page.click('button:has-text("Next")')
    
    // Publish
    await this.page.click('button:has-text("Publish")')
    
    // Wait for success
    await expect(this.page.locator('text=/Challenge created|Published successfully/')).toBeVisible({ timeout: 15000 })
  }

  async submitProof(text: string, uploadImage: boolean = false) {
    // Click submit proof button
    await this.page.click('button:has-text("Submit Proof")')
    
    // Fill proof description
    await this.page.fill('textarea[name="proofDescription"]', text)
    
    // Upload image if requested
    if (uploadImage) {
      // TODO: Implement file upload for E2E tests
    }
    
    // Submit
    await this.page.click('button:has-text("Submit")')
    
    // Wait for confirmation
    await expect(this.page.locator('text=/Proof submitted|Submitted successfully/')).toBeVisible({ timeout: 10000 })
  }

  async assertChallengeStatus(status: 'active' | 'pending' | 'completed') {
    await expect(this.page.locator(`[data-status="${status}"]`).or(this.page.locator(`text=${status}`))).toBeVisible()
  }

  async assertParticipantCount(expectedCount: number) {
    await expect(this.page.locator(`text=/${expectedCount} participant/`)).toBeVisible()
  }
}


