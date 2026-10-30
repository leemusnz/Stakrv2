/** @jest-environment node */
// A new account starts with 0 credits and every challenge needs a stake, so
// without welcome credits no self-serve user could ever join a challenge.
import { Pool } from "pg";
import {
  claimWelcomeCredits,
  welcomeCreditsOffer,
  welcomeGrantCents,
} from "@/lib/welcome-credits";

jest.mock("@neondatabase/serverless", () => ({
  Pool: jest.requireActual("pg").Pool,
}));

describe("welcomeGrantCents", () => {
  it("defaults to 50 credits when unset or blank", () => {
    expect(welcomeGrantCents(undefined)).toBe(5000);
    expect(welcomeGrantCents("  ")).toBe(5000);
  });
  it("honours a configured amount and 0 disables the grant", () => {
    expect(welcomeGrantCents("25.5")).toBe(2550);
    expect(welcomeGrantCents("0")).toBe(0);
  });
  it.each(["abc", "-5", "1000.01", "NaN", "Infinity"])(
    "fails closed (grants nothing) for %s",
    (value) => expect(welcomeGrantCents(value)).toBe(0),
  );
});

const databaseUrl = process.env.STAKR_TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;
const ana = "00000000-0000-4000-8000-0000000000a1";
const ben = "00000000-0000-4000-8000-0000000000b2";

describeDatabase("welcome credits PostgreSQL acceptance", () => {
  let admin: Pool;
  let db: Pool;
  const schema = "welcome_acceptance_" + process.pid;
  const originalUrl = process.env.DATABASE_URL;
  const originalGrant = process.env.STAKR_WELCOME_CREDITS;
  const sql = async (s: TemplateStringsArray, ...v: unknown[]) =>
    (
      await db.query(
        s.reduce((q, p, i) => q + (i ? "$" + i : "") + p, ""),
        v,
      )
    ).rows;

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
      CREATE TABLE users (id uuid PRIMARY KEY, credits numeric(18,2) NOT NULL DEFAULT 0,
        email_verified boolean DEFAULT false, updated_at timestamp DEFAULT now());
      CREATE TABLE credit_transactions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES users(id), amount numeric(18,2) NOT NULL,
        transaction_type varchar(30) NOT NULL, description text, created_at timestamp DEFAULT now());`);
  });

  beforeEach(async () => {
    delete process.env.STAKR_WELCOME_CREDITS;
    await db.query("TRUNCATE users CASCADE");
    await db.query(
      "INSERT INTO users(id,email_verified) VALUES ($1,true),($2,false)",
      [ana, ben],
    );
  });

  afterAll(async () => {
    process.env.DATABASE_URL = originalUrl;
    if (originalGrant === undefined) delete process.env.STAKR_WELCOME_CREDITS;
    else process.env.STAKR_WELCOME_CREDITS = originalGrant;
    await db?.end();
    if (admin) {
      await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await admin.end();
    }
  });

  const ledger = async (id: string) =>
    (
      await db.query(
        "SELECT count(*)::int n, coalesce(sum(amount),0)::text total FROM credit_transactions WHERE user_id=$1",
        [id],
      )
    ).rows[0];

  it("grants once, with a matching ledger row", async () => {
    const first = await claimWelcomeCredits(ana);
    expect(first).toMatchObject({ granted: true, amountCents: 5000 });
    expect(
      (await db.query("SELECT credits FROM users WHERE id=$1", [ana])).rows[0]
        .credits,
    ).toBe("50.00");
    expect(await ledger(ana)).toEqual({ n: 1, total: "50.00" });
  });

  it("repeat claims grant nothing and change nothing", async () => {
    await claimWelcomeCredits(ana);
    const again = await claimWelcomeCredits(ana);
    expect(again.granted).toBe(false);
    expect(await ledger(ana)).toEqual({ n: 1, total: "50.00" });
  });

  it("concurrent claims credit exactly once", async () => {
    const results = await Promise.all(
      Array.from({ length: 8 }, () => claimWelcomeCredits(ana)),
    );
    expect(results.filter((r) => r.granted)).toHaveLength(1);
    expect(await ledger(ana)).toEqual({ n: 1, total: "50.00" });
    expect(
      (await db.query("SELECT credits FROM users WHERE id=$1", [ana])).rows[0]
        .credits,
    ).toBe("50.00");
  });

  it("refuses an unverified email and writes nothing", async () => {
    await expect(claimWelcomeCredits(ben)).rejects.toMatchObject({
      status: 403,
    });
    expect(await ledger(ben)).toEqual({ n: 0, total: "0" });
  });

  it("refuses an unknown user", async () => {
    await expect(
      claimWelcomeCredits("00000000-0000-4000-8000-0000000000ff"),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("is unavailable when disabled by configuration", async () => {
    process.env.STAKR_WELCOME_CREDITS = "0";
    await expect(claimWelcomeCredits(ana)).rejects.toMatchObject({
      status: 404,
    });
    expect(await ledger(ana)).toEqual({ n: 0, total: "0" });
  });

  it("offer: eligible only when verified and not yet claimed", async () => {
    expect(await welcomeCreditsOffer(sql, ana)).toEqual({
      eligible: true,
      amount: 50,
    });
    expect(await welcomeCreditsOffer(sql, ben)).toEqual({
      eligible: false,
      amount: 50,
    });
    await claimWelcomeCredits(ana);
    expect(await welcomeCreditsOffer(sql, ana)).toEqual({
      eligible: false,
      amount: 50,
    });
    process.env.STAKR_WELCOME_CREDITS = "0";
    expect(await welcomeCreditsOffer(sql, ana)).toEqual({
      eligible: false,
      amount: 0,
    });
  });
});
