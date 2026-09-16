import { NextRequest } from "next/server";
const sql = jest.fn(),
  session = jest.fn(),
  create = jest.fn();
jest.mock("@/lib/db", () => ({ createDbConnection: () => sql }));
jest.mock("next-auth", () => ({ getServerSession: () => session() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/challenge-create", () => ({
  ...jest.requireActual("@/lib/challenge-create"),
  createChallenge: (...args: any[]) => create(...args),
}));
import { GET, POST } from "@/app/api/challenges/route";
beforeEach(() => {
  session.mockResolvedValue({ user: { id: "user" } });
  sql.mockResolvedValue([]);
});
it("preserves thumbnail metadata while binding filters and pagination", async () => {
  sql.mockResolvedValue([
    { id: "a", thumbnail_url: "https://example.com/a.webp" },
    { id: "b", thumbnail_url: null },
  ]);
  const r = await GET(
    new NextRequest(
      "http://localhost/api/challenges?limit=2&category=fitness&q=walk",
    ),
  );
  const d = await r.json();
  expect(r.status).toBe(200);
  expect(d.challenges[0].thumbnail_url).toBe("https://example.com/a.webp");
  expect(d.challenges[1].thumbnail_url).toBeNull();
  expect(d.hasMore).toBe(true);
  expect(sql.mock.calls[0][0].join("?")).toContain("LIMIT ? OFFSET ?");
  expect(sql.mock.calls[0]).toContain("%walk%");
});
it.each(["limit=-1", "limit=101", "offset=-1", "limit=NaN", "status=invalid"])(
  "rejects invalid filter %s",
  async (q) => {
    const r = await GET(
      new NextRequest("http://localhost/api/challenges?" + q),
    );
    expect(r.status).toBe(400);
    expect(sql).not.toHaveBeenCalled();
  },
);
it("requires authentication before querying", async () => {
  session.mockResolvedValue(null);
  expect(
    (await GET(new NextRequest("http://localhost/api/challenges"))).status,
  ).toBe(401);
  expect(sql).not.toHaveBeenCalled();
});
it("never substitutes demo challenges when the database fails", async () => {
  sql.mockRejectedValue(new Error("offline"));
  const r = await GET(new NextRequest("http://localhost/api/challenges"));
  expect(r.status).toBe(500);
  expect((await r.json()).challenges).toBeUndefined();
});
it("requires explicit daily evidence policy before creating a challenge", async () => {
  const r = await POST(
    new NextRequest("http://localhost/api/challenges", {
      method: "POST",
      body: JSON.stringify({
        title: "Incomplete draft",
        thumbnail_url: "https://example.com/a.webp",
      }),
    }),
  );
  expect(r.status).toBe(400);
  expect(create).not.toHaveBeenCalled();
});
it("publishes a valid policy through the transactional creator", async () => {
  create.mockResolvedValue({ id: "created" });
  const data = {
    requestId: "11111111-1111-4111-8111-111111111111",
    title: "Daily walk",
    description: "Walk thirty minutes every day.",
    category: "fitness",
    startDate: "2027-01-01T00:00:00Z",
    endDate: "2027-01-08T00:00:00Z",
    requiredDays: 7,
    minStake: 10,
    maxStake: 100,
    proofTypes: ["text"],
    proofInstructions: "Describe your walk route and duration.",
    rules: ["Walk for at least thirty minutes."],
  };
  const r = await POST(
    new NextRequest("http://localhost/api/challenges", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  );
  expect(r.status).toBe(201);
  expect(create).toHaveBeenCalledWith(
    "user",
    expect.objectContaining({ requiredDays: 7, graceHours: 24 }),
  );
  expect((await r.json()).challenge.id).toBe("created");
});
