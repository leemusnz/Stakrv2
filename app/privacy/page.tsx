import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - Stakr',
  description: 'Learn how Stakr collects, uses, and protects your personal information',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pb-24">
      <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">
        Last Updated: December 3, 2025
      </p>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">1. Introduction</h2>
          <p>
            Welcome to Stakr ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, disclose, and safeguard your information when you use our challenge-based accountability platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">2. Information We Collect</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Information You Provide</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Information:</strong> Name, email address, username, password (encrypted), profile picture</li>
            <li><strong>Profile Data:</strong> Bio, interests, goals, achievements</li>
            <li><strong>Challenge Data:</strong> Challenges you create, join, or complete</li>
            <li><strong>Payment Information:</strong> Processed securely through Stripe (we don't store credit card details)</li>
            <li><strong>Proof Submissions:</strong> Photos, videos, text descriptions you upload for challenge verification</li>
            <li><strong>Communications:</strong> Messages, support requests, feedback</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Automatically Collected Information</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Device Information:</strong> IP address, browser type, device type, operating system</li>
            <li><strong>Usage Data:</strong> Pages visited, features used, time spent, interactions</li>
            <li><strong>Location Data:</strong> General location (city/country level) based on IP address</li>
            <li><strong>Cookies:</strong> Essential cookies for authentication and functionality</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Third-Party Integration Data</h3>
          <p>When you connect third-party services, we collect:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Fitness Trackers (Whoop, Strava, Fitbit, Apple Watch):</strong> Recovery scores, workout data, strain scores, sleep data, heart rate, activity metrics</li>
            <li><strong>Apps (Duolingo, GitHub, MyFitnessPal):</strong> Progress data, achievements, activity logs</li>
            <li><strong>OAuth Tokens:</strong> Encrypted access tokens for integrated services (never your passwords)</li>
          </ul>
          <p className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <strong>Important:</strong> You control which integrations to connect. You can disconnect any service anytime from Settings → Integrations.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">3. How We Use Your Information</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Core Services</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide and maintain the Stakr platform</li>
            <li>Process challenge participation and verification</li>
            <li>Calculate and distribute rewards</li>
            <li>Handle payments and transactions</li>
            <li>Enable social features (leaderboards, following, posts)</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Automatic Verification</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Verify challenge completion using connected integrations</li>
            <li>Analyze fitness and activity data for challenge validation</li>
            <li>Detect fraud and prevent cheating using AI systems</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Communication</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Send challenge updates and notifications</li>
            <li>Respond to support requests</li>
            <li>Send important account or service updates</li>
            <li>Marketing emails (you can opt out anytime)</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">3.4 Improvement & Analytics</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Analyze usage patterns to improve our service</li>
            <li>Develop new features based on user behavior</li>
            <li>Troubleshoot technical issues</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">4. How We Share Your Information</h2>
          
          <p className="font-semibold">We do NOT sell your personal data. We only share information in these circumstances:</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">4.1 With Your Consent</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Public profile information (username, bio, achievements) is visible to other users</li>
            <li>Challenge participation is visible to other challenge participants</li>
            <li>Social features (posts, comments) are visible based on your privacy settings</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Service Providers</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Neon (PostgreSQL):</strong> Database hosting</li>
            <li><strong>AWS S3:</strong> File storage for proof submissions</li>
            <li><strong>Stripe:</strong> Payment processing</li>
            <li><strong>OpenAI:</strong> AI verification (only challenge-relevant data)</li>
            <li><strong>Email Service:</strong> Transactional emails</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Legal Requirements</h3>
          <p>We may disclose information if required by law, court order, or government request, or to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Enforce our Terms of Service</li>
            <li>Protect our rights, property, or safety</li>
            <li>Prevent fraud or abuse</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">4.4 Business Transfers</h3>
          <p>If Stakr is involved in a merger, acquisition, or sale, your information may be transferred. We'll notify you before this happens.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">5. Third-Party Integrations</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Whoop Integration</h3>
          <p>When you connect your Whoop account:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Data Collected:</strong> Recovery scores, strain scores, sleep data, workout information, heart rate variability</li>
            <li><strong>Usage:</strong> Challenge verification only</li>
            <li><strong>Retention:</strong> Verification scores stored for 90 days, then automatically deleted</li>
            <li><strong>Sharing:</strong> Never shared with third parties</li>
            <li><strong>Control:</strong> You can disconnect Whoop anytime</li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            This integration uses Whoop API. Not affiliated with, endorsed by, or officially supported by Whoop Inc. See Whoop's Privacy Policy: <a href="https://www.whoop.com/privacy-policy/" target="_blank" rel="noopener noreferrer" className="underline">https://www.whoop.com/privacy-policy/</a>
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Other Integrations</h3>
          <p>Similar data practices apply to all integrations (Strava, Fitbit, Duolingo, GitHub, etc.):</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Data used for verification only</li>
            <li>You control what to connect</li>
            <li>You can disconnect anytime</li>
            <li>Data deleted when you disconnect</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">6. Data Security</h2>
          <p>We implement industry-standard security measures:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Encryption:</strong> All data encrypted in transit (HTTPS) and at rest (AES-256)</li>
            <li><strong>Access Controls:</strong> Limited employee access, role-based permissions</li>
            <li><strong>OAuth Tokens:</strong> Encrypted with AES-256-GCM before storage</li>
            <li><strong>Payment Data:</strong> Never stored (handled by PCI-compliant Stripe)</li>
            <li><strong>Regular Audits:</strong> Security reviews and vulnerability scanning</li>
            <li><strong>CSRF Protection:</strong> All OAuth flows protected against attacks</li>
          </ul>
          <p className="mt-4 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
            <strong>Note:</strong> No security system is 100% secure. We take reasonable precautions, but cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">7. Data Retention</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Data:</strong> Retained while your account is active</li>
            <li><strong>Challenge History:</strong> Retained for 12 months after challenge completion</li>
            <li><strong>Integration Data:</strong> Verification scores retained for 90 days, then auto-deleted</li>
            <li><strong>Payment Records:</strong> Retained for 7 years (tax/legal requirements)</li>
            <li><strong>Deleted Accounts:</strong> Personal data deleted within 30 days (except legal requirements)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">8. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update inaccurate or incomplete data</li>
            <li><strong>Deletion:</strong> Delete your account and personal data</li>
            <li><strong>Export:</strong> Download your data in portable format</li>
            <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails</li>
            <li><strong>Disconnect:</strong> Remove any third-party integrations</li>
            <li><strong>Object:</strong> Object to certain data processing</li>
          </ul>
          <p className="mt-4">
            To exercise these rights, go to Settings or email us at <a href="mailto:privacy@stakr.app" className="underline">privacy@stakr.app</a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">9. Children's Privacy</h2>
          <p>
            Stakr is not intended for users under 13 years old. We do not knowingly collect data from children under 13. If you believe a child has provided us with personal information, please contact us immediately and we will delete it.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">10. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this privacy policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">11. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of significant changes via email or prominent notice on our platform. Your continued use after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mt-8 mb-4">12. Contact Us</h2>
          <p>
            If you have questions about this privacy policy or our data practices, contact us:
          </p>
          <ul className="list-none space-y-2 mt-4">
            <li><strong>Email:</strong> <a href="mailto:privacy@stakr.app" className="underline">privacy@stakr.app</a></li>
            <li><strong>Support:</strong> <a href="mailto:support@stakr.app" className="underline">support@stakr.app</a></li>
            <li><strong>Legal Contact:</strong> <a href="mailto:legal@stakr.app" className="underline">legal@stakr.app</a></li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            For official legal correspondence, please use the email addresses above. Physical address available upon request for legal matters.
          </p>
        </section>

        <section className="border-t pt-8 mt-12">
          <p className="text-sm text-muted-foreground">
            <strong>Effective Date:</strong> December 3, 2025<br />
            <strong>Last Updated:</strong> December 3, 2025<br />
            <strong>Version:</strong> 1.0
          </p>
        </section>
      </div>
    </div>
  )
}

