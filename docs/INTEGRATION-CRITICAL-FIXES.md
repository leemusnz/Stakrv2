# 🔧 Integration System - Critical Fixes Implementation Guide

**Priority:** 🔴 URGENT
**Estimated Time:** 2-3 days
**Blocking Production:** YES

---

## 🎯 Critical Issues Summary

| Issue | Severity | Impact | Files Affected |
|-------|----------|--------|----------------|
| BUG #1: Tokens Not Stored | 🔴 CRITICAL | 69% of integrations broken | `app/api/integrations/wearables/route.ts` |
| BUG #2: OAuth CSRF Vulnerability | 🔴 CRITICAL | Security risk | `app/api/integrations/callback/*/route.ts` |
| BUG #3: Token Refresh Missing | 🔴 CRITICAL | Integrations break after 6hrs | `lib/wearable-integrations.ts`, `lib/app-integrations.ts` |
| ISSUE #1: No Retry Logic | 🟡 HIGH | Poor reliability | `lib/auto-sync-service.ts` |
| ISSUE #2: No Rate Limiting | 🟡 HIGH | API abuse risk | `app/api/integrations/sync/route.ts` |

---

## 🛠️ Fix #1: Proper Token Storage with Encryption

### Problem
```typescript
// ❌ Current broken implementation
api_credentials: ${JSON.stringify({
  apiKey: apiKey ? '***' : null,          // Original key lost!
  hasAccessToken: !!accessToken,          // Just a boolean!
  hasRefreshToken: !!refreshToken
})}
```

### Solution

#### Step 1: Create Encryption Utility

Create `lib/encryption.ts`:

```typescript
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'dev-key-change-in-production-32char'
const ALGORITHM = 'aes-256-gcm'

if (process.env.NODE_ENV === 'production' && ENCRYPTION_KEY === 'dev-key-change-in-production-32char') {
  throw new Error('ENCRYPTION_KEY must be set in production')
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
    iv
  )
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return JSON.stringify({
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  })
}

export function decrypt(encryptedData: string): string {
  const { encrypted, iv, authTag } = JSON.parse(encryptedData)
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
    Buffer.from(iv, 'hex')
  )
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'))
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

export function encryptCredentials(credentials: {
  apiKey?: string
  clientId?: string
  clientSecret?: string
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
  [key: string]: any
}): string {
  // Encrypt sensitive fields only
  const encrypted: any = { ...credentials }
  
  if (credentials.apiKey) {
    encrypted.apiKey = encrypt(credentials.apiKey)
  }
  if (credentials.clientSecret) {
    encrypted.clientSecret = encrypt(credentials.clientSecret)
  }
  if (credentials.accessToken) {
    encrypted.accessToken = encrypt(credentials.accessToken)
  }
  if (credentials.refreshToken) {
    encrypted.refreshToken = encrypt(credentials.refreshToken)
  }
  
  encrypted._encrypted = true
  return JSON.stringify(encrypted)
}

export function decryptCredentials(encryptedData: string): any {
  const data = JSON.parse(encryptedData)
  
  if (!data._encrypted) {
    // Legacy unencrypted data, return as-is (for migration)
    return data
  }
  
  const decrypted: any = { ...data }
  
  if (data.apiKey) {
    try {
      decrypted.apiKey = decrypt(data.apiKey)
    } catch (e) {
      console.error('Failed to decrypt apiKey:', e)
      decrypted.apiKey = null
    }
  }
  if (data.clientSecret) {
    try {
      decrypted.clientSecret = decrypt(data.clientSecret)
    } catch (e) {
      console.error('Failed to decrypt clientSecret:', e)
      decrypted.clientSecret = null
    }
  }
  if (data.accessToken) {
    try {
      decrypted.accessToken = decrypt(data.accessToken)
    } catch (e) {
      console.error('Failed to decrypt accessToken:', e)
      decrypted.accessToken = null
    }
  }
  if (data.refreshToken) {
    try {
      decrypted.refreshToken = decrypt(data.refreshToken)
    } catch (e) {
      console.error('Failed to decrypt refreshToken:', e)
      decrypted.refreshToken = null
    }
  }
  
  delete decrypted._encrypted
  return decrypted
}
```

