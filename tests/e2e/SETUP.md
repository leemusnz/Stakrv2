# 🚀 E2E Testing Setup Guide

Quick start guide for running Stakr's end-to-end tests.

---

## 📋 Prerequisites

1. **Node.js** (v18+)
2. **npm** or **pnpm**
3. **Running dev server** on `http://localhost:3000`

---

## ⚡ Quick Start

### **1. Install Playwright**
```bash
npm install
npx playwright install
```

### **2. Start Dev Server**
```bash
# Terminal 1
npm run dev
```

### **3. Run Tests**
```bash
# Terminal 2
npm run test:e2e
```

---

## 🎯 First Time Setup

### **Step 1: Install Dependencies**
```bash
npm install
```

### **Step 2: Install Playwright Browsers**
```bash
npx playwright install chromium
npx playwright install webkit
```

### **Step 3: Create Auth State**
```bash
npx playwright test tests/e2e/fixtures/auth.setup.ts
```

This creates an authenticated session for protected route testing.

### **Step 4: Run Your First Test**
```bash
npx playwright test tests/e2e/points/onboarding.spec.ts --headed
```

The `--headed` flag shows the browser so you can see what's happening.

---

## 🎮 Common Commands

### **Run All Tests**
```bash
npm run test:e2e
```

### **Run Points System Tests Only** (App Store Features)
```bash
npm run test:e2e:points
```

### **Run Cash System Tests Only** (Web Features)
```bash
npm run test:e2e:cash
```

### **Run Integration Tests**
```bash
npm run test:e2e:integration
```

### **Interactive Mode** (Best for Development)
```bash
npm run test:e2e:ui
```

### **Debug Mode** (Step Through Tests)
```bash
npm run test:e2e:debug
```

### **Watch Mode** (Re-run on Changes)
```bash
npx playwright test --watch
```

---

## 🌐 Browser Options

### **Chrome Only**
```bash
npx playwright test --project=chromium
```

### **Mobile Chrome**
```bash
npx playwright test --project=mobile-chrome
```

### **Mobile Safari**
```bash
npx playwright test --project=mobile-safari
```

### **All Browsers**
```bash
npx playwright test --project=chromium --project=mobile-chrome --project=mobile-safari
```

---

## 📊 Viewing Results

### **HTML Report** (Best Visual Report)
```bash
npx playwright show-report
```

### **JSON Report** (For CI/CD)
```bash
cat test-reports/e2e-results.json
```

### **Screenshots** (On Failure)
```bash
ls test-results/*/screenshots/
```

### **Videos** (On Failure)
```bash
ls test-results/*/videos/
```

---

## 🐛 Debugging Tips

### **Problem: Tests Time Out**

**Solution 1:** Increase timeout
```typescript
test('my test', async ({ page }) => {
  test.setTimeout(120000) // 2 minutes
  // ... test code
})
```

**Solution 2:** Check dev server
```bash
# Make sure server is running
curl http://localhost:3000
```

### **Problem: Authentication Fails**

**Solution:** Regenerate auth state
```bash
rm -rf tests/e2e/.auth/
npx playwright test tests/e2e/fixtures/auth.setup.ts
```

### **Problem: Selectors Not Found**

**Solution 1:** Use Playwright Inspector
```bash
npx playwright test --debug
# Hover over elements to see selectors
```

**Solution 2:** Use more flexible selectors
```typescript
// ❌ Too specific
await page.click('div.css-xyz button')

// ✅ Better
await page.click('button:has-text("Join")')

// ✅ Best
await page.click('[data-testid="join-button"]')
```

### **Problem: Flaky Tests**

**Solution:** Add explicit waits
```typescript
// Wait for network to settle
await page.waitForLoadState('networkidle')

// Wait for specific element
await expect(page.locator('[data-testid="content"]')).toBeVisible()

// Wait for API response
await page.waitForResponse(resp => resp.url().includes('/api/'))
```

---

## 🏃 Running Specific Tests

### **By File Name**
```bash
npx playwright test onboarding
```

### **By Test Name**
```bash
npx playwright test -g "should complete onboarding"
```

### **By Tag** (if you add tags)
```bash
npx playwright test --grep @critical
```

### **Exclude Tests**
```bash
npx playwright test --grep-invert @slow
```

---

## 📸 Visual Testing

### **Update Screenshots**
```bash
npx playwright test --update-snapshots
```

### **Compare Screenshots**
```bash
npx playwright test --reporter=html
npx playwright show-report
```

---

## 🚀 CI/CD Setup

### **Environment Variables**
```bash
# .env.test
NEXT_PUBLIC_BASE_URL=http://localhost:3000
DATABASE_URL=your_test_database_url
STRIPE_SECRET_KEY=sk_test_your_test_key
```

### **Pre-commit Hook**
```bash
# .husky/pre-commit
npm run test:e2e:points  # Fast tests only
```

### **Pre-deploy Check**
```bash
npm run test:e2e  # Full suite
```

---

## 💡 Tips & Tricks

### **Speed Up Tests**
```bash
# Run in parallel
npx playwright test --workers=4

# Run only changed tests
npx playwright test --only-changed
```

### **Test Specific Scenarios**
```bash
# Test on slow network
npx playwright test --slow-mo=1000

# Test on specific device
npx playwright test --project=mobile-safari
```

### **Generate Test Code**
```bash
# Record actions to generate test code
npx playwright codegen http://localhost:3000
```

---

## 🎯 Success Criteria

Tests are successful when:
- ✅ All critical financial flows pass
- ✅ Points system works without money
- ✅ Mobile/web handoff works correctly
- ✅ Data remains consistent
- ✅ No financial calculation errors

---

## 📞 Getting Help

- **Playwright Discord:** https://discord.gg/playwright
- **Documentation:** https://playwright.dev/docs/intro
- **GitHub Issues:** https://github.com/microsoft/playwright/issues

---

**Questions?** Check the main README.md or ask the team!


