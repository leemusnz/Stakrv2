# Stakr — Board-Approved Engineering Recovery Plan

**Status: APPROVED WITH CONDITIONS** (Board resolution, 12 June 2026 — see `BOARD_MINUTES.md`)
**Capacity assumption:** 2 full-time engineers. **Timeline:** Phase 0 ≈ 1 wk → Phase 1 ≈ 6 wks (points-only v1 live ~week 7) → Phase 2 ≈ 8 wks (real money, gated).
**Evidence base:** `ENGINEERING_FINDINGS.md` (file:line for every claim) and `ENGINEERING_DISCUSSION.md`.

Execution order is binding (Chairman's directive): **Phase 0 → staging environment → ledger
atomicity + drift detection → CI discipline → Phase-1 features.** No Phase-2 code before the gate.

---

## PHASE 0 — STOP THE BLEEDING (week 1; both engineers; deploy freeze in effect)

Exit criterion: written close-out report signed by both engineers, answering board questions 1–5,
delivered to the board before end of week 2 (Condition 1).

| # | Ticket | Files | Acceptance criteria |
|---|--------|-------|---------------------|
| P0-1 | Delete dev backdoor | `app/api/dev-bypass/route.ts` | Route removed; no references remain |
| P0-2 | Delete self-grant admin + DDL endpoints | `app/api/grant-dev-access/route.ts`, `app/api/admin/add-team-column/route.ts` | Routes removed; admin DDL only via `migrations/` |
| P0-3 | `assertEnv()` boot guard; kill all fallback secrets | `lib/nextauth-secret.ts:5-9`, `lib/encryption.ts:4-13`, `app/api/alpha-access/route.ts:4`, new `lib/assert-env.ts` | Prod boot throws if `NEXTAUTH_SECRET`/`ENCRYPTION_KEY` (and `STRIPE_WEBHOOK_SECRET` when cash enabled) unset; no string-literal fallbacks anywhere; gate cookies `httpOnly:true` |
| P0-4 | Stripe webhook: signature mandatory; no metadata trust | `app/api/payments/webhook/route.ts:23-27`, `lib/payments-service.ts:131-156` | Unsigned requests → 400 always; amounts reconciled against the stored pending `transactions` row, never event metadata |
| P0-5 | **Fix ledger SQL interpolation bug** | `app/api/challenges/[id]/join/route.ts:231-241`, `lib/reward-calculation.ts:420,516` | Message built in JS, passed as a single bound param; regression test proves a credits join writes participant + debit + ledger row atomically and a settlement INSERT succeeds |
| P0-6 | Unique index for Stripe idempotency | new migration | `CREATE UNIQUE INDEX ... ON transactions(stripe_payment_id)`; `ON CONFLICT` path exercised in a test |
| P0-7 | Restore build signal | `next.config.mjs:6,9`, `app/settings/page.tsx:278`, `app/verification-demo/page.tsx:69` | `ignoreBuildErrors`/`ignoreDuringBuilds` removed; `/settings` renders; tsc = 0 (61 errors fixed — incl. `CHALLENGE_JOIN` enum case in `app/api/integrations/sync`, `session.user.role`, Zod `.warnings` misuse); lint = 0 (one autofix PR + 2 import fixes) |
| P0-8 | Gate/delete demo & test routes | `middleware.ts` + the 11 routes (`/demo`, `/mobile-demo`, `/proof-demo`, `/verification-demo`, `/test-avatar`, `/test-dashboard`, `/test-verification-system`, `/theme-preview`, `/design-preview`, `/dev-tools`; `/alpha-gate` stays as the gate itself) | Routes 404 in production server-side (middleware), not client-side guards; full deletion manifest due at Phase-1 start (Condition 5) |
| P0-9 | Disable passwordless verification provider | `lib/auth.ts:290-335` | Provider removed or hard-gated behind `ALLOW_DEV_AUTH=true` (default absent) |
| P0-10 | CI on and blocking; reproducible deploys | `.github/workflows/tests.yml`, `package.json`, `vercel.json`, `.npmrc` | Push trigger restored; order install→type-check→lint→test(non-DB)→build; 57 `"latest"` deps pinned from lockfile; `installCommand: "npm ci"`; `prepare: husky` + pre-commit lint-staged; engines fixed to npm |
| P0-11 | Repo hygiene + CVE audit | root junk | `hell -NoProfile...` file, `lighthouse-*.json`, `PRIORITY-QUEUE.json`, `.eng-state.json` deleted; 13 status .md moved to `docs/archive/`; `.gitignore` patterns added; `npm audit` results in close-out (board Q3) |
| P0-12 | SQLi + admin-check triage | `app/api/admin/financial-monitor/route.ts:57+`, new `lib/require-admin.ts` | `timeRange` parsed to int and bound; `requireAdmin()` helper created and applied to all `app/api/admin/*` routes (replaces the 3 inconsistent checks + `alex@stakr.app` backdoors); `image-proxy` requires a session (full per-key authz in Phase 2) |

---

## PHASE 1 — POINTS-ONLY V1 (weeks 2–7)

Board amendments incorporated: ledger atomicity + nightly drift check are **in Phase 1**
(Condition 4); reminders/auto-enroll are sequenced **after** the loop is verified end-to-end in
staging and are first-cut on slip (R5 as amended); money UI is **removed server-side** (R2/R3).

**Week 1 of Phase 1 — foundations (Conditions 3, 4):**
- Staging environment: isolated Neon branch, synthetic seeded ledger, `npm ci` pinned lockfile, gating PRs (CTO condition).
- `withTransaction()`: move money/points writes to `neon.transaction()` / Pool sessions — join debit+ledger, settlement distribution (`lib/db/index.ts`, `lib/reward-calculation.ts:389-586`). Concurrent-write test in staging.
- Jest Neon mock layer (fix the 40 failing tests or quarantine explicitly); coverage ratchet at 20%.
- DB-backed rate limiter applied to signin/register/checkins (in-memory limiter is ineffective on serverless).

**Weeks 2–3 — the severed loop:**
- `evaluateParticipantCompletion(challengeId)`: on proof approval (checkins POST + `app/api/admin/verifications` PATCH), upsert daily progress; at challenge end mark `completed`/`failed` from approved-days ≥ threshold. (The only current writer is the appeals route — `app/api/admin/appeals/route.ts:388-396`.)
- `settleExpiredChallenges()` + Vercel cron (`vercel.json` crons → `/api/cron/lifecycle`, `CRON_SECRET`-protected): `pending→active→ended→settled`, calling the existing distribution math idempotently with row locking.
- Real check-in history: replace mock GET (`app/api/challenges/[id]/checkins/route.ts:316-357`) with `proof_submissions` query; make POST persistence mandatory (remove swallow-catch at `:238` and `Math.random` scores at `:163-168`).
- `upload/confirm` persists the S3 key to `proof_submissions` (currently a TODO stub).
- `email_verified` type fix (boolean column or `_at` timestamp; align `verify-email` + `lib/auth.ts:449`).

**Weeks 3–4 — proof UX + verification policy:**
- `ProofSubmissionSheet`: mount the existing real `components/proof-submission.tsx` from `/my-active`, `/my-challenges`, and challenge detail (replacing console.log stubs at `my-active:497`, `my-challenges:380,783,1132`); fix `camera_only` disabled-input dead-end (`proof-submission.tsx:405,458`) and the duplicate video tab block.
- Fail-closed verification: no OpenAI key → human queue (never auto-approve; replaces `enhanced-ai-verification.ts:356-371` fail-open and the hardcoded `ai-anti-cheat` layer scores); auto-approve rule as an auditable config value (≤50 points AND in-window timestamp AND no fraud flag — R4 as amended); `pending_review` status chip + "typically within 24 business hours" copy + notification on resolution; queue-depth metric, alert at >50 pending and >10%/hr growth, business-hours SLA with auto-escalation at hour 8.
- **WEEK-4 MILESTONE (Condition 8): 50-user concierge alpha completes a live challenge loop end-to-end.** Fallback if rollup work slips: admin manual settlement via the (already working) appeals path, founder-operated.

**Weeks 4–5 — honest money UI + ledger discipline:**
- Wallet route → non-interactive "Cash stakes coming soon" + waitlist email capture (feeds the R6 willingness-to-pay metric). Points balance/history in its own surface. Removes: fake deposit (`app/wallet/page.tsx:307-315`), mock balances merged into responses (`:179,:201,:241`), fake payment methods (`:809`), `alert()` withdraw. `ENABLE_CASH_PAYMENTS=false` enforced server-side (join CASH path → 403; withdraw behind the same flag).
- Server-derived `ChallengeStats` (real pot from stakes, real completion rate) replacing fabricated values (`app/challenge/[id]/page.tsx:223-246`); real `ParticipantsPanel`/activity wired to existing endpoints, replacing the hardcoded community (`components/challenge-community-tabs.tsx:57-170`).
- Nightly points-ledger drift job (Condition 4): assert `users.credits == Σ credit_transactions` per user; alert on mismatch; one-time audit of pre-fix state with founder-signed write-off (board Q4/Q8).
- Withdraw double-count fix recorded for Phase 2 (the route is behind the cash flag in v1): drop the locked-stakes subtraction since the join already debits credits (`withdraw/route.ts:210-231` vs `join/route.ts:221`).

**Weeks 5–6 — sequenced usability + polish (first-cut on slip):**
- Discover search + sort (may start in parallel from week 2 — R5 amendment); wire desktop filters into `ChallengeGrid` (`app/discover/page.tsx:26-29`).
- Daily reminder notifications (cron + existing `lib/notification-service.ts`); starter challenge auto-enroll at onboarding completion.
- Streak calculation from real check-in rows (`lib/xp-reward-calculation.ts:99`); dead-CTA sweep (settings real saves or removal; "View My Progress" wiring; suspended-page link; CSV quoting fix; onboarding error feedback).
- Cut-list deletions land with the signed manifest (Condition 5): brands/creators pages+grids shelved (server-side removal), invite-flow fiction removed or rebuilt minimal, random check-ins + timer sessions removed, anti-cheat layers 3–5 deleted, team/insurance create options hidden, ~30 `if(false)` blocks and duplicate mock/demo libs removed, dual dashboard APIs consolidated.
- E2E: wire `auth.setup.ts` into Playwright config; smoke test of the full points loop in staging (CTO launch gate).

**Phase-1 launch gates (beyond code):** ops runbook with named queue owner (Condition 6, founder);
staffing budget line + rejection-rate model (Condition 7, founder); board acceptance of Phase-0
close-out (Condition 1); no launch-date comms until freeze lifted (Condition 12).

---

## PHASE 2 — REAL MONEY (weeks 8–15; **gated, do not start**)

Opens only on the consolidated gate (BOARD_MINUTES §c): 28-day cohort ≥200 completers, D14
retention ≥40%, completion ≥55%, re-engagement ≥30%, waitlist CTA ≥30%, disputes <5%, zero ledger
errors in 14 days — plus paid security re-review, written legal opinion (Condition 9), Stripe
Connect standing in writing (Condition 10), ledger integrity proof (Condition 11), and a board vote.

Scope: Stripe Connect onboarding (`accounts.create` + accountLinks + the missing
`/settings/payments/connect-stripe` page + `account.updated` webhook); deposit checkout → credit
top-up on webhook; full webhook event coverage (`charge.refunded`, `payment_intent.payment_failed`,
`transfer.failed`) with ledger reversals; unify CASH/credits join (kill the unauthenticated
server-to-self fetch at `join/route.ts:148-160`); `reconcileLedger()` nightly vs Stripe balance;
platform-revenue recording on cash joins; withdraw double-count fix verified; image-proxy per-key
authorization + presigned upload Content-Type/size constraints + post-upload content scan;
CSP/security headers middleware; Redis rate limiting on all sensitive endpoints. Structural
options from Investor B to evaluate with counsel **before** building: fee on net winnings only;
custody off balance sheet (Connect direct charges/escrow); no-purchase-entry path; NZ-first
geo-blocked launch.

---

## ENGINEERING'S ANSWERS TO THE BOARD'S QUESTIONS

**Q1 — Why was webhook verification missing; what else receives unverified payloads?**
Root cause: the v0.dev scaffold pattern "work without env vars configured" (graceful fallbacks)
was never hardened — the same pattern produced the JWT fallback secret, default AES key, and
default alpha password. Inventory of inbound surfaces: Stripe webhook (fixed P0-4); OAuth
integration callbacks do real state-validated token exchange (`lib/oauth-state.ts`) — acceptable;
`image-proxy` had no auth (session check P0-12, per-key authz Phase 2); `dev-bypass`/
`grant-dev-access` (deleted P0-1/2); alpha-access default password (P0-3). Full list re-verified
in the close-out report (Condition 2).

**Q2 — Neon driver replacement?** Same package (`@neondatabase/serverless`), two supported paths:
`neon.transaction([...])` for batched atomic statements, or the WebSocket `Pool` for interactive
transactions; drizzle-orm (already a dependency) supports the Pool. No new vendor. Validation:
staging Neon branch with migration replay + a concurrent join/settle write test (Phase 1, week 1).

**Q3 — CVE audit?** Scheduled in P0-11 (`npm audit` against the pinned lockfile); note the
existing `overrides` block (preact/cookie/esbuild/@smithy) indicates previously patched
advisories — pinning makes those patches durable instead of silently expiring. Numbers go in the
close-out report.

**Q4 — Ledger bug: patch or migration?** A pure code defect (interpolation inside a quoted SQL
literal in a tagged template). The fix is a code patch — no schema migration, no risk to existing
rows. Historical impact: every credits join since the bug shipped debited `users.credits` without
writing the ledger row; remediation is an audit script comparing `users.credits` to
`Σ credit_transactions` per user. Because the app is pre-launch (alpha-gated), affected balances
are limited to test accounts; recommendation is re-derive or reset alpha balances with a
founder-signed write-off (Condition 4). Pre-fix balances should be treated as unreliable until
that audit runs — written assertion to that effect will be in the close-out report (CFO).

**Q5 — Cron failure runbook?** `/api/cron/lifecycle` protected by `CRON_SECRET`; failures surface
through Sentry (already integrated) with alert routing to email/Slack; the nightly drift job
doubles as the watchdog by flagging "challenges past `end_date` not settled" as an invariant
violation, so a silently dead cron is caught within 24h. Runbook doc ships with Phase 1; the two
engineers rotate weekly notification duty until an ops hire exists. (Honest caveat: with no
on-call rotation, overnight failures are next-business-day — consistent with the business-hours
SLA the board set.)

**Q6 — Queue volume/staffing?** With the ≤50-point auto-approve rule covering the long tail
(engineering estimate: 70–80% of submissions in a points-only alpha), human reviews ≈ 100–150/mo
at 500 completions/mo — roughly 1–2 founder-hours/day at week-4 alpha scale; at 2,000/mo a
part-time contractor; at 10,000/mo a dedicated moderator + AI assist. **OPEN — founder decision
required:** named queue owner, hours, and budget line (Conditions 6–7).

**Q7 — Fail-closed semantics when the queue is unavailable?** A submission enters
`pending_review` with its timestamp recorded at submission (not approval), so on-time compliance
is preserved regardless of review latency; the participant's settlement defers until resolution;
**stakes never auto-forfeit while pending**; business-hours auto-escalation at hour 8; the state
is a normal DB status — recoverable without manual intervention. Challenges are not frozen,
stakes are not refunded, users are not blocked.

**Q8 — Partial-payout records from alpha testing?** Pre-launch, so the blast radius is test data:
the Q4 audit script identifies them; alpha balances re-derived from the transaction log where
possible, otherwise reset with notice; staging gets a clean synthetic ledger (Condition 3).

**Q9 — AI verification cost?** Order-of-magnitude engineering estimate (to be confirmed against
current provider pricing before Phase 2): single-image vision verification runs at fractions of a
cent per call, so 500/2,000/10,000 completions/mo ≈ single-digit to low-tens of USD monthly —
immaterial next to human review labor at any volume. The crossover therefore favors AI-assist
wherever it's reliable; but per R4, AI is assist-only and the human queue remains the authority.
Recommended model: auto-approve rule → AI pre-screen (when key present) → human queue for the
remainder.

**Q10 — Named counsel?** **OPEN — founder decision required.** Scope is fixed by Condition 9
(Investor B's five-point list). Engineering input: multi-state written opinions typically take
4–8 weeks, so engagement should begin during Phase 1 to avoid gating Phase 2 on legal lead time.

## OPEN ITEMS REQUIRING FOUNDER INPUT
1. Queue owner, staffing hours, and budget line (Conditions 6–7) — before Phase-1 launch.
2. Payments-and-gaming counsel selection + engagement (Condition 9) — start during Phase 1.
3. Stripe account standing / Connect eligibility confirmation in writing (Condition 10).
4. Waitlist size and points-vs-cash motivation data (CEO Q2) — informs Phase-2 urgency.
5. Sign-off on the alpha ledger write-off after the audit script runs (Condition 4 / CFO).

## WORKING AGREEMENTS (R7 — in force from Phase 0)
Blocking CI on push: install → type-check (0 errors) → lint (0 errors) → test → build; coverage
ratchet starting at 20%, fail on regression; pinned dependencies + Renovate; `npm ci` everywhere
including Vercel; husky + lint-staged pre-commit; no feature PR merges while CI is red; staging
gate for anything touching the ledger.
