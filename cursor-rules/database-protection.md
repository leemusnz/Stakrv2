# Database Protection Rules

## 🗄️ CRITICAL: Database Schema Protection

### **WORKING DATABASE FUNCTIONS - DO NOT MODIFY:**
These database functions are working correctly and should NOT be changed:

#### **1. XP System Functions:**
- `award_xp(user_id, amount, source, challenge_id, description)` 
- **Purpose**: Awards XP and prevents duplicates
- **Status**: ✅ WORKING - DO NOT MODIFY

#### **2. Verification Token Functions:**
- `create_verification_token(email, token, type, hours_valid)`
- `verify_token(token, type)`
- **Purpose**: Email verification system
- **Status**: ✅ WORKING - DO NOT MODIFY

#### **3. Database Tables:**
- `users` table structure (XP, level, onboarding fields)
- `xp_transactions` table structure
- `verification_tokens` table structure
- **Status**: ✅ WORKING - DO NOT MODIFY

### **PROTECTED SCHEMA ELEMENTS:**

#### **Users Table:**
```sql
- id (UUID, PRIMARY KEY)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR, NULL for OAuth)
- name (VARCHAR)
- xp (INTEGER, DEFAULT 0)
- level (INTEGER, DEFAULT 1)
- onboarding_completed (BOOLEAN, DEFAULT FALSE)
- email_verified (BOOLEAN, DEFAULT FALSE)
- email_verified_at (TIMESTAMP)
```

#### **XP Transactions Table:**
```sql
- id (UUID, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY)
- amount (INTEGER)
- source (VARCHAR)
- challenge_id (UUID, NULL)
- description (TEXT)
- created_at (TIMESTAMP)
```

#### **Verification Tokens Table:**
```sql
- token (VARCHAR, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY)
- email (VARCHAR)
- type (VARCHAR) -- 'email_verification'
- expires_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

## 🚫 FORBIDDEN DATABASE CHANGES:

### **NEVER MODIFY:**
- Function signatures
- Table structures
- Column types
- Constraint definitions
- Index definitions
- XP calculation logic

### **NEVER ADD:**
- New XP sources
- Complex XP calculations
- Additional verification types
- New onboarding steps
- Variable XP amounts

## ⚠️ MODIFICATION GUIDELINES:

### **Before Changing Database:**
1. **EXPLAIN** why change is necessary
2. **GET EXPLICIT PERMISSION** from user
3. **CREATE MIGRATION** scripts
4. **TEST THOROUGHLY** in development
5. **VERIFY** all systems still work

### **Safe Database Changes:**
- Adding new columns (non-breaking)
- Adding new tables (unrelated)
- Adding indexes (performance)
- Adding comments/documentation

### **Requires Permission:**
- Function modifications
- Table structure changes
- Constraint changes
- XP system changes
- Verification system changes

## 🛡️ DATABASE PROTECTION:

### **Function Protection:**
- `award_xp()` - XP awarding and duplicate prevention
- `create_verification_token()` - Token creation
- `verify_token()` - Token verification
- **Status**: ✅ WORKING - DO NOT MODIFY

### **Table Protection:**
- `users` - User data and XP
- `xp_transactions` - XP history
- `verification_tokens` - Email verification
- **Status**: ✅ WORKING - DO NOT MODIFY

### **Constraint Protection:**
- Unique constraints
- Foreign key relationships
- Check constraints
- **Status**: ✅ WORKING - DO NOT MODIFY

## 📋 DATABASE TESTING CHECKLIST:
Before any database changes:
- [ ] XP awarding works correctly
- [ ] Duplicate XP prevention works
- [ ] Email verification works
- [ ] OAuth signup works
- [ ] Onboarding completion works
- [ ] All constraints are maintained

## 🎯 DATABASE CONSISTENCY RULES:

1. **XP Integrity**: All XP awards tracked
2. **No Duplicates**: `award_xp()` prevents duplicates
3. **Verification**: Tokens expire and are single-use
4. **Relationships**: Foreign keys maintained
5. **Constraints**: Data integrity preserved

## 🚨 CRITICAL WARNINGS:

### **DO NOT:**
- Modify function signatures
- Change table structures
- Alter XP calculation logic
- Break foreign key relationships
- Remove constraints
- Change column types

### **ALWAYS:**
- Test all functions
- Verify constraints
- Check relationships
- Maintain data integrity
- Use migrations for changes

---
**Remember**: Database schema is working perfectly. Changes should be minimal and well-justified.
