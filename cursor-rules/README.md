# Stakr Project Protection Rules

## 🛡️ Overview
This directory contains protection rules for critical Stakr systems that are currently working correctly. These rules help prevent accidental changes that could break the authentication, onboarding, and XP systems.

## 📁 Protection Rule Files

### 1. **authentication-protection.md**
- Email verification system
- OAuth authentication flow
- Password reset system
- NextAuth configuration
- Account conflict handling

### 2. **xp-system-protection.md**
- XP award amounts (50, 300, 350)
- Level calculation logic
- Duplicate prevention
- Frontend/backend reconciliation

### 3. **onboarding-flow-protection.md**
- 3-step onboarding process
- Auto-signin after verification
- OAuth conflict detection
- XP display consistency

### 4. **database-protection.md**
- Database functions (`award_xp`, `create_verification_token`, `verify_token`)
- Table structures (`users`, `xp_transactions`, `verification_tokens`)
- Schema constraints and relationships

## 🚨 Critical Systems Status

### ✅ **WORKING CORRECTLY - DO NOT MODIFY:**
- **Email Signup**: Register → Verify → Auto-signin → Onboarding → 350 XP
- **OAuth Signup**: Google → Auto-signin → Onboarding → 350 XP
- **XP System**: 50 verification + 300 onboarding = 350 XP total
- **OAuth Conflicts**: Helpful error messages and resolution
- **Password Reset**: Complete flow working
- **Database Functions**: All XP and verification functions working

## ⚠️ Modification Guidelines

### **Before Making Changes:**
1. **READ** the relevant protection rule file
2. **EXPLAIN** why the change is necessary
3. **GET EXPLICIT PERMISSION** from the user
4. **TEST THOROUGHLY** in development
5. **VERIFY** all systems still work

### **Safe Changes:**
- UI text and styling
- Animation timing
- Loading states
- Error message content
- Visual elements

### **Requires Permission:**
- XP amounts or calculations
- Authentication flow changes
- Database schema modifications
- API endpoint changes
- Onboarding logic changes

## 🧪 Testing Checklist

Before any changes to protected systems:
- [ ] Email signup flow works end-to-end
- [ ] OAuth signup flow works end-to-end
- [ ] OAuth conflict detection works
- [ ] XP amounts are consistent (350 total)
- [ ] Auto-signin after verification works
- [ ] Password reset flow works
- [ ] All database functions work

## 🎯 Key Principles

1. **Working Systems**: Don't fix what isn't broken
2. **Explicit Permission**: Always ask before changing critical systems
3. **Thorough Testing**: Test complete flows, not just individual components
4. **Consistency**: Maintain XP and authentication consistency
5. **Documentation**: Update protection rules when making changes

## 📞 When to Use These Rules

- **Before modifying** authentication, onboarding, or XP systems
- **When adding** new features that might affect existing systems
- **During refactoring** that touches protected components
- **When debugging** issues in protected systems
- **Before deploying** changes to production

---
**Remember**: These systems are working correctly. Changes should be minimal, well-justified, and thoroughly tested.
