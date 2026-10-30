# Running Stakr locally

You can run the whole app, with the **real Neon driver**, against a plain local
Postgres. No cloud account is needed and nothing you do here can touch
production.

## One-time setup

You need Node 22+, npm 10+ and PostgreSQL 16 (`psql` on your PATH).

```bash
npm ci

# 1. Create an empty database. The name MUST end in _dev, _test, _local or _staging.
createdb stakr_dev

# 2. Build the production schema into it (63 tables, from migrations/baseline).
npm run db:rebuild -- "postgresql://USER:PASS@localhost:5432/stakr_dev"

# 3. Apply migrations dated after the baseline, in date order.
psql "postgresql://USER:PASS@localhost:5432/stakr_dev" -f migrations/2026-10-30_rate-limit-hits.sql
```

`db:rebuild` refuses to run on a database that is not named like a throwaway one,
or that already has data, so it cannot damage anything real.

## Start it

The Neon driver speaks HTTP and WebSockets, which plain Postgres does not. A tiny
local proxy translates (it only ever connects to the database you name, and only
if that database is on localhost):

```bash
# terminal 1: the proxy
LOCAL_PG_URL="postgresql://USER:PASS@localhost:5432/stakr_dev?sslmode=disable" npm run db:proxy

# terminal 2: build and start the app (production mode, like Vercel)
export DATABASE_URL="postgresql://USER:PASS@localhost:5432/stakr_dev?sslmode=disable"
export STAKR_LOCAL_NEON_PROXY=localhost:4444
export NEXTAUTH_URL=http://localhost:3000 NEXT_PUBLIC_BASE_URL=http://localhost:3000
export NEXTAUTH_SECRET=$(openssl rand -hex 32) ENCRYPTION_KEY=$(openssl rand -hex 32)
export CRON_SECRET=$(openssl rand -hex 24) STAKR_ALPHA_GATE_DISABLED=true
npm run build && npm start
```

Without `RESEND_API_KEY` no email is sent (production-mode `sendEmail` refuses). To
verify an account locally, read its token from the database and open
`/auth/verify-email?token=<token>`:

```sql
select token from verification_tokens where email = 'you@example.test';
```

To make yourself an admin locally:

```sql
update users set is_dev = true, has_dev_access = true where email = 'you@example.test';
```

## Prove it works: the release journey

One command drives the real build in a headless browser through everything a
launch depends on, with explicit PASS/FAIL checks (about 80):

```bash
CRON_SECRET=<same value the server has> npm run test:journey
```

It covers: signup through the real onboarding screens, email verification (and the
regression where it showed "failed"), welcome credits, publishing a challenge,
joining with exact fee maths, evidence, neutral review, settlement **to the cent**
with credit conservation, admin suspension taking effect immediately, data export,
account deletion, rate limits, the locked-down legacy surface and security headers.

**It truncates the `users` table.** It refuses to run unless `DATABASE_URL` is a
localhost database ending `_dev`, `_test` or `_local`.

## Tests

```bash
npm run test:ci        # unit tests
STAKR_TEST_DATABASE_URL=postgresql://USER:PASS@localhost:5432/stakr_test npm run test:db
                       # Postgres acceptance tests (real schema, real concurrency)
npm run type-check && npm run lint && npm run build
```

`STAKR_TEST_DATABASE_URL` must name a dedicated database ending `_test`.
