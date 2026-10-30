# Stakr release checklist (credits release)

Last updated: 30/10/2026 · Production: https://stakr.app · Vercel project: `v0-stakr-v2`
Neon project: `Stakr` (`cold-lab-24148964`), production branch `br-rough-snowflake-a4ardvlz`

**Read this first.** The code is verified as far as it can be without your
production secrets (section 1). A handful of things can only be done by you,
because they need your accounts, secrets or legal sign-off (section 2). PR #11 was
merged and deployed on 30/10/2026 and the one new database migration (2.2) is
applied; "Production status" below says what is confirmed live and what is open.

What ships: a **credits-only** accountability app. Credits have no cash value and
cannot be bought or withdrawn. Cash, Stripe, insurance, teams, brands/creators,
social and wearable integrations are **not part of this release** and are switched
off server-side (they return 404 in production).

---

## 1. What is already verified (with evidence)

| Area                                                                    | Evidence                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full user journey in a real browser, production build, real Neon driver | `npm run test:journey`: **78 checks, 0 failed** (signup → verify → welcome credits → host → join → evidence → neutral review → settlement → suspension → export → deletion → abuse limits → closed legacy surface)          |
| Money maths                                                             | Settled example to the cent (finisher 65.50, forfeiter 29.00, host 50.00, platform 5.50); balances + platform ledger = total credits issued; ledger reconciles to balances for every user, including after account deletion |
| Concurrency                                                             | Real Postgres: duplicate joins, last-place race, double settlement vs cancellation, 8 simultaneous welcome claims, 40 simultaneous rate-limit hits: all exactly-once                                                        |
| Unit and DB tests                                                       | 325+ unit tests, 50+ Postgres acceptance tests (built on the real production schema)                                                                                                                                        |
| Types, lint, build                                                      | `tsc` 0 errors, ESLint 0 errors, `next build` succeeds                                                                                                                                                                      |
| Dependencies                                                            | `npm audit --omit=dev`: 33 advisories (4 critical, 10 high) reduced to 2 (the `postcss` bundled in Next 15, build-time only; the fix needs Next 16)                                                                         |
| Database reproducibility                                                | `migrations/baseline/` rebuilds an empty DB identical to production (63 tables, 229 constraints, 241 indexes, checked by per-table column fingerprint)                                                                      |

**Not verified, and why**

