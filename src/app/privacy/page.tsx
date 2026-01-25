'use client';

import Link from 'next/link';
import { APP_VERSION } from '@/lib/version';

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Version {APP_VERSION} • Last Updated: January 25, 2026
          </p>
        </div>

        {/* Content */}
        <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-800">
          <div className="prose prose-zinc dark:prose-invert max-w-none">

            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Habit-a-Day ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and web services (collectively, the "Service"). Please read this policy carefully. By accessing or using the Service, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy.
            </p>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-4">
              1. Information We Collect
            </h2>

            <h3 className="text-lg font-medium text-zinc-800 dark:text-zinc-200 mt-6 mb-3">
              1.1 Personal Information
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              When you create an account or use our Service, we may collect the following personal information:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2 mb-4">
              <li><strong>Account Information:</strong> Email address, name, and profile photo provided through third-party authentication services (Google, Facebook, Apple).</li>
              <li><strong>Profile Information:</strong> First name, last name, age, gender, height, weight, and personal health goals you choose to provide.</li>
              <li><strong>Authentication Data:</strong> Information received from OAuth providers when you sign in using Google, Facebook, or Apple.</li>
            </ul>

            <h3 className="text-lg font-medium text-zinc-800 dark:text-zinc-200 mt-6 mb-3">
              1.2 Health and Wellness Data
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              To provide our health tracking services, we collect:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2 mb-4">
              <li><strong>Bathroom Tracking Data:</strong> Type of bathroom visit, timestamp, urine color, stream strength, and any notes you add.</li>
              <li><strong>Water Intake Data:</strong> Amount consumed, measurement unit, timestamp, and notes.</li>
              <li><strong>Food Journal Data:</strong> Meal type, calorie count, timestamp, and notes.</li>
            </ul>

            <h3 className="text-lg font-medium text-zinc-800 dark:text-zinc-200 mt-6 mb-3">
              1.3 Technical Information
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              We automatically collect certain technical information when you use our Service:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2 mb-4">
              <li><strong>Device Information:</strong> Device type, operating system, browser type, and unique device identifiers.</li>
              <li><strong>Usage Data:</strong> Features accessed, interaction patterns, and performance metrics.</li>
              <li><strong>Log Data:</strong> IP address, access times, and referring URLs for security and troubleshooting purposes.</li>
            </ul>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-4">
              2. How We Use Your Information
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2 mb-4">
              <li><strong>Service Provision:</strong> To provide, maintain, and improve our health tracking features and personalized experience.</li>
              <li><strong>Account Management:</strong> To create and manage your account, authenticate your identity, and provide customer support.</li>
              <li><strong>Analytics and Insights:</strong> To generate personal health insights and trends based on your tracked data.</li>
              <li><strong>Communication:</strong> To send you service-related notifications, updates, and security alerts.</li>
              <li><strong>Security:</strong> To detect, prevent, and address technical issues, fraud, and unauthorized access.</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes.</li>
            </ul>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-4">
              3. Data Security
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              We implement robust security measures to protect your personal and health information:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2 mb-4">
              <li><strong>Encryption in Transit:</strong> All data transmitted between your device and our servers is encrypted using industry-standard TLS/SSL protocols.</li>
              <li><strong>Encryption at Rest:</strong> Your data is encrypted at rest using AES-256 encryption in our database systems.</li>
              <li><strong>Access Controls:</strong> Strict access controls limit data access to authorized personnel only, with all access logged and audited.</li>
              <li><strong>Infrastructure Security:</strong> Our services are hosted on Supabase and Vercel, which maintain SOC 2 Type II compliance and implement comprehensive security controls.</li>
            </ul>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-4">
              4. Data Sharing and Disclosure
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2 mb-4">
              <li><strong>Service Providers:</strong> With trusted third-party service providers who assist us in operating our Service (hosting, analytics), subject to confidentiality obligations.</li>
              <li><strong>Legal Requirements:</strong> When required by law, subpoena, court order, or other legal process.</li>
              <li><strong>Safety and Rights:</strong> To protect the safety, rights, or property of Habit-a-Day, our users, or the public.</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, with notice provided to users.</li>
            </ul>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-4">
              5. Data Retention
            </h2>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2 mb-4">
              <li><strong>Active Accounts:</strong> We retain your data for as long as your account remains active and you continue to use our Service.</li>
              <li><strong>Inactive Accounts:</strong> Accounts with no login activity for twenty-four (24) consecutive months may be flagged for deletion after notice.</li>
              <li><strong>Post-Deletion:</strong> Following account deletion, your data is permanently removed from our primary systems immediately. Encrypted backups are purged within ninety (90) days.</li>
            </ul>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-4">
              6. Your Rights and Choices
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              You have the following rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2 mb-4">
              <li><strong>Access:</strong> You can access your personal data through your account profile at any time.</li>
              <li><strong>Correction:</strong> You can update or correct your personal information through the app settings.</li>
              <li><strong>Data Export:</strong> You can download a complete copy of your data in CSV format through the profile settings.</li>
              <li><strong>Deletion:</strong> You can permanently delete your account and all associated data through the app settings. This action is irreversible.</li>
              <li><strong>Opt-Out:</strong> You can opt out of non-essential communications by adjusting your notification preferences.</li>
            </ul>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-4">
              7. Third-Party Authentication
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              When you sign in using Google, Facebook, or Apple, we receive only the information you authorize these providers to share with us. We do not have access to your passwords for these services. Please review the privacy policies of these providers:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2 mb-4">
              <li>Google Privacy Policy: <a href="https://policies.google.com/privacy" className="text-teal-600 dark:text-teal-400 hover:underline" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy</a></li>
              <li>Facebook Privacy Policy: <a href="https://www.facebook.com/privacy/policy" className="text-teal-600 dark:text-teal-400 hover:underline" target="_blank" rel="noopener noreferrer">https://www.facebook.com/privacy/policy</a></li>
              <li>Apple Privacy Policy: <a href="https://www.apple.com/legal/privacy" className="text-teal-600 dark:text-teal-400 hover:underline" target="_blank" rel="noopener noreferrer">https://www.apple.com/legal/privacy</a></li>
            </ul>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-4">
              8. Children's Privacy
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Our Service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately so we can delete such information.
            </p>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-4">
              9. International Data Transfers
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that are different from the laws of your country. We take appropriate safeguards to ensure that your personal information remains protected in accordance with this Privacy Policy.
            </p>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-4">
              10. Changes to This Privacy Policy
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. We encourage you to review this Privacy Policy periodically for any changes. Your continued use of the Service after any modifications constitutes your acceptance of the updated Privacy Policy.
            </p>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-4">
              11. Contact Us
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              <strong>Email:</strong> <a href="mailto:privacy@pottylogger.com" className="text-teal-600 dark:text-teal-400 hover:underline">privacy@pottylogger.com</a>
            </p>

            <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                By using Habit-a-Day, you acknowledge that you have read and understood this Privacy Policy. For our complete Terms & Conditions, please visit the app settings menu.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
