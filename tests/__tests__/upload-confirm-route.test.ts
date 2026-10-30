/** @jest-environment node */
// Regression (Codex security review, PR #11): the confirm endpoint copies a
// stored object on every call and had no rate limit, unlike the presign endpoint.
import { NextRequest } from "next/server";
import { POST } from "@/app/api/upload/confirm/route";

let mockAllowed = true;
let mockCopies = 0;

jest.mock("next-auth", () => ({
  getServerSession: async () => ({
    user: { id: "00000000-0000-4000-8000-000000000001" },
  }),
}));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/db", () => ({
  createDbConnection: () => async (strings: TemplateStringsArray) =>
    strings.join("?").includes("FROM challenge_participants")
      ? [{ id: 1 }]
      : [],
}));
jest.mock("@/lib/db/transaction", () => ({
  withTransaction: async (work: (sql: () => Promise<never[]>) => unknown) =>
    work(async () => []),
}));
jest.mock("@/lib/storage", () => ({
  confirmEvidenceObject: async () => {
    mockCopies++;
    return {
      storageKey: "confirmed-evidence/x",
      contentType: "image/jpeg",
      byteSize: 1,
    };
  },
}));
jest.mock("@/lib/rate-limit-db", () => ({
  ...jest.requireActual("@/lib/rate-limit-db"),
  enforce: async () => ({
    allowed: mockAllowed,
    retryAfterSeconds: 42,
    mode: "database",
  }),
}));

const request = () =>
  new NextRequest("http://localhost/api/upload/confirm", {
    method: "POST",
    body: JSON.stringify({
      fileKey: "verification-files/images/c/u/a.jpg",
      challengeId: "00000000-0000-4000-8000-0000000000c1",
    }),
  });

describe("POST /api/upload/confirm", () => {
  beforeEach(() => {
    mockAllowed = true;
    mockCopies = 0;
  });

  it("is rate limited per user, and refuses before touching storage", async () => {
    mockAllowed = false;
    const res = await POST(request());
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("42");
    expect(mockCopies).toBe(0);
  });

  it("confirms normally while under the limit", async () => {
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(mockCopies).toBe(1);
  });
});