#### Step 2: Fix Wearables API Route

Update `app/api/integrations/wearables/route.ts`:

```typescript
import { encryptCredentials, decryptCredentials } from '@/lib/encryption'

// In POST handler (line 136-170):
const sql = await createDbConnection()

await sql`
  INSERT INTO wearable_integrations (
    user_id,
    device_type,
    enabled,
    auto_sync,
    privacy_level,
    api_credentials,
    created_at,
    updated_at
  ) VALUES (
    ${session.user.id},
    ${device},
    ${enabled},
    ${autoSync},
    ${privacyLevel},
    ${encryptCredentials({
      apiKey,
      clientId,
      clientSecret,
      accessToken,
      refreshToken,
      expiresAt: accessToken ? Math.floor(Date.now() / 1000) + 3600 : null // Default 1hr
    })},
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, device_type) 
  DO UPDATE SET
    enabled = EXCLUDED.enabled,
    auto_sync = EXCLUDED.auto_sync,
    privacy_level = EXCLUDED.privacy_level,
    api_credentials = EXCLUDED.api_credentials,
    updated_at = NOW()
`
```

#### Step 3: Fix Apps API Route

Update `app/api/integrations/apps/route.ts` similarly (lines 119-170).

#### Step 4: Update Auto-Sync Service

Update `lib/auto-sync-service.ts`:

```typescript
import { decryptCredentials } from '@/lib/encryption'

// In getUserIntegrations function (line 62-98):
const wearables = await sql`
  SELECT device_type, api_credentials, privacy_level
  FROM wearable_integrations 
  WHERE user_id = ${userId} 
  AND enabled = true 
  AND auto_sync = true
`

// Decrypt credentials before use
const decryptedWearables = wearables.map(w => ({
  ...w,
  api_credentials: decryptCredentials(w.api_credentials)
}))
```

#### Step 5: Add Environment Variable

Add to `.env.local`:

```bash
# Generate with: openssl rand -hex 32
ENCRYPTION_KEY=your-32-character-encryption-key-here-change-in-prod
```

---

## 🛠️ Fix #2: OAuth CSRF Protection

### Problem
OAuth callback accepts any state parameter without validation (CSRF vulnerability).

### Solution

#### Step 1: Create OAuth State Management

Create `lib/oauth-state.ts`:

```typescript
import { createDbConnection } from '@/lib/db'
import crypto from 'crypto'

export async function generateOAuthState(
  userId: string,
  provider: string
): Promise<string> {
  const state = crypto.randomBytes(32).toString('hex')
  const sql = await createDbConnection()
  
  // Store state with 10-minute expiration
  await sql`
    INSERT INTO oauth_states (user_id, provider, state, expires_at, created_at)
    VALUES (
      ${userId},
      ${provider},
      ${state},
      NOW() + INTERVAL '10 minutes',
      NOW()
    )
    ON CONFLICT (user_id, provider) 
    DO UPDATE SET 
      state = EXCLUDED.state,
      expires_at = EXCLUDED.expires_at,
      created_at = NOW()
  `
  
  return state
}

export async function validateOAuthState(
  userId: string,
  provider: string,
  state: string
): Promise<boolean> {
  const sql = await createDbConnection()
  
  const results = await sql`
    SELECT state, expires_at
    FROM oauth_states
    WHERE user_id = ${userId}
    AND provider = ${provider}
    AND state = ${state}
    AND expires_at > NOW()
  `
  
  if (results.length === 0) {
    return false
  }
  
  // Delete used state (one-time use)
  await sql`
    DELETE FROM oauth_states
    WHERE user_id = ${userId} AND provider = ${provider}
  `
  
  return true
}

export async function cleanupExpiredStates(): Promise<void> {
  const sql = await createDbConnection()
  await sql`
    DELETE FROM oauth_states
    WHERE expires_at < NOW()
  `
}
```

