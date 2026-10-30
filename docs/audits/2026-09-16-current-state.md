# Follow-up

The lifecycle, evidence, settlement, admin and MVP screen changes are now implemented in follow-up draft PR #10. See [the lifecycle implementation and release gates](2026-09-16-mvp-lifecycle.md). The original first-slice findings below are retained as historical context.

# Stakr current state and first repair slice

Reviewed 16 September 2026 against `main` at `23226c3bf1fecba992a3b2e02ce8675280f5fd65`.

## Assessment

Stakr has a substantial interface and API scaffold, but the dependable
join → submit proof → review → complete/expire → settle loop is unfinished.
It is not ready for unattended challenges or real-money use on the code evidence.
This is a repository audit, not a verification of the deployed database or app.

The supplied September 2025 snapshot predates the merged June 2026 security
recovery work. The three named source-of-truth documents are not present at the
expected `docs/` paths on this commit; supplied copies were read as requirements.
Current code and `docs/audits/2026-06-engineering-review/APPROVED_PLAN.md` informed
the implementation order. Archived documents were not used for live decisions.
The June plan explicitly puts ledger atomicity before lifecycle automation.

## Confirmed findings

| Priority | Area                       | Evidence and consequence                                                                                                                                                                                                                  | Status in this slice                                                                                   |
| -------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Critical | Join consistency           | `app/api/challenges/[id]/join/route.ts` previously inserted a participant, debited credits and wrote ledger rows as separate HTTP queries. Later failures could leave partial state.                                                      | Replaced with `lib/challenge-join.ts` and an interactive transaction.                                  |
| Critical | Free-entry loophole        | Client `pointsOnly` skipped credit debit even when the challenge required stakes.                                                                                                                                                         | Server checks the mode against `allow_points_only`; no mixed-mode participation.                       |
| High     | Join timing and races      | No start-time check; capacity and duplicate checks were outside a transaction.                                                                                                                                                            | Challenge/user row locks, database-clock deadline checks and a unique participant index.               |
| High     | Invalid financial modes    | Broken server-to-self cash checkout, catch-and-ignore payment metadata, unconditional insurance purchase and incomplete teams/referrals.                                                                                                  | Join endpoint rejects these modes. This does not globally disable other payment endpoints.             |
| Critical | Settlement atomicity       | `lib/reward-calculation.ts` and `lib/xp-reward-calculation.ts` issue separate `BEGIN`/`COMMIT` HTTP queries. The cash path calculates before locking, catches settlement-record failures and checks idempotency without a lock.           | Unchanged. Reuse the new transaction primitive in the settlement slice.                                |
| Critical | Settlement fairness        | `lib/reward-calculation.ts` uses floating point, equal-splits returned stakes, throws when no participants completed and refunds all insured failures without policy adjudication.                                                        | Unchanged. Needs deterministic integer splits, original-stake return and explicit no-winner treatment. |
| Critical | Early settlement           | `app/api/challenges/[id]/settle/route.ts` permits the host to invoke distribution without checking the end/grace window. `complete/route.ts` reads `end_date` but does not enforce it.                                                    | Unchanged. Central lifecycle eligibility must guard both entry points.                                 |
| High     | Missing lifecycle          | No lifecycle worker or cron in `vercel.json`; proof decisions do not roll up approved days or enqueue completion processing. See `app/api/admin/verifications/route.ts`.                                                                  | Unchanged. Detection follows the ledger foundation.                                                    |
| High     | Proof persistence/history  | `app/api/challenges/[id]/checkins/route.ts` catches failed inserts and still returns success, returns mock GET history and generates random quality scores. `app/api/upload/confirm/route.ts` returns a temporary ID without persistence. | Unchanged. Must fix before relying on proof rollups.                                                   |
| High     | Fail-open verification     | `lib/enhanced-ai-verification.ts` manual fallback sets `approved: true` while saying human review is needed.                                                                                                                              | Unchanged. Queue for review rather than treating unavailable verification as a pass.                   |
| High     | Challenge administration   | No challenge suspend/resume/cancel policy service found in inspected API routes. Existing user suspension and session pause are different operations.                                                                                     | Unchanged. Timer freeze, refund presets and audit are required.                                        |
| Medium   | Tests overstate confidence | Baseline: 141 passing, 29 quarantined. Several API tests assert fabricated fetch responses. Original join tests prove SQL calls were issued, not atomicity.                                                                               | Added real PostgreSQL acceptance job plus focused service/transaction/amount tests.                    |

