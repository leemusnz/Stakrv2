/**
 * Dashboard Page Object
 * 
 * Handles dashboard interactions and data verification
 */

import { Page, expect } from '@playwright/test'

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard')
    await this.page.waitForLoadState('networkidle')
  }

  async assertUserData(expectedData: {
    name?: string
    credits?: number
    xp?: number
    level?: number
    streak?: number
  }) {
    if (expectedData.name) {
      await expect(this.page.locator(`text=${expectedData.name}`)).toBeVisible()
    }

    if (expectedData.credits !== undefined) {
      await expect(this.page.locator(`text=/\\$${expectedData.credits}/`)).toBeVisible()
    }

    if (expectedData.xp !== undefined) {
      await expect(this.page.locator(`text=/${expectedData.xp}.*XP/`)).toBeVisible()
    }

    if (expectedData.level !== undefined) {
      await expect(this.page.locator(`text=/Level ${expectedData.level}/`)).toBeVisible()
    }
  }

  async viewActiveChallenges() {
    await this.page.click('text=/Active Challenges|My Active/')
  }

  async viewCompletedChallenges() {
    await this.page.click('text=/Completed|History/')
  }

  async assertActiveChallengeCount(count: number) {
    const challenges = this.page.locator('[data-testid="active-challenge"]')
    await expect(challenges).toHaveCount(count)
  }

  async getCredits(): Promise<number> {
    const creditsText = await this.page.locator('[data-testid="user-credits"]').or(this.page.locator('text=/\\$[0-9.,]+/')).first().textContent()
    return parseFloat(creditsText?.replace(/[^0-9.]/g, '') || '0')
  }

  async getXP(): Promise<number> {
    const xpText = await this.page.locator('[data-testid="user-xp"]').or(this.page.locator('text=/[0-9,]+ XP/')).first().textContent()
    return parseInt(xpText?.replace(/[^0-9]/g, '') || '0')
  }

  async getLevel(): Promise<number> {
    const levelText = await this.page.locator('[data-testid="user-level"]').or(this.page.locator('text=/Level [0-9]+/')).first().textContent()
    return parseInt(levelText?.replace(/[^0-9]/g, '') || '1')
  }
}


