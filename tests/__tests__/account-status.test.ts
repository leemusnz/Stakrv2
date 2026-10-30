/** @jest-environment node */
// Regression: sessions are stateless 30-day JWTs and nothing re-checked the
// database, so a suspended (or deleted/unverified) account kept full access.
let rows: unknown[] = [];
let queries = 0;
jest.mock("@/lib/db", () => ({
  createDbConnection: () => async () => {
    queries += 1;
    return rows;
  },
}));

import {
  clearAccountStatusCache,
  isAccountActive,
  isBlockedStatus,
} from "@/lib/account-status";

const id = "0b9c8a52-0000-4000-8000-000000000001";
const env = process.env as Record<string, string | undefined>;
const nodeEnv = env.NODE_ENV;

beforeEach(() => {
  clearAccountStatusCache();
  queries = 0;
  rows = [{ moderation_status: "approved", email_verified: true }];
});
afterEach(() => {
  env.NODE_ENV = nodeEnv;
});

describe("isAccountActive", () => {
  it("allows a verified, approved account", async () => {
    await expect(isAccountActive(id)).resolves.toBe(true);
  });

  it.each(["suspended", "rejected"])("blocks a %s account", async (status) => {
    rows = [{ moderation_status: status, email_verified: true }];
    await expect(isAccountActive(id)).resolves.toBe(false);
  });

  it("blocks an unverified email", async () => {
    rows = [{ moderation_status: "approved", email_verified: false }];
    await expect(isAccountActive(id)).resolves.toBe(false);
  });

  it("blocks an account that no longer exists", async () => {
    rows = [];
    await expect(isAccountActive(id)).resolves.toBe(false);
  });

  it("caches briefly, then sees a new suspension", async () => {
    await isAccountActive(id, 1_000);
    await isAccountActive(id, 5_000);
    expect(queries).toBe(1);
    rows = [{ moderation_status: "suspended", email_verified: true }];
    await expect(isAccountActive(id, 5_000)).resolves.toBe(true); // still cached
    await expect(isAccountActive(id, 11_001)).resolves.toBe(false); // window elapsed
    expect(queries).toBe(2);
  });

  it("treats non-UUID ids as demo logins: development only", async () => {
    env.NODE_ENV = "production";
    await expect(isAccountActive("demo-1")).resolves.toBe(false);
    env.NODE_ENV = "development";
    await expect(isAccountActive("demo-1")).resolves.toBe(true);
    expect(queries).toBe(0);
  });

  it("propagates a database failure so the caller fails closed", async () => {
    jest.resetModules();
    jest.doMock("@/lib/db", () => ({
      createDbConnection: () => async () => {
        throw new Error("db down");
      },
    }));
    const fresh = await import("@/lib/account-status");
    await expect(fresh.isAccountActive(id)).rejects.toThrow("db down");
  });
});

describe("isBlockedStatus", () => {
  it.each([
    ["suspended", true],
    ["rejected", true],
    ["approved", false],
    ["pending", false],
    [null, false],
    [undefined, false],
  ])("%p -> %p", (status, blocked) =>
    expect(isBlockedStatus(status)).toBe(blocked),
  );
});
