/** @jest-environment node */
import { Pool } from "pg";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createChallenge } from "@/lib/challenge-create";
import { joinChallenge } from "@/lib/challenge-join";
import {
  processChallenge,
  administerChallenge,
  runLifecycleBatch,
} from "@/lib/challenge-engine";
import { submitProof, reviewProof } from "@/lib/challenge-proofs";
import { GET as reviewQueue } from "@/app/api/admin/verifications/route";
jest.mock("@neondatabase/serverless", () => ({
  Pool: jest.requireActual("pg").Pool,
}));
jest.mock("@/lib/require-admin", () => ({
  requireAdmin: async () => ({
    ok: true,
    userId: "00000000-0000-4000-8000-000000000004",
  }),
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
  // An active challenge with one participant's evidence still awaiting review.
  async function pendingProof() {
    const c = await createChallenge(host, terms());
    await joinChallenge(c.id, winner, {
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
    return { challengeId: c.id as string, proofId: proof.id as string };
  }
  // Regression (Codex review, PR #11): cancelling leaves evidence "pending" and
  // reviewProof refuses it, but the queue (oldest first, capped at 200) kept
  // listing it, so enough cancelled challenges would bury all live evidence.
  it("review queue lists only evidence an admin can still act on", async () => {
    const live = await pendingProof();
    const cancelled = await pendingProof();
    const suspended = await pendingProof();
    await administerChallenge(
      cancelled.challengeId,
      reviewer,
      "cancel",
      "Cancelled for the test",
      "refund_all",
    );
    await administerChallenge(
      suspended.challengeId,
      reviewer,
      "suspend",
      "Suspended for the test",
    );
    expect(
      (
        await db.query("SELECT status FROM proof_submissions WHERE id=$1", [
          cancelled.proofId,
        ])
      ).rows[0].status,
    ).toBe("pending_review");
    const { proofs } = await (await reviewQueue()).json();
    expect(proofs.map((p: { id: string }) => p.id)).toEqual([live.proofId]);
  });
  // Regression (Codex security review, PR #11): every new challenge was due
  // immediately and, when not ready, rescheduled five minutes out, but the batch
  // takes only 3 per cron run. So each unstarted or still-running challenge held
  // a slot every five minutes and the backlog grew with challenges created, not
  // with work to do, delaying settlements (credits stay locked until then).
  describe("lifecycle queue scheduling", () => {
    // Is the queue row due within a second of the given challenge column?
    const dueAt = async (id: string, column: string, plusSeconds = 0) =>
      (
        await db.query(
          `SELECT abs(extract(epoch FROM q.next_attempt_at - (c.${column} AT TIME ZONE 'UTC')) - $2) < 1 AS ok
           FROM challenge_lifecycle_queue q JOIN challenges c ON c.id=q.challenge_id WHERE c.id=$1`,
          [id, plusSeconds],
        )
      ).rows[0].ok as boolean;
    const markDue = (id: string) =>
      db.query(
        "UPDATE challenge_lifecycle_queue SET next_attempt_at=now() WHERE challenge_id=$1",
        [id],
      );

    it("a challenge that has not started is not due until its start", async () => {
      const c = await createChallenge(host, terms());
      expect(await dueAt(c.id, "start_date")).toBe(true);
      expect(await runLifecycleBatch()).toEqual([]);
    });

    it("unstarted challenges cannot crowd a settlement out of the batch", async () => {
      for (let i = 0; i < 5; i++) await createChallenge(host, terms());
      const id = await ready();
      await markDue(id); // time has passed for this one
      await runLifecycleBatch();
      expect(
        (
          await db.query(
            "SELECT 1 FROM challenge_settlement_records WHERE challenge_id=$1",
            [id],
          )
        ).rows,
      ).toHaveLength(1);
    });

    it("a running challenge sleeps until its end", async () => {
      const { challengeId } = await pendingProof();
      await db.query(
        `UPDATE challenges SET start_date=(now() AT TIME ZONE 'UTC')-interval '1 day',
           end_date=(now() AT TIME ZONE 'UTC')+interval '1 day' WHERE id=$1`,
        [challengeId],
      );
      await markDue(challengeId);
      await runLifecycleBatch();
      expect(await dueAt(challengeId, "end_date")).toBe(true);
    });

    it("an ended challenge sleeps until its grace period is over", async () => {
      const { challengeId } = await pendingProof(); // ended, 24h grace still running
      await markDue(challengeId);
      await runLifecycleBatch();
      expect(
        (
          await db.query("SELECT status FROM challenges WHERE id=$1", [
            challengeId,
          ])
        ).rows[0].status,
      ).toBe("ended");
      expect(await dueAt(challengeId, "end_date", 86400)).toBe(true);
    });

    it("keeps polling every five minutes while evidence is still being reviewed", async () => {
      const { challengeId } = await pendingProof();
      await db.query(
        "UPDATE challenges SET lifecycle_policy=jsonb_set(lifecycle_policy,'{graceSeconds}','0') WHERE id=$1",
        [challengeId],
      );
      await markDue(challengeId);
      await runLifecycleBatch();
      expect(
        (
          await db.query(
            `SELECT next_attempt_at BETWEEN now()+interval '4 minutes' AND now()+interval '6 minutes' AS ok
             FROM challenge_lifecycle_queue WHERE challenge_id=$1`,
            [challengeId],
          )
        ).rows[0].ok,
      ).toBe(true);
    });
  });
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
  // Regression (Codex review, PR #11): validation judged the true UTC instants,
  // but the raw strings went into timestamp-without-time-zone columns, which
  // silently drop the offset. +13:00 and -12:00 midnights were stored as 13:00
  // and 12:00, so the end landed before the start after the host was charged.
  it("stores offset-bearing schedule inputs as the validated UTC instants", async () => {
    const startUtc = midnight() + day,
      endUtc = midnight() + 2 * day;
    const withOffset = (ms: number, hours: number) =>
      new Date(ms + hours * 3600000).toISOString().slice(0, 19) +
      (hours < 0 ? "-" : "+") +
      String(Math.abs(hours)).padStart(2, "0") +
      ":00";
    const c = await createChallenge(host, {
      ...terms(),
      startDate: withOffset(startUtc, 13),
      endDate: withOffset(endUtc, -12),
    });
    const stored = (
      await db.query(
        `SELECT to_char(start_date,'YYYY-MM-DD"T"HH24:MI:SS') AS s, to_char(end_date,'YYYY-MM-DD"T"HH24:MI:SS') AS e FROM challenges WHERE id=$1`,
        [c.id],
      )
    ).rows[0];
    expect(stored).toEqual({
      s: new Date(startUtc).toISOString().slice(0, 19),
      e: new Date(endUtc).toISOString().slice(0, 19),
    });
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