Seven older PRs remain open (#1–#7), including overlapping dashboard UUID fixes,
notifications and check-in identity fixes. Their metadata was inventoried; they
were not blindly merged or treated as current code.

## What this slice changes

- One request-scoped Neon Pool client owns each join transaction. UTC, bounded
  lock/statement timeouts and cleanup are explicit. Runtime minimum is Node 22,
  matching CI and supplying the WebSocket implementation used by Neon.
- Lock the challenge before checking capacity/duplicates; lock the user before
  checking balance. Credit amounts use integer hundredths, with fees rounded
  down. An explicit zero-percent override stays zero. Missing overrides use
  `STAKR_ENTRY_FEE_BPS` (default 500).
- Participant, balance debit, ledger and structured audit commit together.
  Duplicate attempts return 409 and never debit again. The unique index also
  guards other writers, though those other writers still need their own audit.
- A committed join remains successful if the reward estimate fails. Participant
  counts are numeric; PostgreSQL numeric-string balances are handled safely.
- A failed participation lookup returns an error instead of claiming the user
  has not joined. Removed unreachable demo join/status code from this route.

Behaviour changes are intentional: entry at/after `start_date` is refused even
if stored status is still `pending`; null/invalid schedules fail closed. Manual
start challenges therefore need a real scheduled window before joining. Teams,
insurance and referral preferences are refused until policy/settlement exists.
The creation UI still exposes some unsupported options and needs alignment in
the subsequent UX slice.

## Verification and rollout

Baseline unit run: 141 passed, 29 skipped. Repaired unit run: 179 passed,
29 existing quarantined tests plus 12 database tests skipped in unit-only mode.
Type-check, lint and production build passed; pre-existing lint warnings remain.
GitHub Actions run `35067848737` failed before either job started. The check-run
annotation says: "The job was not started because your account is locked due to
a billing issue." The 12 PostgreSQL acceptance tests therefore remain unrun.
Resolve the GitHub billing lock and rerun CI; no database or deployment success
is claimed.

`npm run test:db` uses `STAKR_TEST_DATABASE_URL` and a throwaway schema in a
dedicated database whose name ends `_test`. CI provisions PostgreSQL 16. Tests
exercise the actual join service and transaction wrapper with the PostgreSQL
wire driver: ledger/audit failure rollback, duplicate concurrent joins, last-slot
competition, cross-challenge overspending, closed states, start deadline and
fractional fee rounding. This is not a Neon transport test or full migration
replay against the deployed schema.

Before merge/deployment:

1. Use an isolated Neon staging branch with synthetic users and ledger.
2. Apply `migrations/2026-09-16_atomic-joins.sql` before deploying this route.
   Duplicate historical participation makes the index fail deliberately. Inspect
   discrepancies rather than deleting financial rows automatically.
3. Verify `npm ci`, type checking, lint, unit tests, PostgreSQL acceptance and build.
4. Run the concurrent join/rollback scenarios over the real Neon transport in
   staging; confirm Node 22+ and the deployed schema match the route projections.
5. Reconcile historical balances before treating existing alpha credits as reliable.
   This change does not repair historical balances or settlement records.

No production migration, balance reset, merge or deployment was performed.
The June recovery plan's staging gate remains relevant for ledger changes.

## Next slices and acceptance tests

| Slice                           | Required acceptance evidence                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Proof persistence and detection | Successful submission has a real persisted ID; failed persistence returns an error. Reviewer approval counts the correct user's distinct UTC days, never duplicate proofs. Completion meets the challenge threshold. Missing/rejected proof fails only after end plus grace. On-time proof pending human review cannot auto-forfeit. Reprocessing creates no duplicate transition/audit.                                                                          |
| Settlement                      | Lock challenge, verify lifecycle eligibility and settle all credits/ledger/revenue/audit in one transaction. Return each completer's own stake. Split failed stakes plus funded host contribution after the configured cut. No winners sends the pool to the platform. Example: 1001 cents failed pool, zero cut, three winners sorted by user ID receive bonuses 334/334/333. Repeat/concurrent runs pay once; injected ledger failure leaves no partial payout. |
| Suspension and cancellation     | Suspend blocks joins and lifecycle transitions while retaining escrow. Resume shifts deadlines by the actual paused duration. Cancellation applies each documented refund preset once with actor/reason/evidence. Neither cancelled nor suspended challenges settle. Cancellation racing settlement has one valid locked outcome.                                                                                                                                 |
| Honest UX                       | Real proof history, reviewer queue and participant statistics; disable unsupported creation/entry options. Show entry cost and conditional pool math before joining. No invented payout certainty or mock production balances.                                                                                                                                                                                                                                    |

Defer community, creators, insurance and cash expansion until this loop is proven.
