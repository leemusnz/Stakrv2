# XP System Protection Rules

## 🎯 CRITICAL: XP System Integrity

### **XP AWARD AMOUNTS - DO NOT MODIFY:**
These XP amounts are working correctly and should NOT be changed:

#### **Email Verification**: 50 XP
- **File**: `app/api/auth/verify-email/route.ts`
- **Function**: `award_xp(userId, 50, 'email_verification', ...)`
- **Status**: ✅ WORKING - DO NOT MODIFY

#### **OAuth Signup**: 50 XP  
- **File**: `lib/auth.ts` (OAuth callback)
- **Function**: `award_xp(userId, 50, 'oauth_signup', ...)`
- **Status**: ✅ WORKING - DO NOT MODIFY

#### **Onboarding Completion**: 300 XP
- **File**: `app/api/onboarding/complete-profile/route.ts`
- **Function**: `award_xp(userId, 300, 'onboarding', ...)`
- **Status**: ✅ WORKING - DO NOT MODIFY

#### **Total XP**: 350 XP (50 + 300)
- **Frontend Display**: Matches backend awards exactly
- **Status**: ✅ RECONCILED - DO NOT MODIFY

### **PROTECTED XP DISPLAYS:**
- **Welcome Step**: "+350 XP" total
- **Goals Step**: "+300 XP Available" 
- **Auth Step**: "+300 XP" completion
- **Status**: ✅ ACCURATE - DO NOT MODIFY

### **XP CALCULATION RULES:**
1. **Level Calculation**: `Math.floor(xp / 200) + 1`
2. **Duplicate Prevention**: Uses `award_xp()` function
3. **Transaction Tracking**: All XP awards logged in `xp_transactions`
4. **Status**: ✅ WORKING - DO NOT MODIFY

## 🚫 FORBIDDEN XP CHANGES:

### **NEVER MODIFY:**
- XP award amounts (50, 300, 350)
- Level calculation formula
- `award_xp()` function logic
- XP display amounts in frontend
- Duplicate prevention logic

### **NEVER ADD:**
- Variable XP per goal (+5 XP)
- Step-by-step XP awards
- Additional XP sources
- Complex XP calculations

## ⚠️ MODIFICATION GUIDELINES:

### **Before Changing XP:**
1. **EXPLAIN** why change is necessary
2. **GET EXPLICIT PERMISSION** from user
3. **UPDATE BOTH** frontend and backend
4. **MAINTAIN CONSISTENCY** across all displays
5. **TEST THOROUGHLY** all XP flows

### **Safe XP Changes:**
- XP display text (non-amount)
- XP animation timing
- XP popup styling
- XP level display formatting

### **Requires Permission:**
- Any XP amount changes
- Level calculation changes
- New XP award sources
- XP system architecture changes

## 🛡️ XP SYSTEM PROTECTION:

### **Database Protection:**
- `xp_transactions` table structure
- `award_xp()` function signature
- `users.xp` and `users.level` fields
- XP transaction logging

### **API Protection:**
- XP award endpoints
- Onboarding completion logic
- Verification XP awards
- OAuth XP awards

### **Frontend Protection:**
- XP popup amounts
- XP display text
- Level calculation displays
- XP progress indicators

## 📋 XP TESTING CHECKLIST:
Before any XP changes:
- [ ] Email signup gets 50 XP verification + 300 XP onboarding = 350 XP total
- [ ] OAuth signup gets 50 XP signup + 300 XP onboarding = 350 XP total
- [ ] Frontend displays match backend awards exactly
- [ ] No duplicate XP awards
- [ ] Level calculation works correctly
- [ ] XP transactions are logged properly

## 🎯 XP CONSISTENCY RULES:

1. **Frontend = Backend**: Display amounts must match actual awards
2. **Total = Sum**: 350 XP = 50 + 300 XP
3. **No Variables**: All users get same XP amounts
4. **No Duplicates**: `award_xp()` prevents duplicate awards
5. **Logged**: All XP awards tracked in database

---
**Remember**: XP system is working perfectly. Changes should be minimal and well-justified.
