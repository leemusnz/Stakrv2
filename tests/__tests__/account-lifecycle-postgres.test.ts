/** @jest-environment node */
// Runs against the REAL production schema (migrations/baseline), not a mock.
import type { Pool } from "pg";
import { createBaselineSchema } from "../helpers/baseline-db";
import { deleteAccount, exportAccountData } from "@/lib/account-data";
import { setUserStatus } from "@/lib/user-moderation";
import { clearAccountStatusCache, isAccountActive } from "@/lib/account-status";

let db: Pool;
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
const ana = "00000000-0000-4000-8000-0000000000a1";
const ben = "00000000-0000-4000-8000-0000000000b2";
const root = "00000000-0000-4000-8000-0000000000c3";

describeDatabase("account lifecycle on the production schema", () => {
  let baseline: Awaited<ReturnType<typeof createBaselineSchema>>;
  const original = process.env.DATABASE_URL;

  beforeAll(async () => {
    baseline = await createBaselineSchema(
      databaseUrl!,
      "account_acceptance_" + process.pid,
    );
    db = baseline.db;
    process.env.DATABASE_URL = baseline.scopedUrl;
  });
  afterAll(async () => {
    if (original === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original;
    await baseline?.drop();
  });

  beforeEach(async () => {
    clearAccountStatusCache();
    await db.query("TRUNCATE users CASCADE");
    await db.query(
      `INSERT INTO users (id,email,name,username,password_hash,credits,email_verified,is_dev)
       VALUES ($1,'ana@example.test','Ana','ana','hash',30,true,false),
              ($2,'ben@example.test','Ben','ben','hash',0,true,false),
              ($3,'root@example.test','Root','root','hash',0,true,true)`,
      [ana, ben, root],
    );
    await db.query(
      `INSERT INTO credit_transactions (user_id,amount,transaction_type,description)
       VALUES ($1,30,'welcome_grant','Welcome credits')`,
      [ana],
    );
    await db.query(
      `INSERT INTO notifications (user_id,type,title,message) VALUES ($1,'verification','t','m')`,
      [ana],
    );
  });

  async function challenge(status: string, host = ben) {
    const row = await db.query(
      `INSERT INTO challenges (title,description,category,duration,difficulty,start_date,end_date,status,host_id)
       VALUES ('Walk','Walk daily for thirty minutes','fitness','7 days','easy',now(),now()+interval '7 days',$1,$2)
       RETURNING id`,
      [status, host],
    );
    return row.rows[0].id as string;
  }
  const join = async (challengeId: string, userId: string) =>
    db.query(
      `INSERT INTO challenge_participants (challenge_id,user_id,stake_amount,entry_fee_paid) VALUES ($1,$2,10,0.5)`,
      [challengeId, userId],
    );

  describe("deleteAccount", () => {
    it("refuses while the user is in an unsettled challenge, changing nothing", async () => {
      await join(await challenge("active"), ana);
      await expect(deleteAccount(ana)).rejects.toMatchObject({ status: 409 });
      const user = (
        await db.query("SELECT email,credits FROM users WHERE id=$1", [ana])
      ).rows[0];
      expect(user).toEqual({ email: "ana@example.test", credits: "30.00" });
    });

    it("refuses while the user hosts an unsettled challenge", async () => {
      await challenge("pending", ana);
      await expect(deleteAccount(ana)).rejects.toMatchObject({ status: 409 });
    });

    it("refuses admin accounts", async () => {
      await expect(deleteAccount(root)).rejects.toMatchObject({ status: 403 });
    });

    it("anonymises, forfeits credits through the ledger and locks the login", async () => {
      await join(await challenge("rewards_distributed"), ana);
      const result = await deleteAccount(ana);
      expect(result).toEqual({ deleted: true, forfeitedCredits: 30 });

      const user = (await db.query("SELECT * FROM users WHERE id=$1", [ana]))
        .rows[0];
      expect(user).toMatchObject({
        name: "Deleted user",
        password_hash: null,
        avatar_url: null,
        credits: "0.00",
        email_verified: false,
        moderation_status: "suspended",
      });
      expect(user.email).toMatch(/^deleted-[0-9a-f]{12}@deleted\.invalid$/);
      expect(user.username).toMatch(/^deleted_[0-9a-f]{12}$/);

      const ledger = (
        await db.query(
          "SELECT coalesce(sum(amount),0)::text AS total FROM credit_transactions WHERE user_id=$1",
          [ana],
        )
      ).rows[0];
      expect(ledger.total).toBe("0.00");
      expect(
        (
          await db.query(
            "SELECT count(*)::int n FROM notifications WHERE user_id=$1",
            [ana],
          )
        ).rows[0].n,
      ).toBe(0);
      expect(
        (
          await db.query("SELECT action FROM audit_events WHERE entity_id=$1", [
            ana,
          ])
        ).rows.map((r) => r.action),
      ).toEqual(["account_deleted"]);

      clearAccountStatusCache();
      await expect(isAccountActive(ana)).resolves.toBe(false);
    });

    it("can be run twice without error or double forfeiture", async () => {
      await deleteAccount(ana);
      await expect(deleteAccount(ana)).resolves.toEqual({
        deleted: true,
        forfeitedCredits: 0,
      });
      expect(
        (
          await db.query(
            "SELECT count(*)::int n FROM credit_transactions WHERE transaction_type='account_closed'",
          )
        ).rows[0].n,
      ).toBe(1);
    });
  });

  describe("setUserStatus", () => {
    it("suspends then restores, auditing each change, and blocks the session check", async () => {
      await expect(
        setUserStatus(root, "ana@example.test", "suspend", "cheating"),
      ).resolves.toMatchObject({
        status: "suspended",
        changed: true,
      });
      clearAccountStatusCache();
      await expect(isAccountActive(ana)).resolves.toBe(false);
      await expect(
        setUserStatus(root, ana, "restore", "appeal upheld"),
      ).resolves.toMatchObject({
        status: "approved",
        changed: true,
      });
      clearAccountStatusCache();
      await expect(isAccountActive(ana)).resolves.toBe(true);
      const audit = await db.query(
        "SELECT action FROM audit_events WHERE entity_id=$1 ORDER BY created_at",
        [ana],
      );
      expect(audit.rows.map((r) => r.action)).toEqual([
        "user_suspended",
        "user_restored",
      ]);
    });

    it("is idempotent and does not double-audit", async () => {
      await setUserStatus(root, ana, "suspend", "x");
      await expect(
        setUserStatus(root, ana, "suspend", "x"),
      ).resolves.toMatchObject({ changed: false });
      expect(
        (await db.query("SELECT count(*)::int n FROM audit_events")).rows[0].n,
      ).toBe(1);
    });

    it("will not let an admin suspend themselves or another admin", async () => {
      await expect(
        setUserStatus(root, root, "suspend", "x"),
      ).rejects.toMatchObject({ status: 400 });
      await db.query("UPDATE users SET has_dev_access=true WHERE id=$1", [ben]);
      await expect(
        setUserStatus(root, ben, "suspend", "x"),
      ).rejects.toMatchObject({ status: 403 });
    });

    it("reports an unknown user and rejects a blank reason", async () => {
      await expect(
        setUserStatus(root, "nobody@example.test", "suspend", "x"),
      ).rejects.toMatchObject({ status: 404 });
      await expect(
        setUserStatus(root, ana, "suspend", "  "),
      ).rejects.toMatchObject({ status: 400 });
    });
  });

  describe("exportAccountData", () => {
    it("returns the user's own data and never credentials or other people's data", async () => {
      await join(await challenge("active"), ana);
      await join(await challenge("active"), ben);
      const data = await exportAccountData(ana);
      const json = JSON.stringify(data);
      expect(data.profile).toMatchObject({
        email: "ana@example.test",
        name: "Ana",
      });
      expect(data.creditLedger).toHaveLength(1);
      expect(data.challengesJoined).toHaveLength(1);
      expect(data.notifications).toHaveLength(1);
      expect(json).not.toContain("password_hash");
      expect(json).not.toContain("hash");
      expect(json).not.toContain("ben@example.test");
      expect(json).not.toContain("moderation_notes");
    });

    it("404s for an unknown user", async () => {
      await expect(
        exportAccountData("00000000-0000-4000-8000-0000000000ff"),
      ).rejects.toMatchObject({ status: 404 });
    });
  });
});
