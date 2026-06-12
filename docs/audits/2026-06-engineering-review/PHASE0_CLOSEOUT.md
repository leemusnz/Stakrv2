# Phase 0 Close-Out Report — DRAFT (pending engineer sign-off)

**To:** Stakr board (per Condition 1, board resolution 12 June 2026)
**Re:** `APPROVED_PLAN.md` Phase 0 — "Stop the bleeding"
**Status of work:** All 12 tickets (P0-1 … P0-12) implemented on branch `claude/epic-lamport-dh97z7`.
**Signatures:** ☐ Engineer 1 ☐ Engineer 2 (required before submission to the board)

---

## Ticket-by-ticket status

| # | Ticket | Status | Evidence |
|---|--------|--------|----------|
| P0-1 | Delete dev backdoor | ✅ | `app/api/dev-bypass/route.ts` deleted; middleware exemption removed; no references remain (`grep -r dev-bypass` clean) |
| P0-2 | Delete self-grant admin + DDL endpoints | ✅ | `app/api/grant-dev-access/route.ts`, `app/api/admin/add-team-column/route.ts` deleted |
| P0-3 | Boot guard; kill fallback secrets | ✅ | New `lib/assert-env.ts` wired into `instrumentation.ts` (production boot throws if `DATABASE_URL`/`NEXTAUTH_SECRET`/`ENCRYPTION_KEY`/`ALPHA_ACCESS_PASSWORD` missing, `STRIPE_WEBHOOK_SECRET` when Stripe configured). `lib/nextauth-secret.ts` and `lib/encryption.ts` throw in production instead of falling back; `alpha-access` default password removed (503 when unconfigured); alpha cookie now `httpOnly: true` |
| P0-4 | Webhook signature mandatory; no metadata trust | ✅ | Unsigned/unverifiable → 400 always; unconfigured → 503; amounts and identities reconciled from the stored pending `transactions` row (`lib/payments-service.ts`); covered by regression tests |
| P0-5 | Ledger SQL interpolation bug | ✅ | Descriptions passed as bound parameters in `join/route.ts` and `lib/reward-calculation.ts`; regression suite `tests/__tests__/phase0-ledger-regression.test.ts` (11 tests) proves a credits join issues participant + debit + ledger writes and a settlement INSERT succeeds, and fails if the literal-interpolation pattern returns |
| P0-6 | Stripe idempotency index | ✅ | `migrations/2026-06-12_phase0-fixes.sql` adds partial unique index on `transactions(stripe_payment_id)`; ON CONFLICT path + duplicate-event delivery exercised in tests |
| P0-7 | Restore build signal | ✅ | `ignoreBuildErrors`/`ignoreDuringBuilds` removed from `next.config.mjs`; **61 TypeScript errors fixed → `tsc --noEmit` = 0**; **178 lint errors fixed → `next lint` = 0 errors** (warnings remain, non-blocking); `/settings` renders (missing `BackgroundImage` import); production build passes |
| P0-8 | Gate demo/test routes | ✅ | 10 scaffolding routes 404 server-side in production via `middleware.ts` (`/demo`, `/mobile-demo`, `/proof-demo`, `/verification-demo`, `/test-avatar`, `/test-dashboard`, `/test-verification-system`, `/theme-preview`, `/design-preview`, `/dev-tools`); full deletion manifest due at Phase-1 start (Condition 5) |
| P0-9 | Passwordless provider disabled | ✅ | "verification" provider only registered when `ALLOW_DEV_AUTH=true` (default absent). Also removed: production demo-user login fallback and plaintext password comparison in the credentials provider |
| P0-10 | CI on and blocking; reproducible deploys | ✅ | Push + PR triggers restored; order install→type-check→lint→test→build; **57 `"latest"` dependencies pinned** to lockfile-resolved versions; `engines` fixed (npm, not pnpm); `installCommand: "npm ci"` in `vercel.json`; `.npmrc` frozen-lockfile overrides removed; husky + lint-staged pre-commit (`prepare: husky`) |
| P0-11 | Repo hygiene + CVE audit | ✅ | PowerShell junk file, `lighthouse-*.json`, `PRIORITY-QUEUE.json`, `.eng-state.json` deleted; 8 stale status docs → `docs/archive/`; `.gitignore` patterns added. Audit numbers below |
| P0-12 | SQLi + admin authz | ✅ | `financial-monitor` `timeRange` parsed to a bounded int and bound as a parameter; new `lib/require-admin.ts` (session + live DB `is_dev`/`has_dev_access` check) applied to **all 17 admin route files / 27 handlers**, replacing 3 inconsistent check patterns and the `alex@stakr.app` email backdoors; `image-proxy` now requires a session and no longer sends `Access-Control-Allow-Origin: *` (per-key authz remains Phase 2) |

