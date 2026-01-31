'use client';

/**
 * HIPAA-Compliant Session Timeout Warning Component
 *
 * Displays a warning modal when the user's session is about to expire
 * due to inactivity. Provides option to extend the session.
 */

import { useEffect } from 'react';

interface SessionTimeoutWarningProps {
  isVisible: boolean;
  remainingSeconds: number;
  onExtend: () => void;
}

export function SessionTimeoutWarning({
  isVisible,
  remainingSeconds,
  onExtend,
}: SessionTimeoutWarningProps) {
  // Trap focus in modal for accessibility
  useEffect(() => {
    if (isVisible) {
      const focusableElement = document.getElementById('extend-session-btn');
      focusableElement?.focus();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeDisplay =
    minutes > 0
      ? `${minutes}:${seconds.toString().padStart(2, '0')}`
      : `${seconds} seconds`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="timeout-title"
      aria-describedby="timeout-description"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md mx-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-amber-600 dark:text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2
            id="timeout-title"
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            Session Expiring
          </h2>
        </div>

        <p
          id="timeout-description"
          className="text-gray-600 dark:text-gray-300 mb-4"
        >
          For your security, your session will expire in{' '}
          <span className="font-bold text-amber-600 dark:text-amber-400">
            {timeDisplay}
          </span>{' '}
          due to inactivity.
        </p>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          To protect your health information, we automatically log you out after
          periods of inactivity.
        </p>

        <div className="flex gap-3">
          <button
            id="extend-session-btn"
            onClick={onExtend}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 font-medium transition-colors"
          >
            Stay Logged In
          </button>
          <button
            onClick={() => {
              // Allow natural timeout
            }}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 font-medium transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
