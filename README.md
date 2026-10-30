# Stakr

Stakr is an accountability app. You back a commitment with **credits**, show your
progress with evidence that a neutral reviewer checks, and if you finish you get your
stake back plus a share of the credits others forfeit. Credits have no cash value and
cannot be bought or withdrawn.

Next.js 15 (App Router) · TypeScript · Neon Postgres · NextAuth · S3 for evidence ·
Resend for email · deployed on Vercel.

## Start here

| I want to…                                 | Read                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------ |
| Run it on my computer                      | [`docs/RUNNING_LOCALLY.md`](docs/RUNNING_LOCALLY.md)                                 |
| Launch it                                  | [`docs/release/RELEASE_CHECKLIST.md`](docs/release/RELEASE_CHECKLIST.md)             |
| Know what was fixed and what is still open | [`BUGS.md`](BUGS.md)                                                                 |
| Understand how challenges settle           | [`docs/audits/2026-09-16-mvp-lifecycle.md`](docs/audits/2026-09-16-mvp-lifecycle.md) |
| Rebuild the database                       | `npm run db:rebuild` (see `migrations/baseline/`)                                    |

## Commands

```bash
npm run dev            # local development
npm run build && npm start
npm run test:ci        # unit tests
npm run test:db        # Postgres acceptance tests (needs STAKR_TEST_DATABASE_URL)
npm run test:journey   # full browser release test (needs a local DB, see docs)
npm run type-check && npm run lint
```

## Health

`GET /api/health` reports whether the database, email, storage, cron secret, shared rate
limiter and reviewer accounts are configured, and whether the settlement cron is keeping
up. Point an uptime monitor at it.
