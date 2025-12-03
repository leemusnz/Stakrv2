# 🧪 Whoop Integration - Testing Guide

**Goal:** Test Whoop integration without breaking anything  
**Time Required:** 10-30 minutes depending on approach

---

## 🎯 **Testing Approach Options**

### **Option 1: Without Real Whoop Account** ✅ (Easiest)
Test the integration structure without OAuth credentials

### **Option 2: With Whoop Developer Account** 🔐
Full end-to-end testing with real OAuth flow

### **Option 3: Mock/Simulation Testing** 🎭
Test with simulated data for development

---

## ✅ **OPTION 1: Test Without Real Credentials** (Start Here)

### **What You Can Test:**

#### 1. **Check Integration is Listed**
```bash
# Start dev server
npm run dev

# Navigate to:
http://localhost:3000/settings?tab=integrations

# Look for:
✅ "Whoop" appears in available devices list
✅ Whoop icon (💪) displays
✅ "Connect Whoop" button is there
```

#### 2. **Test Integration Manager UI**
```typescript
// Check the UI loads:
- Go to /settings?tab=integrations
- Click "Add Wearable" button
- Whoop should appear in dropdown
- Select Whoop
- See privacy level options
- See auto-sync toggle
```

#### 3. **Test API Endpoints (Without Auth)**
```bash
# Test available devices endpoint
curl http://localhost:3000/api/integrations/wearables

# Expected response should include:
{
  "availableDevices": [
    "apple_watch",
    "fitbit",
    "strava",
    "whoop",  ← Should be here!
    ...
  ]
}
```

#### 4. **Check OAuth URL Generation**
```bash
# Test OAuth authorize endpoint (will fail without credentials, but that's ok)
curl -X POST http://localhost:3000/api/integrations/oauth/authorize \
  -H "Content-Type: application/json" \
  -d '{"provider": "whoop", "type": "wearable"}'

# Expected error (because WHOOP_CLIENT_ID not set):
{
  "error": "OAuth not available for whoop"
}
# Or it might generate a URL with "undefined" - both are fine for testing
```

---

## 🔐 **OPTION 2: Full OAuth Testing** (Requires Whoop Account)

### **Step 1: Get Whoop Developer Credentials** (5-10 min)

1. Go to https://developer.whoop.com/
2. Sign up or log in
3. Click "Create Application" or "New App"
4. Fill in details:
   - **App Name:** Stakr (Development)
   - **Description:** Challenge verification platform (testing)
   - **Redirect URI:** `http://localhost:3000/api/integrations/callback/whoop`
5. Copy your **Client ID** and **Client Secret**

### **Step 2: Add Environment Variables**

Add to `.env.local`:
```bash
WHOOP_CLIENT_ID=your-client-id-here
WHOOP_CLIENT_SECRET=your-client-secret-here
```

### **Step 3: Restart Dev Server**
```bash
# Stop server (Ctrl+C)
npm run dev
```

### **Step 4: Test OAuth Flow**

1. **Navigate to integrations:**
   ```
   http://localhost:3000/settings?tab=integrations
   ```

2. **Click "Add Wearable"** and select Whoop

3. **Click "Add Integration"** button

4. **Should redirect to Whoop login page**
   - If you see Whoop's login page ✅ OAuth URL generated correctly
   - If you get error ❌ Check credentials in .env.local

5. **Log in with your Whoop account**

6. **Authorize Stakr to access your data**
   - Should show scopes: recovery, workouts, sleep, etc.

7. **Should redirect back to Stakr**
   ```
   http://localhost:3000/settings?tab=integrations&success=whoop_connected
   ```

8. **Check database:**
   ```sql
   SELECT * FROM wearable_integrations 
   WHERE device_type = 'whoop';
   
   -- Should show:
   -- ✅ Your user_id
   -- ✅ device_type: 'whoop'
   -- ✅ enabled: true
   -- ✅ api_credentials: (encrypted JSON with tokens)
   ```

### **Step 5: Test Data Sync**

1. **Create a test challenge** (or use existing)

2. **Join the challenge**

3. **Trigger sync:**
   ```bash
   # Via API:
   curl -X POST http://localhost:3000/api/integrations/sync \
     -H "Content-Type: application/json" \
     -d '{"trigger": "manual_sync", "provider": "whoop", "type": "wearable"}'
   ```
   
   Or click "Sync Now" button in UI

4. **Check logs for:**
   ```
   💪 Whoop connection verified
   📊 Fetching data from whoop...
   ✅ Found X Whoop activities
   ```

5. **Check database for synced data:**
   ```sql
   SELECT * FROM wearable_data 
   WHERE device_type = 'whoop'
   ORDER BY timestamp DESC;
   
   -- Should show your recovery/workout/sleep data
   ```

---

