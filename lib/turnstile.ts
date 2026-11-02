/**
 * Cloudflare Turnstile ("prove you're human") for password sign-in.
 *
 * Why: sign-in is limited per email address so password guessing is slow, but
 * that let anyone who knew an address use up its attempts and lock the owner out
 * for 15 minutes at a time (BUGS.md O-13). With this on, an attempt that has not
 * passed the check is turned away before it touches the account's attempt
 * budget, so bots can neither lock people out nor guess at speed.
 *
 * Off unless both keys are set, so nothing changes until the owner opts in.
 * It never locks everyone out: if Cloudflare or the keys are broken the result
 * is "unavailable" and sign-in behaves as it did before the check existed.
 */
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const MAX_TOKEN_LENGTH = 2048;
const TIMEOUT_MS = 4000;
/** Cloudflare says our setup is broken, not that the visitor failed the check. */
const OUR_FAULT = new Set([
  "internal-error",
  "missing-input-secret",
  "invalid-input-secret",
]);

export type TurnstileResult = "valid" | "invalid" | "unavailable";

export function turnstileEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return Boolean(
    env.TURNSTILE_SECRET_KEY?.trim() &&
    env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim(),
  );
}

/**
 * Asks Cloudflare whether a widget token is genuine. A token works once.
 * @cost one HTTPS request to Cloudflare (a few hundred ms), only when enabled.
 */
export async function verifyTurnstile(
  token: unknown,
  ip: string | undefined,
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<TurnstileResult> {
  if (
    typeof token !== "string" ||
    token.length === 0 ||
    token.length > MAX_TOKEN_LENGTH
  )
    return "invalid";
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