#### Step 2: Create Migration

Create `migrations/add-oauth-states-table.sql`:

```sql
-- OAuth state tracking for CSRF protection
CREATE TABLE IF NOT EXISTS oauth_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    state VARCHAR(128) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

CREATE INDEX idx_oauth_states_user_provider ON oauth_states(user_id, provider);
CREATE INDEX idx_oauth_states_expires_at ON oauth_states(expires_at);

COMMENT ON TABLE oauth_states IS 'Temporary OAuth state storage for CSRF protection';
```

#### Step 3: Update OAuth Authorize Endpoint

Update `app/api/integrations/oauth/authorize/route.ts`:

```typescript
import { generateOAuthState } from '@/lib/oauth-state'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { provider, type } = await request.json()
    
    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    // ✅ Generate and store CSRF-protected state
    const state = await generateOAuthState(session.user.id, provider)

    let authUrl: string

    switch (provider) {
      case 'strava':
        authUrl = `https://www.strava.com/oauth/authorize?` +
          `client_id=${process.env.STRAVA_CLIENT_ID}&` +
          `response_type=code&` +
          `redirect_uri=${encodeURIComponent(`${baseUrl}/api/integrations/callback/strava`)}&` +
          `approval_prompt=force&` +
          `scope=read,activity:read&` +
          `state=${state}`
        break
      
      // ... other providers
    }

    return NextResponse.json({ 
      success: true, 
      authUrl,
      provider,
      state 
    })
  } catch (error) {
    console.error('OAuth authorization error:', error)
    return NextResponse.json({
      error: 'Failed to generate authorization URL',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
```

#### Step 4: Update Strava Callback

Update `app/api/integrations/callback/strava/route.ts`:

```typescript
import { validateOAuthState } from '@/lib/oauth-state'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/auth/signin?error=unauthorized', request.url))
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const state = searchParams.get('state')

    if (error) {
      console.error('Strava OAuth error:', error)
      return NextResponse.redirect(new URL('/settings?tab=integrations&error=strava_auth_failed', request.url))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/settings?tab=integrations&error=missing_parameters', request.url))
    }

    // ✅ CSRF Protection: Validate OAuth state
    const isValidState = await validateOAuthState(session.user.id, 'strava', state)
    if (!isValidState) {
      console.error('Invalid OAuth state - possible CSRF attack')
      return NextResponse.redirect(new URL('/settings?tab=integrations&error=invalid_state', request.url))
    }

    // Rest of the implementation remains the same...
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      // ... existing code
    })

    // ... rest of implementation
  } catch (error) {
    console.error('Strava OAuth callback error:', error)
    return NextResponse.redirect(new URL('/settings?tab=integrations&error=oauth_error', request.url))
  }
}
```

---

## 🛠️ Fix #3: Token Refresh Implementation

### Problem
OAuth tokens expire (typically 1-6 hours), but no refresh logic exists.

### Solution

#### Step 1: Add Token Refresh to Fitbit Integration

Update `lib/wearable-integrations.ts`:

```typescript
export class FitbitIntegration {
  private config: WearableIntegrationConfig
  private readonly BASE_URL = 'https://api.fitbit.com/1'

  constructor(config: WearableIntegrationConfig) {
    this.config = config
  }