## 🎭 **OPTION 3: Mock Testing** (No Credentials Needed)

### **Create Test Data Manually**

Use this script to insert mock Whoop data:

Create `scripts/test-whoop-mock-data.js`:

```javascript
const { createDbConnection } = require('../lib/db')

async function insertMockWhoopData() {
  const sql = await createDbConnection()
  
  // Get test user (replace with your user ID)
  const users = await sql`SELECT id FROM users LIMIT 1`
  const userId = users[0]?.id
  
  if (!userId) {
    console.error('No user found. Create a user first.')
    return
  }
  
  console.log('Creating mock Whoop data for user:', userId)
  
  // Insert mock recovery data
  await sql`
    INSERT INTO wearable_data (
      user_id,
      device_type,
      data_type,
      value,
      unit,
      timestamp,
      metadata,
      verification_status
    ) VALUES (
      ${userId},
      'whoop',
      'recovery',
      85,
      'percentage',
      NOW() - INTERVAL '1 day',
      ${JSON.stringify({
        deviceId: 'Whoop 4.0',
        accuracy: 'high',
        source: 'Mock Data',
        heartRate: [45],
        hrv: 95,
        respiratoryRate: 14.5
      })},
      'verified'
    )
  `
  
  // Insert mock workout data
  await sql`
    INSERT INTO wearable_data (
      user_id,
      device_type,
      data_type,
      value,
      unit,
      timestamp,
      metadata,
      verification_status
    ) VALUES (
      ${userId},
      'whoop',
      'workout',
      15.3,
      'strain',
      NOW() - INTERVAL '2 hours',
      ${JSON.stringify({
        deviceId: 'Whoop 4.0',
        accuracy: 'high',
        source: 'Mock Data',
        heartRate: [145],
        calories: 450,
        distance: 5.2,
        duration: 45
      })},
      'verified'
    )
  `
  
  // Insert mock sleep data
  await sql`
    INSERT INTO wearable_data (
      user_id,
      device_type,
      data_type,
      value,
      unit,
      timestamp,
      metadata,
      verification_status
    ) VALUES (
      ${userId},
      'whoop',
      'sleep',
      480,
      'minutes',
      NOW() - INTERVAL '8 hours',
      ${JSON.stringify({
        deviceId: 'Whoop 4.0',
        accuracy: 'high',
        source: 'Mock Data',
        heartRate: [55],
        respiratoryRate: 13.8,
        sleepQuality: 92
      })},
      'verified'
    )
  `
  
  console.log('✅ Mock Whoop data created!')
  console.log('Check dashboard to see the data.')
  
  process.exit(0)
}

insertMockWhoopData().catch(console.error)
```

**Run it:**
```bash
node scripts/test-whoop-mock-data.js
```

---

## 🧪 **COMPREHENSIVE TEST CHECKLIST**

### **Pre-OAuth Tests (No Credentials):**
- [ ] Whoop appears in integration list
- [ ] Whoop icon (💪) displays correctly
- [ ] Device name "Whoop" shows in UI
- [ ] Can select Whoop from dropdown
- [ ] Privacy level selector works

### **OAuth Flow Tests (With Credentials):**
- [ ] Click "Connect Whoop" generates OAuth URL
- [ ] Redirects to Whoop login page
- [ ] Can log in to Whoop
- [ ] Authorization screen shows correct scopes
- [ ] Callback URL receives code and state
- [ ] State validation passes (CSRF protection)
- [ ] Tokens stored encrypted in database
- [ ] Success message displays
- [ ] Whoop shows as "Connected" in UI

### **Data Sync Tests (With Credentials):**
- [ ] Manual sync button appears
- [ ] Click "Sync Now" triggers sync
- [ ] API call to Whoop succeeds
- [ ] Recovery data retrieved
- [ ] Workout data retrieved
- [ ] Sleep data retrieved
- [ ] Data stored in wearable_data table
- [ ] Verification status set correctly

### **Integration Management Tests:**
- [ ] Can view Whoop integration status
- [ ] Last sync time displays
- [ ] Can toggle auto-sync on/off
- [ ] Can remove integration
- [ ] Removal deletes from database

### **Challenge Verification Tests:**
- [ ] Create recovery-based challenge
- [ ] Join challenge with Whoop connected
- [ ] Sync data
- [ ] Verify challenge auto-completes
- [ ] Check proof_submissions table

---

## 🚀 **RECOMMENDED TESTING SEQUENCE:**

### **Quick Test (5 minutes) - No Credentials:**

```bash
1. Start: npm run dev
2. Go to: http://localhost:3000/settings?tab=integrations
3. Check: Whoop appears in list ✅
4. Check: UI renders correctly ✅
5. Done!
```

### **Full Test (30 minutes) - With Credentials:**

