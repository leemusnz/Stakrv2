/** @jest-environment node */
import { generateResetToken, generateVerificationToken } from "@/lib/email";

// Regression: tokens were Math.random().toString(36) + Date.now().toString(36),
// which is predictable and allowed password-reset account takeover.
describe.each([
  ["verification", generateVerificationToken],
  ["reset", generateResetToken],
])("%s token", (_name, generate) => {
  it("carries 256 bits of URL-safe entropy", () => {
    expect(generate()).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("does not depend on Math.random or the clock", () => {
    const random = jest.spyOn(Math, "random").mockReturnValue(0.123456789);
    const now = jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    try {
      expect(generate()).not.toBe(generate());
    } finally {
      random.mockRestore();
      now.mockRestore();
    }
  });

  it("never repeats across many draws", () => {
    const seen = new Set(Array.from({ length: 5000 }, () => generate()));
    expect(seen.size).toBe(5000);
  });

  it("fits the verification_tokens.token column (varchar 255)", () => {
    expect(generate().length).toBeLessThanOrEqual(255);
  });
});
