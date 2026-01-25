'use client';

import Link from 'next/link';
import { APP_VERSION } from '@/lib/version';
import { CURRENT_TERMS_VERSION } from '@/lib/services/profileService';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-zinc-50 dark:from-zinc-950 dark:via-teal-950/20 dark:to-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 mb-4"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to App
          </Link>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Terms & Conditions
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Version {CURRENT_TERMS_VERSION} • Last Updated: January 25, 2026
          </p>
        </div>

        {/* Content */}
        <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-800">
          <div className="prose prose-zinc dark:prose-invert max-w-none">

            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Welcome to Habit-a-Day. By accessing or using our application, you agree to be bound by these Terms & Conditions and our Privacy Policy. Please read them carefully before using our services.
            </p>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              By creating an account, accessing, or using Habit-a-Day, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions. If you do not agree to these terms, you must not use our application. We reserve the right to modify these terms at any time, and your continued use of the application following any changes constitutes acceptance of those changes.
            </p>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-4">
              2. Privacy and Data Protection
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-3">
              Your privacy is of utmost importance to us. We are committed to protecting your personal information and health-related data.
            </p>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2 mb-4">
              <li><strong>Confidentiality:</strong> All personal health records, tracking data, and user information are treated as strictly confidential and are <strong>never publicly accessible</strong>. Your data is visible only to you through your authenticated account.</li>
              <li><strong>Data Encryption:</strong> All data transmitted between your device and our servers is encrypted using industry-standard SSL/TLS protocols. Data at rest is encrypted using AES-256 encryption.</li>
              <li><strong>No Third-Party Sharing:</strong> We do not sell, trade, or otherwise transfer your personal information or health data to third parties for marketing purposes.</li>
              <li><strong>Access Controls:</strong> Only authorized personnel with a legitimate need have access to user data, and such access is logged and audited.</li>
            </ul>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-4">
              3. Data Collection and Usage
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-3">
              We collect and process the following categories of information:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2 mb-4">
              <li><strong>Account Information:</strong> Email address, name, profile photo, and authentication credentials.</li>
              <li><strong>Health & Wellness Data:</strong> Tracking entries including bathroom habits, water intake, food consumption, and other health metrics you choose to record.</li>
              <li><strong>Device Information:</strong> Browser type, operating system, device identifiers, and IP address for security and functionality purposes.</li>
              <li><strong>Usage Data:</strong> Application interaction patterns, feature usage, and performance metrics to improve our services.</li>
            </ul>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-4">
              4. Data Retention Policy
            </h2>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2 mb-4">
              <li><strong>Active Accounts:</strong> Your data is retained for as long as your account remains active and you continue to use our services.</li>
              <li><strong>Inactive Accounts:</strong> Accounts with no login activity for twenty-four (24) consecutive months may be flagged for deletion.</li>
              <li><strong>Backup Retention:</strong> Encrypted backups may be retained for up to ninety (90) days following data deletion for disaster recovery purposes.</li>
            </ul>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-4">
              5. Data Deletion and Export
            </h2>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2 mb-4">
              <li><strong>Data Export:</strong> You have the right to request and download a complete copy of your data at any time through the application settings.</li>
              <li><strong>Account Deletion:</strong> You may permanently delete your account and all associated data through the application settings. This action is irreversible.</li>
              <li><strong>Deletion Timeline:</strong> Primary data deletion occurs immediately upon request. Complete purging from all backup systems occurs within ninety (90) days.</li>
            </ul>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-4">
              6. User Responsibilities
            </h2>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2 mb-4">
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You agree to provide accurate and complete information when creating your account.</li>
              <li>You must be at least 13 years of age to use this application.</li>
              <li>You agree not to use the application for any unlawful purpose or in violation of these terms.</li>
            </ul>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-4">
              7. Health Information Disclaimer
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Habit-a-Day is designed for personal health tracking and informational purposes only. The application does <strong>not</strong> provide medical advice, diagnosis, or treatment recommendations. Always consult with a qualified healthcare provider regarding any health concerns.
            </p>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-4">
              8. Intellectual Property
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              The Service and its original content, features, and functionality are and will remain the exclusive property of Habit-a-Day and its licensors. The Service is protected by copyright, trademark, and other intellectual property laws. Our trademarks and trade dress may not be used in connection with any product or service without prior written consent.
            </p>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-4">
              9. Limitation of Liability
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              To the maximum extent permitted by applicable law, Habit-a-Day and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the application. In no event shall our total liability exceed the amount paid by you, if any, for accessing our Service during the twelve (12) months preceding the claim.
            </p>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-4">
              10. Indemnification
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              You agree to defend, indemnify, and hold harmless Habit-a-Day and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, arising out of or in any way connected with your access to or use of the Service or your violation of these Terms.
            </p>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-4">
              11. Changes to Terms
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              We reserve the right to update or modify these Terms & Conditions at any time. Material changes will be communicated through the application or via email. Your continued use of the application after such modifications constitutes your acceptance of the updated terms.
            </p>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-4">
              12. Governing Law
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts located within the United States.
            </p>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-4">
              13. Severability
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that these Terms shall otherwise remain in full force and effect and enforceable.
            </p>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-4">
              14. Contact Information
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              If you have any questions regarding these Terms & Conditions, please contact us at:
            </p>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              <strong>Email:</strong> <a href="mailto:support@pottylogger.com" className="text-teal-600 dark:text-teal-400 hover:underline">support@pottylogger.com</a>
            </p>

            <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                By using Habit-a-Day, you acknowledge that you have read and understood these Terms & Conditions. For our Privacy Policy, please visit <Link href="/privacy" className="text-teal-600 dark:text-teal-400 hover:underline">/privacy</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
