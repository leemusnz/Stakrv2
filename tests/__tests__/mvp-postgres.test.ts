/** @jest-environment node */
import { Pool } from "pg";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createChallenge } from "@/lib/challenge-create";
import { joinChallenge } from "@/lib/challenge-join";
import { processChallenge, administerChallenge } from "@/lib/challenge-engine";
import { submitProof, reviewProof } from "@/lib/challenge-proofs";
jest.mock("@neondatabase/serverless", () => ({
  Pool: jest.requireActual("pg").Pool,
}));
jest.mock("@/lib/db", () => ({
  createDbConnection:
    () =>
    async (strings: TemplateStringsArray, ...values: unknown[]) =>
      (
        await db.query(
          strings.reduce((s, p, i) => s + (i ? "$" + i : "") + p, ""),
          values,
        )
      ).rows,
}));
const databaseUrl = process.env.STAKR_TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;
let db: Pool;
const host = "00000000-0000-4000-8000-000000000001",
  winner = "00000000-0000-4000-8000-000000000002",
  loser = "00000000-0000-4000-8000-000000000003",
  reviewer = "00000000-0000-4000-8000-000000000004";
const day = 86400000,
  midnight = () => Math.floor(Date.now() / day) * day;
function terms() {
  return {
    requestId: randomUUID(),
    title: "Daily walk",
    description: "Walk for thirty minutes every day.",
    category: "fitness" as const,
    difficulty: "easy" as const,
    startDate: new Date(midnight() + day).toISOString(),
    endDate: new Date(midnight() + 2 * day).toISOString(),
    requiredDays: 1,
    graceHours: 24,
    minStake: 1,
    maxStake: 100,
    hostContribution: 0,
    maxParticipants: 10,
    proofTypes: ["text" as const],
    proofInstructions: "Explain the duration and location of your walk.",
    rules: ["Walk for thirty minutes."],
  };
}
describeDatabase("MVP PostgreSQL concurrency", () => {
  let admin: Pool;
  const schema = "mvp_acceptance_" + process.pid;
  const original = process.env.DATABASE_URL;
  beforeAll(async () => {
    const url = new URL(databaseUrl!);
    if (!url.pathname.endsWith("_test"))
      throw new Error("Use a dedicated database ending in _test");
    admin = new Pool({ connectionString: databaseUrl });
    await admin.query(`CREATE SCHEMA ${schema}`);
    url.searchParams.set("options", `-c search_path=${schema},public`);
    process.env.DATABASE_URL = url.toString();
    db = new Pool({ connectionString: url.toString() });
    for (const file of [
      "tests/fixtures/mvp-schema.sql",
      "migrations/2026-09-16_atomic-joins.sql",
      "migrations/2026-09-16_mvp-lifecycle.sql",
    ])
      await db.query(readFileSync(file, "utf8"));
  });
  beforeEach(async () => {
    await db.query("TRUNCATE users CASCADE");
    for (const user of [host, winner, loser, reviewer])
      await db.query("INSERT INTO users(id,name,credits) VALUES($1,$2,1000)", [
        user,
        user,
      ]);
  });
  afterAll(async () => {
    if (original === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original;
    await db?.end();
    if (admin) {
      await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await admin.end();
    }
  });
  async function ready() {
    const c = await createChallenge(host, terms());
    for (const user of [winner, loser])
      await joinChallenge(c.id, user, {
        stakeAmount: 50,
        pointsOnly: false,
        insurancePurchased: false,
      });
    await db.query(
      "UPDATE challenges SET start_date=$1,end_date=$2,status='active' WHERE id=$3",
      [new Date(midnight() - day), new Date(midnight()), c.id],
    );
    const proof = await submitProof(c.id, winner, {
      submission_type: "manual",
      submission_key: randomUUID(),
      proof_day: new Date(midnight() - day).toISOString().slice(0, 10),
      proof_type: "text",
      proof_data: { text: "I walked for thirty minutes by the river." },
      notes: "",
    });
    await reviewProof(
      proof.id,
      reviewer,
      "approved",
      "Meets the published requirement",
    );
    await db.query(
      "UPDATE challenges SET lifecycle_policy=jsonb_set(lifecycle_policy,'{graceSeconds}','0') WHERE id=$1",
      [c.id],
    );
    return c.id;
  }
  it("competing workers settle one pool once", async () => {
    const id = await ready();
    const results = await Promise.all([
      processChallenge(id),
      processChallenge(id),
    ]);
    expect(results.every((r) => r.settled)).toBe(true);
    expect(
      (await db.query("SELECT * FROM challenge_settlement_records")).rows,
    ).toHaveLength(1);
    expect(
      (
        await db.query(
          "SELECT * FROM credit_transactions WHERE transaction_type='challenge_reward'",
        )
      ).rows,
    ).toHaveLength(1);
    expect(
      (await db.query("SELECT credits FROM users WHERE id=$1", [winner]))
        .rows[0].credits,
    ).toBe("1037.50");
  });
  it("cancellation racing settlement produces exactly one financial close", async () => {
    const id = await ready();
    await Promise.allSettled([
      processChallenge(id),
      administerChallenge(
        id,
        reviewer,
        "cancel",
        "Race acceptance",
        "refund_all",
      ),
    ]);
    expect(
      (await db.query("SELECT * FROM challenge_settlement_records")).rows,
    ).toHaveLength(1);
    const kinds = (
      await db.query(
        "SELECT DISTINCT transaction_type FROM credit_transactions WHERE transaction_type IN ('challenge_reward','challenge_refund')",
      )
    ).rows;
    expect(kinds).toHaveLength(1);
    const total = (
      await db.query(
        "SELECT (SELECT sum(credits)*100 FROM users WHERE id=ANY($1::uuid[]))+(SELECT amount_cents FROM challenge_platform_ledger) AS conserved",
        [[winner, loser]],
      )
    ).rows[0].conserved;
    expect(Number(total)).toBe(200000);
  });
  it("concurrent publication retries debit host funding once", async () => {
    const data = { ...terms(), hostContribution: 10 };
    const [a, b] = await Promise.all([
      createChallenge(host, data),
      createChallenge(host, data),
    ]);
    expect(a.id).toBe(b.id);
    expect(
      (await db.query("SELECT credits FROM users WHERE id=$1", [host])).rows[0]
        .credits,
    ).toBe("990.00");
    expect(
      (await db.query("SELECT * FROM challenge_funding")).rows,
    ).toHaveLength(1);
  });
});
