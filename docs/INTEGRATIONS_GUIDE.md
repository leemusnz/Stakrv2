# Integrations Guide

**Status:** ✅ Implemented with Action Items  
**Last Updated:** December 3, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Available Integrations](#available-integrations)
3. [Architecture](#architecture)
4. [Adding New Integrations](#adding-new-integrations)
5. [Known Issues & Fixes](#known-issues--fixes)
6. [Best Practices](#best-practices)

---

## Overview

Stakr integrates with 22+ external services to automatically verify challenge completion. Users can connect wearables, fitness apps, productivity tools, and learning platforms.

### Integration Categories

**Wearables (9):** Apple Watch, Fitbit, Garmin, WHOOP, Strava, Samsung Watch, Polar, Withings, Oura Ring

**Apps (13):** Duolingo, GitHub, MyFitnessPal, Headspace, Noom, Coursera, Khan Academy, Spotify, YouTube Music, Goodreads, Todoist, Notion, LinkedIn Learning

---

## Available Integrations

### ✅ Fully Working (7 integrations)

**Strava** - GPS tracking, runs, rides, workouts  
**OAuth:** ✅ | **Auto-Sync:** ✅ | **Verification:** ✅

**Duolingo** - Language learning streaks  
**OAuth:** ✅ | **Auto-Sync:** ✅ | **Verification:** ✅

**GitHub** - Commits, pull requests, repositories  
**OAuth:** ✅ | **Auto-Sync:** ✅ | **Verification:** ✅

**Apple Watch** - Steps, workouts, heart rate  
**OAuth:** ❌ (HealthKit) | **Auto-Sync:** ✅ | **Verification:** ✅

**Fitbit** - Activity, sleep, heart rate  
**OAuth:** ✅ | **Auto-Sync:** ✅ | **Verification:** ✅

**MyFitnessPal** - Calories, nutrition tracking  
**OAuth:** ✅ | **Auto-Sync:** ✅ | **Verification:** ✅

**Headspace** - Meditation minutes  
**OAuth:** ❌ (Manual) | **Auto-Sync:** ❌ | **Verification:** ✅

### 🚧 Framework Ready (15 integrations)

These have integration classes but need OAuth credentials or API completion:

- Google Fit, Garmin, Samsung Watch, Polar, Withings, Oura Ring
- Noom, Coursera, Khan Academy, Spotify, YouTube Music, Goodreads
- Todoist, Notion, LinkedIn Learning

**Status:** Integration framework ready, needs API keys and testing

---

## Architecture

### System Design

```
┌─────────────────────────────────────────────────┐
│              Integration Manager                │
│  (UI for connecting/managing integrations)      │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│           OAuth Authorization Flow              │
│  • State generation (CSRF protection)          │
│  • Redirect to provider                        │
│  • Callback handling                           │
│  • Token storage (encrypted)                   │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│        Integration Classes (Adapters)          │
│  • WearableManager (9 device types)            │
│  • AppManager (13 app types)                   │
│  • Standardized data fetching                  │
│  • Data normalization                          │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│           Auto-Sync Service                     │
│  • Periodic data fetching                      │
│  • Challenge verification                      │
│  • Proof auto-submission                       │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│              Database Storage                   │
│  • wearable_integrations                       │
│  • app_integrations                            │
│  • wearable_data                               │
│  • oauth_states                                │
└─────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Integration connections
CREATE TABLE wearable_integrations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  device_type VARCHAR(50),
  enabled BOOLEAN DEFAULT true,
  api_credentials JSONB,  -- Encrypted tokens
  last_sync TIMESTAMP,
  auto_sync BOOLEAN DEFAULT true,
  privacy_level VARCHAR(20) DEFAULT 'standard'
);

CREATE TABLE app_integrations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  app_type VARCHAR(50),
  enabled BOOLEAN DEFAULT true,
  api_credentials JSONB,  -- Encrypted tokens
  last_sync TIMESTAMP,
  auto_sync BOOLEAN DEFAULT true
);

-- Synced data
CREATE TABLE wearable_data (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  device_type VARCHAR(50),
  data_type VARCHAR(50),
  value NUMERIC,
  unit VARCHAR(20),
  timestamp TIMESTAMP,
  metadata JSONB,
  verification_status VARCHAR(20) DEFAULT 'pending'
);

-- OAuth security
CREATE TABLE oauth_states (
  state VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  provider VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

---

## Adding New Integrations

### Step 1: Create Integration Class

**File:** `lib/wearable-integrations.ts` (or `app-integrations.ts`)

```typescript
export class NewServiceIntegration extends BaseIntegration {
  async connect(credentials: any): Promise<ConnectionResult> {
    // Verify credentials and test connection
    const isValid = await this.testConnection(credentials)
    return { success: isValid }
  }

  async fetchData(credentials: any, startDate: Date, endDate: Date): Promise<Data[]> {
    // Fetch data from API
    const response = await fetch(`${API_URL}/data`, {
      headers: { Authorization: `Bearer ${credentials.accessToken}` }
    })
    
    // Normalize data to standard format
    return this.normalizeData(await response.json())
  }

  async verifyChallenge(challenge: Challenge, userData: Data[]): Promise<boolean> {
    // Check if challenge criteria met
    return this.meetsRequirements(challenge, userData)
  }
  
  private normalizeData(rawData: any): Data[] {
    // Convert provider format to Stakr format
    return rawData.map(item => ({
      type: 'steps',
      value: item.steps,
      timestamp: new Date(item.date),
      source: 'NewService'
    }))
  }
}
```

### Step 2: Add OAuth Configuration

**File:** `lib/oauth-config.ts`

```typescript
export const OAUTH_CONFIGS = {
  // ... existing configs ...
  
  newservice: {
    authUrl: 'https://api.newservice.com/oauth/authorize',
    tokenUrl: 'https://api.newservice.com/oauth/token',
    scopes: ['read:data', 'read:profile'],
    clientId: process.env.NEWSERVICE_CLIENT_ID,
    clientSecret: process.env.NEWSERVICE_CLIENT_SECRET,
  }
}
```

### Step 3: Add Callback Route

**File:** `app/api/integrations/callback/newservice/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { validateOAuthState } from '@/lib/oauth-state'
import { NewServiceIntegration } from '@/lib/wearable-integrations'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  
  // Validate CSRF state
  const isValidState = await validateOAuthState(state)
  if (!isValidState) {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 })
  }
  
  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code)
  
  // Store encrypted credentials
  await storeIntegration({
    userId: session.user.id,
    service: 'newservice',
    credentials: tokens
  })
  
  return NextResponse.redirect('/settings?tab=integrations&success=newservice')
}
```

### Step 4: Update Type Definitions

**File:** `lib/types.ts`

```typescript
export type WearableDevice = 
  | 'apple_watch'
  | 'fitbit'
  // ... existing types ...
  | 'newservice'  // Add new type

export type DataType =
  | 'steps'
  | 'heart_rate'
  // ... existing types ...
  | 'custom_metric'  // Add new type if needed
```

### Step 5: Add to Integration Manager

**File:** `components/integration-manager.tsx`

```typescript
const AVAILABLE_INTEGRATIONS = [
  // ... existing integrations ...
  {
    id: 'newservice',
    name: 'New Service',
    icon: '🎯',  // Choose appropriate emoji
    category: 'wearable',  // or 'app'
    oauthAvailable: true,
    description: 'Connect your New Service data'
  }
]
```

### Step 6: Environment Variables

```bash
# Add to .env.local
NEWSERVICE_CLIENT_ID=your-client-id
NEWSERVICE_CLIENT_SECRET=your-client-secret
```

### Step 7: Test

1. Connect integration via UI
2. Verify OAuth flow works
3. Test data fetching
4. Verify challenge completion detection
5. Check encryption of stored credentials

---

## Known Issues & Fixes

### ✅ Fixed: Token Storage

**Issue:** OAuth tokens weren't being stored properly (69% of integrations broken)

**Solution Implemented:**
- AES-256-GCM encryption for all credentials
- Proper token storage in database
- Token refresh logic for expired tokens

### ✅ Fixed: OAuth CSRF Vulnerability

**Issue:** No state validation (security risk)

**Solution Implemented:**
- Cryptographic state generation
- Database-backed state validation
- 10-minute state expiration
- One-time use enforcement

### ✅ Fixed: No Retry Logic

**Issue:** API failures caused immediate errors

**Solution Implemented:**
- Exponential backoff retry (1s → 2s → 4s)
- Graceful degradation
- Error logging

### ⚠️ Action Required: Data Retention

**Issue:** Some integrations may store data longer than allowed by provider terms

**Solution:** Implement time-based data deletion
```sql
ALTER TABLE wearable_data ADD COLUMN expires_at TIMESTAMP;

-- Cron job to cleanup
DELETE FROM wearable_data WHERE expires_at < NOW();
```

---

## Best Practices

### 1. Always Encrypt Credentials

```typescript
import { encrypt } from '@/lib/encryption'

const encryptedCreds = await encrypt(JSON.stringify(tokens))
await sql`INSERT INTO wearable_integrations (api_credentials) VALUES (${encryptedCreds})`
```

### 2. Implement Token Refresh

```typescript
async function refreshToken(integration: Integration) {
  if (integration.credentials.expiresAt > Date.now()) {
    return integration.credentials.accessToken
  }
  
  // Refresh token
  const newTokens = await fetchNewTokens(integration.credentials.refreshToken)
  await updateIntegration(integration.id, newTokens)
  
  return newTokens.accessToken
}
```

### 3. Handle Rate Limits

```typescript
import { retryWithBackoff } from '@/lib/retry-utils'

const data = await retryWithBackoff(async () => {
  return await fetchFromAPI()
}, {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000
})
```

### 4. Normalize Data Format

```typescript
// Always convert to standard format
interface StandardData {
  type: string
  value: number
  unit: string
  timestamp: Date
  source: string
  metadata?: Record<string, any>
}
```

### 5. Test Edge Cases

- User with no data
- Expired tokens
- Network failures
- Rate limit errors
- Invalid credentials
- Provider API changes

---

## API Endpoints

### Get Available Integrations
```
GET /api/integrations/wearables
GET /api/integrations/apps
```

### Connect Integration
```
POST /api/integrations/oauth/authorize
Body: { provider: 'strava', type: 'wearable' }
```

### OAuth Callbacks
```
GET /api/integrations/callback/[provider]
```

### Manage Integrations
```
GET /api/integrations/wearables  # List user's integrations
DELETE /api/integrations/wearables/[id]  # Remove integration
POST /api/integrations/sync  # Trigger manual sync
```

---

## Testing

### Manual Testing

```bash
# 1. Connect integration
# Visit: /settings?tab=integrations
# Click "Connect [Service]"
# Complete OAuth flow

# 2. Verify stored
# Check database:
SELECT * FROM wearable_integrations WHERE user_id = 'your-user-id';

# 3. Test data sync
# Trigger sync via UI or API:
curl -X POST /api/integrations/sync

# 4. Check synced data
SELECT * FROM wearable_data WHERE user_id = 'your-user-id' ORDER BY timestamp DESC LIMIT 10;
```

### Automated Testing

```typescript
// tests/__tests__/integrations.test.ts
describe('Integration System', () => {
  it('stores credentials encrypted', async () => {
    const tokens = { accessToken: 'test-token' }
    await storeIntegration({ userId: '1', service: 'strava', credentials: tokens })
    
    const stored = await getIntegration('1', 'strava')
    expect(stored.api_credentials).not.toContain('test-token')  // Should be encrypted
  })
  
  it('validates OAuth state', async () => {
    const state = await generateOAuthState('user-1', 'strava')
    const isValid = await validateOAuthState(state)
    expect(isValid).toBe(true)
  })
})
```

---

## Resources

- **Strava API:** https://developers.strava.com/
- **Fitbit API:** https://dev.fitbit.com/
- **WHOOP API:** https://developer.whoop.com/
- **Duolingo API:** (Unofficial, reverse-engineered)
- **GitHub API:** https://docs.github.com/en/rest

---

**Integration Status:** 7/22 Fully Working, 15/22 Framework Ready  
**Security:** ✅ OAuth CSRF protection, AES-256 encryption  
**Next Steps:** Add OAuth credentials for remaining integrations, test thoroughly

