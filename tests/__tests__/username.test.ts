/** @jest-environment node */
import { generateHandle } from "@/lib/username";

// Regression: handles were built from the email's local part, so every public
// profile exposed part of the owner's private email address.
describe("generateHandle", () => {
  it("is built from the display name, not an email", () => {
    expect(generateHandle("Alice Tester")).toMatch(/^alicetester\d{4}$/);
  });

  it("never contains characters outside a-z0-9", () => {
    for (const name of [
      "Jo-Anne O'Neil",
      "  ÉLODIE  ",
      "<script>alert(1)</script>",
      "🙂🙂🙂",
    ])
      expect(generateHandle(name)).toMatch(/^[a-z0-9]{7,24}$/);
  });

  it("falls back to a neutral word for names with no usable characters", () => {
    expect(generateHandle("🙂🙂")).toMatch(/^member\d{4}$/);
  });

  it("truncates long names to stay well inside the column", () => {
    expect(generateHandle("a".repeat(200)).length).toBeLessThanOrEqual(18);
  });

  it("varies between calls", () => {
    expect(
      new Set(Array.from({ length: 200 }, () => generateHandle("Sam"))).size,
    ).toBeGreaterThan(100);
  });
});