  async connect(): Promise<boolean> {
    try {
      // In development mode, allow connection without API keys
      if (process.env.NODE_ENV === 'development') {
        console.log('⌚ Fitbit integration connected (development mode)')
        return true
      }

      if (!this.config.clientId) {
        console.log('⌚ Fitbit Client ID required for production')
        return false
      }

      // ✅ Check if token needs refresh
      if (await this.isTokenExpired()) {
        console.log('⌚ Fitbit token expired, refreshing...')
        await this.refreshAccessToken()
      }

      // Test connection with current token
      if (this.config.accessToken) {
        const response = await fetch(`${this.BASE_URL}/user/-/profile.json`, {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`
          }
        })

        if (response.ok) {
          console.log('⌚ Fitbit connection verified')
          return true
        } else if (response.status === 401) {
          // Token invalid, try refresh
          await this.refreshAccessToken()
          return true
        }
      }

      // OAuth 2.0 flow for Fitbit
      const authUrl = `https://www.fitbit.com/oauth2/authorize?` +
        `response_type=code&` +
        `client_id=${this.config.clientId}&` +
        `scope=activity+heartrate+location+sleep&` +
        `redirect_uri=${encodeURIComponent(window.location.origin + '/auth/fitbit')}`

      console.log('⌚ Fitbit OAuth URL:', authUrl)
      return true
    } catch (error) {
      console.error('Fitbit connection failed:', error)
      return false
    }
  }

  // ✅ NEW: Check if token is expired
  private async isTokenExpired(): Promise<boolean> {
    if (!this.config.expiresAt) {
      return false // No expiration set, assume valid
    }
    
    // Add 5-minute buffer to refresh before actual expiration
    const expiresWithBuffer = (this.config.expiresAt * 1000) - (5 * 60 * 1000)
    return Date.now() >= expiresWithBuffer
  }

  // ✅ NEW: Refresh access token using refresh token
  private async refreshAccessToken(): Promise<void> {
    if (!this.config.refreshToken) {
      throw new Error('No refresh token available')
    }

    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('Client credentials required for token refresh')
    }

    try {
      const response = await fetch('https://api.fitbit.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.config.refreshToken
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Token refresh failed: ${error}`)
      }

      const data = await response.json()
      
      // Update local config
      this.config.accessToken = data.access_token
      this.config.refreshToken = data.refresh_token
      this.config.expiresAt = Math.floor(Date.now() / 1000) + data.expires_in

      // ✅ Persist new tokens to database
      await this.persistTokens()

      console.log('⌚ Fitbit tokens refreshed successfully')
    } catch (error) {
      console.error('Failed to refresh Fitbit token:', error)
      throw error
    }
  }

  // ✅ NEW: Save updated tokens to database
  private async persistTokens(): Promise<void> {
    const sql = await createDbConnection()
    const { encryptCredentials } = await import('@/lib/encryption')
    
    await sql`
      UPDATE wearable_integrations
      SET 
        api_credentials = ${encryptCredentials({
          clientId: this.config.clientId,
          clientSecret: this.config.clientSecret,
          accessToken: this.config.accessToken,
          refreshToken: this.config.refreshToken,
          expiresAt: this.config.expiresAt
        })},
        updated_at = NOW()
      WHERE device_type = 'fitbit'
      AND user_id = (
        SELECT user_id FROM wearable_integrations 
        WHERE device_type = 'fitbit' 
        LIMIT 1
      )
    `
  }

  async fetchWorkoutData(startDate: Date, endDate: Date): Promise<WearableData[]> {
    // ✅ Ensure valid token before fetching
    if (await this.isTokenExpired()) {
      await this.refreshAccessToken()
    }

    if (!this.config.accessToken) {
      throw new Error('Fitbit access token required')
    }

    try {
      const dateStr = startDate.toISOString().split('T')[0]
      const response = await fetch(`${this.BASE_URL}/user/-/activities/date/${dateStr}.json`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Fitbit API error: ${response.status}`)
      }

      const data = await response.json()
      return this.parseFitbitData(data)
    } catch (error) {
      console.error('Failed to fetch Fitbit data:', error)
      return []
    }
  }

  // ... rest of implementation
}
```

#### Step 2: Add Token Refresh to Strava Integration

Similar implementation for `StravaIntegration` class.

#### Step 3: Add Token Refresh to App Integrations

Similar implementation for `lib/app-integrations.ts` (GitHub, Spotify, etc.)

---

## 🛠️ Fix #4: Retry Logic with Exponential Backoff

### Solution

#### Step 1: Create Retry Utility

Create `lib/retry-utils.ts`:

```typescript
export interface RetryOptions {
  maxAttempts?: number
  backoff?: 'constant' | 'exponential' | 'fibonacci'
  initialDelay?: number
  maxDelay?: number
  retryOn?: number[] // HTTP status codes to retry
  onRetry?: (error: Error, attempt: number) => void
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  backoff: 'exponential',
  initialDelay: 1000,
  maxDelay: 10000,
  retryOn: [408, 429, 500, 502, 503, 504],
  onRetry: () => {}
}

export class RetryError extends Error {
  constructor(message: string, public readonly lastError: Error, public readonly attempts: number) {
    super(message)
    this.name = 'RetryError'
  }
}

function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  let delay: number
  
