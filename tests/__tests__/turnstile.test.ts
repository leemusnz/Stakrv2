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

  it.each([42, {}, "x".repeat(2049)])(
    "rejects an absurd token (%p) without calling Cloudflare",
    async (token) => {
      const { fetchImpl, calls } = reply({ success: true });
      await expect(verifyTurnstile(token, "ip", keys, fetchImpl)).resolves.toBe(
        "invalid",
      );
      expect(calls).toHaveLength(0);
    },
  );

  it("checks a real token with Cloudflare every time, never from memory", async () => {
    const { fetchImpl, calls } = reply({ success: true });
    await verifyTurnstile("same-token", "ip", keys, fetchImpl);
    await verifyTurnstile("same-token", "ip", keys, fetchImpl);
    expect(calls).toHaveLength(2);
  });

  // A visitor whose browser could not run the widget (Cloudflare down, a content blocker)
  // sends no token. Turning them away must depend on whether Cloudflare is reachable, which
  // only Cloudflare's own state can change, never on anything the visitor claims
  // (Codex review on PR #13, P1).
  describe("when no token arrives", () => {
    let now = 0;
    const clock = () => now;
    // Each test starts after the previous test's remembered answer has expired.
    beforeEach(() => {
      now += 10 * 60_000;
    });
    const down = (calls: { n: number }) =>
      (async () => {
        calls.n++;
        throw new Error("ECONNRESET");
      }) as unknown as typeof fetch;

    it.each([undefined, null, ""])(
      "turns the visitor away (%p) while Cloudflare is answering",
      async (token) => {
        const { fetchImpl, calls } = reply({
          success: false,
          "error-codes": ["missing-input-response"],
        });
        await expect(
          verifyTurnstile(token, "ip", keys, fetchImpl, clock),
        ).resolves.toBe("invalid");
        expect(calls).toHaveLength(1);
        expect(
          new URLSearchParams(String(calls[0].init.body)).get("response"),
        ).toBe("");
      },
    );

    it("lets the visitor carry on ('unavailable') when Cloudflare cannot be reached", async () => {
      const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
      const calls = { n: 0 };
      await expect(
        verifyTurnstile(undefined, "ip", keys, down(calls), clock),
      ).resolves.toBe("unavailable");
      warn.mockRestore();
    });

    it("remembers that Cloudflare is answering for 30 seconds, then asks again", async () => {
      const { fetchImpl, calls } = reply({
        success: false,
        "error-codes": ["missing-input-response"],
      });
      await verifyTurnstile("", "ip", keys, fetchImpl, clock);
      now += 29_000;
      await verifyTurnstile("", "ip", keys, fetchImpl, clock);
      expect(calls).toHaveLength(1);
      now += 2_000;
      await verifyTurnstile("", "ip", keys, fetchImpl, clock);
      expect(calls).toHaveLength(2);
    });

    it("remembers an outage for 30 seconds too, so visitors cannot make us hammer Cloudflare", async () => {
      const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
      const calls = { n: 0 };
      await verifyTurnstile("", "ip", keys, down(calls), clock);
      now += 10_000;
      await expect(
        verifyTurnstile("", "ip", keys, down(calls), clock),
      ).resolves.toBe("unavailable");
      expect(calls.n).toBe(1);
      warn.mockRestore();
    });

    // The 30-second memory is only about whether Cloudflare is up. It must never decide a real
    // token, or one visitor's outage (or refusal) would be replayed onto the next visitor.
    it("still checks a real token with Cloudflare right after a token-less visit, whatever was remembered", async () => {
      const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
      // Remembered: "Cloudflare is answering".
      await verifyTurnstile(
        "",
        "ip",
        keys,
        reply({ success: false, "error-codes": ["missing-input-response"] })
          .fetchImpl,
        clock,
      );
      const first = reply({ success: true });
      await expect(
        verifyTurnstile("tok-1", "ip", keys, first.fetchImpl, clock),
      ).resolves.toBe("valid");
      expect(first.calls).toHaveLength(1);

      // Remembered: "Cloudflare is not answering".
      now += 31_000;
      await verifyTurnstile("", "ip", keys, down({ n: 0 }), clock);
      const second = reply({ success: true });
      await expect(
        verifyTurnstile("tok-2", "ip", keys, second.fetchImpl, clock),
      ).resolves.toBe("valid");
      expect(second.calls).toHaveLength(1);
      warn.mockRestore();
    });

    it("never lets a visitor in without a token, even if Cloudflare says an empty answer is fine", async () => {
      const { fetchImpl } = reply({ success: true });
      await expect(
        verifyTurnstile("", "ip", keys, fetchImpl, clock),
      ).resolves.toBe("invalid");
    });
  });

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
