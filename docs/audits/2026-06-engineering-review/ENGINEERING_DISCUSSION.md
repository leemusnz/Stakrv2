# Stakr — Cross-Team Engineering Discussion (June 2026)

After the five reviews (see `ENGINEERING_FINDINGS.md`), each lead received the other teams'
findings and took positions on five contested questions, re-verifying disputed claims in code.
Position memos follow verbatim, then the consensus that went to the board.

The five questions:
- **Q1** — What must land in week 1?
- **Q2** — Points-only v1 with money rails feature-flagged off: support/oppose/amend?
- **Q3** — Brands/creators marketplace: cut for v1, or wire to the existing real APIs?
- **Q4** — v1 verification fail-closed to a human review queue, AI assist optional?
- **Q5** — Disputes with other teams' claims + the one "die on this hill" item.

---

## POSITION MEMO — BACKEND LEAD

**Q1. WEEK-1 MUST-LAND (max 6, file-level)**
1. `app/api/grant-dev-access/route.ts` — delete or gate (SECURITY CRIT; self-grant admin)
2. `lib/nextauth-secret.ts` + `app/api/dev-bypass/route.ts` — assertEnv boot guard; remove fallback secret and Vercel-URL bypass
3. `app/api/challenges/[id]/join/route.ts:231-241` + `lib/reward-calculation.ts:420,516` — fix `${title}` interpolated inside SQL string literal (all ledger INSERTs throw; blocks every join and every settlement)
4. `lib/db/index.ts` — replace `neon()` HTTP driver with Pool + transaction helper; every multi-step money write is currently non-atomic
5. `next.config.*` — remove `ignoreBuildErrors`/`ignoreDuringBuilds`; fix the 2 runtime-crash lint errors
6. `lib/payments-service.ts:92` — add `UNIQUE` index on `transactions.stripe_payment_id`

**Q2 — AMEND SUPPORT.** Support the split, but the flag boundary must be drawn at the DB layer,
not just the UI. The ledger SQL bug and non-atomic writes corrupt credits joins identically to
cash joins — they share the same INSERT paths. Points-only v1 is only safe after those two fixes
land. Then gate the Stripe checkout path on an `ENABLE_CASH_PAYMENTS` env var returning 403.

**Q3 — CUT.** Tables are empty and the frontend is 100% mock; wiring delivers nothing until
content exists. Shipping empty lists degrades credibility more than shipping nothing.

**Q4 — AGREE.** Current fail-open (auto-approve at confidence 50, hardcoded layer scores) is a
direct financial loss path. Mitigate queue latency by surfacing the expected review SLA at
proof-submit time and adding a queue-depth alert.

**Q5 — DISPUTES + HILL.** Dispute (BUILD): "green is fake" is accurate for tests but overstates
runtime breakage — only `/settings` and `verification-demo` actually crash; the other 59 tsc
errors are type-only. Dispute (SECURITY, unresolved): image-proxy claim needs a 30-min spike to
confirm it can reach private presigned paths. **HILL:** the `${title}` SQL literal interpolation
bug is the single most important fix — a thrown exception on every credits join and every reward
distribution. Everything else in the v1 plan is predicated on it. *(Verified in code: lines
234-235, 240-241 of the join route; 420 and 516 of reward-calculation; no transaction support in
`lib/db/index.ts`.)*

---

## POSITION MEMO — FRONTEND LEAD

**Q1. WEEK-1 MUST-LAND**
1. `app/api/grant-dev-access/route.ts` — delete or gate; day-zero breach
2. `lib/nextauth-secret.ts` + `lib/encryption.ts` — hard-fail on missing env vars
3. `app/settings/page.tsx:278` — fix missing `BackgroundImage` import (confirmed crash)
4. `next.config` — remove ignore flags; force tsc + lint to gate every merge
5. `app/api/payments/webhook/route.ts` — require `STRIPE_WEBHOOK_SECRET` or 400; stop trusting `metadata.stakeAmount/userId`
6. All 11 demo/test routes — auth-guard or remove

**Q2 — SUPPORT WITH AMENDMENT.** Deposit is a confirmed `setTimeout` fake; withdraw is
`alert()+reload`; Connect onboarding is absent. Don't show a gutted wallet behind the flag —
replace the route with a "Coming Soon: Cash Stakes" page that collects waitlist emails. Points
balance/history get their own UI surface, clearly separate from cash.

**Q3 — CUT** (reversing my original "wire it" proposal). Wiring UI to real APIs that return zero
rows produces the same blank experience users see today, but costs a sprint. Wire it when there
is actual brand/creator content.

**Q4 — AGREE.** Mandatory UX deliverable bundled with the backend change: an explicit
"Under Review — typically within 24h" state, a `pending_review` status chip, and a notification
when the queue clears. Without that state, users assume submission failed and resubmit or churn.

