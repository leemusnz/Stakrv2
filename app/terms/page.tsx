import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Stakr",
  description: "Read the terms and conditions for using Stakr",
};

export default function TermsOfServicePage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pb-24">
      <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
      <p className="text-muted-foreground mb-8">
        Last Updated: 30 October 2026
      </p>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">
            1. Agreement to Terms
          </h2>
          <p>
            By accessing or using Stakr (&quot;Service,&quot;
            &quot;Platform,&quot; &quot;we,&quot; &quot;us,&quot; or
            &quot;our&quot;), you agree to be bound by these Terms of Service
            (&quot;Terms&quot;). If you disagree with any part of these terms,
            you may not access the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">
            2. Description of Service
          </h2>
          <p>Stakr is an accountability platform. Using Stakr you can:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Host a challenge with published rules, dates and evidence
              requirements
            </li>
            <li>Join a challenge by backing your commitment with credits</li>
            <li>
              Submit evidence of your progress for review by a neutral reviewer
            </li>
            <li>
              Recover your stake and share the credits that others forfeit when
              you finish
            </li>
          </ul>
          <p className="mt-4">
            <strong>Credits have no cash value.</strong> They cannot be bought,
            sold, transferred or withdrawn, and Stakr does not currently accept
            payments or pay out money.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">3. Eligibility</h2>
          <p>You must:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Be at least 13 years old</li>
            <li>
              Provide accurate registration information and a working email
              address
            </li>
            <li>Maintain the security of your account</li>
            <li>Not have been suspended or removed from Stakr</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">
            4. Account Registration
          </h2>
          <p>You are responsible for:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Maintaining the confidentiality of your password</li>
            <li>All activities under your account</li>
            <li>Notifying us immediately of unauthorized access</li>
            <li>Ensuring your account information is accurate and current</li>
          </ul>
          <p className="mt-4">
            We reserve the right to suspend or terminate accounts that violate
            these Terms or engage in fraudulent activity.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">
            5. Challenges and Credits
          </h2>
          <h3 className="text-xl font-semibold mt-6 mb-3">
            5.1 Hosting a challenge
          </h3>
          <p>
            A host publishes the rules before anyone joins, including the UTC
            start and end dates, the number of approved proof days required, the
            evidence accepted, the stake range, any credits the host adds to the
            pool, and the entry fee and platform share. Credits a host adds are
            deducted when the challenge is published.{" "}
            <strong>Published terms cannot be changed.</strong> Hosts must set
            fair, achievable and lawful goals.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-3">
            5.2 Joining a challenge
          </h3>
          <p>
            When you join, you stake credits within the published range and pay
            the entry fee shown on the join screen. You must accept the
            published rules first. Joining closes when the challenge starts or
            is full, and a stake is locked once you join.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-3">
            5.3 Fees and outcomes
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Entry fee:</strong> a percentage of your stake (5% unless
              the challenge shows otherwise), charged on top of the stake and
              kept by Stakr. It is not part of the pool.
            </li>
            <li>
              <strong>Finishing:</strong> you finish when you have the required
              number of distinct approved proof days by the proof deadline (the
              end date plus the grace period) and nothing is left unresolved.
              You then get your own stake back plus an equal share of the pool.
            </li>
            <li>
              <strong>The pool:</strong> the stakes of participants who did not
              finish plus any credits the host added. Stakr keeps a published
              share (20% unless the challenge shows otherwise) and the rest is
              shared equally among finishers. Any remainder of a cent is
              allocated to finishers in a fixed order.
            </li>
            <li>
              <strong>If nobody finishes</strong>, the pool goes to Stakr.
            </li>
            <li>
              <strong>If you do not finish</strong>, your stake is forfeited
              into the pool.
            </li>
          </ul>
          <h3 className="text-xl font-semibold mt-6 mb-3">
            5.4 Suspension and cancellation
          </h3>
          <p>
            Only Stakr administrators can suspend or cancel a challenge.
            Cancellation applies one of three published outcomes, recorded with
            a reason: return all stakes, fees and host credits; return
            participants&apos; stakes only; or allocate the pool to Stakr. A
            cancelled challenge is not settled in any other way. Suspension
            pauses deadlines for the time it lasts.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">
            6. Evidence and Review
          </h2>
          <h3 className="text-xl font-semibold mt-6 mb-3">
            6.1 Submitting evidence
          </h3>
          <p>
            You must submit genuine, unaltered evidence that shows what the
            challenge rules require, for the day it is submitted for, and not
            present anyone else&apos;s work as your own.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-3">
            6.2 How evidence is reviewed
          </h3>
          <p>
            Each submission is reviewed by a Stakr reviewer against the
            published rules. The challenge host and participants cannot review
            their own challenge. Stakr does not use peer voting or automatic
            approval to decide results. Reviewers record a reason with each
            decision.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-3">6.3 Appeals</h3>
          <p>
            If your evidence is rejected you may appeal within 24 hours. An
            appeal is decided by a different reviewer. Settlement waits until
            every review and appeal for the challenge is resolved. Decisions are
            otherwise final.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-3">6.4 Misuse</h3>
          <p>
            Fraudulent or repeated false submissions, multiple accounts, or
            attempts to manipulate results can lead to suspension of your
            account. A suspended account cannot sign in, and credits already
            staked settle under the challenge&apos;s published rules.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">
            7. Credits and Refunds
          </h2>
          <h3 className="text-xl font-semibold mt-6 mb-3">7.1 No payments</h3>
          <p>
            Stakr does not currently take payments or pay out money. If that
            ever changes, new terms will be presented to you and will only apply
            if you accept them.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-3">
            7.2 Welcome credits
          </h3>
          <p>
            New members may claim a one-time grant of free credits after
            verifying their email address. Stakr may change or stop this for new
            members at any time. Credits remaining when an account is deleted
            are forfeited.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-3">7.3 Refunds</h3>
          <p>
            Credits are returned only where a challenge is cancelled under
            section 5.4, or where we correct an error. Otherwise, staked credits
            and fees are not refundable once you have joined.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">
            8. Prohibited Conduct
          </h2>
          <p>You may not:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Submit fraudulent or manipulated proof</li>
            <li>Create multiple accounts to circumvent rules</li>
            <li>Use bots or automated systems</li>
            <li>Harass, threaten, or abuse other users</li>
            <li>Share explicit, illegal, or harmful content</li>
            <li>Exploit bugs or vulnerabilities</li>
            <li>Scrape or copy platform content</li>
            <li>Impersonate others or misrepresent affiliation</li>
            <li>Engage in money laundering or fraud</li>
            <li>Violate any applicable laws</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">
            9. Third-Party Services
          </h2>
          <p>
            Stakr does not currently connect to fitness trackers, apps or
            wearables. We use service providers to run the platform, listed in
            our Privacy Policy. We are not responsible for third-party services
            you choose to use alongside Stakr.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">
            10. Intellectual Property
          </h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">
            10.1 Platform Content
          </h3>
          <p>
            Stakr and its original content, features, and functionality are
            owned by Stakr and protected by copyright, trademark, and other
            intellectual property laws.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">10.2 User Content</h3>
          <p>
            By submitting content (proof, posts, comments), you grant Stakr a
            worldwide, non-exclusive, royalty-free license to use, display, and
            distribute your content on the platform. You retain ownership of
            your content.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">11. Disclaimers</h2>

          <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-lg space-y-4">
            <p className="font-semibold">IMPORTANT DISCLAIMERS:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Stakr is provided &quot;AS IS&quot; without warranties of any
                kind
              </li>
              <li>We do not guarantee challenge outcomes or rewards</li>
              <li>
                We&apos;re not responsible for user conduct or interactions
              </li>
              <li>
                Third-party integrations may fail or provide inaccurate data
              </li>
              <li>Platform availability may be interrupted</li>
              <li>Financial transactions carry inherent risks</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">
            12. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by law, Stakr shall not be liable
            for any indirect, incidental, special, consequential, or punitive
            damages, including loss of profits, data, or other intangible
            losses, resulting from:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your use or inability to use the Service</li>
            <li>Unauthorized access to your account</li>
            <li>Errors or omissions in content</li>
            <li>Third-party conduct or content</li>
            <li>Integration failures or inaccuracies</li>
          </ul>
          <p className="mt-4">
            Our total liability shall not exceed the amount you paid to Stakr in
            the past 12 months, or $100, whichever is greater.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">13. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Stakr and its officers,
            directors, employees, and agents from any claims, damages, losses,
            or expenses arising from:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your violation of these Terms</li>
            <li>Your violation of any law or third-party rights</li>
            <li>Your use of the Service</li>
            <li>Your submitted content</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">14. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior
            notice, for:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Violation of these Terms</li>
            <li>Fraudulent or illegal activity</li>
            <li>Abuse of other users</li>
            <li>Extended inactivity</li>
            <li>Request from law enforcement</li>
          </ul>
          <p className="mt-4">
            Upon termination, your right to use the Service ceases immediately.
            Active challenges and funds may be forfeited based on the
            circumstances.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">
            15. Dispute Resolution
          </h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">
            15.1 Informal Resolution
          </h3>
          <p>
            Before filing a claim, contact us at{" "}
            <a href="mailto:support@stakr.app" className="underline">
              support@stakr.app
            </a>{" "}
            to resolve the issue informally.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">15.2 Arbitration</h3>
          <p>
            Any disputes shall be resolved through binding arbitration in
            accordance with the American Arbitration Association rules. You
            waive your right to a jury trial or class action lawsuit.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">15.3 Exceptions</h3>
          <p>
            Small claims court actions and intellectual property disputes are
            exempt from arbitration.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">16. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with
            the laws of [Your State/Country], without regard to conflict of law
            provisions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">17. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will
            notify you of significant changes via email or platform notice. Your
            continued use after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">
            18. Contact Information
          </h2>
          <p>Questions about these Terms? Contact us:</p>
          <ul className="list-none space-y-2 mt-4">
            <li>
              <strong>Email:</strong>{" "}
              <a href="mailto:legal@stakr.app" className="underline">
                legal@stakr.app
              </a>
            </li>
            <li>
              <strong>Support:</strong>{" "}
              <a href="mailto:support@stakr.app" className="underline">
                support@stakr.app
              </a>
            </li>
            <li>
              <strong>Business Inquiries:</strong>{" "}
              <a href="mailto:hello@stakr.app" className="underline">
                hello@stakr.app
              </a>
            </li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            Physical address available upon request for legal matters. For
            official legal notice, please use email above or contact via
            registered agent.
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
          <p className="mt-4 text-sm">
            By using Stakr, you acknowledge that you have read, understood, and
            agree to be bound by these Terms of Service and our{" "}
            <a href="/privacy" className="underline">
              Privacy Policy
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
