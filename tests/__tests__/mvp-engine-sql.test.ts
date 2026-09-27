/** @jest-environment node */
import { grantCredits } from "@/lib/credit-grants";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createChallenge } from "@/lib/challenge-create";
import { joinChallenge } from "@/lib/challenge-join";
import { processChallenge, administerChallenge } from "@/lib/challenge-engine";
import { submitProof, reviewProof, appealProof } from "@/lib/challenge-proofs";
import { settleChallenge } from "@/src/config/pricing";

let db: PGlite;
function tag(client: any) {
  return async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const text = strings.reduce((s, p, i) => s + (i ? "$" + i : "") + p, "");
    return (await client.query(text, values)).rows;
  };
}
jest.mock("@/lib/db", () => ({ createDbConnection: () => tag(db) }));
jest.mock("@/lib/db/transaction", () => ({
  withTransaction: (work: any) =>
    db.transaction(async (tx) => {
      await tx.exec("SET LOCAL TIME ZONE 'UTC'");
      return work(tag(tx));
    }),
}));
const host = "00000000-0000-4000-8000-000000000001",
  winner = "00000000-0000-4000-8000-000000000002",
  loser = "00000000-0000-4000-8000-000000000003",
  reviewer = "00000000-0000-4000-8000-000000000004",
  secondReviewer = "00000000-0000-4000-8000-000000000005";
let id: string;
const day = 86400000;
const midnight = () => Math.floor(Date.now() / day) * day;
const sql = async (text: string, values: any[] = []) =>
  (await db.query(text, values)).rows as any[];
const join = (user: string, stakeAmount = 50) =>
  joinChallenge(id, user, {
    stakeAmount,
    insurancePurchased: false,
    pointsOnly: false,
  });
const proof = (user: string, extra: any = {}) =>
  submitProof(id, user, {
    submission_type: "manual",
    submission_key: randomUUID(),
    proof_day: new Date(midnight() - day).toISOString().slice(0, 10),
    proof_type: "text",
    proof_data: {
      text: "I completed the required activity and attached my evidence.",
    },
    notes: "",
    ...extra,
  });
async function openProofWindow() {
  await sql(
    "UPDATE challenges SET start_date=$1,end_date=$2,status='active' WHERE id=$3",
    [new Date(midnight() - day), new Date(midnight()), id],
  );
}
async function expire() {
  await sql(
    "UPDATE challenges SET lifecycle_policy=jsonb_set(lifecycle_policy,'{graceSeconds}','0') WHERE id=$1",
    [id],
  );
}
async function credits(user: string) {
  return (await sql("SELECT credits FROM users WHERE id=$1", [user]))[0]
    .credits;
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(readFileSync("tests/fixtures/mvp-schema.sql", "utf8"));
  await db.exec(readFileSync("migrations/2026-09-16_atomic-joins.sql", "utf8"));
  await db.exec(
    readFileSync("migrations/2026-09-16_mvp-lifecycle.sql", "utf8"),
  );
});
afterAll(async () => {
  await db?.close();
});
beforeEach(async () => {
  await db.exec(
    "DROP TRIGGER IF EXISTS break_ledger ON credit_transactions; TRUNCATE users CASCADE;",
  );
  for (const user of [host, winner, loser, reviewer, secondReviewer])
    await sql("INSERT INTO users (id,name,credits) VALUES ($1,$2,1000)", [
      user,
      user,
    ]);
  const c = await createChallenge(host, {
    requestId: randomUUID(),
    title: "Daily walk",
    description: "Walk for thirty minutes and provide evidence each day.",
    category: "fitness",
    difficulty: "easy",
    startDate: new Date(midnight() + day).toISOString(),
    endDate: new Date(midnight() + 2 * day).toISOString(),
    requiredDays: 1,
    graceHours: 24,
    minStake: 0.01,
    maxStake: 100,
    hostContribution: 0,
    maxParticipants: 10,
    proofTypes: ["text"],
    proofInstructions: "Explain where and when you completed the walk.",
    rules: ["Walk for thirty minutes."],
  });
  id = c.id;
});