## Verification gates (all green at close-out)

- `npx tsc --noEmit` → **0 errors** (was 61)
- `npm run lint` → **0 errors** (was 178; remaining warnings are `<img>`/hook-deps advisories)
- `npx jest --ci` → **141 passed, 0 failed**, 29 explicitly quarantined (see below)
- `npm run build` → succeeds with type-checking and linting enforced

### Test quarantine (explicit, per Phase-1 plan)
- `thumbnail-system.test.tsx` (suite) — tests a `YouTubeStyleChallengeCard` component that was never created
- `ai-verification-integration.test.ts` (suite) and 4 tests in `ai-challenge-analyzer.test.ts` — assert prompt/payload layouts the analyzer no longer uses
- These are scheduled for fix-or-delete in Phase 1 week 1 (Jest/Neon mock layer workstream)

## Answers to the board's questions 1–5

**Q1 — Why was webhook verification missing; what else receives unverified payloads?**
Root cause: the v0.dev scaffold pattern "work without env vars configured" was never hardened.
Inventory re-verified at close-out: Stripe webhook (fixed, P0-4); OAuth callbacks already do
state-validated token exchange (`lib/oauth-state.ts`) — and the Whoop callback now refuses to run
unconfigured; `image-proxy` had no auth (session now required, P0-12); `dev-bypass` and
`grant-dev-access` deleted (P0-1/2); alpha-access default password removed (P0-3). We found no
other inbound surface that accepts unverified payloads. Remaining known gap (accepted, Phase 2):
image-proxy authorizes any signed-in user, not per-file ownership.

**Q2 — Neon driver replacement?** None needed. Same package (`@neondatabase/serverless`);
`neon.transaction([...])` or the WebSocket `Pool` for interactive transactions in Phase 1.
Typing was corrected in Phase 0 (`NeonQueryFunction` — the package exports no `Sql` type), which
surfaced and fixed 8 latent query-shape bugs (e.g. `.count` read off a rows array that never has
it, a `sql.unsafe(text, params)` two-argument call that the driver does not support, and a
`sql(array)` IN-list helper that does not exist — replaced with `= ANY($1)`).

**Q3 — CVE audit (board Q3).** Against the pinned lockfile, `npm audit` reported
**20 vulnerabilities — 0 critical, 8 high, 11 moderate, 1 low**, all in transitive dependencies
(notably `basic-ftp`, `fast-xml-parser` via the AWS SDK chain, `lodash`, `yaml`, `ip-address`,
`flatted`, `brace-expansion`, `@tootallnate/once`). Non-breaking `npm audit fix` was applied in
this branch, reducing the count to **8 (2 high, 6 moderate, 0 critical/low)**; the remainder
require major-version bumps scheduled with Renovate (working agreement R7). The pre-existing
`overrides` block (preact/cookie/esbuild/@smithy) is retained, and pinning makes those patches
durable.

**Q4 — Ledger bug: patch or migration?** Code patch (P0-5), shipped with regression tests; no
schema migration touches existing rows. The corrective migration in this branch is additive only
(unique index + `email_verified` type fix). **Written assertion (CFO request): all pre-fix alpha
balances are unreliable until the Q4 audit script reconciles `users.credits` against
`Σ credit_transactions`; the audit script and founder-signed write-off are scheduled for Phase 1
week 4-5 (Condition 4).**

**Q5 — Cron failure runbook?** Unchanged from the approved plan: `/api/cron/lifecycle` ships in
Phase 1 behind `CRON_SECRET`; Sentry (already integrated, `instrumentation.ts`) carries alerts;
the nightly drift job doubles as the dead-cron watchdog ("ended but unsettled challenges" is an
invariant violation caught within 24h); engineers rotate weekly notification duty; overnight
failures are next-business-day, consistent with the board's business-hours SLA.

## Deviations from plan / notes for the board

1. The plan's estimate "lint = 0 (one autofix PR + 2 import fixes)" was optimistic: the true count
   was 178 errors (unescaped JSX entities), all mechanical, all fixed.
2. The plan listed "13 status .md" files for archiving; 8 existed at execution time (the other 5
   appear to have been deleted in earlier cleanup). Root now contains only `README.md` and
   `SECURITY.md`.
3. Development-only conveniences retained, all hard-gated: demo-user login (gated to
   `NODE_ENV=development`), the "verification" provider (gated to `ALLOW_DEV_AUTH=true`), demo/test
   pages (server-side 404 in production until the Phase-1 deletion manifest).
4. The deploy freeze stays in effect until the board accepts this report (Condition 1).
