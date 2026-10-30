/** @jest-environment node */
// Regression (Codex security review, PR #11): creating a challenge had no rate
// limit, so one verified account could publish challenges without bound, each
// taking a place in the lifecycle queue and in Discover.
import { NextRequest } from "next/server";
import { POST } from "@/app/api/challenges/route";

let mockAllowed = true;
let mockCreated = 0;

jest.mock("next-auth", () => ({
  getServerSession: async () => ({
    user: { id: "00000000-0000-4000-8000-000000000001" },
  }),
}));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/db", () => ({ createDbConnection: () => async () => [] }));
jest.mock("@/lib/challenge-create", () => ({
  ...jest.requireActual("@/lib/challenge-create"),
  createChallenge: async () => {
    mockCreated++;
    return { id: "c" };
  },
}));
jest.mock("@/lib/rate-limit-db", () => ({
  ...jest.requireActual("@/lib/rate-limit-db"),
  enforce: async () => ({
    allowed: mockAllowed,
    retryAfterSeconds: 90,
    mode: "database",
  }),
}));

const request = () =>
  new NextRequest("http://localhost/api/challenges", {
    method: "POST",
    body: JSON.stringify({
      requestId: "00000000-0000-4000-8000-0000000000a1",
      title: "Daily walk",
      description: "Walk for thirty minutes every day.",
      category: "fitness",
      startDate: "2030-01-02T00:00:00Z",
      endDate: "2030-01-03T00:00:00Z",
      requiredDays: 1,
      minStake: 1,
      maxStake: 10,
      proofTypes: ["text"],
      proofInstructions: "Explain the duration and location of your walk.",
      rules: ["Walk for thirty minutes."],
    }),
  });

describe("POST /api/challenges", () => {
  beforeEach(() => {
    mockAllowed = true;
    mockCreated = 0;
  });

  it("limits how many challenges one account can publish, before creating anything", async () => {
    mockAllowed = false;
    const res = await POST(request());
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("90");
    expect(mockCreated).toBe(0);
  });

  it("publishes normally while under the limit", async () => {
    const res = await POST(request());
    expect(res.status).toBe(201);
    expect(mockCreated).toBe(1);
  });
});
