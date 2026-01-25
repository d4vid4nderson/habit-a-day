'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useProfile } from '@/lib/hooks/useProfile';
import { CURRENT_TERMS_VERSION } from '@/lib/services/profileService';

interface TermsAcceptanceModalProps {
  onAccepted: () => void;
}

export function TermsAcceptanceModal({ onAccepted }: TermsAcceptanceModalProps) {
  const router = useRouter();
  const { signOut } = useAuth();
  const { gender, acceptTerms } = useProfile();
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!hasReadTerms) return;

    setIsAccepting(true);
    setError(null);

    try {
      await acceptTerms();
      onAccepted();
    } catch (err) {
      console.error('Error accepting terms:', err);
      setError('Failed to save your acceptance. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      await signOut();
      router.push('/auth/login');
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to sign out. Please try again.');
      setIsDeclining(false);
    }
  };

  const accentColor = gender === 'female' ? 'pink' : 'teal';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl dark:bg-zinc-800">
        {/* Header */}
        <div className="border-b border-zinc-200 p-6 dark:border-zinc-700">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Terms & Conditions
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Please review and accept our terms to continue using Habit-a-Day
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Version {CURRENT_TERMS_VERSION} • Last Updated: January 25, 2026
            </p>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              Welcome to Habit-a-Day. By accessing or using our application, you agree to be bound by these Terms & Conditions and our Privacy Policy. Please read them carefully before using our services.
            </p>

            {/* Section 1 */}
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-6 mb-3">
              1. Acceptance of Terms
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              By creating an account, accessing, or using Habit-a-Day, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions. If you do not agree to these terms, you must not use our application. We reserve the right to modify these terms at any time, and your continued use of the application following any changes constitutes acceptance of those changes.
            </p>

            {/* Section 2 */}
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-6 mb-3">
              2. Privacy and Data Protection
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
              Your privacy is of utmost importance to us. We are committed to protecting your personal information and health-related data.
            </p>
            <ul className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 list-disc pl-5 space-y-2">
              <li><strong>Confidentiality:</strong> All personal health records, tracking data, and user information are treated as strictly confidential and are <strong>never publicly accessible</strong>. Your data is visible only to you through your authenticated account.</li>
              <li><strong>Data Encryption:</strong> All data transmitted between your device and our servers is encrypted using industry-standard SSL/TLS protocols. Data at rest is encrypted using AES-256 encryption.</li>
              <li><strong>No Third-Party Sharing:</strong> We do not sell, trade, or otherwise transfer your personal information or health data to third parties for marketing purposes.</li>
              <li><strong>Access Controls:</strong> Only authorized personnel with a legitimate need have access to user data, and such access is logged and audited.</li>
            </ul>

            {/* Section 3 */}
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-6 mb-3">
              3. Data Collection and Usage
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
              We collect and process the following categories of information:
            </p>
            <ul className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 list-disc pl-5 space-y-2">
              <li><strong>Account Information:</strong> Email address, name, profile photo, and authentication credentials.</li>
              <li><strong>Health & Wellness Data:</strong> Tracking entries including bathroom habits, water intake, food consumption, and other health metrics you choose to record.</li>
              <li><strong>Device Information:</strong> Browser type, operating system, device identifiers, and IP address for security and functionality purposes.</li>
              <li><strong>Usage Data:</strong> Application interaction patterns, feature usage, and performance metrics to improve our services.</li>
            </ul>

            {/* Section 4 */}
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-6 mb-3">
              4. Data Retention Policy
            </h3>
            <ul className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 list-disc pl-5 space-y-2">
              <li><strong>Active Accounts:</strong> Your data is retained for as long as your account remains active and you continue to use our services.</li>
              <li><strong>Inactive Accounts:</strong> Accounts with no login activity for twenty-four (24) consecutive months may be flagged for deletion.</li>
              <li><strong>Backup Retention:</strong> Encrypted backups may be retained for up to ninety (90) days following data deletion for disaster recovery purposes.</li>
            </ul>

            {/* Section 5 */}
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-6 mb-3">
              5. Data Deletion and Export
            </h3>
            <ul className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 list-disc pl-5 space-y-2">
              <li><strong>Data Export:</strong> You have the right to request and download a complete copy of your data at any time through the application settings.</li>
              <li><strong>Account Deletion:</strong> You may permanently delete your account and all associated data through the application settings. This action is irreversible.</li>
              <li><strong>Deletion Timeline:</strong> Primary data deletion occurs immediately upon request. Complete purging from all backup systems occurs within ninety (90) days.</li>
            </ul>

            {/* Section 6 */}
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-6 mb-3">
              6. User Responsibilities
            </h3>
            <ul className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 list-disc pl-5 space-y-2">
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You agree to provide accurate and complete information when creating your account.</li>
              <li>You must be at least 13 years of age to use this application.</li>
              <li>You agree not to use the application for any unlawful purpose or in violation of these terms.</li>
            </ul>

            {/* Section 7 */}
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-6 mb-3">
              7. Health Information Disclaimer
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Habit-a-Day is designed for personal health tracking and informational purposes only. The application does <strong>not</strong> provide medical advice, diagnosis, or treatment recommendations. Always consult with a qualified healthcare provider regarding any health concerns.
            </p>

            {/* Section 8 */}
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-6 mb-3">
              8. Limitation of Liability
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              To the maximum extent permitted by applicable law, Habit-a-Day and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the application.
            </p>

            {/* Section 9 */}
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-6 mb-3">
              9. Changes to Terms
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              We reserve the right to update or modify these Terms & Conditions at any time. Material changes will be communicated through the application or via email. Your continued use of the application after such modifications constitutes your acceptance of the updated terms.
            </p>

            {/* Section 10 */}
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-6 mb-3">
              10. Contact Information
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              If you have any questions regarding these Terms & Conditions, please contact us at: <strong>support@pottylogger.com</strong>
            </p>
          </div>
        </div>

        {/* Footer with Checkbox and Button */}
        <div className="border-t border-zinc-200 p-6 dark:border-zinc-700">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <label className="flex items-start gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={hasReadTerms}
              onChange={(e) => setHasReadTerms(e.target.checked)}
              className={`mt-1 h-5 w-5 rounded border-2 border-zinc-300 dark:border-zinc-600 ${
                gender === 'female'
                  ? 'text-pink-500 focus:ring-pink-500'
                  : 'text-teal-500 focus:ring-teal-500'
              }`}
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              I have read, understood, and agree to be bound by the Terms & Conditions and Privacy Policy. I acknowledge that my data will be collected and processed as described above, and I consent to such collection and processing.
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!hasReadTerms || isAccepting || isDeclining}
            className={`w-full rounded-xl px-4 py-3 font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              gender === 'female'
                ? 'bg-pink-500 hover:bg-pink-600 active:bg-pink-700'
                : 'bg-teal-500 hover:bg-teal-600 active:bg-teal-700'
            }`}
          >
            {isAccepting ? 'Saving...' : 'Accept and Continue'}
          </button>

          <button
            onClick={handleDecline}
            disabled={isAccepting || isDeclining}
            className="mt-3 w-full rounded-xl border-2 border-zinc-300 bg-white px-4 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 active:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600 dark:active:bg-zinc-500"
          >
            {isDeclining ? 'Signing out...' : 'Do Not Accept'}
          </button>

          <p className="mt-3 text-xs text-center text-zinc-400 dark:text-zinc-500">
            By clicking &quot;Accept and Continue&quot;, you are electronically signing and agreeing to these terms.
          </p>
        </div>
      </div>
    </div>
  );
}