**Q5 — DISPUTES + HILL.** Nuance on Backend's framing: ProofSubmission's POST to the checkins API
works — the break is downstream in rollup/distribution, which matters for sequencing (check-in
submission can ship before the distribution fix, as long as we don't promise payout timing).
Re-verified my own claims: my-active:497 console.log stub, wallet:307-315 setTimeout fake,
settings:278 missing import — all confirmed. **HILL:** no interactive-looking fake money UI may
ship in any flag state. One user typing a card number into a fake form ends the product's
credibility on launch day.

---

## POSITION MEMO — SECURITY LEAD

**Q1. WEEK-1 — DELETE/DISABLE (hours):**
1. `app/api/dev-bypass/route.ts` — DELETE the file entirely (verified: also `httpOnly:false, secure:false` cookie — worse than originally reported)
2. `app/api/grant-dev-access/route.ts` — DELETE or admin-gate
3. `next.config.*` — remove ignore flags
**BUILD (days):**
4. `assertEnv()` boot guard crashing at startup if `NEXTAUTH_SECRET`/`ENCRYPTION_KEY`/`STRIPE_WEBHOOK_SECRET` unset — no fallbacks, no defaults
5. `app/api/payments/webhook/route.ts:23-27` — remove the unsigned-JSON branch; 400 when secrets absent
6. `lib/auth.ts:290-335` — disable the email+userId passwordless provider or gate behind explicit `ALLOW_DEV_AUTH=true`

**Q2 — SUPPORT (with amendment).** Deferring real money materially shrinks the pre-launch attack
surface: the entire Stripe surface and AES/payout fraud surface become unreachable. Minimum bar
for points-only alpha: assertEnv guard; both backdoors deleted; ignore flags off with zero
crash-path errors; `requireAdmin()` on all /admin routes; rate limiter backed by Redis or DB.
Additional bar for real-money GA: mandatory webhook signatures + idempotency index; real atomic
writes; AES key rotated; withdraw re-audited; Connect onboarding; CSP + image-proxy authz.
**Amendment: the flag must be enforced server-side — a UI-only flag is bypassable by direct API
call.**

**Q3 — CUT.** Wiring adds authenticated endpoints and untested authz paths at launch with zero
product value gating on it.

**Q4 — AGREE, with abuse caveats.** Collusion (reviewer approves own-challenge participants —
forbid) and review fatigue (per-reviewer daily cap; second-reviewer flag for borderline). Process
controls, appropriate for alpha.

**Q5 — DISPUTES + HILL.** Backend's withdraw double-count: **conceded in part** — my "withdraw is
hardened" positive is amended to "hardened assuming `credits` is a gross ledger; if the join
debits at stake time (backend says it does at `join/route.ts:221`), the locked-stakes subtraction
double-deducts against the user." **HILL: delete `app/api/dev-bypass/route.ts` before any
deployment to a public URL.** One-file delete, zero regression risk, closes an unauthenticated
endpoint handing out gate-bypass cookies on every Vercel URL.

---

## POSITION MEMO — PRODUCT

**Q1. WEEK-1 MUST-LAND**
1. `grant-dev-access` — delete/gate (verified: self-escalation for any authenticated user)
2. `dev-bypass` + VERCEL_URL check — remove
3. `join/route.ts:234-235` — fix SQL literal interpolation (verified: literal dollar-brace inside the quoted string; same at reward-calculation.ts:420,516) — blocking every points join
4. Webhook signature verification; remove metadata.stakeAmount trust
5. Remove JWT fallback secret; NEXTAUTH_SECRET hard-required at startup
6. Remove ignore flags; fix `/settings` crash

**Q2 — AMEND ACCEPTED; CONSOLIDATED PHASED PLAN (2 engineers).** Backend is right: the ledger
bug hits POINTS joins identically — my "points-only v1 is clean" position was wrong.
- **Phase 0 — Stop the bleeding (days 1–5, both engineers):** kill self-grant, dev-bypass,
  unsigned webhook, JWT fallback (d1–2); fix SQL interpolation (d2–3); webhook signatures (d3);
  ignore flags off + /settings fix + tsc to 0 (d3–5); remove/gate 11 demo routes. ~5 eng-days.
- **Phase 1 — Points-only v1 (weeks 1–6):** w1–2 completion rollup, lifecycle cron, real
  check-ins GET, mandatory proof persistence (upload/confirm links media); w3–4 streaks,
  end-to-end points test, proof submission wired on prod pages, human moderation queue
  (fail-closed); w5–6 atomicity fix, remove ~30 if(false) blocks, coverage to ≥40%.
  Standing behind 6 calendar weeks at 2 engineers.
- **Phase 2 — Money (weeks 7–14):** Connect onboarding (L — from scratch); deposit checkout →
  credit top-up; unify CASH/credits join; webhook event coverage; idempotency index;
  image-proxy/upload security pass. ~8 calendar weeks at 2 engineers.

**Q3 — CUT (hold position).** A challenge platform with no working rewards is worse than a
challenge platform with no brand directory. Revisit post-money launch.

**Q4 — AGREE, with amendments.** 24h flat SLA is the churn threshold for short challenges —
target 4 business hours, 12h max, auto-escalation at 8h. Adopt self-serve auto-approve tied to
stake size: photo + timestamp metadata auto-approves if stake ≤ 50 credits AND timestamp within
challenge window AND no prior fraud flag. Above threshold → human queue.

**Q5 — DISPUTES + SURVIVORS + HILL.** Verified backend's claims — accurate, no concession needed
from them. Concede my own framing on completion rollup mechanism. Three new functions that
survive a hard scope cut: **daily reminders** (highest retention lever per unit effort),
**discover search** (join conversion), **starter auto-enroll** (activation; first-loop
guarantee). **HILL:** fix the SQL interpolation before any other backend work — every other fix
depends on ledger writes not throwing; slip it past day 2 and Phase 1 slips a week.

---

## POSITION MEMO — DEVEX/RELEASE LEAD

**Q1. WEEK-1 (hours/days)**
1. `next.config.mjs` — remove both ignore flags (2h; everything else is fiction until done)
2. `app/settings/page.tsx:278` — fix import (1h; verified: zero imports reference it)
3. CI yaml — uncomment push trigger; add tsc + lint as blocking gates (4h)
4. `package.json` — `prepare: husky`; pin the 57 `"latest"` deps from lockfile (4h)
5. `scripts/check-env.js` boot guard (4h)
6. Delete tracked junk incl. the U+F03C filename that breaks Windows checkouts (2h)
All six fit one engineer in two days.

**Q2 — SUPPORT, AMEND THE SEQUENCE.** Fix types first — not purism: the 61 errors include real
bugs (wrong enum case, nonexistent `session.user.role`, Zod misuse). Rewiring the loop on top
produces type-correct-looking code that silently uses wrong values. Gates before Phase-1 PRs:
tsc=0 blocking; lint=0 (one autofix PR); Jest green on non-DB suites with a Neon mock;
**coverage ratchet at 20%, not 70%** (70% is aspirational at a 6.2% baseline; ratchet prevents
slide). Week 1: gates live. Week 2: Jest mock. Week 3: e2e auth wiring.

**Q3 — CUT.** Zero test coverage on a separate actor model = unverifiable integration surface
that can corrupt the ledger Backend is simultaneously repairing.

**Q4 — AGREE with mandatory ops conditions.** Queue-depth metric + alert at >50 pending; SLA
enforced by cron with auto-escalation and audit log; ops dashboard (depth, median review time,
auto-approval rate); alert on >10%/hour queue growth. Otherwise "fail-closed" becomes "silently
stalls all completions for 3 days."

**Q5 — DISPUTES + DEFENSE + HILL.** Corroborations, not disputes: settings crash and config flags
verified in source. Defending "3 weeks to green" vs 6–9 week estimates: mine covers CI live and
blocking, types/lint zero, Jest non-DB green, e2e wired — it does NOT cover ledger/cron/wallet
work. The estimates are parallel tracks, not competing. **HILL: remove `ignoreBuildErrors` and
`ignoreDuringBuilds` before any other PR merges** — every other team's findings are invisible to
the build until compiler signal is restored.

---

## CONSENSUS REACHED (input to the board)

1. **Phase 0 "stop the bleeding" (~1 week, both engineers)** — unanimous; the merged week-1 list
   is: delete `dev-bypass` + `grant-dev-access` (+ `add-team-column` DDL endpoint); `assertEnv()`
   boot guard killing all fallback secrets/keys; mandatory Stripe webhook signatures + no
   metadata trust; fix the ledger SQL interpolation bug (+ regression test); unique index on
   `stripe_payment_id`; remove build ignore flags + fix `/settings` crash + tsc/lint to 0; gate
   or delete the 11 demo/test routes; CI on push, blocking; pin deps + `npm ci` deploys; repo
   junk purge; disable passwordless verification provider.
2. **Points-only v1 (~6 weeks), money rails OFF behind a server-side flag** — unanimous with
   amendments: ledger fixes land first (they hit points too); wallet route becomes a
   non-interactive "cash stakes coming soon" + waitlist; no functional-looking fake money UI in
   any state.
3. **Brands/creators: CUT for v1** — unanimous (frontend reversed).
4. **Verification fail-closed** — unanimous: human/admin review queue; auto-approve only for
   stakes ≤ 50 points with valid in-window timestamp and clean account; AI assist only when a key
   is present; SLA surfaced to users with a `pending_review` UI state; queue monitoring + alerts
   + auto-escalation are launch gates.
5. **Usability adds for v1:** daily reminders, discover search, starter auto-enroll (the three
   survivors of a hard cut).
6. **Recorded hills:** SQL-interpolation fix first (Backend, Product); `dev-bypass` deleted before
   any public deploy (Security); compiler signal restored before any PR merges (DevEx); no fake
   interactive money UI ever (Frontend).
7. **Consolidated estimate (2 engineers):** Phase 0 ≈ 1 wk → Phase 1 ≈ 6 wks → Phase 2 (money)
   ≈ 8 wks; points v1 live ~week 7, real-money GA ~week 15. DevEx's ~3-week green-build track
   runs in parallel inside Phases 0–1.
