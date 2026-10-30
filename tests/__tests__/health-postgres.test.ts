/** @jest-environment node */
import { randomUUID } from "node:crypto";
import { createBaselineSchema } from "../helpers/baseline-db";
import { healthReport } from "@/lib/health";

const databaseUrl = process.env.STAKR_TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;
const env = {
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

describeDatabase("health watchdog on the production schema", () => {
  let baseline: Awaited<ReturnType<typeof createBaselineSchema>>;
  const sql = async (strings: TemplateStringsArray, ...values: unknown[]) =>
    (
      await baseline.db.query(
        strings.reduce((q, p, i) => q + (i ? "$" + i : "") + p, ""),
        values,
      )
    ).rows;
  const overdue = async () =>
    (await healthReport(sql, env)).lifecycle.overdueJobs;
  // A queue row two hours overdue, for a challenge in the given status.
  async function queued(status: string) {
    const id = randomUUID();
    await baseline.db.query(
      `INSERT INTO challenges (id,title,description,category,duration,difficulty,start_date,end_date,status,lifecycle_version)
       VALUES ($1,'t','d','fitness','1 days','easy',now(),now()+interval '1 day',$2,1)`,
      [id, status],
    );
    await baseline.db.query(
      "INSERT INTO challenge_lifecycle_queue (challenge_id,next_attempt_at) VALUES ($1,now()-interval '2 hours')",
      [id],
    );
  }

  beforeAll(async () => {
    baseline = await createBaselineSchema(
      databaseUrl!,
      "health_acceptance_" + process.pid,
    );
  });
  afterAll(async () => {
    await baseline?.drop();
  });
  beforeEach(() => baseline.db.query("TRUNCATE challenges CASCADE"));

  it("counts a stuck queue entry for a challenge the cron should be processing", async () => {
    await queued("active");
    expect(await overdue()).toBe(1);
  });

  // Regression (Codex review, PR #11): suspending a challenge leaves its queue
  // row, and the cron deliberately skips suspended challenges, so the row went
  // overdue and /api/health reported "degraded" for the whole suspension even
  // though the scheduler was healthy.
  it("ignores queue entries the cron deliberately skips (suspended, cancelled, settled)", async () => {
    await queued("suspended");
    await queued("cancelled");
    await queued("rewards_distributed");
    expect(await overdue()).toBe(0);
  });

  it("still flags a real stall when a suspended challenge sits beside it", async () => {
    await queued("suspended");
    await queued("pending");
    await queued("ended");
    const report = await healthReport(sql, env);
    expect(report.lifecycle.overdueJobs).toBe(2);
    expect(report.lifecycle.oldestOverdueMinutes).toBeGreaterThanOrEqual(119);
  });
});
