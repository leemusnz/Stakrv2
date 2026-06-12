# Stakr — Engineering Review Findings (June 2026)

Five independent review agents audited the codebase in parallel (read-only), each with a distinct lens.
Their full reports follow, lightly formatted but otherwise as delivered. Claims carry file:line
references and were cross-checked in the discussion round (see `ENGINEERING_DISCUSSION.md`).

**Combined verdict:** the app cannot execute its core loop end-to-end today and is not safe to
launch with real users or real money. Roughly 55% of the product is genuinely database-wired;
the rest is mock UI, stubbed services, and fail-open verification — with five critical security
holes and a ledger-corrupting SQL bug on the money path.

---

## 1. SECURITY REVIEW

**VERDICT:** Not safe to run with real users or real money today. At least five trivially
exploitable paths to full admin/auth/money compromise. The withdrawal path itself is fairly well
hardened, but the auth/authorization foundation and webhook are not.

### CRITICAL (exploitable now)
1. **Privilege escalation — any user → admin.** `app/api/grant-dev-access/route.ts:6-28`: a POST with only a valid session sets `is_dev=true, has_dev_access=true` on the caller. Admin routes (e.g. `app/api/admin/users/route.ts:114-119`, `revenue-stats`, `financial-monitor`) authorize via a live `SELECT has_dev_access`, so this grants admin immediately. Fix: delete the endpoint or gate behind an existing-admin check.
2. **Forgeable JWTs via fallback secret.** `lib/nextauth-secret.ts:5-9` returns `"development-secret-change-in-production"` when `NEXTAUTH_SECRET`/`AUTH_SECRET` is unset. Anyone can mint a token with arbitrary `sub`/`isAdmin`. Fix: throw at boot if unset in production.
3. **Stripe webhook fail-open + amount tampering.** `app/api/payments/webhook/route.ts:23-27` accepts unsigned JSON when `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` are absent; `lib/payments-service.ts:131-156` trusts `metadata.userId/challengeId/stakeAmount` from the event. An attacker forges `checkout.session.completed` to join any challenge as any user, at any stake, without paying. Fix: require the webhook secret unconditionally; reconcile amounts against the stored pending `transactions` row.
4. **Dev backdoor reachable in production.** `app/api/dev-bypass/route.ts:5` guards with `NODE_ENV!=="development" && !process.env.VERCEL_URL?.includes("vercel.app")`. On Vercel, `VERCEL_URL` always ends in `vercel.app`, so the 403 never fires — any unauthenticated POST gets the `alpha_access` cookie. Cookie is also `httpOnly:false, secure:false`. Fix: delete the route.
5. **Encryption default key; prod warns only.** `lib/encryption.ts:4,10-13` uses `'dev-key-change-in-production-32char'` if `ENCRYPTION_KEY` is unset and only `console.warn`s in production. OAuth/integration tokens are AES-encrypted with a public, source-controlled key. Fix: throw in prod; rotate stored credentials.

### HIGH
1. **Passwordless "verification" credential provider.** `lib/auth.ts:290-335` logs a user in given only `email` + `userId` if `email_verified`. Fix: remove or require a server-issued one-time token.
2. **Rate limiter is in-memory.** `lib/rate-limit.ts:46` uses a per-process `Map` (no Upstash anywhere in repo); ineffective on serverless. Fix: Redis-backed limiter.
3. **Unauthenticated read of private verification files.** `app/api/image-proxy/route.ts:4-58` has no session check and fetches any key in the private `stakr-verification-files` S3 bucket; host check is a weak `String.includes`. Fix: require session and authorize the key.
4. **DDL endpoint open to any logged-in user.** `app/api/admin/add-team-column/route.ts:8-12` checks only `session.user` then runs `ALTER TABLE`/`CREATE INDEX`. Fix: remove; DDL via migrations only.
5. **Hardcoded alpha password.** `app/api/alpha-access/route.ts:4` falls back to `"stakr_alpha_2023"`.
6. **OpenAI key can ship to the browser.** `lib/openai-client.ts:16` falls back to `NEXT_PUBLIC_OPENAI_API_KEY`, which Next bundles into client JS.
7. **No real file-content validation on upload.** `app/api/upload/presigned-url/route.ts:30-46` builds a mock File whose `arrayBuffer()` returns `ArrayBuffer(0)`, so magic-byte checks can't inspect bytes. Fix: constrain Content-Type/size in the presigned policy + scan after upload.
8. **Build safety disabled.** `next.config.mjs:6,9` set `eslint.ignoreDuringBuilds` and `typescript.ignoreBuildErrors` to `true`.

