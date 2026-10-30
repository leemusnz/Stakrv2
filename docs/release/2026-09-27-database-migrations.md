# Database migration execution — 27 September 2026

Applied successfully to Neon project `cold-lab-24148964` (Stakr), branch
`br-rough-snowflake-a4ardvlz` (`main`), database `neondb`.

## Applied order

1. `migrations/2026-09-16_credit-ledger-prerequisite.sql`
2. `migrations/2026-09-16_atomic-joins.sql`
3. `migrations/2026-09-16_mvp-lifecycle.sql`

The existing database was missing `credit_transactions`. The prerequisite creates
the baseline ledger from `database-schema.sql` and its user index. It creates no
historical transactions and changes no balances. The existing `transactions`
table supplies its foreign-key target.

## Verification and recovery

- Rehearsed the complete bundle twice on parent-data branch
  `br-solitary-frog-a40k6hju` (`stakr-migration-rehearsal-20260927`). Both runs passed,
  including idempotency and original-value comparisons for all 55 existing tables.
- Retained pre-migration backup branch `br-fancy-flower-a4zwld4u`
  (`stakr-pre-migrations-20260927`), parent LSN `0/53535B0`, without a compute endpoint.
- Applied the same bundle to main in one transaction, stripping only the files'
  outer transaction statements. Used a five-second lock timeout and 60-second
  statement timeout. Existing tables were locked against concurrent writes while
  verifying original values before commit.
- Verified again through a fresh connection after commit: all eight new tables,
  seven named indexes, widened user credit precision, and original record values.
- Preserved 8 users, 7 challenges, 5 participants, 5 proofs, and every original
  value across all 55 pre-existing tables. All seven challenges remain lifecycle
  version 0. The new credit ledger is empty.
- Closed verification and rehearsal connections. Rehearsal compute is configured
  to suspend after 300 seconds of inactivity.

No challenge was converted, settled, refunded, or paid out. Legacy financial
reconciliation remains a separate task. This record confirms database migration
execution; it does not certify application deployment or all release gates.

The backup branch is the recovery source if needed; do not attempt a destructive
down migration or replace live data after subsequent writes without reconciliation.

## SHA-256 of executed files

| File | SHA-256 |
| --- | --- |
| `2026-09-16_credit-ledger-prerequisite.sql` | `40d9c5d8ea20d337a1b94945e6a7719db5d75952f8c44870103b500f32258b9d` |
| `2026-09-16_atomic-joins.sql` | `ac98af4e4942391c6da6ad45f44fbf35527c234becbf977df7a07b46b1879fd8` |
| `2026-09-16_mvp-lifecycle.sql` | `9456535de1141e37df5eb6385b0fd11c57162f4d45cda8336fcb20f9d90c510c` |
