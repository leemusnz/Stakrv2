# Credits MVP lifecycle implementation — 16 September 2026

This continues the atomic join repair in PR #9. The app now has a coherent credits challenge loop in code: create, browse, join, submit evidence, neutral review, appeal, determine outcomes, settle and cancel. This document supersedes the “next slices” section of the earlier current-state audit. It does **not** assert production readiness or live deployment.

## Implemented behaviour

- Creation snapshots explicit daily proof rules, UTC schedule, entry fee, platform cut and a 24-hour appeal window. A host contribution is debited and ledgered atomically. A stable creation request key prevents duplicate funding after network retries. Published terms are immutable.
- Public discovery lists only version-1 challenges; joins close at start, enforce capacity and debit stake plus fee atomically. Unsupported XP-only, cash, insurance, team and referral modes are rejected.
- Evidence is persisted with a real ID, UTC day and retry key. One current proof per participant/day; rejected evidence can be replaced while submission remains open. Pending appeals cannot be replaced. Photo/video evidence must be owned and confirmed. S3 confirmation copies the object to a fresh server-only key using the source ETag so later overwrites cannot change reviewed evidence. Private evidence requires owner/admin authorization and uses short-lived URLs/no shared cache.
- Hosts and participants cannot review their own challenge. Appeals require a different neutral reviewer. Decisions notify the participant and queue lifecycle evaluation. Appeals change evidence decisions; they never independently pay a refund or bonus.
- Completion requires the configured number of distinct approved days. Failure waits until end plus grace, with no unresolved evidence or appeal opportunity. Any pending proof/appeal holds the entire pool. Suspensions block joins, proof, review and processing; resume extends relevant deadlines without rewriting review history.
- Settlement uses integer cents, returns each successful participant’s own stake, then splits failed stakes plus funded host contribution after the platform cut. Remainders go to winners in ascending user-ID order. With no winners the full pool goes to the platform. Entry fees are platform revenue outside the pool. Bulk payout writes and a unique settlement record run in one locked transaction with audit and notifications.
- Cancellation presets: `refund_all` returns stakes, entry fees and funded host contribution; `refund_participants` returns participant stakes while retaining fees and host contribution; `refund_none` allocates all escrow to the platform. Repeated cancellation cannot pay twice.
- Admin operations include a review queue, explicit reasons, suspend/resume/process/cancel, ledger drift visibility and retry-safe MVP credit grants. New users have zero credits; admins can fund test participants through recorded grants. This is not cash funding.
- Main MVP pages now use the real API contracts with loading, empty, error and retry states. Join terms show exact fees and conditional payout rules. Old independent credit/XP distributors are disabled, automated integration review cannot process canonical challenges, and cash entry points are off by default.

## Schema and rollout

Use an isolated staging copy with synthetic accounts before applying these changes to live balances. Apply in order, using a database migration operator rather than a public HTTP endpoint:

1. The repository’s existing baseline/schema migrations, reconciled against the actual staging schema.
2. `migrations/2026-09-16_atomic-joins.sql`.
3. `migrations/2026-09-16_mvp-lifecycle.sql`.

The new migration is additive apart from widening decimal amounts and fee percentages. It intentionally leaves old challenges at `lifecycle_version=0`; they require a human rules/escrow review. Do not blindly flip historical records to version 1, invent balancing entries, delete duplicates or replay payouts. A failed unique index or ledger reconciliation is a release blocker to investigate.

Required runtime/configuration:

| Setting                                                                       | Purpose                                                         |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Node 22+                                                                      | Neon interactive transaction transport and runtime              |
| `DATABASE_URL`                                                                | Isolated Neon branch for staging; protect production separately |
| `NEXTAUTH_SECRET` / `AUTH_SECRET`, existing auth settings                     | Session signing and authentication                              |
| `CRON_SECRET`                                                                 | Random secret for bearer-authenticated lifecycle scheduler      |
| `STAKR_ENTRY_FEE_BPS=500`                                                     | Default 5% entry fee, snapshotted at publication                |
| `STAKR_PLATFORM_CUT_BPS=2000`                                                 | Default 20% cut of failed stakes plus host contribution         |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BUCKET_NAME` | Private evidence storage; needs HEAD/GET/PUT/copy permissions   |
| `ENABLE_CASH_PAYMENTS=false`                                                  | Keep cash routes disabled for this release                      |

`vercel.json` schedules `/api/cron/lifecycle` every five minutes. Use a scheduler/deployment configuration that supports this interval, with `Authorization: Bearer <CRON_SECRET>`. Each invocation processes at most three challenges, with retry/backoff in `challenge_lifecycle_queue`; monitor backlog and processing failures. Operators can also process individual challenges from the admin screen. S3 must remain private with CORS permitting the staging/app origin to PUT supported media, and confirmed evidence must not be publicly writable. Configure retention for abandoned temporary uploads.

## Validation and remaining release gates

Local verification: 204 tests passed, including 22 SQL-backed lifecycle scenarios using embedded PostgreSQL (PGlite), plus UI interaction/transport tests. These cover ledger rollback, replay safety, deterministic cent conservation, evidence ownership, neutral reviewers, appeals, host funding, suspension and cancellation. The 29 pre-existing quarantined tests remain skipped; the 15 wire-protocol PostgreSQL acceptance tests require their dedicated database and remain a separate gate. PGlite exercises actual SQL/transactions but does not prove concurrent Neon transport behaviour.

Run `npm run test:ci`, `npm run type-check`, `npm run lint`, `npm run build`, then `STAKR_TEST_DATABASE_URL=... npm run test:db` against a dedicated database ending `_test`.

Before merge/release, complete all of:

- Restore GitHub Actions: the earlier run was rejected before jobs started because the GitHub account was locked for billing.
- Connect an isolated Neon staging branch. The requested connection is still pending; no remote database writes were performed.
- Apply migrations to that staging schema and run the real wire-protocol concurrent join suite, including the competing settlement/cancellation and publication-retry scenarios, then verify grant retries against Neon.
- Exercise authenticated browser flows with two participants and two independent admins, including private S3 upload/download. Browser verification could not complete in this workspace: agent-browser daemon failed, browser download encountered certificate/time-out errors, and the dev server’s localhost listener was not reachable from a separate command. DOM interaction tests are not a substitute for that gate.
- Reconcile existing balances, provision the scheduler and verify an actual scheduled invocation. The app is not deployed by this PR.

Community/social expansion, cash payments, insurance, team challenges, external-provider auto-verification and XP-only rewards remain outside this credits release. Their presence in legacy files does not imply support. The existing June recovery plan’s staging gate remains in force.