### MEDIUM/LOW
- Hardcoded admin by email `alex@stakr.app` (`lib/auth.ts:239,321,492`) — no real roles model.
- No security headers/CSP; middleware skips all `/api`; no HSTS/X-Frame-Options.
- Gate/dev cookies `httpOnly:false` (`app/api/alpha-access/route.ts:49`).
- Demo users with plaintext passwords in source + dev credential bypass (`lib/auth.ts:75-98,159-177`).
- Password minimum length 6 (`app/api/auth/register/route.ts:11`).
- `sql.unsafe()` in `social/leaderboard/route.ts:108,180,300` and `user/notification-preferences/route.ts:247` — currently safe but fragile.
- Root file `hell -NoProfile -Command =...` is junk (captured help text from a mangled PowerShell command) — delete.

**Positives:** `app/api/payments/withdraw/route.ts` has atomic `credits >= total` debit, DB-based 3/24h + $1000/day caps, fraud flags, server-side payout destination. Neon tagged templates (parameterized) throughout. `.env*` gitignored; no secrets committed.

**Security work to build:** `requireAdmin()` + real roles (M); Redis `rateLimit()` wrapper (M); `assertEnv()` boot guard (S); `authorizeFileAccess()` + presign constraints (M); security-headers/CSP middleware (S).
**Effort:** ~4–6 engineer-weeks to launch-safe.

---

## 2. BACKEND / API REVIEW

**VERDICT:** A v0-generated shell with real-looking but non-functional money plumbing. The core
loop cannot execute: no code path transitions a participant to `completed`/`failed` (only admin
appeals), and no cron settles expired challenges. Where wired, ledger INSERTs are corrupted by a
parameter-binding bug, Stripe `ON CONFLICT` fails for lack of a unique index, and "transactions"
are non-atomic because the Neon HTTP driver makes `BEGIN/COMMIT` no-ops.

