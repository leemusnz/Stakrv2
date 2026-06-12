# Stakr — Board Minutes: Engineering Recovery Plan (12 June 2026)

The consolidated engineering plan (see `ENGINEERING_DISCUSSION.md`) was put before a simulated
board — CEO, COO, CFO, CTO, and two investor-observers — as seven resolutions. Each member
submitted an independent memo with votes; the Chairman then tallied, ruled on conflicts, and
issued the binding resolution (reproduced at the end; also extracted into `APPROVED_PLAN.md`).

**The seven resolutions voted on:**
- **R1.** Execute Phase 0 "stop the bleeding" immediately; public deploy freeze until complete.
- **R2.** Points-only v1 launch scope (~6 wks post-Phase-0); real money server-side flagged OFF; wallet → non-interactive "coming soon" + waitlist.
- **R3.** v1 cut list (demo/test pages deleted; brands/creators shelved; fake anti-cheat removed; team/insurance options removed).
- **R4.** Fail-closed verification: human review queue, auto-approve ≤50-point stakes, 24h SLA + queue monitoring as launch gates.
- **R5.** Three usability additions in Phase 1: daily reminders, discover search, starter auto-enroll.
- **R6.** Phase 2 (real money, ~8 wks) contingent on a v1 metric gate + independent security re-review + payments-compliance review.
- **R7.** Engineering discipline standard: blocking CI, pinned deps, npm ci deploys, before Phase 1 feature PRs.

---

## BOARD MEMO — CEO

**Situation reading:** We built a storefront before we built a store. The product looks like a
money app and currently has the security posture of a novelty site. The "green build" was a lie
of omission; discovering 61 suppressed type errors and disabled CI in a board review is a
governance failure. The good news: the 55% that works is the right 55% — the retention mechanics.
Points-only is a real product if executed with discipline; real money is a Series A conversation,
not a launch conversation.

**Votes:** R1 APPROVE unconditionally. R2 APPROVE ("earn your spot before you stake real money"
is better positioning than a broken wallet). R3 APPROVE (ship nothing you cannot stand behind).
R4 APPROVE (24h SLA is a hard launch gate). R5 APPROVE-WITH-CONDITIONS (reminders/auto-enroll
only after the loop is verified end-to-end in staging; search may parallel). R6
APPROVE-WITH-CONDITIONS (gate: 40% of users completing one challenge complete a second within 30
days, ≥500-user cohort, 3 consecutive weeks; independent security sign-off; Stripe standing
confirmed; compliance counsel engaged). R7 APPROVE as a prerequisite.

**Questions:** (1) Why was webhook signature verification absent, and what other integrations
receive unverified payloads? (2) Waitlist size, and points- vs money-motivation signal? (3)
Review-queue volume at launch scale and the staffing plan — or is founder bandwidth the
assumption?

**Condition:** Written Phase-0 close-out certified by both engineers, delivered to the board.
Until then: no further spend, no communications referencing a launch date.

---

## BOARD MEMO — COO

**Situation reading:** We have a demonstration with live infrastructure bolted on, not a shippable
product. The phased plan is disciplined and the cut list appropriate. My concern is not the code —
it is that Phase 1 introduces a human-staffed verification queue with a 24h SLA and nobody in
this plan owns it, is trained for it, or is budgeted for it.

**Votes:** R1 APPROVE (fire, not backlog). R2 APPROVE (wallet non-interactive before any alpha
invite). R3 APPROVE. R4 APPROVE-WITH-CONDITIONS (SLA defined business-hours-only 9–6 M–F until
volume known; strict timestamp validation on auto-approve; named queue owner documented
pre-launch). R5 APPROVE (reduces support load). R6 APPROVE-WITH-CONDITIONS (gate: ≥200 MAU
completing ≥1 challenge, dispute rate <5%, zero critical findings in re-review; compliance review
scoped and budgeted before Phase 2 — a legal resource, not an engineering task). R7 APPROVE.

**Questions:** (1) Who staffs the queue, contracted hours, named escalation at hour 8? (2)
Expected proof-rejection rate and modeled support-ticket volume? (3) Has Stripe confirmed account
standing and Connect use-case eligibility, or are we assuming approval?

**Condition:** Written ops runbook (owner, staffing schedule, escalation chain, SLA definition,
dispute process, monitoring thresholds) signed off before Phase-1 launch gates open.

---

## BOARD MEMO — CFO

**Situation reading:** At ~$200k fully loaded per engineer, 30 engineer-weeks is roughly **$290k
in labor before a single dollar of fee revenue** — assuming zero slip and no external compliance
spend. The fraud exposure is not theoretical: a forged webhook is a direct P&L event. The ledger
atomicity failure and the SQL bug together mean we cannot trust any balance figure the system has
ever produced — material even points-only, because **points are a liability on our books**.

