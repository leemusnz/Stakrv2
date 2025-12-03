/**
 * Authentication Page Object
 * 
 * Handles all auth-related interactions (login, signup, logout)
 */

import { Page, expect } from '@playwright/test'
import { generateUniqueEmail } from '../helpers/test-data'

export class AuthPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/auth/signin')
  }

  async login(email: string, password: string) {
    await this.page.fill('input[name="email"]', email)
    await this.page.fill('input[name="password"]', password)
    await this.page.click('button[type="submit"]')
    
    // Wait for redirect
    await this.page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15000 })
  }

  async loginWithGoogle() {
    await this.page.click('button:has-text("Continue with Google")')
    // Note: Actual OAuth flow would need mocking in tests
  }

  async signup(name: string, email?: string, password?: string) {
    const testEmail = email || generateUniqueEmail()
    const testPassword = password || 'TestPassword123!'
    
    await this.page.goto('/auth/signup')
    
    await this.page.fill('input[name="name"]', name)
    await this.page.fill('input[name="email"]', testEmail)
    await this.page.fill('input[name="password"]', testPassword)
    await this.page.fill('input[name="confirmPassword"]', testPassword)
    
    await this.page.click('button[type="submit"]')
    
    return { email: testEmail, password: testPassword }
  }

  async logout() {
    // Click user menu
    await this.page.click('[data-testid="user-menu"]')
    
    // Click logout
    await this.page.click('text=Logout')
    
    // Wait for redirect to landing/signin
    await this.page.waitForURL(/\/(alpha-gate|auth)/)
  }

  async assertLoggedIn() {
    await expect(
      this.page.locator('[data-testid="user-menu"]')
        .or(this.page.locator('text=/Dashboard|Profile/'))
    ).toBeVisible({ timeout: 10000 })
  }

  async assertLoggedOut() {
    await expect(
      this.page.locator('text=/Sign In|Login|Get Started/')
    ).toBeVisible({ timeout: 5000 })
  }
}


