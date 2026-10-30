/** @jest-environment node */
import { sendEmail } from "@/lib/email";

// Regression: with no RESEND_API_KEY, sendEmail reported success in every
// environment. Production sign-in requires a verified email, so a mis-configured
// deploy silently stranded every new user.
const template = { to: "a@b.test", subject: "s", html: "<p>x</p>" };
const env = process.env as Record<string, string | undefined>;
const saved = { key: env.RESEND_API_KEY, node: env.NODE_ENV };

describe("sendEmail without a configured mailer", () => {
  beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => {
    if (saved.key === undefined) delete env.RESEND_API_KEY;
    else env.RESEND_API_KEY = saved.key;
    env.NODE_ENV = saved.node;
  });

  it.each([undefined, "", "dummy-key-for-development"])(
    "fails loudly in production when the key is %p",
    async (key) => {
      env.NODE_ENV = "production";
      if (key === undefined) delete env.RESEND_API_KEY;
      else env.RESEND_API_KEY = key;
      await expect(sendEmail(template)).resolves.toEqual({
        success: false,
        error: "Email service is not configured",
      });
    },
  );

  it("still lets local development proceed without a key", async () => {
    env.NODE_ENV = "development";
    delete env.RESEND_API_KEY;
    await expect(sendEmail(template)).resolves.toEqual({ success: true });
  });
});
