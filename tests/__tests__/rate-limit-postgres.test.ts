/** @jest-environment node */
import { readFileSync } from "node:fs";
import type { Pool } from "pg";
import { createBaselineSchema } from "../helpers/baseline-db";
import { enforce, hit, LIMITS } from "@/lib/rate-limit-db";

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
const limit = { name: "test", max: 5, windowSeconds: 3600 };

describeDatabase("distributed rate limiter on the production schema", () => {
  let baseline: Awaited<ReturnType<typeof createBaselineSchema>>;
  const original = process.env.DATABASE_URL;

  beforeAll(async () => {
    baseline = await createBaselineSchema(
      databaseUrl!,
      "ratelimit_acceptance_" + process.pid,
    );
    db = baseline.db;
    process.env.DATABASE_URL = baseline.scopedUrl;
    await db.query(
      readFileSync("migrations/2026-10-30_rate-limit-hits.sql", "utf8"),
    );
    jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterAll(async () => {
    if (original === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original;
    await baseline?.drop();
  });
  beforeEach(() => db.query("TRUNCATE rate_limit_hits"));

  it("the migration is idempotent", async () => {
    await expect(
      db.query(
        readFileSync("migrations/2026-10-30_rate-limit-hits.sql", "utf8"),
      ),
    ).resolves.toBeDefined();
  });

  it("allows up to the maximum, then blocks with a retry time inside the window", async () => {
    const results = [];
    for (let i = 0; i < 7; i++) results.push(await hit(limit, "10.0.0.1"));
    expect(results.map((r) => r.allowed)).toEqual([
      true,
      true,
      true,
      true,
      true,
      false,
      false,
    ]);
    expect(results[0].mode).toBe("database");
    expect(results[6].retryAfterSeconds).toBeGreaterThan(0);
    expect(results[6].retryAfterSeconds).toBeLessThanOrEqual(3600);
  });

  it("is atomic: 40 concurrent requests allow exactly the maximum", async () => {
    const results = await Promise.all(
      Array.from({ length: 40 }, () => hit(limit, "10.0.0.2")),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(5);
  });

  it("keeps subjects and limit names independent, ignoring case", async () => {
    for (let i = 0; i < 6; i++) await hit(limit, "Alice@Example.test");
    expect((await hit(limit, "alice@example.test")).allowed).toBe(false);
    expect((await hit(limit, "bob@example.test")).allowed).toBe(true);
    expect(
      (await hit({ ...limit, name: "other" }, "alice@example.test")).allowed,
    ).toBe(true);
  });

  it("starts a fresh window when the old one has passed", async () => {
    for (let i = 0; i < 6; i++) await hit(limit, "10.0.0.3");
    await db.query(
      "UPDATE rate_limit_hits SET window_start = window_start - interval '2 hours'",
    );
    expect((await hit(limit, "10.0.0.3")).allowed).toBe(true);
  });

  it("enforce() blocks if any one limit is exceeded", async () => {
    for (let i = 0; i < 4; i++)
      await hit(LIMITS.emailSendPerAddress, "victim@example.test");
    const blocked = await enforce([
      [LIMITS.emailSendPerIp, "10.9.9.9"],
      [LIMITS.emailSendPerAddress, "victim@example.test"],
    ]);
    expect(blocked.allowed).toBe(false);
  });

  it("falls back to the per-instance limiter when the table is missing, and still limits", async () => {
    await db.query("ALTER TABLE rate_limit_hits RENAME TO rate_limit_hits_off");
    try {
      const results = [];
      for (let i = 0; i < 7; i++)
        results.push(await hit({ ...limit, name: "fallback" }, "10.0.0.4"));
      expect(results[0].mode).toBe("per-instance");
      expect(results.filter((r) => r.allowed).length).toBeLessThan(7);
    } finally {
      await db.query(
        "ALTER TABLE rate_limit_hits_off RENAME TO rate_limit_hits",
      );
    }
  });
});