### P0 (blockers)
1. **Privilege escalation** — `app/api/grant-dev-access/route.ts:6-28` (corroborates Security #1).
2. **Unauthenticated schema mutation** — `app/api/admin/add-team-column/route.ts:10-27` (corroborates Security HIGH #4).
3. **Credit-ledger & reward INSERTs broken (param-binding corruption).** `app/api/challenges/[id]/join/route.ts:234-235,240` and `lib/reward-calculation.ts:420,516` embed `${challengeData.title}` *inside* a single-quoted SQL literal within a Neon tagged template → Postgres sees a literal `$N` inside quotes, param count mismatches, INSERT throws. CREDITS joins create a participant + debit credits, then 500 with no ledger row; `distributeRewards` throws during payout. Fix: build the message in JS and pass it as one `${msg}` param.
4. **No proof→completion transition + no cron → loop dead.** Only writer of `completion_status='completed'` is `app/api/admin/appeals/route.ts:388-396`; nothing sets `'failed'`; no `app/api/cron`, no `crons` in `vercel.json`. Settlement reads always see 0 completed participants.
5. **Stripe checkout INSERT always fails.** `lib/payments-service.ts:92` uses `ON CONFLICT (stripe_payment_id) DO NOTHING`, but no unique index exists on that column (`database-schema.sql:132`, no migration) → Postgres error 42P10; CASH joins 500.
6. **Money writes are not atomic.** `lib/db/index.ts:14-23` returns the Neon **HTTP** driver; `BEGIN`/`COMMIT`/`ROLLBACK` in `reward-calculation.ts:389,576,586` run as separate autocommit requests. Fix: `neon.transaction([...])` or a Pool session.
7. **AI verification silently auto-approves without a key.** `lib/enhanced-ai-verification.ts:356-371` returns `approved:true, confidence:50` when `OPENAI_API_KEY` is missing; `lib/ai-anti-cheat.ts:242-255,489,511-524` hardcodes 85/90/95 and `return true` for stock/AI/duplicate checks. Fix: fail closed to manual review.
8. **SQL injection in financial monitor.** `app/api/admin/financial-monitor/route.ts:57,78,93,...` interpolates `timeRange` into `INTERVAL '${timeRange} days'` unvalidated.
9. **Alpha gate trivially bypassable.** `app/api/alpha-access/route.ts:4,44-50` hardcoded default password; `httpOnly:false` forgeable cookie.
10. **`email_verified` type drift.** Migration `2025-01-15_consolidate_all_schema_changes.sql:27` makes it `TIMESTAMP`, but `app/api/auth/verify-email/route.ts:47,145` and `lib/auth.ts:449` run `SET email_verified = true` → boolean-into-timestamp error.

### P1
1. **Withdraw double-counts locked stakes.** `app/api/payments/withdraw/route.ts:210-231` computes `available = credits - SUM(active stake_amount)`, but the join already debited the stake from `credits` (`join/route.ts:221`) → users can't withdraw funds they hold.
2. **Webhook thin & permissive.** Only `checkout.session.completed` handled; no `charge.refunded`, `payment_intent.payment_failed`, `transfer.failed`, `account.updated`.
3. **Three inconsistent admin checks** coexist: `session.user.isAdmin`, DB `has_dev_access`, `session.user.role==='admin'` (`admin/storage-health/route.ts:11`).
4. **High-blast-radius admin tools in prod:** `deploy-ai-schema/route.ts:42-76` runs `sql.unsafe()` on file contents; `moderation/test-data` inserts fake rows.
5. **`settle` distributes without preconditions** (`challenges/[id]/settle/route.ts:31`): no participant-status transition, no row locking; idempotency is a status-string check.
6. **`upload/confirm` is a stub.** `app/api/upload/confirm/route.ts:31-44` returns `temp-...` with a TODO — uploaded proof media is never recorded against a submission.
7. **Check-ins are mock-backed.** `challenges/[id]/checkins/route.ts:238` swallows DB errors and reports success; GET (316-357) returns hardcoded check-ins.
8. **Cash joins skip revenue accounting** — no `platform_revenue` row on `checkout.session.completed`.
9. **Hardcoded `alex@stakr.app` backdoor** in `admin/system/route.ts:220`, `user/dev-mode/route.ts:23,111`.
10. **`dev-bypass` open on all Vercel hosts** (corroborates Security #4).

### P2 (selected)
- `reward-calculation.ts:265` winner-takes-all breakdown double-subtracts host share (display only).
- `proof_submissions` column drift papered over by `migrations/2025-08-10_consolidate-proof-submissions.sql`.
- `admin/ai-system` `retrain-model` placeholder; `admin/system` `clear_cache`/`toggle_debug` no-ops.
- `admin/storage-health/route.ts:11` checks `session.user.role` (never set) — always 403.
- Dead `if(false)` demo blocks bloat `challenges/route.ts`, `join/route.ts:64,433`, several admin routes.

**Proposed new functions:** `settleExpiredChallenges()` cron (M); `evaluateParticipantCompletion()` (M); `withTransaction()` (M); `handleStripeEvent()` expansion (M); `reconcileLedger()` nightly (L); `requireAdmin()` (S).
**Effort:** ~6–9 engineer-weeks to production-ready.

---

## 3. FRONTEND / UX REVIEW

**VERDICT:** A real user cannot complete the core loop today. Auth → onboarding → discover →
join/stake run against real APIs, but the loop dead-ends at proof submission (the fully-built
`ProofSubmission` component is only mounted on test/demo pages) and at funding ("Add Funds" is a
`setTimeout` simulation). The money UI fabricates numbers — a trust-killer for a staking product.

### ROUTE MAP (user-facing)
| Route | Status | Note |
|---|---|---|
| `/` → `/alpha-gate` → `/auth/*` | WORKS | Real NextAuth; suspended page links to non-existent `/community-guidelines` |
| `/onboarding` | WORKS | Real API; failure path silent (console only) |
| `/dashboard` | WORKS | Real `/api/user/dashboard`, proper states |
| `/discover` | PARTIAL | Real data; desktop filters cosmetic; mobile Brands tab "Coming soon" |
| `/challenge/[id]` | PARTIAL | Real challenge + join; fake pot/completion/host stats; fake community |
| `/create-challenge`, `/edit-challenge/[id]` | WORKS | Real upload + POST/PUT |
| `/challenge/invite/[code]` | MOCK | Hardcoded challenge; email invites = `setTimeout` |
| `/my-active` | PARTIAL | Real list; Submit Proof = console.log; demo fallback on error |
| `/my-challenges` | PARTIAL | Real list; Submit Proof / Quit / Try Again dead |
| `/wallet` | MOCK | Fake deposit, mock balance fallback, mock payment methods |
| `/profile`, `/settings` | PARTIAL | Profile save real; perf stats fake; settings saves toast-only; `/settings` crashes (missing import) |
| `/social` | PARTIAL | Leaderboard real; hero stats hardcoded; friend activity mock |
| `/notifications`, `/pricing`, `/privacy`, `/terms` | WORKS | — |
| `/brand/[id]`, `/creator/[id]` | MOCK | 100% hardcoded despite real `/api/brands`, `/api/creators` |

**Delete or gate before ship:** `/demo/dashboard`, `/theme-preview` (both UNGUARDED), `/dev-tools`, `/design-preview`, `/mobile-demo`, `/proof-demo`, `/test-avatar`, `/test-dashboard`, `/test-verification-system`, `/verification-demo` (weak client-side guards only).

### P0
1. **Proof submission unreachable** — `app/my-active/page.tsx:497-499` handler is `console.log(...)`; `components/proof-submission.tsx` (real, calls checkins API) imported only by test/demo pages. Users currently lose stakes with no way to comply.
2. **Fake deposit** — `app/wallet/page.tsx:307-315`: `setTimeout(1500)` + console.log; user believes money was added.
3. **Mock wallet balances shown to real users** — mock data is initial state (`:179`), error fallback (`:241`), and merged into successful responses (`:201,630,646`); fake Visa •••• 4242 / PayPal always render (`:809`).
4. **Dead core CTAs in my-challenges** — `app/my-challenges/page.tsx:380,384,783,787,1132`.
5. **Fabricated money math at the join decision** — `app/challenge/[id]/page.tsx:223` (`completionRate: 78 // Mock`), `:229` (`totalPot: participants * 50 // Mock`), `:243-246` (fake host stats), feeding `components/challenge-stake-section.tsx:82-86,485-488` "Potential Winnings".
6. **Fake community on challenge detail** — `components/challenge-community-tabs.tsx:57-170` hardcoded people; Nudge/Cheer console.log only (`:172-182`) though real endpoints exist.
7. **camera_only challenges can't submit** — `components/proof-submission.tsx:405,458`: file input `disabled={proofRequirements.camera_only}` → hard dead-end.
8. **Brand/creator profiles fully mock** — `app/brand/[id]/page.tsx:26-146`, `app/creator/[id]/page.tsx:16-133`.
9. **Discover desktop filters do nothing** — `app/discover/page.tsx:26-29` state never reaches `ChallengeGrid` (`components/challenge-grid.tsx:12` takes no props).
10. **Private-invite flow is fiction** — `app/challenge/invite/[code]/page.tsx:42-64,131`.

### P1 (selected)
- `app/my-active/page.tsx:152-172` — API error shows fake "Demo Challenge - API Error" card as real.
- `app/settings/page.tsx:167-169,681,791` — saves toast-only; password update (`:760`), Download Data / Delete Account (`:774-786`), 2FA dead.
- `app/social/page.tsx:56-85` hardcoded "10,247 users / $2.3M"; `components/social/friend-activity.tsx:27-70` mock friends.
- `app/onboarding/page.tsx:204-209` — completion failure only console.errors.
- `components/proof-submission.tsx:410-460` vs `:462-509` — duplicate `TabsContent value="video"` blocks.
- `components/challenge-stake-section.tsx:208-210` — post-join "View My Progress" has no onClick.
- `app/wallet/page.tsx:475-487,824-832` — Overview buttons no handlers; withdraw uses `alert()` + reload; CSV export quoting bug (`:286`).
- `app/auth/suspended/page.tsx:136` — links to non-existent `/community-guidelines`.

### P2 (selected)
Console.log spam ships everywhere; `window.location.href` instead of `router.push`; a11y gaps (clickable divs, missing aria-labels); hotlinked Unsplash images; desktop/mobile nav configs diverge; `app/wallet/page.tsx:171-177` dead `useApi` instance.

**Proposed new functions:** `ProofSubmissionSheet` (M); `useWalletDeposit()` (M); server-derived `ChallengeStats` (S); `ParticipantsPanel` + `ActivityFeed` wired to real endpoints (M); shared `ErrorState`/`EmptyState` (S); `navConfig.ts` single source of truth (S).
**Effort:** ~6–8 engineer-weeks (the API layer mostly exists — predominantly wiring + mock removal).

---

## 4. PRODUCT COMPLETENESS REVIEW

**VERDICT:** Roughly **55% real**. Auth, challenge create/discover/join with credit debits, social
feed, notifications, admin tooling, and settlement math are genuinely DB-wired; but the core loop
is severed at three points: (1) wallets can never be funded, (2) approved proofs never mark a
participant `completed` (only the admin appeals route does), (3) nothing transitions challenge
lifecycle or triggers settlement (zero crons). Shortest path: a points-only v1.

### Placeholder sweep
True `TODO/FIXME`: only 4 (`upload/confirm`, `xp-reward-calculation.ts:99` streak=0, `ai-anti-cheat.ts:593` ban, `demo-mode.ts:102`) — the hollowness is unmarked. `mock`: 102 hits in `app/api`, 66 in `lib`, 51 in `components`. `Math.random` in server code: 44. Demo plumbing referenced in 13 API route files; ~30 dead `if (false)` blocks. 11 demo/test pages shipped.

### Feature inventory
| Feature | Rating | Evidence |
|---|---|---|
| Auth/registration/email verify | REAL | `app/api/auth/register/route.ts` (bcrypt, Resend) |
| Challenge create/edit/discover | REAL | `app/api/challenges/route.ts` |
| Join + stake (credits) | REAL* | atomic debit + ledger; *ledger INSERT bug, unfundable wallet |
| Wallet | STUB | balance/tx real; deposit no-op; payment methods hardcoded |
| Payouts/withdrawals | STUB | real Stripe transfers but **no Connect onboarding exists**; setup link dead |
| Stripe checkout (CASH join) | STUB | real if key set, silent mock fallback |
| Proof submission | STUB | UI real; persistence best-effort try/catch; response named `mockCheckin` |
| Check-in history | FACADE | GET returns 3 hardcoded mock check-ins, always |
| Activity sessions/timer | FACADE | "return demo for now until migration is run" |
| Random check-ins | FACADE | mock gestures |
| AI anti-cheat | STUB | layers 3-5 hardcoded 85/90/95; ban TODO |
| AI vision verification | STUB | real OpenAI call if key |
| Admin verification queue | REAL | real `proof_submissions` review/reverse |
| Settlement/reward math | REAL (unreachable) | throws "No completed participants" in practice |
| XP/gamification | REAL-ish | `award_xp` SQL fn; streak bonus stubbed to 0 |
| Social feed/follow/leaderboard | REAL | `app/api/social/*` |
| Notifications | REAL | DB inserts + templates + prefs |
| Wearables/integrations | STUB | real OAuth token exchange; sync→verification rollup unproven |
| Brands / creators | FACADE | zero seed data; grids fall back to mocks |
| Pricing/subscriptions | FACADE | static calculator; no subscription anywhere |
| Appeals | REAL | ironically the only completion path |

### Core loop gap analysis (ordered; points mode = 1–5)
1. **Completion rollup** — on proof approval, upsert daily progress; mark completed at challenge end if approved-days ≥ threshold (M).
2. **Lifecycle automation** — Vercel cron + `/api/cron/lifecycle` flipping `pending→active→ended→settled`, calling existing distribute functions (M).
3. **Real check-in history** — replace mock GET with `proof_submissions` query (S).
4. **Mandatory check-in persistence** — remove swallow-errors try/catch and `Math.random` quality scores (S).
5. **Streak calc** — implement `lib/xp-reward-calculation.ts:99` from real rows (S).
6. *(money)* Wallet funding via Stripe checkout → credit top-up on webhook (M).
7. *(money)* Stripe Connect onboarding + `account.updated` webhook + the missing settings page (L).
8. *(money)* Unify CASH vs credits join (CASH path server-fetches own API without auth → 401) (M).

### Cut list (v1)
11 demo/test pages; brands & creators marketplace; random check-ins + timer sessions; anti-cheat layers 3-5 + ban TODO; team mode/insurance/referral half-wired create options; legacy demo litter (~30 `if(false)` blocks, dup mock libs, dual dashboard APIs, root junk file).

### Proposed new functions
Challenge templates (S/HIGH); daily reminder notifications (S/HIGH); discover search + sort (S/HIGH); starter challenge auto-enroll (S/HIGH); streak freeze token (S/MED); referral deep links (M/MED); progress calendar view (M/MED); public share/OG pages (S/MED).

**Effort:** points-only credible v1 ~6 engineer-weeks; money mode +5–6; **total ~11–12 engineer-weeks**.

---

## 5. BUILD / TEST / TOOLING REVIEW (empirical)

**VERDICT:** A new engineer can clone, `npm ci` (clean, 45s), and `next build` (green, ~2.5 min)
today — but the green is cosmetic: the build disables type-checking and linting, shipping 61 type
errors and two pages that crash at runtime; 40/158 unit tests fail; e2e is unrunnable; CI is
disabled on push and would fail at its first step.

### Empirical results (node v22.22.2, npm 10.9.7)
1. **Install:** engines demand pnpm>=8 but lockfile is npm; `.npmrc` has pnpm-only flags + `legacy-peer-deps=true`. `npm ci`: 1515 packages / 45s / exit 0. **57 deps pinned `"latest"`** — and `vercel.json` uses `npm install`, so every deploy can re-resolve all 57 → non-reproducible deploys.
2. **tsc --noEmit:** exit 2, **61 errors**, all production code. Top files: `lib/validation.ts` (6), `components/ui/chart.tsx` (5), `lib/ai-anti-cheat.ts` (4). Real bugs: enum case mismatch `"CHALLENGE_JOIN"` vs `"challenge_join"` in `app/api/integrations/sync`; `session.user.role` doesn't exist; `.warnings` read off a Zod success result.
3. **Lint:** exit 1 — **180 errors** (178 cosmetic/autofixable; **2 runtime ReferenceErrors**: `BackgroundImage` at `app/settings/page.tsx:278`, `Button` at `app/verification-demo/page.tsx:69`).
4. **Build:** exit 0; prints "Skipping validation of types / Skipping linting". Shared first-load 193 kB; `/onboarding` 306 kB; middleware 118 kB.
5. **Unit tests:** 14 suites: 7 fail; 158 tests: **40 fail** (unmocked Neon client: `sql is not a function`; assertion drift). Coverage threshold 70%; reality **6.2%**.
6. **E2E/CI:** 3/4 Playwright projects require `tests/e2e/.auth/user.json` which is never generated (`auth.setup.ts` not wired into config). CI: push trigger commented out "to conserve minutes"; would fail at step 1.
7. **Hygiene:** tracked junk: the 16KB `hell -NoProfile...` file (U+F03C char breaks Windows checkouts), 3 lighthouse JSONs (~1.2MB), `PRIORITY-QUEUE.json`, `.eng-state.json`, 13 stray status .md in root, 7 Windows-only `.ps1` scripts. Husky configured but no `prepare` script and no `.husky/` dir → pre-commit hooks have never run.

### P0
1. Remove `ignoreBuildErrors`/`ignoreDuringBuilds`; treat `npm run type-check` as the release gate until then.
2. Fix the two crashing pages (`/settings` is user-facing).
3. Pin the 57 `"latest"` deps from today's lockfile; set `installCommand: "npm ci"` in `vercel.json`.
4. Re-enable CI on push: install → type-check → lint → test → build, blocking.
5. Introduce a DB mock layer for the Neon `sql` client; fix or quarantine stale suites.
6. Set coverage threshold to current baseline and ratchet up.
7. Add `"prepare": "husky"` + `.husky/pre-commit` → lint-staged.
8. Pick npm: fix `engines`, delete pnpm flags, resolve peer conflicts.

### P1 (selected)
Delete tracked junk + gitignore patterns; move test/dev tooling out of production `dependencies` (`@jest/globals`, `@testing-library/dom`, `drizzle-kit`); wire e2e auth setup project; audit middleware bundle; lazy-load recharts/framer-motion on heavy routes; revisit `overrides` after pinning; un-exclude `tests/**` from tsconfig.

**Tooling to build:** CI pipeline v2 (S); pre-commit wiring (S); `scripts/check-env.js` (S); dependency pinning + Renovate (M); coverage/test ratchet (M).
**Effort:** ~3 engineer-weeks to genuinely green (parallel to, not competing with, the backend/frontend tracks).