it("creates and joins with real SQL, and a duplicate cannot debit twice", async () => {
  await join(winner);
  await expect(join(winner)).rejects.toThrow("already joined");
  expect(await credits(winner)).toBe("947.50");
  expect((await sql("SELECT * FROM credit_transactions")).length).toBe(2);
});
it("rolls back participant and balance when the ledger insert fails", async () => {
  await db.exec(
    "CREATE OR REPLACE FUNCTION broken_ledger() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected ledger failure'; END; $$; CREATE TRIGGER break_ledger BEFORE INSERT ON credit_transactions FOR EACH ROW EXECUTE FUNCTION broken_ledger();",
  );
  await expect(join(winner)).rejects.toThrow("injected ledger failure");
  expect(await credits(winner)).toBe("1000.00");
  expect(await sql("SELECT * FROM challenge_participants")).toHaveLength(0);
});
it("saves actual proof IDs, rejects duplicate days and blocks peer/host review", async () => {
  await join(winner);
  await openProofWindow();
  const p = await proof(winner);
  expect(p.status).toBe("pending_review");
  await expect(proof(winner)).rejects.toThrow("already awaiting");
  await expect(
    reviewProof(p.id, winner, "approved", "Looks complete"),
  ).rejects.toThrow("cannot review");
  await expect(
    reviewProof(p.id, host, "approved", "Looks complete"),
  ).rejects.toThrow("cannot review");
  await reviewProof(
    p.id,
    reviewer,
    "approved",
    "Evidence demonstrates the daily task",
  );
  expect((await processChallenge(id)).settled).toBe(false); // still inside grace
  expect(
    (await sql("SELECT completion_status FROM challenge_participants"))[0]
      .completion_status,
  ).toBe("completed");
});
it("holds on-time pending proof after expiry, then settles once after review", async () => {
  await join(winner);
  await join(loser);
  await openProofWindow();
  const p = await proof(winner);
  await expire();
  expect((await processChallenge(id)).settled).toBe(false);
  expect(await credits(winner)).toBe("947.50");
  await reviewProof(p.id, reviewer, "approved", "Task evidenced");
  const settled = await processChallenge(id);
  expect(settled.settled).toBe(true);
  expect(await credits(winner)).toBe("1037.50"); // 50 stake + 40 failed-stake bonus
  expect(await credits(loser)).toBe("947.50");
  expect(
    (await sql("SELECT amount_cents FROM challenge_platform_ledger"))[0]
      .amount_cents,
  ).toBe(1500);
  const before = await sql("SELECT * FROM challenge_audit_events");
  await processChallenge(id);
  expect(await credits(winner)).toBe("1037.50");
  expect(await sql("SELECT * FROM challenge_audit_events")).toHaveLength(
    before.length,
  );
});
it("a failed settlement write rolls back outcomes, transfers and settlement marker", async () => {
  await join(winner);
  await join(loser);
  await openProofWindow();
  const p = await proof(winner);
  await reviewProof(p.id, reviewer, "approved", "Task evidenced");
  await expire();
  await db.exec(
    "CREATE OR REPLACE FUNCTION broken_ledger() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected ledger failure'; END; $$; CREATE TRIGGER break_ledger BEFORE INSERT ON credit_transactions FOR EACH ROW EXECUTE FUNCTION broken_ledger();",
  );
  await expect(processChallenge(id)).rejects.toThrow("injected ledger failure");
  expect(await credits(winner)).toBe("947.50");
  expect(await sql("SELECT * FROM challenge_settlement_records")).toHaveLength(
    0,
  );
  expect(
    (await sql("SELECT status FROM challenges WHERE id=$1", [id]))[0].status,
  ).toBe("active");
});
it("all failures send the full pool to the platform without inventing a winner", async () => {
  await join(winner);
  await openProofWindow();
  await expire();
  expect((await processChallenge(id)).settled).toBe(true);
  expect(
    (await sql("SELECT amount_cents FROM challenge_platform_ledger"))[0]
      .amount_cents,
  ).toBe(5250);
  expect(
    (await sql("SELECT completion_status FROM challenge_participants"))[0]
      .completion_status,
  ).toBe("failed");
});
it("rejection appeal window and pending appeal both hold settlement; appeal does not pay separately", async () => {
  await join(winner);
  await openProofWindow();
  const p = await proof(winner);
  await expire();
  await reviewProof(
    p.id,
    reviewer,
    "rejected",
    "Please explain the missing evidence",
  );
  expect((await processChallenge(id)).settled).toBe(false);
  await appealProof(
    p.id,
    winner,
    "The uploaded description includes this evidence",
  );
  await expect(
    reviewProof(p.id, reviewer, "approved", "Corrected", true),
  ).rejects.toThrow("different neutral reviewer");
  await reviewProof(
    p.id,
    secondReviewer,
    "approved",
    "Evidence accepted after independent review",
    true,
  );
  expect(await credits(winner)).toBe("947.50");
  await processChallenge(id);
  expect(await credits(winner)).toBe("997.50");
});
it("rejects expired appeals and settles rejected evidence after the appeal window", async () => {
  await join(winner);
  await openProofWindow();
  const p = await proof(winner);
  await expire();
  await reviewProof(p.id, reviewer, "rejected", "Insufficient evidence");
  await sql(
    "UPDATE proof_submissions SET appeal_deadline_at=now()-interval '1 second' WHERE id=$1",
    [p.id],
  );
  await expect(appealProof(p.id, winner, "Late appeal")).rejects.toThrow(
    "not eligible",
  );
  expect((await processChallenge(id)).settled).toBe(true);
});
it("suspension freezes joins and processing; resume shifts a pending schedule once", async () => {
  const before = (
    await sql("SELECT start_date,end_date FROM challenges WHERE id=$1", [id])
  )[0];
  await administerChallenge(id, reviewer, "suspend", "Investigating");
  await expect(join(winner)).rejects.toThrow("no longer accepting");
  expect((await processChallenge(id)).settled).toBe(false);
  await sql(
    "UPDATE challenges SET suspended_at=clock_timestamp()-interval '1 hour' WHERE id=$1",
    [id],
  );
  await administerChallenge(id, reviewer, "resume", "Investigation closed");
  const after = (
    await sql("SELECT start_date,end_date FROM challenges WHERE id=$1", [id])
  )[0];
  expect(
    new Date(after.end_date).getTime() - new Date(before.end_date).getTime(),
  ).toBeGreaterThanOrEqual(3599000);
  await administerChallenge(id, reviewer, "resume", "Repeated request");
  expect(
    (await sql("SELECT end_date FROM challenges WHERE id=$1", [id]))[0]
      .end_date,
  ).toEqual(after.end_date);
});
it.each([
  ["refund_all", "1000.00", 0],
  ["refund_participants", "997.50", 250],
  ["refund_none", "947.50", 5250],
])("cancels using %s once", async (preset, balance, platform) => {
  await join(winner);
  await administerChallenge(
    id,
    reviewer,
    "cancel",
    "Challenge cannot proceed",
    preset as string,
  );
  await administerChallenge(id, reviewer, "cancel", "Retry", preset as string);
  expect(await credits(winner)).toBe(balance);
  expect(
    (await sql("SELECT amount_cents FROM challenge_platform_ledger"))[0]
      .amount_cents,
  ).toBe(platform);
  expect((await processChallenge(id)).settled).toBe(false);
  await expect(join(loser)).rejects.toThrow("no longer accepting");
});
it("refuses settlement when historical debits do not reconcile", async () => {
  await join(winner);
  await openProofWindow();
  await expire();
  await sql(
    "DELETE FROM credit_transactions WHERE transaction_type='stake_lock'",
  );
  await expect(processChallenge(id)).rejects.toThrow("does not reconcile");
  expect(await sql("SELECT * FROM challenge_settlement_records")).toHaveLength(
    0,
  );
});
it("deterministic cents conserve the pool and return each winner their own stake", () => {
  const p = settleChallenge(
    [
      { userId: "b", stakeCents: 500, completed: true },
      { userId: "a", stakeCents: 100, completed: true },
      { userId: "c", stakeCents: 200, completed: true },
      { userId: "d", stakeCents: 1001, completed: false },
    ],
    0,
    0,
  );
  expect(p.credits.map((c) => [c.userId, c.bonusCents, c.amountCents])).toEqual(
    [
      ["a", 334, 434],
      ["b", 334, 834],
      ["c", 333, 533],
    ],
  );
  expect(
    p.credits.reduce((n, c) => n + c.amountCents, 0) + p.platformTakeCents,
  ).toBe(1801);
});

