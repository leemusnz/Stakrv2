# BUGS.md

Every fix gets an entry here, newest at the bottom. Regressions are the
number-one risk, so each entry names the **regression test** that now guards it.
Dates are DD/MM/YYYY (Pacific/Auckland).

Status key: **FIXED** (verified by a run), **OPEN** (known, not yet fixed),
**DECISION** (needs the owner's call; a default has been applied).

---

## B-001 — Repo could not rebuild its own database (schema drift) — FIXED

- **Date:** 30/10/2026 · **Severity:** High (disaster recovery / staging impossible)
- **Symptom:** Replaying `database-schema.sql` plus every file in `migrations/`
  into an empty database produced **36 tables; production has 63**. 41 live
  tables existed nowhere in the repo, 13 repo-defined tables did not exist in
  production, and 7 shared tables had different columns (`users` 31 vs 17
  columns, `proof_submissions` 42 vs 23). The "consolidated" migration also
  aborted with 24 errors (single transaction, so it applied nothing).
- **Root cause:** Production was assembled by hand in the Neon SQL editor over
  time; the repo's migrations were never reconciled with it.
- **Fix:** Captured the live schema read-only and committed it as
  `migrations/baseline/2026-10-30_live-schema-0{1,2,3}-*.sql` (63 tables, 229
  constraints, 241 indexes, 16 functions, 15 triggers, 2 views).
  `scripts/db-rebuild-from-baseline.sh` builds an empty DB from it and refuses
  to run unless the database name ends `_dev|_test|_local|_staging` and the DB
  is empty.
- **Verified:** Rebuilt a fresh database; object counts match live exactly and
  the per-table column fingerprint (name, type, nullability) is identical for
  all 63 tables.
- **Regression guard:** `scripts/db-rebuild-from-baseline.sh` safety rails
  exercised (bad name → exit 3, non-empty DB → exit 4). Keep new migrations
  additive and dated after 30/10/2026.

## B-002 — Predictable email-verification and password-reset tokens — FIXED

- **Date:** 30/10/2026 · **Severity:** Critical (account takeover)
- **Symptom:** `lib/email.ts` built tokens as
  `Math.random().toString(36).substring(2) + Date.now().toString(36)`.
  `Math.random()` is not cryptographically secure (its state is recoverable from
  a few outputs) and the timestamp half is public, so an attacker could predict
  another user's password-reset token.
- **Fix:** Tokens are now `crypto.randomBytes(32).toString('base64url')`
  (256 bits, 43 URL-safe chars, fits `verification_tokens.token varchar(255)`).
  No flow or schema change.
- **Regression test:** `tests/__tests__/auth-tokens.test.ts` — confirmed to
  **fail on the old code** (format and clock-independence checks) and pass on
  the new.
- **Note:** Tokens issued before this fix expire on their own (24 h); nothing to
  migrate.

## B-003 — Every first-time visitor's page was force-reloaded; email verification showed "failed" after succeeding — FIXED

- **Date:** 30/10/2026 · **Severity:** High (first impression of every new user)
- **Symptom:** Opening the verification link verified the account (+50 XP) but
  the page then displayed "Verification Failed — Invalid or expired token".
  Request log: `POST /api/auth/verify-email` 200, then the page reloaded itself
  and POSTed again with the now-consumed token → 400.
- **Root cause:** `public/sw.js` calls `skipWaiting()` + `clients.claim()`, so on
  a first visit the new service worker takes over the open page and fires
  `controllerchange`. `components/pwa-registration.tsx` called
  `window.location.reload()` on **every** `controllerchange`. The component also
  never removed its listener or cleared its update interval.
- **Fix:** Reload only when this is an update (a controller already existed at
  load), at most once; clean up listener and timer on unmount.
  `app/auth/verify-email/page.tsx` also refuses to submit the same single-use
  token twice from one mount.
- **Regression test:** `tests/__tests__/pwa-registration.test.tsx` — fails on
  the old component (all 3), passes on the new.

## B-004 — Server trusted a client-supplied XP amount at onboarding — FIXED

- **Date:** 30/10/2026 · **Severity:** High (integrity / anti-abuse)
- **Symptom:** `POST /api/onboarding/complete-profile` used `xp || 300` from the
  request body. Any signed-in user could send `{"xp": 2000000000}` once and set
  their own XP and level.
- **Fix:** The server always awards the documented 300 XP and ignores `xp` and
  `level` in the body (the schema still accepts them so older clients don't
  break). **No XP amount changed**; this enforces the existing rule.
- **Regression test:** `tests/__tests__/onboarding-xp.test.ts` — the four
  injection cases fail on the old route and pass on the new.

## B-005 — A self-serve user could never join a challenge (no way to get credits) — FIXED (DECISION)

- **Date:** 30/10/2026 · **Severity:** Blocker for public launch
- **Symptom:** Challenges require a stake > 0, new accounts start at 0 credits,
  and the only source of credits was an admin grant.
- **Decision applied (owner may change):** a **one-time welcome grant of 50
  credits**, claimable after email verification, configurable with
  `STAKR_WELCOME_CREDITS` (`0` disables). Credits have no cash value and cannot
  be withdrawn, so this cannot be converted to money.
- **Implementation:** `lib/welcome-credits.ts`, `POST/GET /api/user/welcome-credits`,
  dashboard prompt `components/mvp/welcome.tsx`. Idempotent and race-safe (row
  lock on `users`), written to `credit_transactions` as `welcome_grant` so the
  admin ledger-drift check still reconciles. **No production schema change.**
- **Regression tests:** `tests/__tests__/welcome-credits-postgres.test.ts`
  (real Postgres: 8 concurrent claims credit once, unverified refused, ledger
  reconciles, disabled by config).

## B-006 — Email silently "succeeded" in production when the mailer was not configured — FIXED

- **Date:** 30/10/2026 · **Severity:** High (silent failure at the front door)
- **Symptom:** `sendEmail` returned `{ success: true }` whenever
  `RESEND_API_KEY` was missing, in every environment. Sign-in requires a
  verified email, so a mis-configured deploy let people register, never receive
  the email, and see no error.
- **Fix:** In production a missing/placeholder key now returns a failure and
  logs loudly; local development is unchanged.
- **Regression test:** `tests/__tests__/email-config.test.ts`.
- **Also note (config, not code):** the verified Resend sending domain is
  `support.stakr.app`, so `RESEND_FROM_EMAIL` must be an address on it (for
  example `Stakr <noreply@support.stakr.app>`). The code's fallback sender
  `onboarding@resend.dev` only delivers to the Resend account owner.

## B-007 — Fake `/api/users` endpoint removed — FIXED

- **Date:** 30/10/2026 · **Severity:** Low
- **Symptom:** A public, unauthenticated route returned invented users with
  realistic emails and "created" users that were never stored. No callers.
- **Fix:** Route deleted.

## B-008 — Fabricated statistics, activity and pricing shown to the public — FIXED

- **Date:** 30/10/2026 · **Severity:** High (legal: misleading conduct under the Fair Trading Act 1986)
- **Symptom:** The welcome screen claimed "12k+ Active Users, $1.2M Staked, 94% Success
  Rate" (production has about 8 users and no money in play); a scrolling "live activity"
  ticker invented wins ("Sarah just won $120"); three "example" challenge cards claimed
  842, 320 and 1,234 participants and linked to challenge ids that do not exist; the copy
  said "make money by betting on yourself" and "join thousands of others"; the Pricing page
  advertised Premium $9.99/month, a 3% cashout fee and $1 insurance, none of which exist.
  `/social` showed 10,247 users / $2.3M earned and invented testimonials.
- **Fix:** Removed all of it. The welcome screen now shows a "how it works" panel and honest
  copy; Pricing is rebuilt and its worked example is computed by the real `settleChallenge`
  function so it cannot drift; `/social` is closed (B-010). Headline changed from "Money" to
  "Credits" (owner may revert).
- **Verified:** `release-journey` asserts no fabricated stats and no Premium/Cashout copy.

## B-009 — Suspension and deletion were never enforced — FIXED

- **Date:** 30/10/2026 · **Severity:** High (business rule: "cheaters must be blocked")
- **Symptom:** `users.moderation_status` was never checked at sign-in or per request, and
  sessions are stateless 30-day JWTs, so a suspended user kept full access. There was no
  admin action to suspend anyone in the release screens.
- **Fix:** `lib/account-status.ts` re-checks the account (exists, verified, not suspended)
  inside the NextAuth `session` callback, so every route is covered (10 s cache, fails
  closed). Suspended users cannot sign in. Admin "Account status" form suspends/restores by
  email or id, audited, refusing self and other admins.
- **Regression tests:** `account-status.test.ts`, `auth.test.tsx` (blocked/deleted/
  unverified return no user; DB failure fails closed), `account-lifecycle-postgres.test.ts`.
  Browser: a suspended user's existing session returns 401 and re-login is refused.

## B-010 — Dormant legacy routes: mock data, missing tables, cash — FIXED (default deny)

- **Date:** 30/10/2026 · **Severity:** High
- **Symptom:** Eight API routes referenced tables that do not exist in production
  (`brands`, `creators`, `saved_challenges`, `notification_preferences`, `rank_history`,
  `platform_revenue`, `admin_actions`, `daily_completions`) and would 500; others served
  mock data (`/api/users`), decided verification with `Math.random()`
  (`/api/random-checkins`), or moved money. The middleware `matcher` excluded `/api`, so
  nothing could gate them.
- **Fix:** `lib/v1-surface.ts` allowlists the release's pages and API routes; everything
  else is 404 in production, from middleware. The matcher now includes `/api`. A test scans
  the release UI source and fails CI if it calls a route that is not allowlisted.
- **Regression test:** `v1-surface.test.ts`; journey checks 12 legacy paths return 404.

## B-011 — No rate limiting on sign-in, password reset or email sending — FIXED (needs one migration)

- **Date:** 30/10/2026 · **Severity:** High
- **Symptom:** The only limiter was an in-memory Map (per serverless instance, reset on
  cold start) applied only to registration. Credentials sign-in could be guessed without
  limit; `forgot-password` and `resend-verification` could email-bomb any address.
  `resend-verification` and `forgot-password` also revealed whether an email was registered.
  The limiter's own cleanup `setInterval` was never `unref`'d and hung `--runInBand` runs.
- **Fix:** `lib/rate-limit-db.ts`, an atomic fixed-window limiter backed by one new table
  (`migrations/2026-10-30_rate-limit-hits.sql`), falling back to the in-memory limiter if the
  table is missing. Applied to sign-in (per IP and per email), forgot/resend (per address
  and per IP), reset/verify token endpoints and upload presigning. Both email endpoints now
  answer identically whether or not the account exists. Timer is `unref`'d.
- **OPEN:** the migration must be applied to production (checklist 2.2); until then
  `/api/health` reports `degraded`.
- **Regression tests:** `rate-limit-postgres.test.ts` (40 concurrent hits allow exactly the
  maximum; fallback), `auth.test.tsx`. Browser: 4th reset/resend is 429, repeated bad
  sign-ins show "too many attempts".

## B-012 — Profile API returned stale session data — FIXED

- `GET /api/user/profile` returned values frozen into the JWT at sign-in (credits, XP,
  streaks) with a "later we can fetch from database" comment. It now reads the database.

## B-013 — No way to export or delete personal data — ADDED

- **Date:** 30/10/2026 · NZ Privacy Act 2020 (access and correction principles)
- `GET /api/user/export` (JSON download, no credentials) and `POST /api/user/delete`
  (anonymises, forfeits remaining credits through the ledger, refuses while the user is in
  an unsettled challenge, locks the login immediately). Tests on the real schema.

## B-014 — Terms of Service and Privacy Policy described a different product — REWRITTEN (needs legal review)

- **Date:** 30/10/2026 · **Severity:** High
- They described Stripe payments, a 3% cash-out fee, $1 insurance, withdrawals, "18+ for
  monetary challenges", peer voting (forbidden by the business rules), a 48-hour appeal
  window (real: 24 h), AI verification, fitness-tracker integrations, marketing email and
  retention promises no code implements. Sections were rewritten to match the system. These
  are drafts, **not legal advice**; see checklist 2.7.

## B-015 — Minimum password length was 6 — FIXED

- Raised to 8 for new passwords (register, reset, shared validation, UI hints), per NIST
  SP 800-63B. Existing shorter passwords still sign in.

## B-016 — Smaller UI faults — FIXED

- Wallet credit history clipped the Credits column on a 390 px phone (date now folds under
  the description); user-visible "MVP" wording removed; a bottom-nav tab pointed at the now
  closed Social pages; a missing `/noise.png` 404'd on every page; the footer linked to
  "Integrations" (not offered) and prefetched protected pages for signed-out visitors.

## B-017 — Operations: health endpoint and local release test — ADDED

- `/api/health` (booleans and counts only): database, email, storage, auth, cron secret,
  shared rate limiter, two-admin reviewer check, overdue lifecycle jobs (a dead-cron
  watchdog), cash switch. `npm run test:journey` is the repeatable release test.

---

## Open items and accepted risks

| ID   | Item                                                                                                        | Status                                         |
| ---- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| O-1  | Photo/video evidence upload not exercised against a real S3 bucket (no AWS access)                          | OPEN: owner, checklist 2.6                     |
| O-2  | GitHub Actions has not run since the billing lock; CI unproven                                              | OPEN: owner, checklist 2.8                     |
| O-3  | Real Neon pooled endpoint not exercised (driver verified against local Postgres via protocol shim)          | OPEN: rehearse on a Neon branch                |
| O-4  | Legal review of Terms/Privacy; Gambling Act 2003 confirmation                                               | OPEN: owner, checklist 2.7                     |
| O-5  | Neon history retention is 24 h                                                                              | OPEN: raise before launch                      |
| O-6  | Dormant legacy code remains in the repo (404 in production)                                                 | ACCEPTED: delete after launch                  |
| O-7  | `lib/auth.ts` has dev-only demo logins (`NODE_ENV=development` only)                                        | ACCEPTED: unreachable in production            |
| O-8  | CSP allows inline scripts (no per-request nonce)                                                            | ACCEPTED: still blocks foreign origins/framing |
| O-9  | `SELECT c.*` in `/api/user/challenges` returns every challenge column (including host `create_request_key`) | ACCEPTED: low sensitivity; narrow later        |
| O-10 | 29 quarantined legacy unit tests                                                                            | ACCEPTED: pre-existing                         |
