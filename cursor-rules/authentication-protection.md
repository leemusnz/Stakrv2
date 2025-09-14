# Authentication & Onboarding Protection Rules

## 🚨 CRITICAL: Authentication System Protection

### **NEVER MODIFY WITHOUT EXPLICIT PERMISSION:**
These systems are working correctly and should NOT be changed without explicit user approval:

#### **1. Email Verification System**
- **Files**: `app/api/auth/verify-email/route.ts`
- **Database Functions**: `create_verification_token()`, `verify_token()`
- **XP Award**: 50 XP for email verification
- **Auto-signin**: Uses verification provider for seamless login
- **Status**: ✅ WORKING - DO NOT MODIFY

#### **2. OAuth Authentication Flow**
- **Files**: `lib/auth.ts` (Google provider, OAuth callbacks)
- **XP Award**: 50 XP for OAuth signup
- **Account Detection**: OAuth account conflict handling
- **Status**: ✅ WORKING - DO NOT MODIFY

#### **3. Onboarding XP System**
- **Files**: `app/api/onboarding/complete-profile/route.ts`
- **XP Award**: 300 XP for onboarding completion
- **Total XP**: 350 XP (50 verification + 300 onboarding)
- **Status**: ✅ WORKING - DO NOT MODIFY

#### **4. Password Reset System**
- **Files**: `app/api/auth/forgot-password/route.ts`
- **Email Service**: `lib/email.ts`
- **Status**: ✅ WORKING - DO NOT MODIFY

#### **5. NextAuth Configuration**
- **File**: `lib/auth.ts`
- **Providers**: credentials, verification, google
- **Callbacks**: signIn, jwt, session
- **Status**: ✅ WORKING - DO NOT MODIFY

### **PROTECTED COMPONENTS:**
- `components/onboarding/gamified-*` - XP display amounts
- `app/auth/signin/page.tsx` - OAuth error handling
- `app/auth/verify-email/page.tsx` - Auto-signin flow
- `app/onboarding/page.tsx` - Onboarding completion logic

### **DATABASE SCHEMA PROTECTION:**
- `verification_tokens` table structure
- `users` table XP and onboarding fields
- `xp_transactions` table and `award_xp()` function

## ⚠️ MODIFICATION GUIDELINES:

### **Before Making Changes:**
1. **ALWAYS** ask user for explicit permission
2. **EXPLAIN** why the change is necessary
3. **TEST** thoroughly in development
4. **VERIFY** XP amounts remain consistent
5. **ENSURE** authentication flows still work

### **Safe to Modify:**
- UI text and styling (non-functional)
- Error messages (content only)
- Loading states and animations
- Form validation messages

### **Requires Permission:**
- XP amounts or calculation logic
- Authentication flow changes
- Database schema modifications
- API endpoint changes
- NextAuth configuration

## 🛡️ PROTECTION RULES:

1. **NEVER** change XP award amounts without explicit approval
2. **NEVER** modify authentication providers without permission
3. **NEVER** alter database functions without testing
4. **NEVER** change onboarding completion logic
5. **ALWAYS** maintain backward compatibility
6. **ALWAYS** test email verification flow
7. **ALWAYS** verify OAuth conflict handling works

## 📋 TESTING CHECKLIST:
Before any authentication changes:
- [ ] Email signup → verification → auto-signin → onboarding → 350 XP
- [ ] OAuth signup → auto-signin → onboarding → 350 XP  
- [ ] OAuth account conflict detection
- [ ] Password reset flow
- [ ] XP reconciliation accuracy

## 🚫 FORBIDDEN CHANGES:
- Changing XP amounts in any system
- Modifying authentication provider logic
- Altering database function signatures
- Changing onboarding completion API
- Removing error handling for OAuth conflicts
- Modifying verification token logic

---
**Remember**: These systems are working correctly. Any changes should be minimal and well-tested.
