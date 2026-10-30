import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Stakr",
  description:
    "Learn how Stakr collects, uses, and protects your personal information",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pb-24">
      <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">
        Last Updated: 30 October 2026
      </p>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">1. Introduction</h2>
          <p>
            Welcome to Stakr (&quot;we,&quot; &quot;our,&quot; or
            &quot;us&quot;). We respect your privacy and are committed to
            protecting your personal data. This privacy policy explains how we
            collect, use, disclose, and safeguard your information when you use
            our challenge-based accountability platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">
            2. Information We Collect
          </h2>
          <h3 className="text-xl font-semibold mt-6 mb-3">
            2.1 Information you provide
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Account:</strong> your name, email address and a public
              handle. Your password is stored only as a salted bcrypt hash; we
              cannot read it.
            </li>
            <li>
              <strong>Challenges:</strong> challenges you host or join, your
              stakes and your credit history (a ledger of every credit
              movement).
            </li>
            <li>
              <strong>Evidence:</strong> the text, photos or videos you submit,
              the reviewer&apos;s decision and reason, and any appeal you make.
            </li>
            <li>
              <strong>Messages to us:</strong> support and privacy requests you
              email to us.
            </li>
          </ul>
          <h3 className="text-xl font-semibold mt-6 mb-3">
            2.2 Collected automatically
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Session cookie:</strong> an essential cookie that keeps
              you signed in. We do not use advertising cookies or third-party
              analytics trackers.
            </li>
            <li>
              <strong>IP address:</strong> used briefly to limit repeated
              sign-in and email requests (abuse protection). These counters are
              deleted within a day. Our hosting provider also keeps standard
              server logs.
            </li>
            <li>
              <strong>Error reports:</strong> technical details when something
              breaks, sent to our error-monitoring provider.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">
            3. How We Use Your Information
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Run the platform: sign-in, challenges, evidence review, appeals
              and settlement
            </li>
            <li>
              Keep the credit ledger accurate so every balance can be reconciled
            </li>
            <li>
              Send service emails: email verification, password resets and
              account notices. We do not send marketing email.
            </li>
            <li>
              Notify you in the app about decisions on your evidence and
              challenge outcomes
            </li>
            <li>
              Prevent fraud, abuse and multiple accounts, and enforce our Terms
            </li>
            <li>Fix problems and keep the service secure</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">
            4. How We Share Your Information
          </h2>
          <p className="font-semibold">
            We do <strong>not</strong> sell your personal data.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-3">
            4.1 Who can see what
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Other users can see your display name where you host a challenge.
              Your evidence is private: it is visible to you and to Stakr
              reviewers and administrators, not to other participants.
            </li>
            <li>
              Stakr reviewers and administrators can see your name, email,
              challenge activity, credit history and evidence in order to run
              the service.
            </li>
          </ul>
          <h3 className="text-xl font-semibold mt-6 mb-3">
            4.2 Service providers
          </h3>
          <p>
            We use these providers to operate Stakr. They process data only to
            provide their service to us:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Vercel:</strong> application hosting
            </li>
            <li>
              <strong>Neon:</strong> database hosting (PostgreSQL)
            </li>
            <li>
              <strong>Amazon Web Services (S3):</strong> private storage for
              evidence files
            </li>
            <li>
              <strong>Resend:</strong> sending service emails
            </li>
            <li>
              <strong>Sentry:</strong> error monitoring
            </li>
          </ul>
          <h3 className="text-xl font-semibold mt-6 mb-3">
            4.3 Legal requirements
          </h3>
          <p>
            We may disclose information if required by law, court order or
            government request, or where needed to enforce our Terms, protect
            rights, property or safety, or prevent fraud.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-3">
            4.4 Business transfers
          </h3>
          <p>
            If Stakr is involved in a merger, acquisition or sale, your
            information may be transferred. We will tell you before this
            happens.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">
            5. Third-Party Integrations
          </h2>
          <p>
            Stakr does not currently connect to fitness trackers, wearables or
            other apps, and does not collect data from them. If we add this, we
            will ask for your explicit consent first and update this policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">6. Data Security</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              All traffic uses HTTPS, and our database and file storage
              providers encrypt data at rest
            </li>
            <li>
              Evidence files are stored in a private bucket and shown to
              authorised people through short-lived links
            </li>
            <li>
              Passwords are hashed; sign-in, password-reset and email-sending
              attempts are rate limited
            </li>
            <li>
              Administrator actions, credit grants and account changes are
              recorded in an audit log
            </li>
          </ul>
          <p className="mt-4">
            No system is perfectly secure. If a breach affecting your
            information occurs, we will notify you and the Privacy Commissioner
            as the Privacy Act 2020 requires.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">7. Data Retention</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Account data:</strong> kept while your account is open.
            </li>
            <li>
              <strong>Deleted accounts:</strong> your name, email, password hash
              and login are removed immediately. We keep an anonymised record of
              credit movements and settled challenges, because other
              people&apos;s results and our financial audit trail depend on it.
            </li>
            <li>
              <strong>Evidence:</strong> kept with the challenge record so a
              result can be reviewed or disputed. You can ask us to delete or
              anonymise your evidence once the challenge has settled; write to
              the privacy address below.
            </li>
            <li>
              <strong>Verification and password-reset links:</strong> expire
              after 24 hours.
            </li>
            <li>
              <strong>Abuse-protection counters:</strong> deleted within a day.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">8. Your Rights</h2>
          <p>Under the New Zealand Privacy Act 2020 you can:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>See your information:</strong> Settings &rarr;
              &quot;Download my data&quot; gives you a copy as a file.
            </li>
            <li>
              <strong>Correct it:</strong> change your display name in Settings,
              or email us to correct anything else, such as your email address.
            </li>
            <li>
              <strong>Delete your account:</strong> Settings &rarr; &quot;Delete
              my account&quot;. This is not available while you host or take
              part in a challenge that has not finished, because other
              people&apos;s results depend on it.
            </li>
            <li>
              <strong>Complain:</strong> if you are unhappy with how we handle
              your information, contact us first at the privacy address below.
              You can also complain to the Office of the Privacy Commissioner
              (privacy.org.nz).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">
            9. Children&apos;s Privacy
          </h2>
          <p>
            Stakr is not intended for users under 13 years old. We do not
            knowingly collect data from children under 13. If you believe a
            child has provided us with personal information, please contact us
            immediately and we will delete it.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">
            10. International Data Transfers
          </h2>
          <p>
            Your information may be transferred to and processed in countries
            other than your own. We ensure appropriate safeguards are in place
            to protect your data in accordance with this privacy policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">
            11. Changes to This Policy
          </h2>
          <p>
            We may update this privacy policy from time to time. We will notify
            you of significant changes via email or prominent notice on our
            platform. Your continued use after changes constitutes acceptance of
            the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">12. Contact Us</h2>
          <p>
            If you have questions about this privacy policy or our data
            practices, contact us:
          </p>
          <ul className="list-none space-y-2 mt-4">
            <li>
              <strong>Email:</strong>{" "}
              <a href="mailto:privacy@stakr.app" className="underline">
                privacy@stakr.app
              </a>
            </li>
            <li>
              <strong>Support:</strong>{" "}
              <a href="mailto:support@stakr.app" className="underline">
                support@stakr.app
              </a>
            </li>
            <li>
              <strong>Legal Contact:</strong>{" "}
              <a href="mailto:legal@stakr.app" className="underline">
                legal@stakr.app
              </a>
            </li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            For official legal correspondence, please use the email addresses
            above. Physical address available upon request for legal matters.
          </p>
        </section>

        <section className="border-t pt-8 mt-12">
          <p className="text-sm text-muted-foreground">
            <strong>Effective Date:</strong> 30 October 2026
            <br />
            <strong>Last Updated:</strong> 30 October 2026
            <br />
            <strong>Version:</strong> 1.0
          </p>
        </section>
      </div>
    </div>
  );
}
