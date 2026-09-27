/** @jest-environment node */
// Real PostgreSQL rollback and concurrency acceptance tests. CI provisions an
// isolated database; regular unit runs explicitly skip this suite.
import { Pool } from "pg";
import { readFileSync } from "node:fs";
import { joinChallenge } from "@/lib/challenge-join";

// Exercise the same transaction wrapper with PostgreSQL's wire driver locally.
// Neon WebSocket transport is a separate staging gate.
jest.mock("@neondatabase/serverless", () => ({
  Pool: jest.requireActual("pg").Pool,
}));

const databaseUrl = process.env.STAKR_TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;
const userA = "00000000-0000-4000-8000-000000000001";
const userB = "00000000-0000-4000-8000-000000000002";
const challengeA = "00000000-0000-4000-8000-000000000011";
const challengeB = "00000000-0000-4000-8000-000000000012";
const input = { stakeAmount: 50, pointsOnly: false, insurancePurchased: false };

describeDatabase("Join PostgreSQL acceptance", () => {
  let admin: Pool;
  let db: Pool;
  const originalUrl = process.env.DATABASE_URL;
  const schema = `join_acceptance_${process.pid}`;

  beforeAll(async () => {
    const url = new URL(databaseUrl!);
    if (!url.pathname.endsWith("_test"))
      throw new Error("Use a dedicated database ending in _test");
    admin = new Pool({ connectionString: databaseUrl });
    await admin.query(`CREATE SCHEMA ${schema}`);
    url.searchParams.set("options", `-c search_path=${schema},public`);
    process.env.DATABASE_URL = url.toString();
    db = new Pool({ connectionString: url.toString() });
    await db.query(`
      CREATE TABLE users (id uuid PRIMARY KEY, name text, credits numeric(10,2) NOT NULL, updated_at timestamptz DEFAULT now());
      CREATE TABLE challenges (
        lifecycle_version integer NOT NULL DEFAULT 1,
        id uuid PRIMARY KEY, host_id uuid, title text, status text, start_date timestamp, end_date timestamp,
        min_stake numeric(8,2) DEFAULT 0.01, max_stake numeric(8,2) DEFAULT 100,
        entry_fee_percentage numeric(4,2) DEFAULT 5, allow_points_only boolean DEFAULT false,
        enable_team_mode boolean DEFAULT false, proof_requirements jsonb DEFAULT '{}', max_participants integer
      );
      CREATE TABLE challenge_participants (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), challenge_id uuid REFERENCES challenges(id), user_id uuid REFERENCES users(id),
        stake_amount numeric(8,2), entry_fee_paid numeric(8,2), insurance_purchased boolean,
        insurance_fee_paid numeric(4,2), completion_status text, joined_at timestamptz
      );
      CREATE TABLE credit_transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id), amount numeric(10,2),
        transaction_type text, related_challenge_id uuid REFERENCES challenges(id), description text, created_at timestamptz
      );
    `);
    await db.query(
      readFileSync("migrations/2026-09-16_atomic-joins.sql", "utf8"),
    );
  });

  beforeEach(async () => {
    await db.query("DROP TRIGGER IF EXISTS fail_write ON credit_transactions");
    await db.query(
      "DROP TRIGGER IF EXISTS fail_write ON challenge_audit_events",
    );
    await db.query(
      "TRUNCATE challenge_audit_events, credit_transactions, challenge_participants, challenges, users CASCADE",
    );
    await db.query(
      "INSERT INTO users (id, credits) VALUES ($1, 100), ($2, 100)",
      [userA, userB],
    );
    await db.query(
      `INSERT INTO challenges (id, title, status, start_date, end_date)
      VALUES ($1, 'Test A', 'pending', (now() AT TIME ZONE 'UTC') + interval '1 day', (now() AT TIME ZONE 'UTC') + interval '2 days'),
      ($2, 'Test B', 'pending', (now() AT TIME ZONE 'UTC') + interval '1 day', (now() AT TIME ZONE 'UTC') + interval '2 days')`,
      [challengeA, challengeB],
    );
  });

  afterAll(async () => {
    process.env.DATABASE_URL = originalUrl;
    await db?.end();
    if (admin) {
      await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await admin.end();
    }
  });

  async function counts() {
    return (
      await db.query(`SELECT
      (SELECT count(*)::int FROM challenge_participants) participants,
      (SELECT count(*)::int FROM credit_transactions) ledger,
      (SELECT count(*)::int FROM challenge_audit_events) audit`)
    ).rows[0];
  }

  it("commits participant, debit, exact ledger and audit together", async () => {
    const joined = await joinChallenge(challengeA, userA, input);
    expect(joined.financial_breakdown.remaining_credits).toBe(47.5);
    expect(await counts()).toEqual({ participants: 1, ledger: 2, audit: 1 });
    const ledger = await db.query(
      "SELECT sum(amount) amount FROM credit_transactions WHERE user_id = $1",
      [userA],
    );
    expect(ledger.rows[0].amount).toBe("-52.50");
  });

  it.each(["credit_transactions", "challenge_audit_events"])(
    "rolls back everything when %s fails",
    async (table) => {
      await db.query(`CREATE OR REPLACE FUNCTION fail_join_write() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'injected failure'; END; $$;
      CREATE TRIGGER fail_write BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION fail_join_write();`);
      await expect(joinChallenge(challengeA, userA, input)).rejects.toThrow(
        "injected failure",
      );
      expect(await counts()).toEqual({ participants: 0, ledger: 0, audit: 0 });
      expect(
        (await db.query("SELECT credits FROM users WHERE id = $1", [userA]))
          .rows[0].credits,
      ).toBe("100.00");
    },
  );

  it("concurrent duplicate joins debit once", async () => {
    const attempts = await Promise.allSettled([
      joinChallenge(challengeA, userA, input),
      joinChallenge(challengeA, userA, input),
    ]);
    expect(attempts.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await counts()).toEqual({ participants: 1, ledger: 2, audit: 1 });
    expect(
      (await db.query("SELECT credits FROM users WHERE id = $1", [userA]))
        .rows[0].credits,
    ).toBe("47.50");
  });

  it("concurrent joins cannot oversubscribe the final place", async () => {
    await db.query("UPDATE challenges SET max_participants = 1 WHERE id = $1", [
      challengeA,
    ]);
    const attempts = await Promise.allSettled([
      joinChallenge(challengeA, userA, input),
      joinChallenge(challengeA, userB, input),
    ]);
    expect(attempts.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await counts()).toEqual({ participants: 1, ledger: 2, audit: 1 });
  });

  it("concurrent joins to different challenges cannot overspend one balance", async () => {
    const attempts = await Promise.allSettled([
      joinChallenge(challengeA, userA, input),
      joinChallenge(challengeB, userA, input),
    ]);
    expect(attempts.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await counts()).toEqual({ participants: 1, ledger: 2, audit: 1 });
    expect(
      (await db.query("SELECT credits FROM users WHERE id = $1", [userA]))
        .rows[0].credits,
    ).toBe("47.50");
  });

  it.each(["suspended", "cancelled", "ended", "rewards_distributed"])(
    "rejects %s without financial writes",
    async (status) => {
      await db.query("UPDATE challenges SET status = $1 WHERE id = $2", [
        status,
        challengeA,
      ]);
      await expect(joinChallenge(challengeA, userA, input)).rejects.toThrow(
        "no longer accepting",
      );
      expect(await counts()).toEqual({ participants: 0, ledger: 0, audit: 0 });
    },
  );

  it("rejects joins at or after start, even if the stored status is pending", async () => {
    await db.query(
      "UPDATE challenges SET start_date = now() AT TIME ZONE 'UTC' WHERE id = $1",
      [challengeA],
    );
    await expect(joinChallenge(challengeA, userA, input)).rejects.toThrow(
      "when the challenge starts",
    );
    expect(await counts()).toEqual({ participants: 0, ledger: 0, audit: 0 });
  });

  it("floors a fractional fee without balance/ledger drift", async () => {
    const result = await joinChallenge(challengeA, userA, {
      ...input,
      stakeAmount: 0.29,
    });
    expect(result.financial_breakdown).toMatchObject({
      entry_fee: 0.01,
      total_cost: 0.3,
      remaining_credits: 99.7,
    });
    expect(
      (await db.query("SELECT sum(amount) amount FROM credit_transactions"))
        .rows[0].amount,
    ).toBe("-0.30");
  });
});
