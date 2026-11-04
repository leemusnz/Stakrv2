/** @jest-environment node */
// "Is the sign-in human check switched on?" has ONE answer, shared by the security
// headers, the build (which tells the sign-in form) and the server. If the form and the
// server ever disagreed, a half-finished setup could block password sign-in for
// everybody (Codex review on PR #13).
import { turnstileClientEnv, turnstileOn } from "@/config/turnstile.cjs";
import { turnstileEnabled } from "@/lib/turnstile";

const env = (values: Record<string, string>) =>
  values as unknown as NodeJS.ProcessEnv;

const SECRET = "TURNSTILE_SECRET_KEY";
const SITE = "NEXT_PUBLIC_TURNSTILE_SITE_KEY";

describe("the human check is on only when BOTH keys are set", () => {
  it.each([
    ["both keys", { [SECRET]: "s", [SITE]: "k" }, true],
    ["neither key", {}, false],
    ["the site key alone", { [SITE]: "k" }, false],
    ["the secret key alone", { [SECRET]: "s" }, false],
    ["a blank secret key", { [SECRET]: "   ", [SITE]: "k" }, false],
    ["a blank site key", { [SECRET]: "s", [SITE]: "  " }, false],
  ])("%s", (_name, values, expected) => {
    expect(turnstileOn(env(values))).toBe(expected);
    expect(turnstileEnabled(env(values))).toBe(expected);
    expect(turnstileClientEnv(env(values))).toEqual({
      NEXT_PUBLIC_TURNSTILE_ENABLED: expected ? "1" : "",
    });
  });

  it("tells the browser only a yes or no, never a key", () => {
    const flag = turnstileClientEnv(env({ [SECRET]: "s3cret", [SITE]: "k" }));
    expect(JSON.stringify(flag)).not.toContain("s3cret");
  });
});
