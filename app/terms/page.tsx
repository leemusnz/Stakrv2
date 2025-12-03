import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - Stakr',
  description: 'Read the terms and conditions for using Stakr',
}

export default function TermsOfServicePage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pb-24">
      <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
      <p className="text-muted-foreground mb-8">
        Last Updated: December 3, 2025
      </p>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">1. Agreement to Terms</h2>
          <p>
            By accessing or using Stakr ("Service," "Platform," "we," "us," or "our"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">2. Description of Service</h2>
          <p>
            Stakr is a challenge-based accountability platform where users can:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Create and host challenges with monetary or credit stakes</li>
            <li>Join challenges created by others</li>
            <li>Submit proof of challenge completion</li>
            <li>Earn rewards when successfully completing challenges</li>
            <li>Connect fitness trackers and apps for automatic verification</li>
            <li>Participate in social features (following, leaderboards, posts)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">3. Eligibility</h2>
          <p>You must:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Be at least 13 years old (18+ for monetary challenges)</li>
            <li>Provide accurate registration information</li>
            <li>Maintain the security of your account</li>
            <li>Not have been previously banned from Stakr</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">4. Account Registration</h2>
          <p>
            You are responsible for:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Maintaining the confidentiality of your password</li>
            <li>All activities under your account</li>
            <li>Notifying us immediately of unauthorized access</li>
            <li>Ensuring your account information is accurate and current</li>
          </ul>
          <p className="mt-4">
            We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activity.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">5. Challenges and Stakes</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Creating Challenges</h3>
          <p>Challenge hosts must:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Clearly define challenge requirements and rules</li>
            <li>Set fair and achievable goals</li>
            <li>Specify accurate duration and deadlines</li>
            <li>Choose appropriate verification methods</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Joining Challenges</h3>
          <p>By joining a challenge, you agree to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Pay the entry fee (if applicable)</li>
            <li>Complete the challenge within the specified timeframe</li>
            <li>Provide honest proof of completion</li>
            <li>Accept the challenge rules and verification process</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">5.3 Stakes and Rewards</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Entry Fees:</strong> Stakr charges a 5% platform fee on all paid challenges</li>
            <li><strong>Reward Pool:</strong> Distributed equally among all successful completers</li>
            <li><strong>Failed Stakes:</strong> 80% of failed stakes contribute to reward pool for winners, 20% retained by Stakr as platform revenue</li>
            <li><strong>Cash Out Fee:</strong> 3% fee when withdrawing earnings</li>
            <li><strong>Insurance:</strong> Optional $1 insurance protects your stake if you fail by refunding your stake amount (insurance fee is non-refundable)</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">5.4 Challenge Cancellation</h3>
          <p>
            Hosts may cancel challenges before the start date with full refunds. After start, cancellation requires admin approval. Stakes may be refunded at our discretion.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">6. Verification and Proof</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">6.1 Proof Submission</h3>
          <p>You must:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Submit genuine, unaltered proof</li>
            <li>Ensure proof clearly demonstrates challenge completion</li>
            <li>Submit proof within the challenge timeframe</li>
            <li>Not submit others' work as your own</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">6.2 Verification Process</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Manual:</strong> Admin review (1-3 business days)</li>
            <li><strong>Automatic:</strong> AI and integration-based verification (instant)</li>
            <li><strong>Peer:</strong> Community voting (if applicable)</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">6.3 Verification Decisions</h3>
          <p>
            Verification decisions are final unless appealed. You may appeal rejections within 48 hours. Repeated fraudulent submissions result in account suspension.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">7. Payments and Refunds</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">7.1 Payment Processing</h3>
          <p>
            All payments are processed securely through Stripe. We do not store your payment information. By making a payment, you agree to Stripe's terms and conditions.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">7.2 Refund Policy</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Before Challenge Starts:</strong> Full refund available</li>
            <li><strong>After Challenge Starts:</strong> No refunds (unless cancelled by host)</li>
            <li><strong>Technical Issues:</strong> Refunds at our discretion</li>
            <li><strong>Disputes:</strong> Contact support within 48 hours</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">7.3 Withdrawals</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Minimum withdrawal: $10</li>
            <li>3% processing fee</li>
            <li>Processing time: 3-5 business days</li>
            <li>Valid payment method required</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">8. Prohibited Conduct</h2>
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
          <h2 className="text-2xl font-bold mt-8 mb-4">9. Third-Party Integrations</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">9.1 Fitness Trackers and Apps</h3>
          <p>
            When connecting third-party services (Whoop, Strava, Fitbit, etc.):
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>You grant us permission to access specified data</li>
            <li>We use data solely for challenge verification</li>
            <li>You can disconnect integrations anytime</li>
            <li>We're not responsible for third-party service failures</li>
            <li>Third-party terms and privacy policies apply</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">9.2 Integration Disclaimers</h3>
          <p>
            Stakr integrations with Whoop, Strava, Fitbit, and other services are not affiliated with, endorsed by, or officially supported by those companies. Use of their APIs is subject to their terms of service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">10. Intellectual Property</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">10.1 Platform Content</h3>
          <p>
            Stakr and its original content, features, and functionality are owned by Stakr and protected by copyright, trademark, and other intellectual property laws.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">10.2 User Content</h3>
          <p>
            By submitting content (proof, posts, comments), you grant Stakr a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content on the platform. You retain ownership of your content.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">11. Disclaimers</h2>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-lg space-y-4">
            <p className="font-semibold">IMPORTANT DISCLAIMERS:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Stakr is provided "AS IS" without warranties of any kind</li>
              <li>We do not guarantee challenge outcomes or rewards</li>
              <li>We're not responsible for user conduct or interactions</li>
              <li>Third-party integrations may fail or provide inaccurate data</li>
              <li>Platform availability may be interrupted</li>
              <li>Financial transactions carry inherent risks</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">12. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Stakr shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or other intangible losses, resulting from:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your use or inability to use the Service</li>
            <li>Unauthorized access to your account</li>
            <li>Errors or omissions in content</li>
            <li>Third-party conduct or content</li>
            <li>Integration failures or inaccuracies</li>
          </ul>
          <p className="mt-4">
            Our total liability shall not exceed the amount you paid to Stakr in the past 12 months, or $100, whichever is greater.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">13. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Stakr and its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from:
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
            We may terminate or suspend your account immediately, without prior notice, for:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Violation of these Terms</li>
            <li>Fraudulent or illegal activity</li>
            <li>Abuse of other users</li>
            <li>Extended inactivity</li>
            <li>Request from law enforcement</li>
          </ul>
          <p className="mt-4">
            Upon termination, your right to use the Service ceases immediately. Active challenges and funds may be forfeited based on the circumstances.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">15. Dispute Resolution</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">15.1 Informal Resolution</h3>
          <p>
            Before filing a claim, contact us at <a href="mailto:support@stakr.app" className="underline">support@stakr.app</a> to resolve the issue informally.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">15.2 Arbitration</h3>
          <p>
            Any disputes shall be resolved through binding arbitration in accordance with the American Arbitration Association rules. You waive your right to a jury trial or class action lawsuit.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">15.3 Exceptions</h3>
          <p>
            Small claims court actions and intellectual property disputes are exempt from arbitration.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">16. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of [Your State/Country], without regard to conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">17. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify you of significant changes via email or platform notice. Your continued use after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">18. Contact Information</h2>
          <p>
            Questions about these Terms? Contact us:
          </p>
          <ul className="list-none space-y-2 mt-4">
            <li><strong>Email:</strong> <a href="mailto:legal@stakr.app" className="underline">legal@stakr.app</a></li>
            <li><strong>Support:</strong> <a href="mailto:support@stakr.app" className="underline">support@stakr.app</a></li>
            <li><strong>Business Inquiries:</strong> <a href="mailto:hello@stakr.app" className="underline">hello@stakr.app</a></li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            Physical address available upon request for legal matters. For official legal notice, please use email above or contact via registered agent.
          </p>
        </section>

        <section className="border-t pt-8 mt-12">
          <p className="text-sm text-muted-foreground">
            <strong>Effective Date:</strong> December 3, 2025<br />
            <strong>Last Updated:</strong> December 3, 2025<br />
            <strong>Version:</strong> 1.0
          </p>
          <p className="mt-4 text-sm">
            By using Stakr, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our <a href="/privacy" className="underline">Privacy Policy</a>.
          </p>
        </section>
      </div>
    </div>
  )
}

