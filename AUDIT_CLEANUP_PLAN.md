# 🔧 Stakr Codebase Cleanup Plan

## **Audit Summary: 23 Critical Issues Found**

### **Priority Level 1: Demo User Dependencies (CRITICAL)**
Must remove all demo user checks and mock data fallbacks to ensure consistent real data flow.

#### **API Endpoints to Fix:**
1. `app/api/challenges/route.ts` - Remove mock challenge data for demo users
2. `app/api/user/challenges/route.ts` - Remove mock user challenges
3. `app/api/user/hosted-challenges/route.ts` - Remove mock hosted challenges  
4. `app/api/user/dev-mode/route.ts` - Remove mock dev mode responses
5. `app/api/user/appeals/route.ts` - Remove mock appeals
6. `app/api/posts/route.ts` - Remove demo post handling
7. `lib/auth.ts` - Remove demo user fallback system
8. `lib/demo-data.ts` - Remove or deprecate entire file

#### **Component Dependencies:**
- Remove all `isDemoUser()` imports and checks
- Remove all mock data imports from these endpoints
- Ensure all paths use real database queries

### **Priority Level 2: Unconnected Components (HIGH)**

#### **Components Using Mock Data:**
1. `components/social/friend-activity.tsx`
   - **Issue:** Uses `mockFriends` array instead of real data
   - **Solution:** Connect to social follows system via `/api/social/follow`
   - **API Needed:** `/api/social/friends` endpoint

2. `components/creator-grid.tsx`
   - **Issue:** Uses `mockCreators` array
   - **Solution:** Create `/api/creators` endpoint from real user data
   - **Data Source:** Users with `challenges_completed > 5` and high trust scores

3. `components/brand-grid.tsx`
   - **Issue:** Uses mock brand data
   - **Solution:** Create brand partnership system or remove component
   - **Decision:** Determine if brands are needed for MVP

4. `components/social/social-proof.tsx`
   - **Issue:** Hardcoded testimonials
   - **Solution:** Create testimonials system or remove
   - **Alternative:** Use real user achievements/quotes

#### **Missing API Endpoints:**
1. **`/api/user/notifications`**
   - **Used by:** `components/notifications/notification-provider.tsx`
   - **Status:** TODO comment exists
   - **Priority:** HIGH (notifications are core UX)

2. **`/api/creators`**
   - **Used by:** Creator discovery pages
   - **Implementation:** Query users with high challenge creation rates

3. **`/api/social/friends`**
   - **Used by:** Friend activity component
   - **Implementation:** Extend existing social follow system

### **Priority Level 3: System Cleanup (MEDIUM)**

#### **Mock Data Files:**
1. `lib/mock-data.ts` - Remove or convert to seed data only
2. `lib/api.ts` - Remove all `USE_MOCK_DATA` conditional code
3. `lib/config.ts` - Remove `enableMockData` flag

#### **Documentation Updates:**
1. Remove all demo user references from documentation
2. Update testing guides to use real data
3. Update deployment checklist

## **🛠 Implementation Steps**

### **Step 1: Remove Demo User System**
```bash
# Remove demo user dependencies
1. Remove isDemoUser checks from all API endpoints
2. Remove demo-data.ts imports  
3. Remove demo user fallback from auth.ts
4. Update all endpoints to use real database queries only
```

### **Step 2: Create Missing API Endpoints**
```bash
# Create notifications API
1. Create /api/user/notifications endpoint
2. Connect notification provider to real API
3. Implement notification triggers for user actions

# Create creators API  
1. Create /api/creators endpoint
2. Query users with high challenge creation activity
3. Connect creator-grid component

# Create friends API
1. Create /api/social/friends endpoint  
2. Connect friend-activity component
3. Use existing social follows data
```

### **Step 3: Component Cleanup**
```bash
# Convert mock components to real data
1. Update friend-activity.tsx to use real follows
2. Update creator-grid.tsx to use real creators
3. Decide on brand-grid.tsx (remove or implement)
4. Update social-proof.tsx with real testimonials or remove
```

### **Step 4: System Cleanup**
```bash
# Remove mock infrastructure
1. Remove or rename lib/mock-data.ts
2. Clean up lib/api.ts mock conditionals
3. Remove enableMockData config
4. Update documentation
```

## **🎯 Success Criteria**

### **Phase A Complete When:**
- ✅ Zero `isDemoUser()` calls in codebase
- ✅ Zero imports from `lib/demo-data.ts`
- ✅ All API endpoints return real database data
- ✅ No mock data conditionals in `lib/api.ts`

### **Phase B Complete When:**
- ✅ Notifications system connected to real API
- ✅ Creator grid shows real user data
- ✅ Friend activity uses real social follows
- ✅ All components connected to live APIs

### **Final Success:**
- ✅ `npm run build` succeeds with no mock data
- ✅ All pages work with real user accounts
- ✅ No placeholder/mock content visible to users
- ✅ Complete removal of demo/testing infrastructure

## **🚀 Execution Timeline**

| Phase | Priority | Estimated Time | Dependencies |
|-------|----------|---------------|-------------|
| **Phase A** | CRITICAL | 2-3 hours | Database access |
| **Phase B** | HIGH | 3-4 hours | Social system complete |
| **Phase C** | MEDIUM | 1-2 hours | Design decisions |

**Total Cleanup Time:** ~6-9 hours for complete production readiness

## **⚠️ Risks & Considerations**

### **Breaking Changes:**
- Removing demo users will break any existing demo workflows
- Need to ensure real user accounts exist for testing
- Some pages may show empty states until real data exists

### **Data Dependencies:**
- Friend activity requires users to actually follow each other
- Creator grid requires users with completed challenges
- Notifications require user activity to trigger

### **Testing Impact:**
- Need real user accounts for testing
- Demo scenarios will need real data setup
- Integration tests need database seeding

This cleanup will achieve **100% production readiness** with zero mock data dependencies. 