  switch (options.backoff) {
    case 'constant':
      delay = options.initialDelay
      break
    case 'exponential':
      delay = options.initialDelay * Math.pow(2, attempt - 1)
      break
    case 'fibonacci':
      delay = options.initialDelay * fibonacci(attempt)
      break
  }
  
  return Math.min(delay, options.maxDelay)
}

function fibonacci(n: number): number {
  if (n <= 1) return 1
  let a = 1, b = 1
  for (let i = 2; i < n; i++) {
    [a, b] = [b, a + b]
  }
  return b
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      // Check if error is retryable
      if (error instanceof Error) {
        // For fetch errors, check status code
        if ('status' in error) {
          const status = (error as any).status
          if (!opts.retryOn.includes(status)) {
            throw error // Don't retry non-retryable status codes
          }
        }
      }
      
      // Don't retry on last attempt
      if (attempt === opts.maxAttempts) {
        break
      }
      
      // Call retry callback
      opts.onRetry(error as Error, attempt)
      
      // Wait before retrying
      const delay = calculateDelay(attempt, opts)
      console.log(`Retry attempt ${attempt}/${opts.maxAttempts} after ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw new RetryError(
    `Failed after ${opts.maxAttempts} attempts`,
    lastError!,
    opts.maxAttempts
  )
}

// Helper for fetch requests
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return retry(async () => {
    const response = await fetch(url, options)
    
    if (!response.ok) {
      const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`)
      error.status = response.status
      error.response = response
      throw error
    }
    
    return response
  }, retryOptions)
}
```

#### Step 2: Update Auto-Sync Service

Update `lib/auto-sync-service.ts`:

```typescript
import { fetchWithRetry, retry } from '@/lib/retry-utils'

export async function syncStravaData(
  credentials: any,
  challengeId: string,
  userId: string,
  aiAnalysis: any | null,
  challengeTextForAI: string
): Promise<SyncResult> {
  
  if (!credentials?.access_token) {
    return { success: false, error: 'No Strava credentials found' }
  }

  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7) // Last 7 days
    const after = Math.floor(startDate.getTime() / 1000)
    
    console.log('🏃 Fetching Strava activities...')
    
    // ✅ Use retry logic for external API calls
    const response = await fetchWithRetry(
      `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=30`,
      {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Accept': 'application/json'
        }
      },
      {
        maxAttempts: 3,
        backoff: 'exponential',
        initialDelay: 1000,
        onRetry: (error, attempt) => {
          console.log(`Strava API retry ${attempt}/3:`, error.message)
        }
      }
    )
    
    const activities = await response.json()
    
    if (!Array.isArray(activities)) {
      return { success: false, error: 'Invalid Strava response format' }
    }

    console.log(`✅ Found ${activities.length} Strava activities`)
    
    // ... rest of implementation
  } catch (error) {
    console.error('Strava sync failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'strava'
    }
  }
}
```

---

## 🛠️ Fix #5: Rate Limiting

### Solution

#### Step 1: Install Dependencies

```bash
npm install @upstash/ratelimit @upstash/redis
```

#### Step 2: Set Up Redis (Upstash)

Add to `.env.local`:

```bash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