it("credit grants retry once, reject changed terms and reconcile to the ledger", async () => {
  const key = randomUUID();
  await grantCredits(reviewer, winner, 12.34, "MVP testing", key);
  await grantCredits(reviewer, winner, 12.34, "MVP testing", key);
  expect(await credits(winner)).toBe("1012.34");
  expect(
    await sql(
      "SELECT * FROM credit_transactions WHERE transaction_type='admin_grant'",
    ),
  ).toHaveLength(1);
  await expect(
    grantCredits(reviewer, winner, 99, "MVP testing", key),
  ).rejects.toThrow("different grant terms");
});
it("credit grants roll back when the matching ledger fails", async () => {
  await db.exec(
    "CREATE OR REPLACE FUNCTION fail_ledger() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'ledger failure'; END $$; CREATE TRIGGER break_ledger BEFORE INSERT ON credit_transactions FOR EACH ROW EXECUTE FUNCTION fail_ledger();",
  );
  await expect(
    grantCredits(reviewer, winner, 10, "MVP testing", randomUUID()),
  ).rejects.toThrow("ledger failure");
  expect(await credits(winner)).toBe("1000.00");
  expect(await sql("SELECT * FROM credit_grants")).toHaveLength(0);
});
it("a declared host contribution cannot be paid without its debit ledger", async () => {
  await join(winner);
  await sql("UPDATE challenges SET host_contribution=10 WHERE id=$1", [id]);
  await sql(
    "INSERT INTO challenge_funding(challenge_id,user_id,amount_cents) VALUES($1,$2,1000)",
    [id, host],
  );
  await openProofWindow();
  await expire();
  await expect(processChallenge(id)).rejects.toThrow(
    "Host contribution ledger does not reconcile",
  );
  expect(await sql("SELECT * FROM challenge_settlement_records")).toHaveLength(
    0,
  );
});
it("suspension preserves open appeal deadlines without changing review history", async () => {
  await join(winner);
  await openProofWindow();
  const p = await proof(winner);
  await reviewProof(p.id, reviewer, "rejected", "Missing duration");
  const before = (
    await sql(
      "SELECT reviewed_at,appeal_deadline_at FROM proof_submissions WHERE id=$1",
      [p.id],
    )
  )[0];
  await administerChallenge(id, reviewer, "suspend", "Investigation");
  await sql(
    "UPDATE challenges SET suspended_at=clock_timestamp()-interval '1 hour' WHERE id=$1",
    [id],
  );
  await administerChallenge(id, reviewer, "resume", "Resolved");
  const after = (
    await sql(
      "SELECT reviewed_at,appeal_deadline_at FROM proof_submissions WHERE id=$1",
      [p.id],
    )
  )[0];
  expect(after.reviewed_at).toEqual(before.reviewed_at);
  expect(
    new Date(after.appeal_deadline_at).getTime() -
      new Date(before.appeal_deadline_at).getTime(),
  ).toBeGreaterThanOrEqual(3599000);
});
it("requires owned, confirmed media and never counts duplicate days twice", async () => {
  await join(winner);
  await openProofWindow();
  await sql(
    "UPDATE challenges SET lifecycle_policy=jsonb_set(lifecycle_policy,'{proofTypes}','[\"photo\"]') WHERE id=$1",
    [id],
  );
  await expect(
    proof(winner, {
      proof_type: "photo",
      proof_data: { file_key: "other-user-file" },
    }),
  ).rejects.toThrow("own evidence");
  await sql(
    "INSERT INTO proof_uploads(file_key,storage_key,user_id,challenge_id,content_type,byte_size) VALUES ('mine','confirmed/mine',$1,$2,'image/jpeg',100)",
    [winner, id],
  );
  const p = await proof(winner, {
    proof_type: "photo",
    proof_data: { file_key: "mine" },
  });
  expect(p.file_url).toBe("mine");
  expect(p.status).toBe("pending_review");
  await reviewProof(p.id, reviewer, "approved", "Matches the requirement");
  await expect(
    proof(winner, { proof_type: "photo", proof_data: { file_key: "mine" } }),
  ).rejects.toThrow("already awaiting review or approved");
});
it("submission and creation failures cannot leave partially funded records", async () => {
  await expect(
    createChallenge(host, {
      requestId: randomUUID(),
      title: "Unaffordable challenge",
      description: "A complete challenge description.",
      category: "fitness",
      difficulty: "easy",
      startDate: new Date(midnight() + day).toISOString(),
      endDate: new Date(midnight() + 2 * day).toISOString(),
      requiredDays: 1,
      graceHours: 24,
      minStake: 1,
      maxStake: 100,
      hostContribution: 1001,
      maxParticipants: 10,
      proofTypes: ["text"],
      proofInstructions: "Describe the activity clearly.",
      rules: ["Complete the daily requirement."],
    }),
  ).rejects.toThrow("Insufficient credits");
  expect(await sql("SELECT * FROM challenges")).toHaveLength(1);
  expect(await sql("SELECT * FROM challenge_funding")).toHaveLength(0);
  await join(winner);
  await openProofWindow();
  await expect(proof(winner, { proof_day: "2026-02-30" })).rejects.toThrow(
    "Proof day",
  );
  await expire();
  await expect(proof(winner)).rejects.toThrow("Outside the proof");
});
it("creation retries never fund twice and cancellation returns the funded host contribution", async () => {
  const template = (
    await sql("SELECT create_request_terms FROM challenges WHERE id=$1", [id])
  )[0].create_request_terms;
  const terms = { ...template, requestId: randomUUID(), hostContribution: 10 };
  const created = await createChallenge(host, terms);
  expect(await credits(host)).toBe("990.00");
  expect((await createChallenge(host, terms)).id).toBe(created.id);
  expect(await credits(host)).toBe("990.00");
  await expect(
    createChallenge(host, { ...terms, title: "Different title" }),
  ).rejects.toThrow("different challenge terms");
  await administerChallenge(
    created.id,
    reviewer,
    "cancel",
    "Host cancellation",
    "refund_all",
  );
  expect(await credits(host)).toBe("1000.00");
});
it("suspending a started challenge does not move already submitted proof out of its schedule", async () => {
  await join(winner);
  await openProofWindow();
  await sql("UPDATE challenges SET status='pending' WHERE id=$1", [id]);
  const p = await proof(winner);
  const before = (
    await sql("SELECT start_date FROM challenges WHERE id=$1", [id])
  )[0].start_date;
  await administerChallenge(id, reviewer, "suspend", "Investigation");
  await sql(
    "UPDATE challenges SET suspended_at=clock_timestamp()-interval '1 hour' WHERE id=$1",
    [id],
  );
  await administerChallenge(id, reviewer, "resume", "Resolved");
  expect(
    (await sql("SELECT start_date FROM challenges WHERE id=$1", [id]))[0]
      .start_date,
  ).toEqual(before);
  await reviewProof(p.id, reviewer, "approved", "Valid evidence");
  await processChallenge(id);
  expect(
    (
      await sql(
        "SELECT completion_status FROM challenge_participants WHERE user_id=$1",
        [winner],
      )
    )[0].completion_status,
  ).toBe("completed");
});
