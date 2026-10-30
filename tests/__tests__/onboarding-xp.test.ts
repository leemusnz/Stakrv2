/** @jest-environment node */
import { NextRequest } from "next/server";

// Regression: complete-profile used `xp || 300` from the request body, so any
// signed-in user could POST an arbitrary number once and set their own level.
const calls: { text: string; values: unknown[] }[] = [];
// Plain functions, not jest.fn(): the project config sets resetMocks, which would wipe them.
jest.mock("next-auth", () => ({
  getServerSession: async () => ({ user: { id: "u-1" } }),
}));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/moderation", () => ({
  moderationService: {
    moderateProfileName: async () => ({ flagged: false, reason: [] }),
  },
}));
jest.mock("@/lib/db", () => ({
  createDbConnection:
    () =>
    async (strings: TemplateStringsArray, ...values: unknown[]) => {
      const text = strings.join("?");
      calls.push({ text, values });
      if (text.includes("SELECT id, email, name"))
        return [{ id: "u-1", onboarding_completed: false, xp: 0, level: 1 }];
      if (text.includes("award_xp")) return [{ success: true }];
      if (text.includes("UPDATE users"))
        return [
          {
            id: "u-1",
            email: "a@b.test",
            name: "Ana",
            credits: "0.00",
            trust_score: 50,
            xp: 300,
            level: 2,
            onboarding_completed: true,
          },
        ];
      return [];
    },
}));

import { POST } from "@/app/api/onboarding/complete-profile/route";

const post = (body: unknown) =>
  POST(
    new NextRequest("http://localhost/api/onboarding/complete-profile", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
const awardedXp = () =>
  calls.find((c) => c.text.includes("award_xp"))!.values[1];

describe("onboarding XP is decided by the server", () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it.each([999999, 2147483647, 1, -50])(
    "ignores a client-supplied xp of %s",
    async (xp) => {
      const res = await post({ name: "Ana Tester", xp });
      expect(res.status).toBe(200);
      expect(awardedXp()).toBe(300);
    },
  );

  it("awards the documented 300 when no xp is sent", async () => {
    await post({ name: "Ana Tester" });
    expect(awardedXp()).toBe(300);
  });

  it("still accepts the legacy xp and level fields without error", async () => {
    const res = await post({ name: "Ana Tester", xp: 300, level: 2 });
    expect(res.status).toBe(200);
  });
});
