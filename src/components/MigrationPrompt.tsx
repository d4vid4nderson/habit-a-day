'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useProfile } from '@/lib/hooks/useProfile';
import {
  hasLocalData,
  hasMigrated,
  getLocalData,
  migrateToSupabase,
  markAsMigrated,
  clearLocalData,
} from '@/lib/services/migrationService';

interface MigrationPromptProps {
  onComplete: () => void;
}

export function MigrationPrompt({ onComplete }: MigrationPromptProps) {
  const { user } = useAuth();
  const { gender } = useProfile();
  const [show, setShow] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<{ entriesImported: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const headerGradient = gender === 'female'
    ? 'from-pink-500 to-purple-600'
    : 'from-teal-500 to-blue-600';

  useEffect(() => {
    // Check if we should show the migration prompt
    if (user && hasLocalData() && !hasMigrated()) {
      setShow(true);
    }
  }, [user]);

  const handleMigrate = async () => {
    if (!user) return;

    setMigrating(true);
    setError(null);

    try {
      const localData = getLocalData();
      const importResult = await migrateToSupabase(user.id, localData);
      setResult(importResult);
      markAsMigrated();
      clearLocalData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed');
    } finally {
      setMigrating(false);
    }
  };

  const handleSkip = () => {
    markAsMigrated();
    setShow(false);
    onComplete();
  };

  const handleDone = () => {
    setShow(false);
    onComplete();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        {result ? (
          // Success state
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Import Complete!
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Successfully imported {result.entriesImported} {result.entriesImported === 1 ? 'entry' : 'entries'} to your account.
            </p>
            <button
              onClick={handleDone}
              className={`mt-6 w-full rounded-xl py-3 font-medium text-white bg-gradient-to-r ${headerGradient}`}
            >
              Get Started
            </button>
          </>
        ) : error ? (
          // Error state
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Import Failed
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              {error}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 rounded-xl bg-zinc-200 py-3 font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
              >
                Skip
              </button>
              <button
                onClick={handleMigrate}
                className={`flex-1 rounded-xl py-3 font-medium text-white bg-gradient-to-r ${headerGradient}`}
              >
                Try Again
              </button>
            </div>
          </>
        ) : (
          // Initial state
          <>
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r ${headerGradient}`}>
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Import Existing Data?
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              We found bathroom entries saved on this device. Would you like to import them to your account?
            </p>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
              Your data will be synced across all your devices.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSkip}
                disabled={migrating}
                className="flex-1 rounded-xl bg-zinc-200 py-3 font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
              >
                Skip
              </button>
              <button
                onClick={handleMigrate}
                disabled={migrating}
                className={`flex-1 rounded-xl py-3 font-medium text-white bg-gradient-to-r ${headerGradient} disabled:opacity-50`}
              >
                {migrating ? 'Importing...' : 'Import Data'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