**Votes:** R1 APPROVE unconditional (liability triage). R2 APPROVE-WITH-CONDITIONS (money UI
removed server-side, auditable — flagged features get unflagged by accident). R3 APPROVE (burn
hygiene). R4 APPROVE-WITH-CONDITIONS (50-point auto-approve threshold reviewed at day 30 against
fraud data; queue staffing costed as a budget line). **R5 REJECT** (nice-to-haves competing with
closing the core loop; first cause of slip; revisit post-v1 with data). R6
APPROVE-WITH-CONDITIONS (gate must include willingness-to-pay: ≥200 active completions AND ≥30%
click-through on a "stake real money" waitlist CTA; external paid security re-review; written
regulatory opinion on money transmission per jurisdiction — hard gate). R7 APPROVE unconditional
(these are financial controls; 57 floating deps would void cyber insurance).

**Questions:** (1) Points-ledger remediation plan + written assertion that pre-fix balances are
unreliable? (2) Projected OpenAI verification cost at 500/2k/10k completions and the human-cost
crossover? (3) Named external counsel for the money-transmission/gambling review, cost, lead time?

**Condition:** Ledger integrity provably correct for points before any Phase-2 budget: atomic
writes, nightly reconciliation alerting on mismatch, and pre-fix ledger state audited and
corrected or written off.

---

## BOARD MEMO — CTO

**Situation reading:** Five independent teams converging on identical rot is signal. The bones are
real — parameterized SQL, schema coherence, auth wiring — but v0 scaffolding left landmines in
exactly the wrong places: ledger, settlement, security perimeter. **I vote patch, not rewrite.**
A greenfield backend at this headcount ships zero to users and takes longer than 15 weeks.
Rewrite advocacy at this stage is usually a purity argument dressed as an engineering argument.
The condition is strict gates, not blank-slate indulgence.

