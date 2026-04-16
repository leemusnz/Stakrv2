# Stakr Release Checklist (Production)

Last updated: 2026-04-16
Production URL: https://stakr.app
Vercel project: v0-stakr-v2

Use this file as the single launch tracker. Mark each checkbox only after running the exact verify step.

## 0) Release safety rules

- [ ] No direct launches from unverified commits.
- [ ] Every item below has a human verification step completed.
- [ ] Any blocker found in smoke tests is fixed before public announcement.

## 1) Production configuration lock (must pass first)

- [ ] Vercel env `NEXTAUTH_URL` is exactly `https://stakr.app`.
  - Verify: Vercel Dashboard -> Project Settings -> Environment Variables -> Production.
- [ ] Vercel env `NEXTAUTH_SECRET` exists and is non-empty in Production.
  - Verify: same screen as above.
- [ ] Launch mode explicitly chosen:
  - [ ] Invite mode (alpha gate ON), or
  - [ ] Public mode with `STAKR_ALPHA_GATE_DISABLED=true`.
  - Verify: open `https://stakr.app` in private browser and confirm expected behavior.
- [ ] Sentry DSNs set (if monitoring enabled): `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`.
  - Verify: create one test client error and confirm it appears in Sentry Issues.

## 2) Deployment health checks

- [x] Latest production deployment is READY on Vercel.
  - Verified via MCP: latest deployment for `main` is READY.
- [ ] Production deployment commit matches intended release commit.
  - Verify: Vercel deployment details -> commit SHA.
- [ ] No active runtime error spikes in last 2h.
  - Verify command: `node scripts/release-smoke-check.js` then inspect Vercel runtime logs.

## 3) Critical smoke tests (mobile + desktop)

- [ ] Sign in succeeds without "session is still initializing" error.
  - Verify: real device + desktop, sign in and land on callback/dashboard.
- [ ] Session persists across refresh on protected routes.
  - Verify: refresh `/dashboard` then `/discover`, remain signed in.
- [ ] Mobile dropdown/select controls are tappable.
  - Verify: open challenge creation form on phone and select values.
- [ ] Notifications page loads without unauthorized console noise when signed out.
  - Verify: signed out visit and inspect browser console.
- [ ] Legal pages open publicly: `/privacy` and `/terms`.
  - Verify: incognito access without account.

## 4) Business and trust readiness

- [ ] Privacy policy copy approved for launch.
- [ ] Terms of service copy approved for launch.
- [ ] Support inboxes monitored (`support@stakr.app`, `legal@stakr.app`, `privacy@stakr.app`).
- [ ] Incident owner assigned for launch week.

## 5) Launch execution

- [ ] Soft launch cohort invited (10-30 users).
- [ ] 48-hour observation: monitor auth failures, runtime errors, conversion drop-offs.
- [ ] Top 3 launch issues triaged and fixed.
- [ ] Public announcement scheduled and published.

---

## Quick commands

```bash
# Build sanity
npm run build

# Release smoke (HTTP-level checks against production)
npm run release:smoke

# Existing mobile checks
npm run test:mobile
```
