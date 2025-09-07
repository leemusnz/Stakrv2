# Stakr XP System Design

## Overview

The Stakr XP (Experience Points) system is designed to gamify the user experience and reward users for completing various activities. This document outlines how XP is awarded, calculated, and tracked to ensure fairness and prevent abuse.

## XP Award Structure

### Onboarding XP (300 XP Total)

Both OAuth and email users receive the same total XP for completing onboarding, ensuring fairness across authentication methods.

#### Email Users (Step-by-Step)
- **Welcome Step:** 50 XP
- **Goals Step:** 100 XP  
- **Auth Step:** 150 XP
- **Total:** 300 XP

#### OAuth Users (Full Completion)
- **Full Onboarding Completion:** 300 XP
- **Rationale:** OAuth users skip the first two steps but still complete the onboarding process, so they receive the equivalent XP

### XP Calculation Formula

```
Level = floor(XP / 200) + 1
```

**Examples:**
- 0-199 XP = Level 1
- 200-399 XP = Level 2
- 400-599 XP = Level 3
- 600-799 XP = Level 4
- 800-999 XP = Level 5
- 1000-1199 XP = Level 6
- 1200-1399 XP = Level 7

## Duplicate Prevention System

### Database-Level Protection

1. **XP Transactions Table:** Tracks all XP awards with source information
2. **Unique Constraints:** Prevents duplicate onboarding XP awards
3. **Safe XP Function:** `award_xp()` function with built-in duplicate prevention

### API-Level Protection

1. **Onboarding Completion Check:** Verifies user hasn't already completed onboarding
2. **Idempotent Operations:** Multiple calls to complete-profile won't award duplicate XP
3. **Comprehensive Logging:** Tracks all XP awards for audit purposes

## Implementation Details

### Frontend (Onboarding Page)

```typescript
// Both OAuth and email users get the same total XP
let xpToAward = 300 // Full onboarding completion XP

if (session?.user) {
  // OAuth users: Get full onboarding XP
  xpToAward = 300
  xpBreakdown = "Full onboarding completion (300 XP)"
} else {
  // Email users: Get accumulated XP from steps
  xpToAward = onboardingData.xp || 300
  xpBreakdown = `Step-by-step completion (${onboardingData.xp || 300} XP)`
}
```

### Backend (Complete Profile API)

```typescript
// Check if onboarding already completed
if (user.onboarding_completed) {
  return { message: 'Onboarding already completed - no XP awarded' }
}

// Use safe XP awarding function
const xpAwardResult = await sql`
  SELECT award_xp(
    ${userId}::UUID,
    ${300}::INTEGER,
    'onboarding'::VARCHAR(50),
    NULL::UUID,
    'Onboarding completion reward'::TEXT
  ) as success
`
```

### Database Functions

```sql
-- Safe XP awarding with duplicate prevention
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_source VARCHAR(50),
  p_source_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS BOOLEAN

-- XP transaction tracking
CREATE TABLE xp_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,
  source VARCHAR(50) NOT NULL,
  source_id UUID,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Fairness Principles

### 1. Equal Total XP
- Both OAuth and email users receive 300 XP for onboarding completion
- No advantage or disadvantage based on authentication method

### 2. Transparent Calculation
- Clear XP breakdown for each step
- Comprehensive logging of all XP awards
- Audit trail for all XP transactions

### 3. Duplicate Prevention
- Database-level constraints prevent duplicate awards
- API-level checks ensure idempotent operations
- Clear error messages when duplicates are attempted

## Future XP Sources

### Planned XP Awards
- **Challenge Completion:** Variable XP based on difficulty
- **Hosting Challenges:** Bonus XP for successful hosts
- **Achievements:** Special milestone rewards
- **Streak Bonuses:** Consecutive day completion rewards
- **Social Features:** Community engagement rewards

### XP Multipliers
- **Premium Users:** 1.5x XP multiplier
- **Trust Score Bonuses:** Higher trust = more XP
- **Seasonal Events:** Special XP multipliers during events

## Monitoring and Analytics

### XP Metrics
- Total XP awarded per user
- XP sources breakdown
- Level distribution across users
- Duplicate prevention effectiveness

### Audit Trail
- Complete XP transaction history
- Source tracking for all awards
- User progression analytics
- System performance monitoring

## Security Considerations

### Anti-Gaming Measures
- Duplicate prevention at multiple levels
- Rate limiting on XP-awarding endpoints
- Audit logging for all XP operations
- Database constraints prevent manual XP manipulation

### Data Integrity
- Atomic XP operations
- Transaction rollback on failures
- Consistent state management
- Backup and recovery procedures

## Testing Strategy

### Unit Tests
- XP calculation accuracy
- Duplicate prevention logic
- Level calculation verification
- Database function testing

### Integration Tests
- End-to-end onboarding flow
- OAuth vs email XP consistency
- API idempotency verification
- Database constraint testing

### Load Tests
- High-volume XP awarding
- Concurrent user onboarding
- Database performance under load
- System stability verification

---

**Last Updated:** January 15, 2025
**Version:** 1.0
**Status:** Implemented and Active