```bash
1. Get Whoop developer credentials (10 min)
2. Add to .env.local (1 min)
3. Restart server (30 sec)
4. Test OAuth flow (5 min)
5. Test data sync (5 min)
6. Check database (2 min)
7. Test challenge verification (5 min)
```

### **Mock Test (10 minutes) - Simulated Data:**

```bash
1. Run mock data script (1 min)
2. Check UI shows data (2 min)
3. Create test challenge (3 min)
4. Verify with mock data (3 min)
```

---

## 🛠️ **Debugging Tips**

### **Issue: "Connect Whoop" button does nothing**
**Check:**
```bash
# Open browser console (F12)
# Look for errors
# Common issue: Missing WHOOP_CLIENT_ID

# Fix: Add to .env.local
WHOOP_CLIENT_ID=your-client-id
```

### **Issue: OAuth redirect fails**
**Check:**
```bash
# Verify redirect URI in Whoop Developer Portal matches:
http://localhost:3000/api/integrations/callback/whoop

# Must be EXACT (including http vs https, port, path)
```

### **Issue: "Invalid state" error**
**Check:**
```bash
# Make sure database migration ran:
psql $DATABASE_URL -f migrations/add-oauth-states-table.sql

# Verify oauth_states table exists:
psql $DATABASE_URL -c "\dt oauth_states"
```

### **Issue: No data syncing**
**Check:**
```bash
# Check logs for errors:
# Terminal where npm run dev is running

# Common issues:
# - Token expired (implement refresh)
# - API rate limit
# - User has no recent Whoop data (need to wear device)
```

---

## 🔍 **Database Inspection Commands**

### **Check Integration Status:**
```sql
-- See if Whoop is connected
SELECT 
  device_type,
  enabled,
  auto_sync,
  last_sync,
  created_at
FROM wearable_integrations
WHERE device_type = 'whoop';
```

### **Check Synced Data:**
```sql
-- See Whoop data
SELECT 
  data_type,
  value,
  unit,
  timestamp,
  verification_status
FROM wearable_data
WHERE device_type = 'whoop'
ORDER BY timestamp DESC
LIMIT 10;
```

### **Check OAuth States:**
```sql
-- See if OAuth state was created
SELECT * FROM oauth_states
WHERE provider = 'whoop';
```

---

## 🎮 **Test Page Approach**

Want a dedicated test page? Create this:

`app/test-whoop/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function TestWhoopPage() {
  const [testResults, setTestResults] = useState<any[]>([])

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    try {
      const result = await testFn()
      setTestResults(prev => [...prev, { name: testName, status: 'pass', result }])
    } catch (error) {
      setTestResults(prev => [...prev, { 
        name: testName, 
        status: 'fail', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }])
    }
  }

  const tests = {
    checkAvailableDevices: async () => {
      const res = await fetch('/api/integrations/wearables')
      const data = await res.json()
      return data.availableDevices.includes('whoop') ? 'Whoop listed!' : 'Whoop not found'
    },

    checkOAuthURL: async () => {
      const res = await fetch('/api/integrations/oauth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'whoop', type: 'wearable' })
      })
      const data = await res.json()
      return data.authUrl ? 'OAuth URL generated' : 'OAuth failed'
    },

    checkWhoopData: async () => {
      const res = await fetch('/api/integrations/wearables')
      const data = await res.json()
      const whoopIntegration = data.integrations?.find((i: any) => i.device === 'whoop')
      return whoopIntegration ? `Connected: ${whoopIntegration.connected}` : 'Not connected'
    }
  }

  return (
    <div className="container max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">🧪 Whoop Integration Test Suite</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Run Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => runTest('Available Devices', tests.checkAvailableDevices)}>
            Test: Whoop in Device List
          </Button>
          <Button onClick={() => runTest('OAuth URL', tests.checkOAuthURL)}>
            Test: OAuth URL Generation
          </Button>
          <Button onClick={() => runTest('Whoop Data', tests.checkWhoopData)}>
            Test: Check Connection Status
          </Button>
          <Button 
            onClick={() => setTestResults([])}
            variant="outline"
            className="ml-4"
          >
            Clear Results
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <p className="text-muted-foreground">No tests run yet</p>
          ) : (
            <div className="space-y-3">
              {testResults.map((result, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded">
                  <span className="font-medium">{result.name}</span>
                  <Badge variant={result.status === 'pass' ? 'default' : 'destructive'}>
                    {result.status === 'pass' ? '✅ Pass' : '❌ Fail'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {result.result || result.error}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Manual Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Go to <a href="/settings?tab=integrations" className="underline text-blue-600">/settings?tab=integrations</a></li>
            <li>Check if Whoop (💪) appears in list</li>
            <li>Click "Connect Whoop"</li>
            <li>Complete OAuth flow</li>
            <li>Check if shows as "Connected"</li>
            <li>Click "Sync Now"</li>
            <li>Check browser console for logs</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Access at:** `http://localhost:3000/test-whoop`

