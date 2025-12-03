# ⚡ E2E Tests - Quick Start

**Get running in 2 minutes!**

---

## 🚀 Run Tests Now

```bash
# 1. Install (if not done)
npx playwright install chromium

# 2. Start dev server
npm run dev

# 3. Run tests (in another terminal)
npm run test:e2e
```

---

## 📱 Test App Store Features

```bash
npm run test:e2e:points
```

This tests all features safe for app stores (no money).

---

## 💰 Test Web-Only Features

```bash
npm run test:e2e:cash
```

This tests financial flows (web-only).

---

## 🔍 Interactive Mode

```bash
npm run test:e2e:ui
```

Best for development - see tests run in real-time!

---

## 📊 View Results

```bash
npx playwright show-report
```

Opens beautiful HTML report with screenshots & videos.

---

## 🐛 Debug Failed Test

```bash
npx playwright test tests/e2e/points/onboarding.spec.ts --debug
```

Step through test line-by-line.

---

## 📚 Full Documentation

See [README.md](./README.md) and [SETUP.md](./SETUP.md) for details.

---

**That's it! You're ready to test! 🎉**


