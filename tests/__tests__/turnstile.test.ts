/** @jest-environment node */
// Cloudflare Turnstile ("prove you're human") for password sign-in. It stops bots
// from using up someone else's sign-in attempts or guessing passwords at speed,
// and must never lock everybody out because Cloudflare or the keys are broken.
import { turnstileEnabled, verifyTurnstile } from "@/lib/turnstile";

const keys = {
  TURNSTILE_SECRET_KEY: "secret-xyz",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "site-abc",
} as unknown as NodeJS.ProcessEnv;

function reply(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = (async (url: string, options: RequestInit) => {
    calls.push({ url, init: options });
    return {
      ok: init.ok ?? true,
      status: init.status ?? 200,
      json: async () => body,
    };
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

describe("turnstileEnabled", () => {
  it("is on only when both keys are set", () => {
    expect(turnstileEnabled(keys)).toBe(true);
    expect(turnstileEnabled({} as NodeJS.ProcessEnv)).toBe(false);
    expect(
      turnstileEnabled({
        TURNSTILE_SECRET_KEY: "s",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe(false);
    expect(
      turnstileEnabled({
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: "k",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe(false);
    expect(
      turnstileEnabled({
        ...keys,
        TURNSTILE_SECRET_KEY: "   ",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe(false);
  });
});

describe("verifyTurnstile", () => {
  it("accepts a token Cloudflare says is good, sending the secret and the visitor's address", async () => {
    const { fetchImpl, calls } = reply({ success: true });
    await expect(
      verifyTurnstile("token-1", "203.0.113.9", keys, fetchImpl),
    ).resolves.toBe("valid");
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    );
    const sent = new URLSearchParams(String(calls[0].init.body));
    expect(sent.get("secret")).toBe("secret-xyz");
    expect(sent.get("response")).toBe("token-1");
    expect(sent.get("remoteip")).toBe("203.0.113.9");
  });

  it("leaves the address out when it is unknown", async () => {
    const { fetchImpl, calls } = reply({ success: true });
    await verifyTurnstile("t", "unknown", keys, fetchImpl);
    expect(
      new URLSearchParams(String(calls[0].init.body)).has("remoteip"),
    ).toBe(false);
  });

  it("rejects a token Cloudflare says is bad or already used", async () => {
    const { fetchImpl } = reply({
      success: false,
      "error-codes": ["timeout-or-duplicate"],
    });
    await expect(verifyTurnstile("t", "ip", keys, fetchImpl)).resolves.toBe(
      "invalid",
    );
  });

  it.each([undefined, null, "", 42, {}, "x".repeat(2049)])(
    "rejects a missing or absurd token (%p) without calling Cloudflare",
    async (token) => {
      const { fetchImpl, calls } = reply({ success: true });
      await expect(verifyTurnstile(token, "ip", keys, fetchImpl)).resolves.toBe(
        "invalid",
      );
      expect(calls).toHaveLength(0);
    },
  );

  // These must not turn into "everyone is locked out of password sign-in".
  it.each([
    ["Cloudflare answers with a server error", { ok: false, status: 500 }, {}],
    [
      "Cloudflare reports an internal error",
      {},
      { success: false, "error-codes": ["internal-error"] },
    ],
    [
      "the secret key is wrong",
      {},
      { success: false, "error-codes": ["invalid-input-secret"] },
    ],
    [
      "the secret key is missing",
      {},
      { success: false, "error-codes": ["missing-input-secret"] },
    ],
  ])(
    "reports 'unavailable', not 'invalid', when %s",
    async (_n, init, body) => {
      const { fetchImpl } = reply(body, init);
      const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
      await expect(verifyTurnstile("t", "ip", keys, fetchImpl)).resolves.toBe(
        "unavailable",
      );
      warn.mockRestore();
    },
  );

  it("reports 'unavailable' when the network call fails or times out", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const failing = (async () => {
      throw new Error("ECONNRESET");
    }) as unknown as typeof fetch;
    await expect(verifyTurnstile("t", "ip", keys, failing)).resolves.toBe(
      "unavailable",
    );
    warn.mockRestore();
  });

  it("never throws, and does not leak the secret into logs", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const failing = (async () => {
      throw new Error("boom");
    }) as unknown as typeof fetch;
    await verifyTurnstile("t", "ip", keys, failing);
    expect(JSON.stringify(warn.mock.calls)).not.toContain("secret-xyz");
    warn.mockRestore();
  });
});
