# Stakr Documentation

Welcome to the Stakr documentation hub. This directory contains comprehensive guides for developers, product managers, and stakeholders.

---

## 📚 Core Documentation

### 🚀 [Setup Guide](./SETUP_GUIDE.md)
Complete environment setup including OAuth, database, storage, and deployment.

**Topics:**
- Environment variables
- Google OAuth setup
- AWS S3 configuration
- Alpha access setup
- Production deployment

---

### 🔔 [Notification System](./NOTIFICATION_SYSTEM.md)
Comprehensive guide to the notification system with 35+ templates.

**Topics:**
- Notification templates (challenges, verification, social, financial)
- User preferences (40+ settings)
- Integration guide
- Cron jobs
- Email delivery

---

### 🔌 [Integrations Guide](./INTEGRATIONS_GUIDE.md)
Connect with 22+ external services for automatic challenge verification.

**Topics:**
- Available integrations (Strava, WHOOP, Fitbit, GitHub, etc.)
- OAuth implementation
- Adding new integrations
- Security best practices
- Known issues and fixes

---

### 💪 [WHOOP Integration](./WHOOP_INTEGRATION.md)
Detailed guide for WHOOP fitness tracker integration.

**Topics:**
- Quick setup (5 minutes)
- OAuth configuration
- Data types (recovery, strain, sleep)
- Testing guide
- Compliance and legal considerations

---

### 📱 [Mobile UI Guide](./MOBILE_UI_GUIDE.md)
Mobile-first design with button-based interactions.

**Topics:**
- Mobile detection hooks
- Touch-friendly components
- Responsive layouts
- Bottom navigation
- Best practices

---

### 🧪 [Testing Guide](./TESTING_GUIDE.md)
Comprehensive testing strategy and implementation.

**Topics:**
- Test infrastructure (Jest, Playwright)
- Unit, integration, and E2E tests
- Writing tests
- CI/CD integration
- Best practices

---

### 👤 [Avatar System](./AVATAR_SYSTEM.md)
Profile picture upload and management system.

**Topics:**
- How it works
- Upload flow
- Troubleshooting
- API endpoints
- Best practices

---

## 📂 Additional Resources

### Features Documentation

**Location:** `./features/`

- **Content Moderation Setup** - AI-powered content filtering
- **Demo Data Strategy** - Hybrid demo system for development and sales
- **MVP Verification Tiers** - Challenge verification levels
- **XP System Design** - Gamification and rewards

### Development Documentation

**Location:** `./development/`

- **Deployment Checklist** - Pre-launch verification
- **Implementation Guide** - Development best practices
- **Implementation Status** - Feature completion tracking
- **Integrations Summary** - Integration system overview

### Audit Documentation

**Location:** `./audits/`

- **API Coverage Audit** - API endpoint analysis
- **Audit Cleanup Plan** - Code cleanup recommendations
- **Current Verification Audit** - Verification system review

### Business Documentation

**Location:** `./business/`

- **Stakr Verification Investor Presentation** - Pitch deck and business model

---

## 🎯 Quick Start

### For New Developers

1. **Setup:** Read [Setup Guide](./SETUP_GUIDE.md)
2. **Test:** Review [Testing Guide](./TESTING_GUIDE.md)
3. **Build:** Check [Mobile UI Guide](./MOBILE_UI_GUIDE.md)
4. **Deploy:** Follow [Setup Guide - Production](./SETUP_GUIDE.md#production-deployment)

### For Product Managers

1. **Business Model:** Review [Business Documentation](./business/)
2. **Features:** Check [Features Documentation](./features/)
3. **Integrations:** Read [Integrations Guide](./INTEGRATIONS_GUIDE.md)
4. **Status:** See [Implementation Status](./development/IMPLEMENTATION_STATUS.md)

### For QA/Testing

1. **Testing Strategy:** Read [Testing Guide](./TESTING_GUIDE.md)
2. **Manual Testing:** Check individual feature guides
3. **E2E Tests:** Review test files in `/tests/e2e/`
4. **Bug Reports:** Use GitHub Issues with proper labels

---

## 📋 Documentation Standards

### File Naming
- Use descriptive, SCREAMING_SNAKE_CASE names
- Example: `NOTIFICATION_SYSTEM.md`, `SETUP_GUIDE.md`

### Content Structure
- Start with clear title and status
- Include table of contents for long documents
- Use consistent markdown formatting
- Include code examples where relevant
- Add troubleshooting sections

### Maintenance
- Update documentation when code changes
- Mark outdated sections clearly
- Review quarterly for accuracy
- Archive obsolete documents

---

## 🔄 Recent Changes

**December 2025 - Documentation Consolidation:**
- ✅ Consolidated 40+ scattered docs into 7 core guides
- ✅ Removed duplicate and outdated content
- ✅ Improved organization and discoverability
- ✅ Added comprehensive troubleshooting sections
- ✅ Standardized formatting across all docs

**Previous Updates:**
- Notification system documentation (35+ templates)
- WHOOP integration guide (complete OAuth flow)
- Mobile UI simplification (button-based interactions)
- Testing infrastructure (Jest + Playwright)
- Integration system fixes (security and reliability)

---

## 🆘 Getting Help

### Documentation Issues
- **Missing information?** Create a GitHub issue with label `documentation`
- **Found errors?** Submit a pull request with corrections
- **Need clarification?** Ask in team chat or create discussion

### Technical Support
- **Setup problems:** Check [Setup Guide - Troubleshooting](./SETUP_GUIDE.md#troubleshooting)
- **Integration issues:** See [Integrations Guide](./INTEGRATIONS_GUIDE.md)
- **Testing help:** Review [Testing Guide](./TESTING_GUIDE.md)
- **Mobile UI:** Check [Mobile UI Guide](./MOBILE_UI_GUIDE.md)

---

## 📊 Documentation Coverage

| Area | Status | Last Updated |
|------|--------|--------------|
| Setup & Configuration | ✅ Complete | Dec 2025 |
| Notification System | ✅ Complete | Dec 2025 |
| Integrations | ✅ Complete | Dec 2025 |
| WHOOP Integration | ✅ Complete | Dec 2025 |
| Mobile UI | ✅ Complete | Dec 2025 |
| Testing | ✅ Complete | Dec 2025 |
| Avatar System | ✅ Complete | Dec 2025 |
| API Documentation | 🚧 In Progress | - |
| Database Schema | 🚧 In Progress | - |
| Deployment Guide | ✅ Complete | Dec 2025 |

---

## 🎨 Project Overview

**Stakr** is a challenge-based self-improvement platform where users stake money/credits on completing personal challenges.

### Core Features
- **Challenge System:** Time-bound challenges with stakes and rewards
- **Verification:** Proof-based verification with optional AI/integration verification
- **Integrations:** 22+ services (WHOOP, Strava, Fitbit, GitHub, etc.)
- **Social:** Community features, nudges, and social feed
- **Payments:** Stripe integration with wallet system
- **Gamification:** XP, achievements, streaks

### Tech Stack
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, PostgreSQL (Neon)
- **Storage:** AWS S3
- **Auth:** NextAuth.js with Google OAuth
- **Payments:** Stripe
- **Hosting:** Vercel

---

## 📞 Contact

- **GitHub:** [Repository Link]
- **Team Chat:** [Slack/Discord Link]
- **Email:** [Support Email]

---

**Last Updated:** December 3, 2025  
**Documentation Version:** 2.0 (Consolidated)  
**Status:** ✅ Production Ready
