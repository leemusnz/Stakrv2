# Financial System Quick Reference

## 🔥 Quick Links

### User Features
- **Wallet:** `/wallet` - View balance, withdraw funds
- **Notifications:** `/notifications` - See financial alerts
- **Challenges:** `/my-challenges` - Track earnings

### Admin Features
- **Financial Monitor:** `/admin/financial-monitor` - Oversight dashboard
- **Revenue Stats:** `/api/admin/revenue-stats` - Revenue breakdown

---

## 💰 Money Flow Diagram

```
USER JOINS CHALLENGE
├─ Stake: $50
├─ Entry Fee (5%): $2.50
└─ Insurance (optional): $1.00
   Total Deducted: $53.50

CHALLENGE ENDS
├─ User Completes
│  ├─ Gets stake back: $50
│  ├─ Gets share of failed stakes: $X
│  └─ Notification sent ✉️
│
└─ User Fails
   ├─ WITH Insurance → Refund $50 ✅
   │  └─ Platform keeps $1 insurance fee
   │
   └─ WITHOUT Insurance → Lose $50 ❌
      ├─ Platform gets 20%: $10
      └─ Winners share 80%: $40

USER WITHDRAWS
├─ Minimum: $10
├─ Available: Balance - Locked Stakes
├─ Fee (3%): Calculated automatically
├─ Rate Limits: 3 withdrawals/day, $1000/day
├─ Fraud Check: Trust score, account age
└─ Notification sent ✉️
```

---

## 📊 Revenue Breakdown

### Platform Earns From:
1. **Entry Fees** - 5% of every stake
2. **Failed Stakes** - 20% of failed stakes  
3. **Insurance Fees** - $1 per insured participant (minus payouts)
4. **Cashout Fees** - 3% of withdrawals
5. **Premium Subscriptions** - $9.99/month

### Example: 100-Person Challenge
```
Participants: 100
Average Stake: $50
Total Stakes: $5,000

Entry Fees: $5,000 × 5% = $250 ✅

Challenge Ends: 70 complete, 30 fail
Failed Stakes: $1,500

Platform Revenue from Failed:
- Platform Cut: $1,500 × 20% = $300 ✅
- Winners Share: $1,500 × 80% = $1,200

Insurance (20 purchased @ $1):
- Fees Collected: $20 ✅
- Payouts (if 6 failed): $300 ❌
- Net: -$280 (loss this time)

Total Platform Revenue: $250 + $300 + $20 = $570
```

---

## 🔒 Security Rules

### Withdrawal Limits
```typescript
MIN_WITHDRAWAL = $10
DAILY_LIMIT = $1,000
MAX_PER_DAY = 3 withdrawals
```

### Fraud Flags 🚨
| Condition | Action |
|-----------|--------|
| Account < 7 days + withdrawal > $100 | Flag |
| Trust score < 30 + withdrawal > $50 | Flag |
| 2+ false claims + withdrawal > $50 | Flag |
| 0 challenges completed + withdrawal > $50 | Flag |
| **2+ flags total** | **BLOCK - Manual Review** |
| 1 flag | Allow but log |

---

## 🛡️ Insurance Logic

### When Purchased
```
Cost: $1 (non-refundable)
Protection: Full stake amount
```

### If User Fails
```
WITH Insurance:
✅ Stake refunded
❌ Insurance fee kept by platform
📧 Notification sent

WITHOUT Insurance:
❌ Stake lost
💰 20% to platform, 80% to winners
```

### Platform P&L
```
Insurance Profitable When:
Claim Rate < 100%

Example:
100 insured @ $1 = $100 revenue
30 fail × $50 avg = $1,500 payouts
Net: -$1,400 (unprofitable)

Break-even: ~2% claim rate for $50 stakes
```

---

## 📧 Notifications

### Auto-Sent When:
1. **Withdrawal Processed**
   - Email + In-app
   - Shows amount, fee, new balance
   - Delivery: 3-5 business days

2. **Insurance Payout**
   - Email + In-app  
   - Shows refunded amount, challenge
   - Encourages trying again

3. **Reward Earned**
   - Email + In-app
   - Shows breakdown (stake + bonus + host)
   - Links to wallet and new challenges

---

## 🎛️ Admin Dashboard Metrics

### Real-Time Monitoring
```
Revenue Summary
├─ Entry Fees: $X
├─ Failed Stakes: $Y (should be ~20% of failed)
├─ Insurance: $Z (fees - payouts)
├─ Cashout Fees: $A
└─ Total: $X+Y+Z+A

Insurance Performance
├─ Total Insured: N participants
├─ Claims Filed: M claims
├─ Claim Rate: M/N %
├─ Revenue: $fees
├─ Payouts: $paid
└─ Net Profit: $fees - $paid (aim for positive)

Risk Indicators
├─ Large Transactions (>$100)
├─ Suspicious Flags: Count
├─ Low Trust Withdrawals: Count
└─ Active Stakes at Risk: $X
```

---

## 🔧 Common Admin Tasks

