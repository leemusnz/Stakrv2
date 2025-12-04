# Setup Guide

**Purpose:** Complete environment setup for Stakr  
**Last Updated:** December 3, 2025

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Variables](#environment-variables)
3. [OAuth Setup](#oauth-setup)
4. [Storage Setup](#storage-setup)
5. [Alpha Access](#alpha-access)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Neon recommended)
- AWS S3 account (for file storage)
- Google Cloud account (for OAuth)

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/stakr.git
cd stakr

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Configure environment variables (see below)

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

Access at: `http://localhost:3000`

---

## Environment Variables

### Complete .env.local Template

```bash
# ================================
# DATABASE
# ================================
DATABASE_URL=postgresql://user:password@host:5432/stakr
DIRECT_URL=postgresql://user:password@host:5432/stakr

# ================================
# NEXTAUTH
# ================================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here  # Generate with: openssl rand -base64 32

# ================================
# GOOGLE OAUTH
# ================================
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ================================
# AWS S3 STORAGE
# ================================
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET_NAME=stakr-uploads
NEXT_PUBLIC_AWS_S3_BUCKET_NAME=stakr-uploads

# ================================
# STRIPE PAYMENTS
# ================================
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ================================
# EMAIL (RESEND)
# ================================
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=notifications@stakr.app

# ================================
# ALPHA ACCESS
# ================================
ALPHA_ACCESS_KEY=your-alpha-key-here

# ================================
# APP CONFIGURATION
# ================================
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development

# ================================
# INTEGRATIONS (Optional)
# ================================
# Spotify
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret

# Strava
STRAVA_CLIENT_ID=your-strava-client-id
STRAVA_CLIENT_SECRET=your-strava-client-secret

# Fitbit
FITBIT_CLIENT_ID=your-fitbit-client-id
FITBIT_CLIENT_SECRET=your-fitbit-client-secret

# GitHub
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# WHOOP
WHOOP_CLIENT_ID=your-whoop-client-id
WHOOP_CLIENT_SECRET=your-whoop-client-secret

# ================================
# CRON JOBS
# ================================
CRON_SECRET=your-cron-secret-key
```

---

## OAuth Setup

### Google OAuth (Required)

**Time Required:** 15-20 minutes

#### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click project dropdown → "New Project"
3. Fill out form:
   ```
   Project Name: Stakr App
   Organization: (leave as default)
   Location: (leave as default)
   ```
4. Click "Create"
5. Wait 30-60 seconds for project creation
6. Select your new project

#### Step 2: Enable APIs

1. Go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click "Google+ API"
4. Click "Enable"

#### Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External"
3. Click "Create"
4. Fill out app information:
   ```
   App Name: Stakr
   User Support Email: your-email@example.com
   App Logo: (optional)
   
   Application Home Page: https://stakr.app
   Application Privacy Policy: https://stakr.app/privacy
   Application Terms of Service: https://stakr.app/terms
   
   Developer Contact: your-email@example.com
   ```
5. Click "Save and Continue"
6. Skip scopes (default is fine)
7. Add test users (your email)
8. Click "Save and Continue"

#### Step 4: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Choose "Web Application"
4. Fill out:
   ```
   Name: Stakr Web App
   
   Authorized JavaScript origins:
   - http://localhost:3000
   - https://stakr.app
   - https://www.stakr.app
   
   Authorized redirect URIs:
   - http://localhost:3000/api/auth/callback/google
   - https://stakr.app/api/auth/callback/google
   - https://www.stakr.app/api/auth/callback/google
   ```
5. Click "Create"
6. Copy Client ID and Client Secret

#### Step 5: Add to Environment

Add to `.env.local`:
```bash
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
NEXTAUTH_URL=http://localhost:3000
```

#### Step 6: Test

1. Restart dev server
2. Visit: `http://localhost:3000/auth/signin`
3. Click "Sign in with Google"
4. Should redirect to Google login
5. After authorization, should redirect back to app

---

## Storage Setup

### AWS S3 Configuration

**Time Required:** 10-15 minutes

#### Step 1: Create S3 Bucket

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Click "Create bucket"
3. Fill out:
   ```
   Bucket name: stakr-uploads (or your choice)
   Region: us-east-1 (or closest to you)
   ```
4. **Block Public Access:** Uncheck (we need public read access for uploaded images)
5. Click "Create bucket"

#### Step 2: Configure CORS

1. Click on your bucket
2. Go to "Permissions" tab
3. Scroll to "Cross-origin resource sharing (CORS)"
4. Click "Edit"
5. Add:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": [
         "http://localhost:3000",
         "https://stakr.app",
         "https://www.stakr.app"
       ],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```
6. Click "Save changes"

#### Step 3: Create IAM User

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click "Users" → "Add users"
3. User name: `stakr-s3-uploader`
4. Access type: "Programmatic access"
5. Click "Next: Permissions"
6. Click "Attach existing policies directly"
7. Search for and select: `AmazonS3FullAccess`
8. Click "Next" → "Create user"
9. **Important:** Copy Access Key ID and Secret Access Key

#### Step 4: Add to Environment

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-here
AWS_SECRET_ACCESS_KEY=your-secret-key-here
AWS_S3_BUCKET_NAME=stakr-uploads
NEXT_PUBLIC_AWS_S3_BUCKET_NAME=stakr-uploads
```

#### Step 5: Test Upload

```bash
# Test image upload
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test-image.jpg" \
  -H "Cookie: your-session-cookie"

# Should return S3 URL
```

---

## Alpha Access

### Enabling Alpha Gate

Stakr includes an alpha access gate to control who can access the site during development.

#### Configuration

Add to `.env.local`:
```bash
ALPHA_ACCESS_KEY=your-secret-key-here
```

#### Behavior

- **Without key:** Users see alpha access page, must enter key
- **With key:** Key stored in browser, full access granted
- **Admin override:** Admins can access without key

#### Generating Keys

```bash
# Generate a random alpha key
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

#### Disabling for Production

To disable alpha gate for public launch:

1. Remove alpha gate middleware from `middleware.ts`
2. Or set environment variable:
   ```bash
   ENABLE_ALPHA_GATE=false
   ```

---

## Troubleshooting

### Google OAuth Issues

**Error: "redirect_uri_mismatch"**

Solution:
- Verify redirect URI in Google Cloud Console matches exactly
- Include protocol (http/https), domain, port, and path
- Common mistake: forgetting `/api/auth/callback/google`

**Error: "Access blocked: This app's request is invalid"**

Solution:
- Add test users in OAuth consent screen
- Or publish app (remove from testing mode)

**Error: "Variables not working"**

Solution:
- Restart dev server after adding env vars
- Check `.env.local` exists (not `.env.example`)
- Verify no typos in variable names

### S3 Upload Issues

**Error: "Access Denied"**

Solution:
- Verify IAM user has S3 permissions
- Check bucket policy allows uploads
- Verify CORS configuration

**Error: "NetworkingError: Network Failure"**

Solution:
- Check AWS credentials are correct
- Verify region matches bucket region
- Check internet connection

### Database Issues

**Error: "Connection refused"**

Solution:
- Verify DATABASE_URL is correct
- Check database is running
- Verify firewall allows connection

**Error: "SSL connection required"**

Solution:
- Add `?sslmode=require` to DATABASE_URL
- Or use DIRECT_URL without pooling

### General Issues

**Changes not reflecting:**
- Clear browser cache
- Restart dev server
- Check for console errors

**Module not found:**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

---

## Development Tools

### Useful Commands

```bash
# Database
npm run db:migrate        # Run migrations
npm run db:seed          # Seed database
npm run db:reset         # Reset database

# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm test                 # Run tests
npm run test:e2e         # Run E2E tests
npm run test:coverage    # Test coverage

# Linting
npm run lint             # Check linting
npm run lint:fix         # Fix linting issues
```

### Debug Endpoints

```bash
# Check Google OAuth config
GET /api/debug/google-oauth

# Test database connection
GET /api/debug/db

# Check environment variables
GET /api/debug/env
```

---

## Production Deployment

### Environment Variables (Production)

Update these for production:

```bash
# Production URLs
NEXTAUTH_URL=https://stakr.app
NEXT_PUBLIC_BASE_URL=https://stakr.app

# Production OAuth
# Update redirect URIs in Google Cloud Console

# Production Database
# Use connection pooling for better performance

# Disable alpha gate
ENABLE_ALPHA_GATE=false

# Production Stripe keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Deployment Checklist

- [ ] Update environment variables
- [ ] Run database migrations
- [ ] Update OAuth redirect URIs
- [ ] Configure domain DNS
- [ ] Set up SSL certificate
- [ ] Test all OAuth providers
- [ ] Test file uploads
- [ ] Test payment processing
- [ ] Disable alpha gate
- [ ] Monitor error logs

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Stripe Documentation](https://stripe.com/docs)

---

**Setup Status:** ✅ Complete  
**Next Steps:** Configure integrations (optional), deploy to production