- **Photo/video evidence upload** to your real S3 bucket: needs your AWS credentials. Text evidence is verified. (See 2.6.)
- **Sending real email**: needs your Resend key. The code path fails loudly if it is missing. (See 2.4.)
- **The scheduled cron settling a challenge on Vercel**: Vercel is confirmed calling the endpoint (runtime logs, 30/10/2026) and the endpoint refuses a missing or wrong secret, but no real settlement through the scheduler has been seen yet. (See 3.)
- **GitHub Actions**: CI has not run since the account was billing-locked (PR #10). (See 2.8.)
- **Neon's pooled production endpoint**: the real Neon driver was exercised against local Postgres through a protocol shim, not against your live Neon. Rehearse once on a Neon branch. (See 2.2.)

### Production status (30/10/2026, after the merge)

Confirmed live on https://stakr.app:

- `/api/auth/session`, `/api/auth/providers` and `/api/auth/csrf` return 200; `/api/challenges` returns 401 when logged out.
- `/api/health` returns 200 with `database`, `email`, `storage`, `auth` and `cronSecret` all `true`, and `rateLimit: "database"` (the migration is working).
- The scheduler endpoint refuses a missing or wrong secret with 401, and Vercel is calling it.
- Security headers (CSP, HSTS, frame, nosniff, referrer) are on every page, and there have been no runtime errors since the last redeploy.

Still open: a second admin (`reviewers: false`, see 2.5); a first real sign-up with email delivery, a photo upload and a settled challenge (section 3); deleting the stray `NODE_ENV` variable in Vercel (see 2.4); legal review (2.7); GitHub Actions billing (2.8); and the welcome-grant and sign-in-lockout decisions (BUGS.md O-12, O-13).

**Incident, same day.** Straight after the merge every sign-in and API route returned HTTP 500, because `ENCRYPTION_KEY` was not set in Vercel Production. The previous deployment had the same failure, so sign-in had been down since June. Fixed by adding the variable and redeploying; see BUGS.md B-026.

---

## 2. Things only you can do, in this order

### 2.1 Choose launch mode

- [ ] **Invite mode**: set `ALPHA_ACCESS_PASSWORD` (the alpha gate stays on), or
- [ ] **Public mode**: set `STAKR_ALPHA_GATE_DISABLED=true`.

### 2.2 The one new migration: DONE (30/10/2026)

`migrations/2026-10-30_rate-limit-hits.sql` adds one table, `rate_limit_hits`. It is
idempotent and touches nothing existing. Until the code that uses it is deployed the
table simply sits empty; once deployed, rate limits are shared across instances and
`/api/health` reports `rateLimit: "database"`.

- [x] Rehearsed on a temporary copy of production: table count 65 to 66 (exactly one more), correct columns and both indexes, the limiter's upsert works, a re-run is a no-op.
- [x] Applied to the production branch (`main`, `br-rough-snowflake-a4ardvlz`, database `neondb`) and re-checked there: table and both indexes exist, 0 rows, users and the lifecycle queue untouched, no overdue jobs. The temporary branch was deleted.

The migration is additive, so rolling back the _code_ needs no database change (the
table is just ignored). To undo the migration itself: `DROP TABLE rate_limit_hits;`
(it holds only throwaway counters).

Nothing else in this release changes the production schema. (The 27/09/2026
migrations from PR #10 are already applied.)

### 2.3 Vercel plan

- [ ] The cron in `vercel.json` runs **every 5 minutes**. Vercel's **Hobby plan only allows daily crons and will reject the deployment**. Use Pro, or accept daily settlement by changing the schedule to `0 3 * * *`.

### 2.4 Environment variables (Vercel → Production)

Required:

| Variable                                                                      | Value                                                                                                                                                        |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                                                                | Neon connection string for the production branch                                                                                                             |
| `NEXTAUTH_URL`                                                                | `https://stakr.app` exactly                                                                                                                                  |
| `NEXT_PUBLIC_BASE_URL`                                                        | `https://stakr.app`                                                                                                                                          |
| `NEXTAUTH_SECRET`                                                             | long random string (`openssl rand -hex 32`)                                                                                                                  |
| `ENCRYPTION_KEY`                                                              | 32+ random characters. **Checked at start-up:** if it is missing, every sign-in and API route returns HTTP 500 (BUGS.md B-026)                               |
| `CRON_SECRET`                                                                 | a different long random string; Vercel sends it to the cron as `Authorization: Bearer`. Without it the scheduler answers 503 and nothing settles             |
| `RESEND_API_KEY`                                                              | from Resend                                                                                                                                                  |
| `RESEND_FROM_EMAIL`                                                           | an address on the **verified** sending domain, e.g. `Stakr <noreply@support.stakr.app>`. The verified Resend domain is `support.stakr.app` (not `stakr.app`) |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BUCKET_NAME` | private evidence bucket                                                                                                                                      |
| `ALPHA_ACCESS_PASSWORD` **or** `STAKR_ALPHA_GATE_DISABLED=true`               | see 2.1                                                                                                                                                      |

Optional: `STAKR_WELCOME_CREDITS` (default `50`, `0` disables), `STAKR_ENTRY_FEE_BPS` (default `500` = 5%), `STAKR_PLATFORM_CUT_BPS` (default `2000` = 20%), `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`.

**Must NOT be set in production:** `ALLOW_DEV_AUTH`, `STAKR_LOCAL_NEON_PROXY`, `ENABLE_CASH_PAYMENTS=true`, and `NODE_ENV` (Vercel and Next.js set it themselves; a stray `NODE_ENV=development` makes every log line warn that it is being overridden, BUGS.md O-15).

I could not read your Vercel environment (the API token lacks permission), so I
cannot tell which of these are already set. `/api/health` (section 3) tells you.

### 2.5 Make two admins

Appeals must be decided by a _different_ reviewer, so **one admin is not enough**.
After you have signed up your own accounts:

```sql
update users set is_dev = true, has_dev_access = true where email in ('you@…', 'second-reviewer@…');
```

`/api/health` reports `reviewers: false` until there are two.

### 2.6 Evidence storage (S3)

- [ ] Bucket is private (block all public access).
- [ ] CORS allows `PUT` from `https://stakr.app` (see `docs/GCS_CORS_CONFIGURATION.md` for the idea; S3 equivalent).
- [ ] IAM user can `PutObject`, `GetObject`, `HeadObject`, `CopyObject` on the bucket.
- [ ] Upload one photo as a real participant and confirm an admin can view it. **This is the one flow I could not test.**
- [ ] Add a lifecycle rule to expire abandoned temporary uploads.

### 2.7 Legal review (a NZ lawyer, before public launch)

I rewrote the Terms and Privacy Policy so they describe what the product really does
(the old text described Stripe payments, withdrawals, insurance, AI verification and
retention promises that do not exist). They are **drafts for review, not legal advice**.
Please have them checked, and ask specifically about:

- [ ] whether a credits-only staking game with no cash value is outside the Gambling Act 2003 (it appears designed to be, but get it confirmed in writing, especially before any future cash feature);
- [ ] the minimum age (currently 13);
- [ ] evidence retention periods (the policy promises deletion on request, no fixed period);
- [ ] the headline "Put Your Credits Where Your Mouth Is" (I changed "Money" to "Credits" because no money is staked; revert if counsel says it is fine).

### 2.8 GitHub

- [ ] Fix the GitHub billing lock so Actions run (`.github/workflows/tests.yml` has the database job).
- [ ] Let CI go green on this PR before merging.

### 2.9 Existing production data

Production has 8 test users, 7 legacy challenges (`lifecycle_version = 0`, hidden from
Discover and quarantined by design) and unreconciled test balances. The admin screen
shows ledger drift. Decide whether to leave them or reset test accounts; do **not**
convert legacy challenges to v1 by hand.

### 2.10 Deploy

- [x] Merged (PR #11) and deployed by Vercel on 30/10/2026.
- [ ] Rollback if needed: Vercel → Deployments → promote the previous deployment (`dpl_1mBbJt1X3jMNoW2DQxh7LXDxRGJz`, commit `86a71c1`). The new database table is additive, so rollback is safe. Rollback undoes a bad code change; it does **not** fix a missing environment variable (that deployment had the same start-up failure).
- [ ] After adding or changing a variable, **Redeploy** from the Deployments tab: a new variable only reaches new deployments.

---

## 3. After deploying: five-minute smoke test

1. **`GET https://stakr.app/api/health`** must return `"status": "ok"`. If it says `degraded`, every `false` under `checks` names what is missing (email, storage, auth, cronSecret, rateLimit, reviewers). `down` means the database is unreachable. HTTP 500 instead of JSON means the server refused to start: the Vercel runtime errors name the missing required variable.
2. Sign up with a real inbox: the verification email arrives from your sending domain, the link verifies (no "failed" screen), you can sign in and claim the welcome credits.
3. As that user create a small challenge; as a second account join it; submit text evidence; as an admin approve it.
4. Wait for the cron (up to 5 minutes after the end date + grace), or run it by hand:
   `curl -H "Authorization: Bearer $CRON_SECRET" https://stakr.app/api/cron/lifecycle` → `{"success":true,…}`. Confirm the challenge reached `rewards_distributed` and balances changed.
5. Open `/social`, `/api/brands`, `/api/payments/withdraw`: all must 404.

**Monitoring:** point an uptime monitor at `/api/health` and alert on anything but `ok`. It also reports `lifecycle.overdueJobs`, which becomes non-zero if the cron stops, so a silently dead scheduler is caught.

---

## 4. Running the service (for whoever is on call)

| Task                                  | How                                                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Review evidence / appeals             | `/admin/challenges`. Aim to clear the queue within a day; settlement waits on it                                                                 |
| Give credits                          | `/admin/challenges` → "Issue MVP credits" (audited)                                                                                              |
| Suspend a cheater                     | `/admin/challenges` → "Account status" (by email). Takes effect within ~10 seconds, signs them out, blocks sign-in. Staked credits stay escrowed |
| Cancel or suspend a challenge         | `/admin/challenges` → challenge actions (choose a refund preset)                                                                                 |
| A user asks for their data / deletion | Settings → "Download my data" / "Delete my account" (self-serve)                                                                                 |
| Process a settlement now              | admin challenge action "Check outcomes & settle when ready"                                                                                      |
| Restore the database                  | Neon point-in-time restore. **Retention is only 24 hours on this plan: raise it before launch**                                                  |

Support inboxes to monitor: `support@stakr.app`, `legal@stakr.app`, `privacy@stakr.app`.

---

## 5. Known limitations (honest list)

- Dormant legacy code (brands, creators, social, cash, wearables, random check-ins) is still in the repo. It is unreachable in production (404), and is slated for deletion once the release is stable.
- The CSP allows inline scripts (Next.js hydration without per-request nonces). It still blocks foreign script origins, framing, plugins and cross-origin form posts.
- 29 older unit tests remain quarantined from the June work.
- Credits have no cash value by design. Adding real money later needs the Phase 2 gate in `docs/audits/2026-06-engineering-review/APPROVED_PLAN.md` (legal opinion, Stripe Connect standing, ledger proof).
- Sessions last 30 days, but a suspended, deleted or unverified account loses access within about 10 seconds.
