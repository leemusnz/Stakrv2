import { NextRequest } from "next/server";
const session = jest.fn(),
  admin = jest.fn(),
  sql = jest.fn(),
  review = jest.fn(),
  batch = jest.fn();
jest.mock("next-auth", () => ({ getServerSession: () => session() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/db", () => ({ createDbConnection: () => sql }));
jest.mock("@/lib/require-admin", () => ({ requireAdmin: () => admin() }));
jest.mock("@/lib/challenge-proofs", () => ({
  ...jest.requireActual("@/lib/challenge-proofs"),
  reviewProof: (...args: any[]) => review(...args),
}));
jest.mock("@/lib/challenge-engine", () => ({
  ...jest.requireActual("@/lib/challenge-engine"),
  runLifecycleBatch: () => batch(),
}));
import { POST as reviewPost } from "@/app/api/admin/verifications/route";
import { POST as grantPost } from "@/app/api/admin/credits/route";
import { GET as cronGet } from "@/app/api/cron/lifecycle/route";
import { GET as proxyGet } from "@/app/api/image-proxy/route";
import { NextResponse } from "next/server";
beforeEach(() => {
  session.mockResolvedValue({ user: { id: "user" } });
  admin.mockResolvedValue({
    ok: false,
    response: NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    ),
  });
  sql.mockResolvedValue([]);
});
it("refuses non-admin proof decisions and credit grants before writes", async () => {
  const request = new NextRequest("http://localhost/api/admin/verifications", {
    method: "POST",
    body: "{}",
  });
  expect((await reviewPost(request)).status).toBe(403);
  expect((await grantPost(request)).status).toBe(403);
  expect(review).not.toHaveBeenCalled();
  expect(sql).not.toHaveBeenCalled();
});
it("refuses private evidence that does not belong to the session", async () => {
  expect(
    (
      await proxyGet(
        new NextRequest(
          "http://localhost/api/image-proxy?url=" +
            encodeURIComponent(
              "https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/verification-files/images/other/evidence.jpg",
            ),
        ),
      )
    ).status,
  ).toBe(403);
  expect(sql).toHaveBeenCalled();
});
it("requires the scheduler secret and rejects unauthenticated invocations", async () => {
  const before = process.env.CRON_SECRET;
  try {
    delete process.env.CRON_SECRET;
    expect(
      (await cronGet(new NextRequest("http://localhost/api/cron/lifecycle")))
        .status,
    ).toBe(503);
    process.env.CRON_SECRET = "local-test-secret";
    expect(
      (
        await cronGet(
          new NextRequest("http://localhost/api/cron/lifecycle", {
            headers: { Authorization: "Bearer wrong" },
          }),
        )
      ).status,
    ).toBe(401);
    expect(batch).not.toHaveBeenCalled();
    batch.mockResolvedValue([]);
    expect(
      (
        await cronGet(
          new NextRequest("http://localhost/api/cron/lifecycle", {
            headers: { Authorization: "Bearer local-test-secret" },
          }),
        )
      ).status,
    ).toBe(200);
    expect(batch).toHaveBeenCalledTimes(1);
  } finally {
    if (before === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = before;
  }
});
