/** @jest-environment node */
import { healthReport } from "@/lib/health";

const full = {
  RESEND_API_KEY: "k",
  RESEND_FROM_EMAIL: "Stakr <n@support.stakr.app>",
  AWS_ACCESS_KEY_ID: "a",
  AWS_SECRET_ACCESS_KEY: "s",
  AWS_REGION: "r",
  AWS_BUCKET_NAME: "b",
  NEXTAUTH_SECRET: "x",
  NEXTAUTH_URL: "https://stakr.app",
  CRON_SECRET: "c",
} as unknown as NodeJS.ProcessEnv;
const now = new Date("2026-10-30T00:00:00Z");
const healthy = async () => [
  { overdue: 0, oldest: 0, present: true, admins: 2 },
];
const sqlReturning = (rows: () => Promise<any[]>) => async () => rows();

describe("healthReport", () => {
  it("is ok when everything is configured and no jobs are overdue", async () => {
    const r = await healthReport(sqlReturning(healthy), full, now);
    expect(r.status).toBe("ok");
    expect(r.checks).toMatchObject({
      database: true,
      email: true,
      storage: true,
      auth: true,
      cronSecret: true,
      cash: "disabled",
    });
  });

  it("is down when the database cannot be reached, without throwing", async () => {
    const r = await healthReport(
      async () => {
        throw new Error("connect ECONNREFUSED");
      },
      full,
      now,
    );
    expect(r.status).toBe("down");
    expect(r.lifecycle.overdueJobs).toBeNull();
  });

  it.each([
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
    "AWS_BUCKET_NAME",
    "CRON_SECRET",
    "NEXTAUTH_URL",
  ])("is degraded when %s is missing", async (name) => {
    const env = { ...full, [name]: "" } as unknown as NodeJS.ProcessEnv;
    expect((await healthReport(sqlReturning(healthy), env, now)).status).toBe(
      "degraded",
    );
  });

  it("is degraded when lifecycle jobs are overdue (a dead cron)", async () => {
    const r = await healthReport(
      sqlReturning(async () => [{ overdue: 3, oldest: 47 }]),
      full,
      now,
    );
    expect(r).toMatchObject({
      status: "degraded",
      lifecycle: { overdueJobs: 3, oldestOverdueMinutes: 47 },
    });
  });

  it("flags cash if it is ever switched on", async () => {
    const env = {
      ...full,
      ENABLE_CASH_PAYMENTS: "true",
    } as unknown as NodeJS.ProcessEnv;
    expect(
      (await healthReport(sqlReturning(healthy), env, now)).checks.cash,
    ).toBe("ENABLED");
  });

  it("never includes any secret value", async () => {
    const json = JSON.stringify(
      await healthReport(sqlReturning(healthy), full, now),
    );
    for (const secret of ["k", "stakr.app", "support.stakr.app"])
      expect(json).not.toContain(`"${secret}"`);
    expect(json).not.toContain("Stakr <");
    expect(json).not.toContain("https://");
  });
});

describe("healthReport rate limiter mode", () => {
  it("reports the shared database limiter once the table exists", async () => {
    const r = await healthReport(sqlReturning(healthy), full, now);
    expect(r.checks.rateLimit).toBe("database");
    expect(r.status).toBe("ok");
  });

  it("is degraded, and says why, until the rate-limit table is migrated", async () => {
    const r = await healthReport(
      sqlReturning(async () => [
        { overdue: 0, oldest: 0, present: false, admins: 2 },
      ]),
      full,
      now,
    );
    expect(r.status).toBe("degraded");
    expect(r.checks.rateLimit).toBe("per-instance");
  });
});

describe("healthReport reviewers", () => {
  it("is degraded with a single admin, because an appeal needs a different reviewer", async () => {
    const r = await healthReport(
      sqlReturning(async () => [
        { overdue: 0, oldest: 0, present: true, admins: 1 },
      ]),
      full,
      now,
    );
    expect(r.status).toBe("degraded");
    expect(r.checks.reviewers).toBe(false);
  });

  it("is ok with two admins", async () => {
    const r = await healthReport(sqlReturning(healthy), full, now);
    expect(r.checks.reviewers).toBe(true);
  });
});
