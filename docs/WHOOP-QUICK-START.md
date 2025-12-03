# 💪 Whoop Integration - Quick Start

**5-Minute Setup Guide**

---

## ✅ **Step 1: Get Whoop Credentials** (2 min)

1. Go to https://developer.whoop.com/
2. Sign in or create account
3. Create new app
4. Copy **Client ID** and **Client Secret**
5. Set redirect URI:
   - Dev: `http://localhost:3000/api/integrations/callback/whoop`
   - Prod: `https://your-domain.com/api/integrations/callback/whoop`

---

## ✅ **Step 2: Add to Environment** (1 min)

Add to `.env.local`:

```bash
WHOOP_CLIENT_ID=your-client-id-here
WHOOP_CLIENT_SECRET=your-client-secret-here
```

---

## ✅ **Step 3: Restart App** (30 sec)

```bash
npm run dev
```

---

## ✅ **Step 4: Test Connection** (1 min)

1. Go to `/settings?tab=integrations`
2. Find **Whoop** in the list (💪 icon)
3. Click **"Connect Whoop"**
4. Login with Whoop
5. Authorize access
6. Success! ✅

---

## 🎯 **What You Can Track**

- ✅ **Recovery Score** (0-100%)
- ✅ **Strain Score** (0-21)
- ✅ **Sleep Quality**
- ✅ **HRV (Heart Rate Variability)**
- ✅ **Workouts**
- ✅ **Respiratory Rate**

---

## 💡 **Example Challenges**

```typescript
// Recovery Challenge
"Maintain 70%+ recovery for 7 days"

// Strain Challenge  
"Hit 15+ strain 5 times this week"

// Sleep Challenge
"Get 8+ hours sleep for 30 days"
```

---

## 🔐 **Security Features**

- ✅ OAuth 2.0 with CSRF protection
- ✅ AES-256-GCM encryption
- ✅ Automatic token refresh
- ✅ Privacy controls

---

## ⚡ **That's It!**

Whoop is now integrated. Users can:
- Connect their Whoop account
- Auto-verify recovery/strain/sleep challenges
- Track progress automatically

**Full Documentation:** See `WHOOP-INTEGRATION-GUIDE.md`

---

**Status:** ✅ Production Ready  
**Time to Setup:** ~5 minutes  
**Difficulty:** Easy 🟢


