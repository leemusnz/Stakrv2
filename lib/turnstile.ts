import { turnstileOn } from "@/config/turnstile.cjs";

/**
 * Cloudflare Turnstile ("prove you're human") for password sign-in.
 *
 * Why: sign-in is limited per email address so password guessing is slow, but
 * that let anyone who knew an address use up its attempts and lock the owner out
 * for 15 minutes at a time (BUGS.md O-13). With this on, an attempt that has not
 * passed the check is turned away before it touches the account's attempt
 * budget, so bots can neither lock people out nor guess at speed.
 *
 * Off unless both keys are set (config/turnstile.cjs), so nothing changes until
 * the owner opts in. It never locks everyone out: if Cloudflare or the keys are
 * broken the result is "unavailable" and sign-in behaves as it did before the
 * check existed. That includes a visitor whose browser could not run the box
 * because Cloudflare is down: they send no token, and we ask Cloudflare ourselves
 * rather than take their word for it (see "no token" below).
 */
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const MAX_TOKEN_LENGTH = 2048;
const TIMEOUT_MS = 4000;
/** How long "Cloudflare is answering / is not" is remembered for visitors with no token. */
const AVAILABILITY_TTL_MS = 30_000;
/** Cloudflare says our setup is broken, not that the visitor failed the check. */
const OUR_FAULT = new Set([
  "internal-error",
  "missing-input-secret",
  "invalid-input-secret",
]);

export type TurnstileResult = "valid" | "invalid" | "unavailable";

/** One rule for "switched on" (both keys), shared with the headers, the build and the form. */
export const turnstileEnabled = turnstileOn;

/** What we last learned about Cloudflare for token-less visitors. Never holds a verdict on a token. */
let availability: { at: number; result: TurnstileResult } | undefined;

/**
 * Asks Cloudflare about one token. `unavailable` means Cloudflare or our setup is
 * at fault, not the visitor.
 * @cost one HTTPS request to Cloudflare (a few hundred ms), only when enabled.
 */
async function askCloudflare(
  token: string,
  ip: string | undefined,
  env: NodeJS.ProcessEnv,
  fetchImpl: typeof fetch,
): Promise<TurnstileResult> {
  const secret = env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return "unavailable";
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "unknown") body.set("remoteip", ip);
    const response = await fetchImpl(VERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      console.warn("Turnstile verification unavailable", response.status);
      return "unavailable";
    }
    const result = (await response.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };
    if (result.success === true) return "valid";
    const codes = result["error-codes"] ?? [];
    if (codes.some((code) => OUR_FAULT.has(code))) {
      console.warn("Turnstile is misconfigured or down", codes.join(","));
      return "unavailable";
    }
    return "invalid";
  } catch (error) {
    console.warn(
      "Turnstile verification unavailable",
      error instanceof Error ? error.name : "unknown",
    );
    return "unavailable";
  }
}

/**
 * A visitor with no token: their browser could not run the box (Cloudflare down, a
 * content blocker), or they are a script that never tried. We cannot tell which from
 * what they send, and must not take their word for it, so we ask Cloudflare. If it
 * answers, it is up, so the visitor should have had a token: turn them away without
 * touching anyone's budget. If it cannot be reached, nobody can pass the check, so
 * carry on as before the check existed. The answer is remembered for a short while so
 * token-less attempts cannot make us hammer Cloudflare. A token-less visitor is never
 * let through on Cloudflare's say-so alone: only "it is down" opens the door.
 */
async function visitorWithoutToken(
  env: NodeJS.ProcessEnv,
  fetchImpl: typeof fetch,
  now: () => number,
): Promise<TurnstileResult> {
  if (availability && now() - availability.at < AVAILABILITY_TTL_MS) {
    return availability.result;
  }
  const answer = await askCloudflare("", undefined, env, fetchImpl);
  const result = answer === "unavailable" ? "unavailable" : "invalid";
  availability = { at: now(), result };
  return result;
}

/**
 * Asks Cloudflare whether a widget token is genuine. A token works once, so a real
 * token is always checked afresh, never answered from memory.
 * @cost one HTTPS request to Cloudflare (a few hundred ms), only when enabled.
 */
export async function verifyTurnstile(
  token: unknown,
  ip: string | undefined,
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
  now: () => number = Date.now,
): Promise<TurnstileResult> {
  if (token === undefined || token === null || token === "") {
    return visitorWithoutToken(env, fetchImpl, now);
  }
  if (typeof token !== "string" || token.length > MAX_TOKEN_LENGTH) {
    return "invalid";
  }
  return askCloudflare(token, ip, env, fetchImpl);
}