#### Step 3: Create Rate Limit Middleware

Create `lib/rate-limit.ts`:

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

// Create Redis client
const redis = Redis.fromEnv()

// Create rate limiters for different endpoints
export const syncRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
  analytics: true,
  prefix: '@upstash/ratelimit/sync'
})

export const apiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
  prefix: '@upstash/ratelimit/api'
})

export async function applyRateLimit(
  request: NextRequest,
  identifier: string,
  limiter: Ratelimit = apiRateLimiter
): Promise<NextResponse | null> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier)
  
  if (!success) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        limit,
        remaining,
        reset: new Date(reset)
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString()
        }
      }
    )
  }
  
  return null // Rate limit passed
}
```

#### Step 4: Apply Rate Limiting to Sync Endpoint

Update `app/api/integrations/sync/route.ts`:

```typescript
import { applyRateLimit, syncRateLimiter } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // ✅ Apply rate limiting (10 syncs per minute per user)
    const rateLimitError = await applyRateLimit(
      request,
      `sync:${session.user.id}`,
      syncRateLimiter
    )
    
    if (rateLimitError) {
      return rateLimitError
    }

    // ... rest of implementation
  } catch (error) {
    console.error('Sync failed:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
```

---

## ✅ Testing Checklist

### After Implementing Fixes

- [ ] **Encryption Tests**
  - [ ] Encrypt and decrypt sample tokens
  - [ ] Verify database stores encrypted data
  - [ ] Test decryption on retrieval
  
- [ ] **OAuth CSRF Tests**
  - [ ] Generate OAuth state
  - [ ] Validate correct state passes
  - [ ] Validate incorrect state fails
  - [ ] Test expired state rejection
  
- [ ] **Token Refresh Tests**
  - [ ] Mock expired token
  - [ ] Verify automatic refresh
  - [ ] Test refresh failure handling
  - [ ] Verify new tokens persisted
  
- [ ] **Retry Logic Tests**
  - [ ] Test successful retry after transient failure
  - [ ] Test max attempts reached
  - [ ] Test exponential backoff timing
  - [ ] Test non-retryable errors
  
- [ ] **Rate Limiting Tests**
  - [ ] Test rate limit enforcement
  - [ ] Test rate limit headers
  - [ ] Test rate limit reset
  
- [ ] **Integration Tests**
  - [ ] Manual Fitbit integration → Sync works
  - [ ] OAuth Strava integration → Tokens stored → Sync works
  - [ ] Token expires → Auto-refresh → Sync continues
  - [ ] Multiple concurrent syncs → Rate limited

---

## 🚀 Deployment Steps

1. **Run database migration**
   ```bash
   psql $DATABASE_URL -f migrations/add-oauth-states-table.sql
   ```

2. **Set environment variables**
   ```bash
   ENCRYPTION_KEY=<generate-with-openssl-rand-hex-32>
   UPSTASH_REDIS_REST_URL=<your-redis-url>
   UPSTASH_REDIS_REST_TOKEN=<your-redis-token>
   ```

3. **Deploy code changes**
   ```bash
   git add .
   git commit -m "fix: critical integration security and reliability fixes"
   git push origin main
   ```

4. **Verify in production**
   - Test OAuth flow
   - Test manual integration
   - Monitor logs for encryption/decryption
   - Verify rate limiting active

---

## 📈 Success Metrics

- ✅ Token storage working: 100% of integrations functional
- ✅ OAuth CSRF protected: 0 security vulnerabilities
- ✅ Token refresh working: 0 "token expired" errors after 6 hours
- ✅ Retry logic working: <1% sync failures due to transient errors
- ✅ Rate limiting working: 0 API quota abuse incidents

---

**Estimated Time to Complete:** 2-3 days
**Priority:** 🔴 CRITICAL - BLOCKING PRODUCTION LAUNCH