### Review Flagged Withdrawal
```sql
-- Find flagged activity
SELECT * FROM suspicious_activities 
WHERE activity_type = 'suspicious_withdrawal'
AND status = 'pending'
ORDER BY created_at DESC;

-- Check user details
SELECT u.*, 
  COUNT(cp.id) as challenges_completed,
  SUM(CASE WHEN ct.transaction_type = 'withdrawal' THEN 1 ELSE 0 END) as total_withdrawals
FROM users u
LEFT JOIN challenge_participants cp ON u.id = cp.user_id AND cp.completion_status = 'completed'
LEFT JOIN credit_transactions ct ON u.id = ct.user_id
WHERE u.id = 'USER_ID'
GROUP BY u.id;

-- Approve manually if legitimate
UPDATE suspicious_activities 
SET status = 'false_positive', reviewed_at = NOW()
WHERE id = 'ACTIVITY_ID';
```

### Check Revenue Accuracy
```sql
-- Verify platform revenue matches distributed rewards
SELECT 
  c.id,
  c.title,
  SUM(cp.entry_fee_paid) as collected_entry_fees,
  SUM(CASE WHEN cp.completion_status = 'failed' THEN cp.stake_amount ELSE 0 END) * 0.2 as expected_failed_cut,
  (SELECT SUM(amount) FROM platform_revenue WHERE challenge_id = c.id AND revenue_type = 'entry_fee') as recorded_entry,
  (SELECT SUM(amount) FROM platform_revenue WHERE challenge_id = c.id AND revenue_type = 'failed_stakes') as recorded_failed
FROM challenges c
JOIN challenge_participants cp ON c.id = cp.challenge_id
WHERE c.status = 'rewards_distributed'
GROUP BY c.id, c.title;
```

---

## 🐛 Troubleshooting

### User Can't Withdraw
**Check:**
1. Available balance > withdrawal + fee?
2. Amount >= $10?
3. Under 3 withdrawals today?
4. Under $1,000 withdrawn today?
5. Trust score >= 20 (for large amounts)?
6. Account age >= 7 days (for >$100)?

**Fix:** Adjust limits or manually approve

---

### Insurance Not Paying Out
**Check:**
1. User actually purchased insurance? (insurance_purchased = true)
2. User failed challenge? (completion_status = 'failed')
3. Challenge completed? (status = 'rewards_distributed')
4. Check credit_transactions for insurance_payout

**Debug:**
```sql
SELECT 
  cp.id,
  u.name,
  cp.stake_amount,
  cp.insurance_purchased,
  cp.insurance_fee_paid,
  cp.completion_status,
  c.status as challenge_status
FROM challenge_participants cp
JOIN users u ON cp.user_id = u.id
JOIN challenges c ON cp.challenge_id = c.id
WHERE cp.insurance_purchased = true
AND cp.completion_status = 'failed'
AND c.id = 'CHALLENGE_ID';
```

---

### Revenue Doesn't Match Expected
**Check:**
1. Challenge completed? (status = 'rewards_distributed')
2. Sum of entry fees = participant count × stake × 5%?
3. Failed stakes cut = failed participant stakes × 20%?
4. Insurance revenue = insurance fees - payouts?

**Verify:**
```sql
-- Full challenge financial breakdown
SELECT 
  c.id,
  c.title,
  COUNT(cp.id) as total_participants,
  COUNT(CASE WHEN cp.completion_status = 'completed' THEN 1 END) as completers,
  COUNT(CASE WHEN cp.completion_status = 'failed' THEN 1 END) as failures,
  SUM(cp.stake_amount) as total_stakes,
  SUM(cp.entry_fee_paid) as entry_fees_collected,
  SUM(CASE WHEN cp.completion_status = 'failed' THEN cp.stake_amount ELSE 0 END) as failed_stakes,
  SUM(CASE WHEN cp.completion_status = 'failed' THEN cp.stake_amount ELSE 0 END) * 0.2 as platform_cut_expected,
  SUM(cp.reward_earned) as rewards_paid,
  (SELECT SUM(amount) FROM platform_revenue WHERE challenge_id = c.id) as platform_revenue_recorded
FROM challenges c
JOIN challenge_participants cp ON c.id = cp.challenge_id
WHERE c.id = 'CHALLENGE_ID'
GROUP BY c.id, c.title;
```

---

## 📱 Quick Commands

```bash
# Run withdrawal tests
npm run test tests/e2e/cash/withdrawal.spec.ts

# Run insurance tests  
npm run test tests/e2e/cash/settlement.spec.ts

# Check financial monitor
curl http://localhost:3000/api/admin/financial-monitor?timeRange=7

# Check user balance
curl http://localhost:3000/api/user/credits
```

---

## 🎯 Health Check Indicators

### Green 🟢
- Insurance net profit > 0
- Claim rate < 50%
- Revenue matches expected (±5%)
- Withdrawal success rate > 95%
- No suspicious activity spikes

### Yellow 🟡
- Insurance break-even (±10%)
- Claim rate 50-70%
- Revenue variance 5-10%
- Withdrawal success rate 90-95%
- Moderate suspicious flags (<5/day)

### Red 🔴
- Insurance losing money
- Claim rate > 70%
- Revenue variance > 10%
- Withdrawal success rate < 90%
- High suspicious activity (>10/day)
- Multiple blocked withdrawals

---

**Last Updated:** December 3, 2025  
**Version:** 2.0

