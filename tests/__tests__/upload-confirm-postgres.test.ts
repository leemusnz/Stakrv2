/** @jest-environment node */
// Regression (Codex security + code review, PR #11): evidence confirmation checked
// "already confirmed", then copied, then inserted, with nothing between the steps.
// Concurrent confirmations of one upload each copied it (orphaned objects), and
// because the destination is derived from the upload, a later copy could overwrite
// the object the first one had already recorded if the uploader swapped the source
// file in between. They must be serialised per upload.
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import type { Pool } from "pg";
import { createBaselineSchema } from "../helpers/baseline-db";
import { POST } from "@/app/api/upload/confirm/route";

let mockDb: Pool;
let mockCopies = 0;
const mockUser = "00000000-0000-4000-8000-000000000001";

jest.mock("@neondatabase/serverless", () => ({
  Pool: jest.requireActual("pg").Pool,
}));
jest.mock("next-auth", () => ({
  getServerSession: async () => ({
    user: { id: "00000000-0000-4000-8000-000000000001" },
  }),
}));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/db", () => ({
  createDbConnection:
    () =>
    async (strings: TemplateStringsArray, ...values: unknown[]) =>
      (
        await mockDb.query(
          strings.reduce((s, p, i) => s + (i ? "$" + i : "") + p, ""),
          values,
        )
      ).rows,
}));
jest.mock("@/lib/storage", () => ({
  // A slow copy keeps the window between "check" and "insert" open, as S3 does.
  confirmEvidenceObject: async () => {
    mockCopies++;
    await new Promise((resolve) => setTimeout(resolve, 60));
    return {
      storageKey: "confirmed-evidence/x/" + mockCopies,
      contentType: "image/jpeg",
      byteSize: 2048,
    };
  },
}));
jest.mock("@/lib/rate-limit-db", () => ({
  ...jest.requireActual("@/lib/rate-limit-db"),
  enforce: async () => ({
    allowed: true,
    retryAfterSeconds: 0,
    mode: "database",
  }),
}));

const databaseUrl = process.env.STAKR_TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;

describeDatabase("evidence confirmation on the production schema", () => {
  let baseline: Awaited<ReturnType<typeof createBaselineSchema>>;
  const original = process.env.DATABASE_URL;
  const challenge = randomUUID();
  const key = (name: string) =>
    `verification-files/images/${challenge}/${mockUser}/${name}`;
  const confirm = (fileKey: string) =>
    POST(
      new NextRequest("http://localhost/api/upload/confirm", {
        method: "POST",
        body: JSON.stringify({ fileKey, challengeId: challenge }),
      }),
    );
  const rows = async () =>
    (await mockDb.query("SELECT file_key FROM proof_uploads")).rows;

  beforeAll(async () => {
    baseline = await createBaselineSchema(
      databaseUrl!,
      "confirm_acceptance_" + process.pid,
    );
    mockDb = baseline.db;
    process.env.DATABASE_URL = baseline.scopedUrl;
    await mockDb.query(
      "INSERT INTO users (id,email,name,username) VALUES ($1,'u@example.test','u','u')",
      [mockUser],
    );
    await mockDb.query(
      `INSERT INTO challenges (id,title,description,category,duration,difficulty,start_date,end_date)
       VALUES ($1,'t','d','fitness','1 days','easy',now(),now()+interval '1 day')`,
      [challenge],
    );
    await mockDb.query(
      "INSERT INTO challenge_participants (challenge_id,user_id,stake_amount,entry_fee_paid) VALUES ($1,$2,5,0.25)",
      [challenge, mockUser],
    );
  });
  afterAll(async () => {
    if (original === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original;
    await baseline?.drop();
  });
  beforeEach(async () => {
    mockCopies = 0;
    await mockDb.query("TRUNCATE proof_uploads");
  });

  it("copies one upload exactly once however many confirmations race", async () => {
    const responses = await Promise.all(
      Array.from({ length: 8 }, () => confirm(key("a.jpg"))),
    );
    expect(responses.map((r) => r.status)).toEqual(Array(8).fill(200));
    expect(mockCopies).toBe(1);
    expect(await rows()).toHaveLength(1);
  });

  it("does not hold different uploads up behind each other", async () => {
    await Promise.all([
      confirm(key("a.jpg")),
      confirm(key("a.jpg")),
      confirm(key("b.jpg")),
      confirm(key("b.jpg")),
    ]);
    expect(mockCopies).toBe(2);
    expect(await rows()).toHaveLength(2);
  });

  it("a confirmation after the upload is recorded copies nothing", async () => {
    await confirm(key("a.jpg"));
    await confirm(key("a.jpg"));
    expect(mockCopies).toBe(1);
  });
});
