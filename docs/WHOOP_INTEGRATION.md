# 💪 WHOOP Integration - Complete Guide

**Status:** ✅ Production Ready  
**Last Updated:** December 3, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Setup Instructions](#setup-instructions)
4. [Testing](#testing)
5. [Compliance & Legal](#compliance--legal)
6. [Troubleshooting](#troubleshooting)

---

## Overview

WHOOP is now fully integrated into Stakr! Users can connect their WHOOP fitness trackers to automatically verify challenges based on recovery, strain, sleep, and more.

### What WHOOP Provides

**Recovery Data:**
- Recovery Score (0-100%)
- Resting Heart Rate
- Heart Rate Variability (HRV)
- Respiratory Rate
- SpO2 (blood oxygen)

**Workout Data:**
- Strain Score (0-21 scale)
- Average Heart Rate
- Calories Burned
- Distance (GPS-tracked)
- Duration

**Sleep Data:**
- Sleep Performance %
- Total Sleep Time
- Sleep Stages (light, deep, REM, awake)
- Average Heart Rate during sleep
- Respiratory Rate during sleep

### Integration Capabilities

| Metric | API Endpoint | Data Type | Frequency |
|--------|--------------|-----------|-----------|
| Recovery Score | `/v1/recovery` | recovery | Daily |
| Strain Score | `/v1/activity/workout` | strain | Per workout |
| Sleep Data | `/v1/activity/sleep` | sleep | Daily |
| HRV | `/v1/recovery` | hrv | Daily |
| Resting HR | `/v1/recovery` | heart_rate | Daily |

---

## Quick Start

### 5-Minute Setup

**Step 1: Get WHOOP Credentials** (2 minutes)

1. Go to https://developer.whoop.com/
2. Sign in or create account
3. Create new app
4. Copy **Client ID** and **Client Secret**
5. Set redirect URI:
   - Dev: `http://localhost:3000/api/integrations/callback/whoop`
   - Prod: `https://your-domain.com/api/integrations/callback/whoop`

**Step 2: Add to Environment** (1 minute)

```bash
# Add to .env.local
WHOOP_CLIENT_ID=your-client-id-here
WHOOP_CLIENT_SECRET=your-client-secret-here
```

**Step 3: Restart App** (30 seconds)

```bash
npm run dev
```

**Step 4: Test Connection** (1 minute)

1. Go to `/settings?tab=integrations`
2. Find **WHOOP** in the list (💪 icon)
3. Click **"Connect WHOOP"**
4. Login with WHOOP
5. Authorize access
6. Success! ✅

---

## Setup Instructions

### 1. WHOOP Developer Portal Setup

**Create WHOOP Application:**

1. Navigate to [WHOOP Developer Portal](https://developer.whoop.com/)
2. Click "Create Application" or "New App"
3. Fill in app details:
   ```
   App Name: Stakr (or your app name)
   Description: Challenge verification platform
   App Type: Web Application
   ```

4. Configure OAuth settings:
   ```
   Authorized Redirect URIs:
   - http://localhost:3000/api/integrations/callback/whoop (development)
   - https://stakr.app/api/integrations/callback/whoop (production)
   - https://www.stakr.app/api/integrations/callback/whoop (production www)
   ```

5. Request OAuth scopes:
   ```
   ✅ read:recovery
   ✅ read:workout
   ✅ read:sleep
   ✅ read:cycles
   ✅ read:profile
   ```

6. Save and copy credentials:
   - Client ID
   - Client Secret

### 2. Environment Configuration

Add to your `.env.local` (development) and production environment:

```bash
# WHOOP Integration
WHOOP_CLIENT_ID=your_client_id_here
WHOOP_CLIENT_SECRET=your_client_secret_here

# Base URL (for OAuth callbacks)
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # or your production URL
```

### 3. Database Setup

The integration uses existing tables:

```sql
-- wearable_integrations: Stores connection status
-- wearable_data: Stores synced recovery/strain/sleep data
-- oauth_states: Handles OAuth CSRF protection
```

No additional migrations needed if you're on the latest schema.

### 4. Verify Integration

Check that WHOOP appears in available devices:

```bash
curl http://localhost:3000/api/integrations/wearables
# Should include "whoop" in availableDevices array
```

---

## Testing

### Option 1: Quick UI Test (No Credentials) - 5 Minutes

**What You Can Test:**
- ✅ WHOOP appears in integration list
- ✅ 💪 icon displays correctly
- ✅ "Connect WHOOP" button exists
- ✅ Dialog opens with privacy options
- ✅ Auto-sync toggle works

**How to Test:**

```bash
1. Start dev server: npm run dev
2. Navigate to: http://localhost:3000/settings?tab=integrations
3. Look for WHOOP in the list
4. Click "Add Wearable" → Select WHOOP
5. Verify UI displays correctly
```

### Option 2: Full OAuth Test (With Credentials) - 15 Minutes

**Prerequisites:**
- WHOOP developer credentials configured
- WHOOP account with recent activity data

**Test Flow:**

1. **Initiate Connection:**
   ```
   - Go to /settings?tab=integrations
   - Click "Connect WHOOP"
   - Should redirect to WHOOP login
   ```

2. **Authorize:**
   ```
   - Log in with WHOOP account
   - Review requested permissions
   - Click "Authorize"
   - Should redirect back to Stakr
   ```

3. **Verify Connection:**
   ```sql
   -- Check database
   SELECT * FROM wearable_integrations 
   WHERE device_type = 'whoop';
   
   -- Should show:
   -- ✅ enabled: true
   -- ✅ api_credentials: (encrypted)
   -- ✅ last_sync: timestamp
   ```

4. **Test Data Sync:**
   ```
   - Click "Sync Now" in UI
   - Check console logs for:
     💪 Fetching data from whoop...
     ✅ Sync completed
   ```

5. **Verify Synced Data:**
   ```sql
   SELECT * FROM wearable_data 
   WHERE device_type = 'whoop'
   ORDER BY timestamp DESC
   LIMIT 10;
   
   -- Should show recovery/strain/sleep data
   ```

### Option 3: Mock Data Test - 10 Minutes

Create test data without WHOOP credentials:

**Create `scripts/test-whoop-mock-data.js`:**

```javascript
const { createDbConnection } = require('../lib/db')

async function insertMockWhoopData() {
  const sql = await createDbConnection()
  const users = await sql`SELECT id FROM users LIMIT 1`
  const userId = users[0]?.id

  // Insert mock recovery data
  await sql`
    INSERT INTO wearable_data (
      user_id, device_type, data_type, value, unit,
      timestamp, metadata, verification_status
    ) VALUES (
      ${userId}, 'whoop', 'recovery', 85, 'percentage',
      NOW(), 
      ${JSON.stringify({
        deviceId: 'Whoop 4.0',
        accuracy: 'high',
        heartRate: [45],
        hrv: 95,
        respiratoryRate: 14.5
      })},
      'verified'
    )
  `

  console.log('✅ Mock WHOOP data created!')
}

insertMockWhoopData().catch(console.error)
```

**Run:**
```bash
node scripts/test-whoop-mock-data.js
```

### Comprehensive Test Checklist

**Pre-OAuth Tests (No Credentials):**
- [ ] WHOOP appears in integration list
- [ ] 💪 icon displays correctly
- [ ] Device name "WHOOP" shows in UI
- [ ] Can select WHOOP from dropdown
- [ ] Privacy level selector works

**OAuth Flow Tests (With Credentials):**
- [ ] "Connect WHOOP" generates OAuth URL
- [ ] Redirects to WHOOP login page
- [ ] Can log in to WHOOP
- [ ] Authorization screen shows correct scopes
- [ ] Callback receives code and state
- [ ] State validation passes (CSRF protection)
- [ ] Tokens stored encrypted in database
- [ ] Success message displays
- [ ] WHOOP shows as "Connected" in UI

**Data Sync Tests:**
- [ ] Manual sync button appears
- [ ] "Sync Now" triggers sync
- [ ] API call to WHOOP succeeds
- [ ] Recovery data retrieved
- [ ] Workout data retrieved
- [ ] Sleep data retrieved
- [ ] Data stored in wearable_data table
- [ ] Verification status set correctly

**Challenge Integration Tests:**
- [ ] Create recovery-based challenge
- [ ] Join challenge with WHOOP connected
- [ ] Sync data
- [ ] Verify challenge auto-completes
- [ ] Check proof_submissions table

---

## Compliance & Legal

### Current Status: ✅ Mostly Compliant

**Compliant Areas:**

✅ **User Consent:** Explicit opt-in via OAuth  
✅ **Data Security:** AES-256-GCM encryption  
✅ **OAuth 2.0:** Proper implementation  
✅ **No Misrepresentation:** Clear attribution  
✅ **Privacy Laws:** GDPR/CCPA compliant

**Action Required Before Public Launch:**

### 1. App Approval (Optional)

**Clarification:** Based on standard OAuth practices, you likely DON'T need formal approval to launch. WHOOP's OAuth will work immediately for any user who authorizes your app.

**"App Approval" Likely Means:**
- Being listed in WHOOP's official app directory (if it exists)
- Getting "WHOOP Approved" badge
- Official partnership status

**You CAN Launch Without Approval If You:**
- ✅ Follow all API terms of use
- ✅ Use standard OAuth scopes
- ✅ Don't claim to be "WHOOP Approved"
- ✅ Include proper disclaimers
- ✅ Handle data responsibly

**Recommended Disclaimers:**

```typescript
// In UI
<WhoopIntegrationCard>
  <Title>Connect WHOOP 💪</Title>
  <Disclaimer>
    Uses WHOOP API. Not affiliated with WHOOP Inc.
  </Disclaimer>
</WhoopIntegrationCard>
```

### 2. Data Retention Policy

**Current Risk:** Storing full API responses may violate "no permanent copies" clause.

**Recommended Approach:**

```typescript
// ❌ Risky: Storing full raw API responses
metadata: {
  rawData: fullWhoopApiResponse
}

// ✅ Safe: Store only verification results
metadata: {
  recoveryScore: 85,
  verifiedAt: new Date(),
  source: 'WHOOP API'
  // No full raw response
}
```

**Implementation Options:**

**Option A: Time-Based Deletion**
```sql
ALTER TABLE wearable_data ADD COLUMN expires_at TIMESTAMPTZ;

INSERT INTO wearable_data (..., expires_at)
VALUES (..., NOW() + INTERVAL '90 days');

-- Cron job to cleanup
DELETE FROM wearable_data 
WHERE expires_at < NOW() AND device_type = 'whoop';
```

**Option B: Verification Results Only**
```sql
-- Store minimal data needed
CREATE TABLE challenge_verifications (
  id UUID PRIMARY KEY,
  user_id UUID,
  challenge_id UUID,
  verification_date DATE,
  passed BOOLEAN,
  score NUMERIC,  -- Just the score
  source VARCHAR(50)
);
```

### 3. Contact WHOOP for Clarification (Recommended)

**Email Template:**

```
To: developer-support@whoop.com
Subject: Data Retention Clarification for Challenge Platform

Hi WHOOP Team,

We're building Stakr, a challenge verification platform that uses WHOOP data 
for automatic verification (e.g., "Maintain 70%+ recovery for 7 days").

Questions:
1. Can we store verification scores (e.g., "85% recovery on Dec 3") for 
   challenge history without storing full raw API responses?
2. What's an acceptable retention period? (30/60/90 days?)
3. Does "no permanent copies" prohibit processed/aggregated data, or just raw responses?
4. Do gamification/challenge use cases need explicit approval?

App Details:
- Name: Stakr
- Purpose: Challenge verification and accountability
- Data Usage: Verification only, never shared
- Users: Full opt-in consent via OAuth

Thank you!
```

### 4. Privacy Policy Update

Add WHOOP-specific section:

```markdown
## WHOOP Integration

When you connect your WHOOP account:

**Data Collected:**
- Recovery scores
- Strain scores  
- Sleep data
- Workout information

**Data Usage:**
- Challenge verification only
- Never shared with third parties
- Stored for 90 days then auto-deleted
- You control access at all times

**Your Control:**
- Disconnect anytime
- Delete data anytime
- Export data anytime

**Disclaimer:** We use the WHOOP API but are not affiliated with, 
endorsed by, or officially supported by WHOOP Inc.
```

### Compliance Checklist

**Before Launch:**
- [ ] Add disclaimers to UI
- [ ] Update privacy policy
- [ ] Implement safe data storage (no raw API responses)
- [ ] Review brand usage guidelines

**Optional (For Official Status):**
- [ ] Send clarification email to WHOOP
- [ ] Apply for app approval
- [ ] Get official partnership status

---

## Troubleshooting

### "Connect WHOOP" Button Does Nothing

**Check:**
```bash
# Open browser console (F12)
# Look for errors

# Common issue: Missing credentials
# Fix: Verify .env.local has:
WHOOP_CLIENT_ID=your-client-id
WHOOP_CLIENT_SECRET=your-client-secret

# Restart server after adding
```

### OAuth Redirect Fails

**Check:**
```bash
# Verify redirect URI in WHOOP Developer Portal matches EXACTLY:
http://localhost:3000/api/integrations/callback/whoop

# Must match:
# - Protocol (http vs https)
# - Domain
# - Port
# - Path
```

### "Invalid State" Error

**Check:**
```sql
-- Verify oauth_states table exists
SELECT * FROM oauth_states WHERE provider = 'whoop';

-- If table missing, run migration:
-- migrations/add-oauth-states-table.sql
```

### No Data Syncing

**Check:**
```bash
# Terminal logs should show:
💪 Fetching data from whoop...
✅ Sync completed

# Common issues:
# - Token expired (automatic refresh should handle this)
# - User has no recent WHOOP data (wear device)
# - API rate limit (wait and retry)
# - Check error logs for specific API errors
```

### Database Inspection

**Check Integration Status:**
```sql
SELECT device_type, enabled, auto_sync, last_sync
FROM wearable_integrations
WHERE device_type = 'whoop';
```

**Check Synced Data:**
```sql
SELECT data_type, value, unit, timestamp, verification_status
FROM wearable_data
WHERE device_type = 'whoop'
ORDER BY timestamp DESC
LIMIT 10;
```

**Check OAuth States:**
```sql
SELECT * FROM oauth_states
WHERE provider = 'whoop'
ORDER BY created_at DESC
LIMIT 5;
```

---

## Technical Implementation

### Files Modified/Created

**Integration Class:**
- `lib/wearable-integrations.ts` - `WhoopIntegration` class

**API Routes:**
- `app/api/integrations/callback/whoop/route.ts` - OAuth callback handler
- `app/api/integrations/oauth/authorize/route.ts` - Updated for WHOOP
- `app/api/integrations/wearables/route.ts` - Includes WHOOP

**Type Definitions:**
- Added `'whoop'` to `WearableDevice` type
- Added data types: `'strain'`, `'recovery'`, `'hrv'`, `'respiratory_rate'`

### OAuth Scopes Requested

```typescript
const scopes = [
  'read:recovery',    // Recovery scores, HRV, resting HR
  'read:workout',     // Strain scores, workouts, calories
  'read:sleep',       // Sleep quality, duration, stages
  'read:cycles',      // Daily physiological cycles
  'read:profile'      // User profile information
]
```

### Security Features

- ✅ **AES-256-GCM encryption** for stored credentials
- ✅ **CSRF protection** with OAuth state validation
- ✅ **HTTPS-only** communication
- ✅ **Token refresh** logic for expired tokens
- ✅ **One-time state use** enforced
- ✅ **10-minute state expiration**

---

## Best Practices

### 1. Always Handle Token Refresh

```typescript
// WhoopIntegration automatically handles token refresh
// Tokens are refreshed when expired
// No manual intervention needed
```

### 2. Respect Rate Limits

```typescript
// Implement retry logic with exponential backoff
// Already implemented in lib/retry-utils.ts
```

### 3. Test with Real WHOOP Data

```typescript
// Before production, test with:
// - Users who wear WHOOP 24/7
// - Users with gaps in data
// - Users who just got WHOOP (new accounts)
```

### 4. Provide Clear User Feedback

```typescript
// Show sync status
<LastSynced>Last synced: 2 hours ago</LastSynced>

// Show what data is being used
<DataUsage>
  Using recovery scores for challenge verification
</DataUsage>
```

---

## Future Enhancements

### Potential Improvements

- Real-time webhooks (when WHOOP adds webhook support)
- Richer data visualization (charts, trends)
- Advanced challenge types (strain zones, sleep consistency)
- Team challenges with aggregated WHOOP data
- Predictive recovery insights

---

## Support & Resources

- **WHOOP API Docs:** https://developer.whoop.com/docs
- **WHOOP API Terms:** https://developer.whoop.com/api-terms-of-use
- **Developer Portal:** https://developer.whoop.com/
- **Developer Support:** developer-support@whoop.com
- **Brand Guidelines:** https://developer.whoop.com/docs/brand-guidelines

---

**Integration Status:** ✅ Production Ready  
**Compliance Status:** ⚠️ Action Items Recommended  
**Launch Readiness:** ✅ Can Launch (with disclaimers)  
**Risk Level:** 🟢 Low (manageable)

