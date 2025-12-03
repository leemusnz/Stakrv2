# 🔐 Environment Variables Guide

**Critical:** Add these to your `.env.local` file

---

## 🔴 Required for Integration System (NEW)

```bash
# Encryption Key for secure token storage
# Generate with: openssl rand -hex 32 (Mac/Linux)
# Or: New-Object byte[] 32; [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes); [BitConverter]::ToString($bytes).Replace("-", "") (Windows PowerShell)
# CRITICAL: Must be 32+ characters, must be different in production
ENCRYPTION_KEY=your-64-character-hex-key-here-must-be-unique-and-secure
```

**To Generate:**
```bash
# On Mac/Linux:
openssl rand -hex 32

# Output example:
# a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

# On Windows PowerShell:
$bytes = New-Object byte[] 32
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
[BitConverter]::ToString($bytes).Replace("-", "").ToLower()
```

---

## 🔴 Required for OAuth Integrations

```bash
# Strava Integration
STRAVA_CLIENT_ID=your-strava-client-id
STRAVA_CLIENT_SECRET=your-strava-client-secret

# Fitbit Integration
FITBIT_CLIENT_ID=your-fitbit-client-id
FITBIT_CLIENT_SECRET=your-fitbit-client-secret

# GitHub Integration
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

**Get OAuth Credentials:**
- **Strava:** https://www.strava.com/settings/api
- **Fitbit:** https://dev.fitbit.com/apps
- **GitHub:** https://github.com/settings/developers

---

## 🟡 Optional but Recommended

```bash
# Rate Limiting (prevents API abuse)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
# Get free account: https://upstash.com

# Error Tracking (monitors production issues)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
# Get free account: https://sentry.io
```

---

## 🟢 Already Configured (Verify)

```bash
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# OpenAI (for AI verification)
OPENAI_API_KEY=sk-...

# Stripe (for payments)
STRIPE_PUBLIC_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
```

---

## 📋 Quick Setup Checklist

- [ ] Generate ENCRYPTION_KEY (use command above)
- [ ] Add ENCRYPTION_KEY to .env.local
- [ ] Get Strava OAuth credentials
- [ ] Get Fitbit OAuth credentials
- [ ] Get GitHub OAuth credentials
- [ ] (Optional) Set up Upstash Redis
- [ ] (Optional) Set up Sentry error tracking
- [ ] Run database migration: `psql $DATABASE_URL -f migrations/add-oauth-states-table.sql`
- [ ] Test with: `node scripts/test-integrations.js`

---

## ⚠️ Security Warnings

1. **NEVER commit .env.local to Git**
2. **Use different ENCRYPTION_KEY in production**
3. **Rotate encryption key if compromised**
4. **Keep OAuth secrets confidential**
5. **Use environment variables in Vercel for production**

---

## 🚀 Vercel Deployment

Add environment variables in Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add each variable (especially ENCRYPTION_KEY)
3. Set appropriate environment (Production/Preview/Development)
4. Redeploy after adding variables

---

**Status:** Required for integration system to function
**Priority:** 🔴 CRITICAL