---

## 🔍 **Check Integration Code**

### **Verify Files Exist:**
```bash
# Check integration class exists
cat lib/wearable-integrations.ts | grep -A 5 "class WhoopIntegration"

# Check callback route exists
ls -la app/api/integrations/callback/whoop/

# Check OAuth authorize includes whoop
cat app/api/integrations/oauth/authorize/route.ts | grep -A 5 "whoop"
```

---

## 📊 **Test Outputs to Verify**

### **✅ Success Indicators:**

**In Browser Console:**
```
💪 Whoop integration connected (development mode)
✅ whoop integration added successfully
```

**In Terminal/Server Logs:**
```
🔄 Auto-sync triggered: manual_sync for challenge xxx
💪 Fetching data from whoop...
✅ Sync completed
```

**In Database:**
```sql
-- Integration exists
wearable_integrations: 1 row with device_type='whoop'

-- Data synced
wearable_data: Multiple rows with device_type='whoop'

-- OAuth state cleaned up
oauth_states: 0 rows for whoop (should be deleted after use)
```

---

## ⚡ **QUICK 5-MINUTE TEST** (Recommended Start)

```bash
# 1. Start server
npm run dev

# 2. Open browser to:
http://localhost:3000/settings?tab=integrations

# 3. Check these:
✅ Whoop in device list
✅ 💪 icon displays
✅ "Connect Whoop" button exists

# 4. Click "Add Wearable", select Whoop
✅ Dialog opens
✅ Privacy options show
✅ Auto-sync toggle works

# 5. Done! Basic UI works ✅
```

**Result:** If UI works, integration is properly wired up!

---

## 🔐 **OAuth Flow Test (With Developer Account)**

```bash
# 1. Get credentials from developer.whoop.com
# 2. Add to .env.local:
WHOOP_CLIENT_ID=abc123
WHOOP_CLIENT_SECRET=xyz789

# 3. Restart server
npm run dev

# 4. Test OAuth:
- Go to /settings?tab=integrations
- Click "Connect Whoop"
- Should redirect to Whoop login
- Authorize access
- Should redirect back with success
- Check "Connected" status in UI

# 5. Test sync:
- Click "Sync Now"
- Check console for "Fetching data from whoop..."
- Check database for wearable_data entries
```

---

## 🎯 **What to Test For:**

### **Functionality:**
- [ ] Integration appears in available devices
- [ ] OAuth URL generates correctly
- [ ] OAuth callback processes tokens
- [ ] Tokens stored encrypted
- [ ] Data fetch works
- [ ] Data parsing works
- [ ] Verification logic works
- [ ] Auto-sync triggers

### **Security:**
- [ ] CSRF state validation works
- [ ] Invalid state rejected
- [ ] Tokens encrypted in database
- [ ] OAuth state expires after 10 min
- [ ] One-time state use enforced

### **Error Handling:**
- [ ] Missing credentials → Clear error
- [ ] Invalid token → Handled gracefully
- [ ] API failure → Retry logic works
- [ ] Network error → User-friendly message

---

## 📝 **Test Report Template**

After testing, document results:

```
WHOOP INTEGRATION TEST REPORT
Date: [Date]
Tester: [Name]

✅ PASSED TESTS:
- UI displays Whoop integration
- OAuth URL generation
- [Add your passed tests]

❌ FAILED TESTS:
- [List any failures]

⚠️ ISSUES FOUND:
- [List any bugs or concerns]

📊 OVERALL STATUS: [Pass/Fail/Partial]

RECOMMENDATION: [Ready to launch / Needs fixes / Needs more testing]
```

---

## 🚀 **RECOMMENDED APPROACH:**

### **For Quick Validation (Today):**
1. ✅ Run 5-minute UI test (no credentials needed)
2. ✅ Verify Whoop appears and UI works
3. ✅ Check code files exist

### **For Full Testing (When Ready):**
1. 🔐 Get Whoop developer account
2. 🔑 Add credentials to .env
3. 🧪 Run full OAuth + sync test
4. ✅ Verify everything works end-to-end

### **For Production Confidence:**
1. 🎭 Test with mock data first
2. 🔐 Test with real OAuth second
3. 👥 Have someone else test it
4. 📊 Monitor first real users

---

## 💡 **Pro Tip:**

**Test in this order:**
1. ✅ UI test (no credentials) - 5 min
2. 🎭 Mock data test - 10 min
3. 🔐 Real OAuth test - 15 min

**Only do full OAuth testing when you're ready to actually use Whoop integration.** Until then, UI + mock tests prove it works!

---

**Want me to create the test page or mock data script?** 🧪