**Votes:** R1 APPROVE. R2 APPROVE (money-off is a technical requirement — atomicity isn't solved).
R3 APPROVE-WITH-CONDITIONS (signed deletion manifest before Phase-1 kickoff; no "shelved" routes
live behind a flag). R4 APPROVE (hold the 50-point ceiling). R5 APPROVE (table-stakes retention;
correct prioritization). R6 APPROVE-WITH-CONDITIONS (gate: ≥200 completed loops with zero ledger
errors in a 14-day prod window + security re-review + legal sign-off on instrument
classification). R7 APPROVE (no feature PRs until CI green and ratchet live).

**Questions:** (1) Tested replacement for the Neon HTTP driver on the money path, validated on a
staging Neon branch with real migrations? (2) Settlement-cron failure runbook and alerting path,
given no on-call rotation? (3) Has a CVE audit of the current lockfile been run?

**Condition:** A staging environment — isolated Neon branch, synthetic seeded ledger, `npm ci`
from a pinned lockfile — operational and gating PRs before any Phase-1 feature work. Without it,
every Phase-1 estimate is fiction.

---

## BOARD MEMO — INVESTOR A (GROWTH, advisory)

**Situation reading:** This review is a liability disclosure, not a speed bump. The 15-week
timeline to the real-money wedge is uncomfortable but the sequencing is sound. My concern is pace
inside the plan: six weeks for a points loop on a known scope sounds padded — I want a concierge
alpha in users' hands by week 3–4, because every week without behavioral data is a week of
narrative we cannot sell to a Series A. The existential question is whether points-only produces
a retention signal distinguishable from every other habit app — that answer comes from users, not
the roadmap.

**Votes:** R1 APPROVE (written security sign-off closes the freeze). R2 APPROVE-WITH-CONDITIONS
(**50-user concierge alpha running a live challenge loop by end of week 4 of Phase 1**; slip →
revisit burn). R3 APPROVE (cut ruthlessly). R4 APPROVE. R5 APPROVE ("the difference between a
retention signal and noise"; auto-enroll kills the cold-start). R6 APPROVE-WITH-CONDITIONS
(rolling 28-day cohort ≥150 users: D14 challenge retention ≥40%; completion ≥55%; ≥30% join a
second challenge within 30 days; ≥200 confirmed-email cash waitlist; + security re-review + legal
sign-off). R7 APPROVE (condition of deployment access).

**Questions:** (1) Biggest technical risk to the week-4 alpha and the mitigation? (2) Explicit
two-engineer ownership split; any blocking dependency; is a third contractor the unlock? (3)
Ledger-bug root cause — patch, or a migration that risks existing data?

**Condition:** Written Phase-0 close report signed by both engineers (vulnerabilities closed and
independently verified; ledger crash fixed and regression-tested) before end of week 2, or burn
pauses.

---

## BOARD MEMO — INVESTOR B (FINTECH PRAGMATIST, advisory)

**Situation reading:** The codebase confirms what kills fintech startups: the ledger was treated
as a UI concern rather than the source of truth. The team found it before users did, and the plan
is structurally sound. My substantive concern: ledger discipline — atomicity, immutable
transaction log, invariant checks, reconciliation — is deferred to Phase 2, where the money
timeline will pressure it. **Points are a liability-like ledger the moment a user can stake them;
if the points ledger is wrong at v1, you migrate bad state into money. Pull reconciliation and
atomicity into Phase 1.**

**Votes:** R1 APPROVE. R2 APPROVE (points-first proves the ledger before money amplifies bugs
into lawsuits). R3 APPROVE-WITH-CONDITIONS (server-side removal, not frontend gating). R4
APPROVE-WITH-CONDITIONS (defined escalation path; auto-approve threshold a config value auditable
in the ledger, not a hardcoded constant). **R5 REJECT** (Phase-1 bandwidth belongs to ledger
integrity, not reminders and search). R6 APPROVE-WITH-CONDITIONS (compliance review MUST cover:
wager-vs-skill-contest classification in NZ/AU/UK/each US state marketed; money-transmission
licensing — pooling and disbursing user funds is the definition in most US states; KYC/AML under
Stripe Connect and FATF/FinCEN thresholds; prize/sweepstakes rules for free-entry variants;
jurisdiction sequencing — an NZ-first geo-blocked soft launch is far lower risk. Structural
mitigations to evaluate before Phase-2 build: platform fee only on net winnings; never holding
pooled funds in a company account — Connect direct charges/escrow keeps custody off the balance
sheet; a no-purchase-entry path where the contest/gambling line is unclear). R7 APPROVE.

**Questions:** (1) Migration plan for partial-payout records already in the DB from alpha
testing? (2) Ledger-drift detection during the points-only period, before the Phase-2
reconciliation job exists? (3) Precise fail-closed semantics when the queue is unavailable:
challenge frozen, stake refunded, or user blocked — and is the state recoverable without manual
intervention?

**Condition:** A payments-and-gaming attorney (NZ/US multi-state) engaged for a written opinion
on money transmission + wager/skill classification before a single line of Phase-2 code.

---

# BOARD RESOLUTION — STAKR ENGINEERING RECOVERY PLAN
**Adopted: 12 June 2026 | Chairman presiding**

## (a) VOTE TALLY

| Res | Votes | Ruling |
|-----|-------|--------|
| **R1** | 6-0 APPROVE | **CARRIED** — immediate; public deploy freeze holds until Phase-0 close-out certified |
| **R2** | 6-0 APPROVE (2 conditioned) | **CARRIED** — money UI removed server-side, auditably, before any alpha expansion; wallet page non-interactive before first alpha invite |
| **R3** | 6-0 APPROVE (2 conditioned) | **CARRIED AS AMENDED** — deletion is server-side removal, not flag-gating; signed deletion manifest delivered pre-Phase-1; no shelved routes live behind flags |
| **R4** | 6-0 APPROVE (3 conditioned) | **CARRIED AS AMENDED** — SLA is business-hours (09:00–18:00 M–F) until volume data exists; auto-approve threshold is a config value auditable in the ledger (not hardcoded), capped at 50 points, reviewed at day 30 against fraud data; named queue owner and escalation chain documented pre-launch |
| **R5** | 4-2 APPROVE (CFO + Investor B reject) | **CARRIED AS AMENDED** — sequenced: daily reminders and auto-enroll only after the core challenge loop is verified end-to-end in staging; discover search may begin in parallel; all three are first-cut if Phase-1 slips past week 6. Rationale: Investor A is correct that the R6 retention gates are unachievable without retention tooling; that outweighs the bandwidth concern, which the sequencing constraint addresses |
| **R6** | 6-0 APPROVE (all conditioned) | **CARRIED AS AMENDED** — consolidated gate in section (c) |
| **R7** | 6-0 APPROVE | **CARRIED** — blocking CI (zero type errors, zero lint errors, coverage ratchet), pinned deps, npm ci deploys; no feature PRs merge until CI is green and ratchet live |

## (b) CONSOLIDATED CONDITIONS

1. **[Engineering / Phase-0 exit]** Written Phase-0 close-out report signed by both engineers — self-grant backdoor deleted, Stripe webhook signatures enforced, ledger SQL crash patched with regression test, build checks re-enabled, demo/admin pages gated, CI on — delivered to the full board no later than end of week 2. Deploy freeze and spend hold lift only upon delivery.
2. **[Engineering / Phase-0 exit]** All external integrations receiving unverified payloads identified and patched in Phase 0, not deferred.
3. **[Engineering / Phase-1 start]** Staging environment operational before any Phase-1 feature work: isolated Neon branch, synthetic seeded ledger, npm ci with pinned lockfile, gating all PRs.
4. **[Engineering / Phase-1 start]** Points-ledger atomicity and nightly drift/invariant alerting pulled into Phase 1 scope — not deferred to Phase 2. Pre-fix ledger state formally audited and written off. Timeline impact absorbed by the R5 sequencing constraint.
5. **[Engineering / Phase-1 start]** Signed deletion manifest confirming server-side removal of all demo, test, and shelved-feature routes delivered pre-Phase-1.
6. **[Founder-CEO / Phase-1 launch]** Ops runbook signed off before launch gates open: named queue owner, staffing schedule and contracted hours, escalation chain (named person at hour 8), SLA definition, dispute process, monitoring thresholds.
7. **[Founder-CEO / Phase-1 launch]** Queue staffing costed as a named budget line; projected proof-rejection rate and modeled support-ticket volume documented.
8. **[Founder-CEO / Phase-1, week 4]** 50-user concierge alpha running a live challenge loop end-to-end by end of week 4 of Phase 1. Slip triggers a board burn-rate review.
9. **[Founder-CEO / Phase-2 start]** Payments-and-gaming attorney (NZ/US multi-state) engaged for written opinion on: money-transmission licensing; wager-vs-skill-contest classification per jurisdiction; KYC/AML obligations under Stripe Connect; prize/sweepstakes rules; jurisdiction sequencing. Engagement confirmed with scope and budget before any Phase-2 code.
10. **[Founder-CEO / Phase-2 start]** Stripe account standing and Connect eligibility confirmed in writing from Stripe before Phase-2 build.
11. **[Engineering / Phase-2 start]** Ledger integrity demonstrably correct for points: atomic writes live in production, nightly reconciliation alerting on mismatch, pre-fix ledger state audited/written off, zero ledger errors in the Phase-2 gate window. Hard prerequisite; Phase-2 budget does not open until satisfied.
12. **[Board / ongoing]** No public launch-date communications until the Phase-0 close-out report is delivered and accepted.

## (c) THE PHASE 2 GATE

**Metric gate** (rolling 28-day cohort, ≥3 consecutive weeks):
- Cohort: ≥200 confirmed-email users who have completed at least one challenge *(150 is the statistical floor; 500 aspirational; 200 binding)*
- D14 challenge retention ≥40% (second challenge started by day 14)
- Completion rate ≥55% of started challenges
- Re-engagement: ≥30% of completers join a second challenge within 30 days
- Willingness-to-pay: ≥30% click-through on a "stake real money" waitlist CTA
- Dispute/support rate <5% of completed challenges
- Ledger integrity: zero ledger errors in the 14-day window preceding authorization

**Non-metric gates (all hard):** independent paid security re-review with zero unresolved critical
findings; written legal opinion per Condition 9; Stripe Connect standing per Condition 10; board
formal vote to authorize Phase-2 spend after reviewing gate evidence.

## (d) QUESTIONS REFERRED TO ENGINEERING

**Technical** — (1) Root cause of missing webhook signature verification; which other integrations
receive unverified payloads and the remediation for each. (2) Tested replacement for the Neon HTTP
driver on the money path, validated on staging with real migrations. (3) CVE audit of the current
lockfile: results and critical findings. (4) Ledger-bug root cause: patch or data-touching
migration; rollback plan; are pre-fix balances formally written off? (5) Settlement-cron failure
runbook and alerting path with no on-call rotation.
**Operations** — (6) Review-queue volume at 500/2,000/10,000 completions; staffing and
founder-bandwidth assumption. (7) Fail-closed semantics when the queue is unavailable; is the
state recoverable without manual intervention? (8) Migration plan for partial-payout records
already in the database.
**Commercial/Legal** — (9) Projected AI-verification cost at 500/2k/10k completions and the
human-cost crossover; recommended staffing model. (10) Named external counsel, estimated cost,
lead time.

*Answers to 1–5 are required in the Phase-0 close-out report; 6–10 before Phase-1 launch gates open.*

## (e) CLOSING DIRECTIVE TO ENGINEERING

Phase 0 is not optional prioritization — it is liability triage, and nothing else ships until the
close-out report is signed by both engineers and accepted by this board. Execute in strict order:
Phase 0, then staging environment, then ledger atomicity and drift detection, then CI discipline,
then Phase-1 features. The concierge alpha running a live loop by week 4 is a binding board
milestone, not a target — miss it and the board convenes a burn-rate review the following week.
Real-money infrastructure does not get a line of code written until every metric and non-metric
gate in section (c) is satisfied in writing; any attempt to pull Phase-2 work forward will be
treated as a material breach of this resolution. This plan gets revoked — and engineering access
reviewed — if Phase-0 findings are understated in the close-out report, if the staging gate is
bypassed to ship features faster, or if public launch-date claims are made before the board lifts
the freeze.
