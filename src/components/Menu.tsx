'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useProfile } from '@/lib/hooks/useProfile';
import { Gender } from '@/lib/types';
import { Theme } from '@/lib/services/profileService';
import { APP_VERSION } from '@/lib/version';
import Link from 'next/link';

// Store console logs globally for bug reports
const consoleLogs: string[] = [];
const MAX_CONSOLE_LOGS = 50;

if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;

  const captureLog = (type: string, args: unknown[]) => {
    const timestamp = new Date().toISOString();
    const message = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    consoleLogs.push(`[${timestamp}] [${type}] ${message}`);
    if (consoleLogs.length > MAX_CONSOLE_LOGS) {
      consoleLogs.shift();
    }
  };

  console.error = (...args) => {
    captureLog('ERROR', args);
    originalConsoleError.apply(console, args);
  };
  console.warn = (...args) => {
    captureLog('WARN', args);
    originalConsoleWarn.apply(console, args);
  };
  console.log = (...args) => {
    captureLog('LOG', args);
    originalConsoleLog.apply(console, args);
  };

  // Capture uncaught errors
  window.addEventListener('error', (event) => {
    captureLog('UNCAUGHT', [`${event.message} at ${event.filename}:${event.lineno}:${event.colno}`]);
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    captureLog('UNHANDLED_REJECTION', [event.reason]);
  });
}

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: 'home' | 'potty' | 'history' | 'faq' | 'water' | 'water-history' | 'water-faq' | 'food' | 'food-history' | 'food-faq') => void;
  currentView: 'home' | 'potty' | 'history' | 'faq' | 'water' | 'water-history' | 'water-faq' | 'food' | 'food-history' | 'food-faq';
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

function SystemIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function MaleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 104.38 251.57">
      <path d="M54.41,237.98l-.08-86.85c0-1.21-1.12-2.68-1.68-2.9-.75-.3-2.64,1.48-2.64,2.29l-.03,87.12c0,8.08-6.99,13.88-14.15,13.64-7.89-.27-13.5-6.39-13.5-14.72l.03-147.72c0-.9-1.04-2.54-1.69-2.88-.81-.43-2.67,1.68-2.67,2.69l.02,59.82c0,5.21-3.91,8.94-8.23,9.26C4.53,158.12,0,154.25,0,148.55l.02-73.78c0-12.42,9.9-22.35,22.29-22.35h59.76c12.39,0,22.29,9.9,22.3,22.35l.02,73.77c0,5.35-3.98,9.1-8.89,9.21-4.03.09-9.08-3.14-9.09-8.47l-.05-60.54c0-.81-1.16-2.54-1.83-2.84-.84-.37-2.55,1.71-2.55,2.92l.08,148.76c0,8.04-6.26,13.77-13.46,13.98-6.86.2-14.17-5.01-14.18-13.58Z"/>
      <path d="M57.5.6c-14.28-3.1-27.19,6.22-29.99,19.64-2.77,13.33,5.92,26.68,19.43,29.61,13.15,2.85,26.33-5.37,29.62-18.28,3.47-13.6-4.47-27.81-19.06-30.98Z"/>
    </svg>
  );
}

function FemaleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 127.46 251.57">
      <path d="M71.26.6c-14.28-3.1-27.19,6.22-29.99,19.64-2.77,13.33,5.92,26.68,19.43,29.61,13.15,2.85,26.33-5.37,29.62-18.28,3.47-13.6-4.47-27.81-19.06-30.98Z"/>
      <path d="M112.2,167.96l-96.9.04,6.34-19.72,19.24-64.31c.33-1.12-1.12-3.53-1.62-3.22s-1.87,1.13-2.07,1.79l-19.08,63.27c-1.71,5.67-8.1,6.64-11.99,5.43-5.06-1.57-7.19-6.69-5.61-11.98l19.25-64.38c4.01-13.41,16.25-22.51,30.13-22.47l29.03.09c13.43.04,25.4,9.38,29.19,22.38l18.97,65.1c1.44,4.96-1.36,10-5.22,11.45-5.06,1.9-11-.15-12.68-5.73l-18.81-62.61c-.29-.95-2.26-2.14-2.88-1.89s-1.3,1.82-.98,2.88l18.73,62.36,6.95,21.52Z"/>
      <path d="M86.75,241.1c0,6.37-5.24,10.41-10.34,10.47s-10.44-4.06-10.44-9.96l-.03-73.62,20.8.03v73.07Z"/>
      <path d="M61.93,241.19c0,6.38-5.42,10.4-10.37,10.37-5.97-.04-10.16-4.56-10.14-10.54l.16-73,20.36-.03v73.19Z"/>
    </svg>
  );
}

export function Menu({ isOpen, onClose, onNavigate, currentView }: MenuProps) {
  const { user, signOut } = useAuth();
  const { profile, gender, theme, updateGender, updateTheme } = useProfile();
  const [localTheme, setLocalTheme] = useState<Theme>(theme);
  const [showFoodJournal, setShowFoodJournal] = useState(false);
  const [showPhysicalTherapy, setShowPhysicalTherapy] = useState(false);
  const [showPottyLogger, setShowPottyLogger] = useState(false);
  const [showWaterIntake, setShowWaterIntake] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showGender, setShowGender] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showBugReportModal, setShowBugReportModal] = useState(false);
  const [bugCategory, setBugCategory] = useState('');
  const [bugTitle, setBugTitle] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [bugScreenshot, setBugScreenshot] = useState<File | null>(null);
  const [bugScreenshotPreview, setBugScreenshotPreview] = useState<string | null>(null);
  const [bugSubmitting, setBugSubmitting] = useState(false);
  const [bugSubmitSuccess, setBugSubmitSuccess] = useState(false);
  const [bugSubmitError, setBugSubmitError] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  // Get avatar URL from profile or fallback to user metadata
  const userMetadata = user?.user_metadata || {};
  const avatarUrl = profile?.avatar_url ||
    userMetadata.avatar_url ||
    (typeof userMetadata.picture === 'string' ? userMetadata.picture : null);

  // Sync local theme state with profile theme
  useEffect(() => {
    setLocalTheme(theme);
  }, [theme]);

  // Auto-expand settings on desktop when menu opens
  useEffect(() => {
    if (isOpen && window.innerWidth >= 1024) {
      setShowSettings(true);
    }
  }, [isOpen]);

  // Apply theme to DOM
  useEffect(() => {
    applyTheme(localTheme);
  }, [localTheme]);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (newTheme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const handleThemeChange = async (newTheme: Theme) => {
    setLocalTheme(newTheme);
    applyTheme(newTheme);
    try {
      await updateTheme(newTheme);
    } catch (err) {
      console.error('Failed to update theme:', err);
    }
  };

  const handleGenderChange = async (newGender: Gender) => {
    try {
      await updateGender(newGender);
    } catch (err) {
      console.error('Failed to update gender:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const handleNavigation = (view: 'home' | 'potty' | 'history' | 'faq' | 'water' | 'water-history' | 'water-faq' | 'food' | 'food-history' | 'food-faq') => {
    onNavigate(view);
    onClose();
  };

  const activeClass = gender === 'female'
    ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
    : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 cursor-pointer"
          onClick={onClose}
        />
      )}

      {/* Menu Panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-72 flex-col bg-white shadow-xl transition-transform duration-300 dark:bg-zinc-900 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* User Info Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-zinc-200 p-4 dark:border-zinc-700">
          {user && profile && (
            <>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="h-12 w-12 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <svg className="h-6 w-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {profile.first_name && profile.last_name
                    ? `${profile.first_name} ${profile.last_name}`
                    : user.email}
                </p>
                {profile.first_name && profile.last_name && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {user.email}
                  </p>
                )}
              </div>
            </>
          )}
          <button
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 active:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:active:bg-zinc-700"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">

          <div className="space-y-2">
            {/* Navigation links - hidden on desktop since they're in the header */}
            <div className="lg:hidden">
              {/* Home */}
              <button
                onClick={() => handleNavigation('home')}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                  currentView === 'home'
                    ? activeClass
                    : 'text-zinc-700 active:bg-zinc-100 dark:text-zinc-300 dark:active:bg-zinc-800'
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="font-medium">Home</span>
              </button>

              {/* Divider */}
              <div className="my-3 border-t border-zinc-200 dark:border-zinc-700" />

              {/* Habit Tracker Section Header */}
              <p className="px-4 text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Habit Tracker
              </p>

            {/* Food Journal - Expandable */}
            <button
              onClick={() => setShowFoodJournal(!showFoodJournal)}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-zinc-700 active:bg-zinc-100 dark:text-zinc-300 dark:active:bg-zinc-800"
            >
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M7 4v17m-3 -17v3a3 3 0 1 0 6 0v-3" />
                  <path d="M14 8a3 4 0 1 0 6 0a3 4 0 1 0 -6 0" />
                  <path d="M17 12v9" />
                </svg>
                <span className="font-medium">Food Journal</span>
              </div>
              <svg
                className={`h-5 w-5 transition-transform ${showFoodJournal ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Food Journal Content */}
            {showFoodJournal && (
              <div className="ml-4 space-y-2 pl-4">
                <button
                  onClick={() => handleNavigation('food')}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                    currentView === 'food'
                      ? activeClass
                      : 'bg-zinc-100 text-zinc-700 active:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">Log</span>
                  {currentView === 'food' && (
                    <svg className="ml-auto h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={() => handleNavigation('food-history')}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                    currentView === 'food-history'
                      ? activeClass
                      : 'bg-zinc-100 text-zinc-700 active:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{gender === 'female' ? 'Herstory' : 'History'}</span>
                  {currentView === 'food-history' && (
                    <svg className="ml-auto h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={() => handleNavigation('food-faq')}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                    currentView === 'food-faq'
                      ? activeClass
                      : 'bg-zinc-100 text-zinc-700 active:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Dietary FAQs</span>
                  {currentView === 'food-faq' && (
                    <svg className="ml-auto h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </div>
            )}

            {/* Physical Therapy - Expandable */}
            <button
              onClick={() => setShowPhysicalTherapy(!showPhysicalTherapy)}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-zinc-700 active:bg-zinc-100 dark:text-zinc-300 dark:active:bg-zinc-800"
            >
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M2 12h1" />
                  <path d="M6 8h-2a1 1 0 0 0 -1 1v6a1 1 0 0 0 1 1h2" />
                  <path d="M6 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1" />
                  <path d="M9 12h6" />
                  <path d="M15 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1" />
                  <path d="M18 8h2a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-2" />
                  <path d="M22 12h-1" />
                </svg>
                <span className="font-medium">Physical Therapy</span>
              </div>
              <svg
                className={`h-5 w-5 transition-transform ${showPhysicalTherapy ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Physical Therapy Content */}
            {showPhysicalTherapy && (
              <div className="ml-4 pl-4">
                <div className="rounded-xl bg-zinc-100 p-4 dark:bg-zinc-800">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">Coming Soon</p>
                </div>
              </div>
            )}

            {/* Potty Logger - Expandable */}
            <button
              onClick={() => setShowPottyLogger(!showPottyLogger)}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-zinc-700 active:bg-zinc-100 dark:text-zinc-300 dark:active:bg-zinc-800"
            >
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M3 10a3 7 0 1 0 6 0a3 7 0 1 0 -6 0" />
                  <path d="M21 10c0 -3.866 -1.343 -7 -3 -7" />
                  <path d="M6 3h12" />
                  <path d="M21 10v10l-3 -1l-3 2l-3 -3l-3 2v-10" />
                  <path d="M6 10h.01" />
                </svg>
                <span className="font-medium">Potty Logger</span>
              </div>
              <svg
                className={`h-5 w-5 transition-transform ${showPottyLogger ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Potty Logger Content */}
            {showPottyLogger && (
              <div className="ml-4 space-y-2 pl-4">
                <button
                  onClick={() => handleNavigation('potty')}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                    currentView === 'potty'
                      ? activeClass
                      : 'bg-zinc-100 text-zinc-700 active:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">Log</span>
                  {currentView === 'potty' && (
                    <svg className="ml-auto h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={() => handleNavigation('history')}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                    currentView === 'history'
                      ? activeClass
                      : 'bg-zinc-100 text-zinc-700 active:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{gender === 'female' ? 'Herstory' : 'History'}</span>
                  {currentView === 'history' && (
                    <svg className="ml-auto h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={() => handleNavigation('faq')}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                    currentView === 'faq'
                      ? activeClass
                      : 'bg-zinc-100 text-zinc-700 active:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Potty FAQs</span>
                  {currentView === 'faq' && (
                    <svg className="ml-auto h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </div>
            )}

            {/* Water Intake - Expandable */}
            <button
              onClick={() => setShowWaterIntake(!showWaterIntake)}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-zinc-700 active:bg-zinc-100 dark:text-zinc-300 dark:active:bg-zinc-800"
            >
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M10 5h4v-2a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v2" />
                  <path d="M14 3.5c0 1.626 .507 3.212 1.45 4.537l.05 .07a8.093 8.093 0 0 1 1.5 4.694v6.199a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2v-6.2c0 -1.682 .524 -3.322 1.5 -4.693l.05 -.07a7.823 7.823 0 0 0 1.45 -4.537" />
                  <path d="M7 14.803a2.4 2.4 0 0 0 1 -.803a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 1 -.805" />
                </svg>
                <span className="font-medium">Water Intake</span>
              </div>
              <svg
                className={`h-5 w-5 transition-transform ${showWaterIntake ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Water Intake Content */}
            {showWaterIntake && (
              <div className="ml-4 space-y-2 pl-4">
                <button
                  onClick={() => handleNavigation('water')}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                    currentView === 'water'
                      ? activeClass
                      : 'bg-zinc-100 text-zinc-700 active:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">Log</span>
                  {currentView === 'water' && (
                    <svg className="ml-auto h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={() => handleNavigation('water-history')}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                    currentView === 'water-history'
                      ? activeClass
                      : 'bg-zinc-100 text-zinc-700 active:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{gender === 'female' ? 'Herstory' : 'History'}</span>
                  {currentView === 'water-history' && (
                    <svg className="ml-auto h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={() => handleNavigation('water-faq')}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                    currentView === 'water-faq'
                      ? activeClass
                      : 'bg-zinc-100 text-zinc-700 active:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Hydration FAQs</span>
                  {currentView === 'water-faq' && (
                    <svg className="ml-auto h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </div>
            )}

            {/* Divider - hidden on desktop */}
            <div className="my-3 border-t border-zinc-200 dark:border-zinc-700 lg:hidden" />
            </div>{/* End of mobile-only navigation */}

            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-zinc-700 active:bg-zinc-100 dark:text-zinc-300 dark:active:bg-zinc-800"
            >
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium">Settings</span>
              </div>
              <svg
                className={`h-5 w-5 transition-transform ${showSettings ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Settings Content */}
            {showSettings && (
              <div className="ml-4 space-y-2 pl-4">
                {/* Profile */}
                <div>
                  <button
                    onClick={() => setShowProfile(!showProfile)}
                    className="flex w-full items-center gap-2 py-2 text-sm font-medium text-zinc-500 dark:text-zinc-400"
                  >
                    <svg
                      className={`h-4 w-4 transition-transform ${showProfile ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Profile
                  </button>
                  {showProfile && (
                    <div className="space-y-2 pb-2">
                      <a
                        href="/profile"
                        className="flex w-full items-center gap-3 rounded-xl bg-zinc-100 px-4 py-3 text-zinc-700 transition-colors active:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium">Edit Profile</span>
                      </a>
                      <a
                        href="/settings"
                        className="flex w-full items-center gap-3 rounded-xl bg-zinc-100 px-4 py-3 text-zinc-700 transition-colors active:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        <span className="font-medium">Edit Settings</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Gender Selection */}
                <div>
                  <button
                    onClick={() => setShowGender(!showGender)}
                    className="flex w-full items-center gap-2 py-2 text-sm font-medium text-zinc-500 dark:text-zinc-400"
                  >
                    <svg
                      className={`h-4 w-4 transition-transform ${showGender ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Gender
                  </button>
                  {showGender && (
                    <div className="space-y-2 pb-2">
                      {[
                        { value: 'male' as Gender, label: 'Male', Icon: MaleIcon },
                        { value: 'female' as Gender, label: 'Female', Icon: FemaleIcon },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleGenderChange(option.value)}
                          className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                            gender === option.value
                              ? activeClass
                              : 'bg-zinc-100 text-zinc-700 active:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          <option.Icon className="h-5 w-5" />
                          <span className="font-medium">{option.label}</span>
                          {gender === option.value && (
                            <svg className="ml-auto h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Appearance */}
                <div>
                  <button
                    onClick={() => setShowAppearance(!showAppearance)}
                    className="flex w-full items-center gap-2 py-2 text-sm font-medium text-zinc-500 dark:text-zinc-400"
                  >
                    <svg
                      className={`h-4 w-4 transition-transform ${showAppearance ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Appearance
                  </button>
                  {showAppearance && (
                    <div className="space-y-2 pb-2">
                      {[
                        { value: 'light' as Theme, label: 'Light', Icon: SunIcon },
                        { value: 'dark' as Theme, label: 'Dark', Icon: MoonIcon },
                        { value: 'system' as Theme, label: 'System', Icon: SystemIcon },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleThemeChange(option.value)}
                          className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                            localTheme === option.value
                              ? activeClass
                              : 'bg-zinc-100 text-zinc-700 active:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          <option.Icon className="h-5 w-5" />
                          <span className="font-medium">{option.label}</span>
                          {localTheme === option.value && (
                            <svg className="ml-auto h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Support */}
                <div>
                  <button
                    onClick={() => setShowSupport(!showSupport)}
                    className="flex w-full items-center gap-2 py-2 text-sm font-medium text-zinc-500 dark:text-zinc-400"
                  >
                    <svg
                      className={`h-4 w-4 transition-transform ${showSupport ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Support
                  </button>
                  {showSupport && (
                    <div className="space-y-2 pb-2">
                      <a
                        href="mailto:support@pottylogger.com"
                        className="flex w-full items-center gap-3 rounded-xl bg-zinc-100 px-4 py-3 text-zinc-700 transition-colors active:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">Email Support</span>
                      </a>
                      <button
                        onClick={() => setShowBugReportModal(true)}
                        className="flex w-full items-center gap-3 rounded-xl bg-zinc-100 px-4 py-3 text-zinc-700 transition-colors active:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 8h-1.81c-.45-.78-1.07-1.45-1.82-1.96l.93-.93a.996.996 0 10-1.41-1.41l-1.47 1.47C12.96 5.06 12.49 5 12 5s-.96.06-1.41.17L9.11 3.7a.996.996 0 10-1.41 1.41l.92.93C7.88 6.55 7.26 7.22 6.81 8H5c-.55 0-1 .45-1 1s.45 1 1 1h1.09c-.05.33-.09.66-.09 1v1H5c-.55 0-1 .45-1 1s.45 1 1 1h1v1c0 .34.04.67.09 1H5c-.55 0-1 .45-1 1s.45 1 1 1h1.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H19c.55 0 1-.45 1-1s-.45-1-1-1h-1.09c.05-.33.09-.66.09-1v-1h1c.55 0 1-.45 1-1s-.45-1-1-1h-1v-1c0-.34-.04-.67-.09-1H19c.55 0 1-.45 1-1s-.45-1-1-1zm-6 8h-2c-.55 0-1-.45-1-1s.45-1 1-1h2c.55 0 1 .45 1 1s-.45 1-1 1zm0-4h-2c-.55 0-1-.45-1-1s.45-1 1-1h2c.55 0 1 .45 1 1s-.45 1-1 1z"/>
                        </svg>
                        <span className="font-medium">Report a Bug</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer content */}
        <div className="shrink-0 border-t border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          {/* Logout Button */}
          <button
            onClick={handleSignOut}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-zinc-200 bg-zinc-50 px-4 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-100 active:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:active:bg-zinc-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>

          <h3 className={`text-lg font-bold bg-gradient-to-r ${gender === 'female' ? 'from-pink-400 via-purple-500 to-purple-400' : 'from-teal-400 via-blue-500 to-blue-400'} bg-clip-text text-transparent`}>Habit-a-Day</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Start your journey to healing one day at a time.
          </p>
          <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
            © 2026 Built for <span title="Shits and Giggles" className="cursor-default">💩 &amp; 🤭</span>.
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            All rights reserved. Version {APP_VERSION}
          </p>
          <p className="mt-2 text-xs">
            <Link
              href="/privacy"
              className={`font-medium underline ${gender === 'female' ? 'text-pink-500 hover:text-pink-600' : 'text-teal-500 hover:text-teal-600'}`}
            >
              Privacy Policy
            </Link>
            <span className="mx-2 text-zinc-400">·</span>
            <Link
              href="/terms"
              className={`font-medium underline ${gender === 'female' ? 'text-pink-500 hover:text-pink-600' : 'text-teal-500 hover:text-teal-600'}`}
            >
              Terms & Conditions
            </Link>
          </p>
        </div>
      </div>

      {/* Bug Report Modal */}
      {showBugReportModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-800">
            {bugSubmitSuccess ? (
              // Success state
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Thank You!
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                  Your bug report has been submitted. We appreciate your help in improving Habit-a-Day!
                </p>
                <button
                  onClick={() => {
                    setShowBugReportModal(false);
                    setBugSubmitSuccess(false);
                    setBugSubmitError(null);
                    setBugCategory('');
                    setBugTitle('');
                    setBugDescription('');
                    setBugScreenshot(null);
                    setBugScreenshotPreview(null);
                  }}
                  className={`w-full rounded-xl px-4 py-3 font-medium text-white transition-colors ${
                    gender === 'female'
                      ? 'bg-pink-500 hover:bg-pink-600 active:bg-pink-700'
                      : 'bg-teal-500 hover:bg-teal-600 active:bg-teal-700'
                  }`}
                >
                  Done
                </button>
              </div>
            ) : (
              // Form state
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Report a Bug
                  </h3>
                  <button
                    onClick={() => {
                      setShowBugReportModal(false);
                      setBugSubmitError(null);
                      setBugCategory('');
                      setBugTitle('');
                      setBugDescription('');
                      setBugScreenshot(null);
                      setBugScreenshotPreview(null);
                    }}
                    className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
                  Encountered a problem? Let us know and we&apos;ll work to fix it.
                </p>

                {/* User Info Display */}
                {user && (
                  <div className="mb-4 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-700/50">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Reporting as: <span className="font-medium text-zinc-700 dark:text-zinc-300">{user.email}</span>
                    </p>
                  </div>
                )}

                {bugSubmitError && (
                  <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {bugSubmitError}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={bugCategory}
                      onChange={(e) => setBugCategory(e.target.value)}
                      className={`w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                        gender === 'female'
                          ? 'focus:border-pink-500 focus:ring-pink-500'
                          : 'focus:border-teal-500 focus:ring-teal-500'
                      }`}
                    >
                      <option value="">Select a category...</option>
                      <option value="ui">UI/Visual Issue</option>
                      <option value="crash">App Crash</option>
                      <option value="data">Data Not Saving</option>
                      <option value="sync">Sync Issue</option>
                      <option value="performance">Slow Performance</option>
                      <option value="login">Login/Auth Issue</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Brief Summary <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bugTitle}
                      onChange={(e) => setBugTitle(e.target.value)}
                      placeholder="What went wrong?"
                      maxLength={100}
                      className={`w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500 ${
                        gender === 'female'
                          ? 'focus:border-pink-500 focus:ring-pink-500'
                          : 'focus:border-teal-500 focus:ring-teal-500'
                      }`}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Details <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={bugDescription}
                      onChange={(e) => setBugDescription(e.target.value)}
                      placeholder="Please describe what happened, steps to reproduce, and what you expected to happen..."
                      rows={4}
                      maxLength={2000}
                      className={`w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500 resize-none ${
                        gender === 'female'
                          ? 'focus:border-pink-500 focus:ring-pink-500'
                          : 'focus:border-teal-500 focus:ring-teal-500'
                      }`}
                    />
                    <p className="mt-1 text-xs text-zinc-400">{bugDescription.length}/2000</p>
                  </div>

                  {/* Screenshot Upload */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Screenshot (optional)
                    </label>
                    {bugScreenshotPreview ? (
                      <div className="relative">
                        <img
                          src={bugScreenshotPreview}
                          alt="Screenshot preview"
                          className="w-full rounded-xl border-2 border-zinc-200 dark:border-zinc-700 max-h-48 object-contain bg-zinc-50 dark:bg-zinc-900"
                        />
                        <button
                          onClick={() => {
                            setBugScreenshot(null);
                            setBugScreenshotPreview(null);
                            if (screenshotInputRef.current) {
                              screenshotInputRef.current.value = '';
                            }
                          }}
                          className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white shadow-lg hover:bg-red-600"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => screenshotInputRef.current?.click()}
                        className="w-full rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center transition-colors hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:border-zinc-500 dark:hover:bg-zinc-700"
                      >
                        <svg className="mx-auto h-8 w-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Click to upload a screenshot</p>
                        <p className="text-xs text-zinc-400">PNG, JPG up to 5MB</p>
                      </button>
                    )}
                    <input
                      ref={screenshotInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            setBugSubmitError('Screenshot must be less than 5MB');
                            return;
                          }
                          setBugScreenshot(file);
                          setBugScreenshotPreview(URL.createObjectURL(file));
                          setBugSubmitError(null);
                        }
                      }}
                      className="hidden"
                    />
                  </div>

                  {/* Data Collection Disclosure */}
                  <div className="rounded-xl bg-zinc-100 p-4 dark:bg-zinc-700/50">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-2">
                      <strong className="text-zinc-700 dark:text-zinc-300">Data Collection Notice:</strong> By submitting this bug report, you help our team identify and resolve issues within our application. You acknowledge and consent to the transmission of diagnostic information including: user account details, IP address, device information, application logs, console errors, current session data, and any screenshots or notes you provide.
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-2">
                      <strong className="text-zinc-700 dark:text-zinc-300">Bug Report Data Retention:</strong> Bug reports and associated diagnostic data are retained for up to twelve (12) months to allow for issue investigation and resolution tracking. After this period, reports are automatically purged from our systems. You may request early deletion of your bug reports by contacting support.
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      For complete details, please review our{' '}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className={`underline font-medium ${gender === 'female' ? 'text-pink-600 dark:text-pink-400' : 'text-teal-600 dark:text-teal-400'}`}
                      >
                        Terms & Conditions and Privacy Policy
                      </button>.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      setShowBugReportModal(false);
                      setBugSubmitError(null);
                      setBugCategory('');
                      setBugTitle('');
                      setBugDescription('');
                      setBugScreenshot(null);
                      setBugScreenshotPreview(null);
                    }}
                    className="flex-1 rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!bugCategory || !bugTitle || !bugDescription) return;
                      setBugSubmitting(true);
                      setBugSubmitError(null);

                      try {
                        const formData = new FormData();
                        formData.append('category', bugCategory);
                        formData.append('title', bugTitle);
                        formData.append('description', bugDescription);
                        formData.append('consoleLogs', consoleLogs.join('\n'));
                        formData.append('userAgent', navigator.userAgent);
                        formData.append('screenSize', `${window.innerWidth}x${window.innerHeight}`);
                        formData.append('currentUrl', window.location.href);
                        if (bugScreenshot) {
                          formData.append('screenshot', bugScreenshot);
                        }

                        const response = await fetch('/api/bug-report', {
                          method: 'POST',
                          body: formData,
                        });

                        const data = await response.json();

                        if (!response.ok) {
                          throw new Error(data.error || 'Failed to submit bug report');
                        }

                        setBugSubmitSuccess(true);
                      } catch (error) {
                        console.error('Bug report submission error:', error);
                        // Fall back to email
                        const subject = encodeURIComponent(`[Bug Report] ${bugCategory.toUpperCase()}: ${bugTitle}`);
                        const body = encodeURIComponent(
                          `Category: ${bugCategory}\n\nSummary: ${bugTitle}\n\nDetails:\n${bugDescription}\n\n---\nUser: ${user?.email || 'Not logged in'}\nDevice: ${navigator.userAgent}\nScreen: ${window.innerWidth}x${window.innerHeight}\nURL: ${window.location.href}\nTimestamp: ${new Date().toISOString()}\n\nConsole Logs:\n${consoleLogs.slice(-10).join('\n')}`
                        );
                        window.location.href = `mailto:support@pottylogger.com?subject=${subject}&body=${body}`;
                        setBugSubmitSuccess(true);
                      } finally {
                        setBugSubmitting(false);
                      }
                    }}
                    disabled={!bugCategory || !bugTitle || !bugDescription || bugSubmitting}
                    className={`flex-1 rounded-xl px-4 py-3 font-medium text-white transition-colors disabled:opacity-50 ${
                      gender === 'female'
                        ? 'bg-pink-500 hover:bg-pink-600 active:bg-pink-700'
                        : 'bg-teal-500 hover:bg-teal-600 active:bg-teal-700'
                    }`}
                  >
                    {bugSubmitting ? 'Submitting...' : 'Agree & Submit'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-xl dark:bg-zinc-800">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 p-6 dark:border-zinc-700">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Terms & Conditions and Privacy Policy
              </h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                  Last Updated: January 25, 2026
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
                  <li><strong>No Third-Party Sharing:</strong> We do not sell, trade, or otherwise transfer your personal information or health data to third parties for marketing purposes. Data may only be shared with service providers necessary for application functionality, and such providers are bound by strict confidentiality agreements.</li>
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
                  <li><strong>Support Data:</strong> Bug reports, console logs, and diagnostic information submitted through our support features.</li>
                </ul>

                {/* Section 4 */}
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-6 mb-3">
                  4. Data Retention Policy
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                  We retain your data according to the following guidelines:
                </p>
                <ul className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 list-disc pl-5 space-y-2">
                  <li><strong>Active Accounts:</strong> Your data is retained for as long as your account remains active and you continue to use our services.</li>
                  <li><strong>Inactive Accounts:</strong> Accounts with no login activity for twenty-four (24) consecutive months may be flagged for deletion. We will attempt to notify you via email before any action is taken.</li>
                  <li><strong>Backup Retention:</strong> Encrypted backups may be retained for up to ninety (90) days following data deletion for disaster recovery purposes, after which they are permanently purged.</li>
                  <li><strong>Legal Requirements:</strong> We may retain certain data for longer periods if required by applicable law, regulation, or legal proceedings.</li>
                </ul>

                {/* Section 5 */}
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-6 mb-3">
                  5. Data Deletion Policy
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                  You have the right to request deletion of your data at any time:
                </p>
                <ul className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 list-disc pl-5 space-y-2">
                  <li><strong>Account Deletion:</strong> You may permanently delete your account and all associated data through the application settings. This action is irreversible.</li>
                  <li><strong>Scope of Deletion:</strong> Upon account deletion, we will remove all personal information, health tracking data, profile information, uploaded media, and associated records from our active systems.</li>
                  <li><strong>Deletion Timeline:</strong> Primary data deletion occurs immediately upon request. Complete purging from all backup systems occurs within ninety (90) days.</li>
                  <li><strong>Exceptions:</strong> Certain anonymized, aggregated data that cannot be used to identify you may be retained for analytical purposes. Data required to be retained by law will be kept for the legally mandated period.</li>
                  <li><strong>Third-Party Data:</strong> While we will delete data from our systems, we cannot control data that may have been cached by third-party services (such as authentication providers) prior to deletion.</li>
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
                  <li>You are responsible for all activities that occur under your account.</li>
                </ul>

                {/* Section 7 */}
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-6 mb-3">
                  7. Health Information Disclaimer
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Habit-a-Day is designed for personal health tracking and informational purposes only. The application does <strong>not</strong> provide medical advice, diagnosis, or treatment recommendations. The information and features provided should not be used as a substitute for professional medical advice. Always consult with a qualified healthcare provider regarding any health concerns or before making decisions related to your health or treatment.
                </p>

                {/* Section 8 */}
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-6 mb-3">
                  8. Intellectual Property
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  All content, features, and functionality of the Habit-a-Day application—including but not limited to text, graphics, logos, icons, images, audio clips, and software—are the exclusive property of Habit-a-Day or its licensors and are protected by international copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works without our express written consent.
                </p>

                {/* Section 9 */}
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-6 mb-3">
                  9. Limitation of Liability
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  To the maximum extent permitted by applicable law, Habit-a-Day and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of data, loss of profits, or business interruption, arising out of or related to your use of or inability to use the application, even if we have been advised of the possibility of such damages. Our total liability shall not exceed the amount paid by you, if any, for accessing the application during the twelve (12) months preceding the claim.
                </p>

                {/* Section 10 */}
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-6 mb-3">
                  10. Indemnification
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  You agree to indemnify, defend, and hold harmless Habit-a-Day and its affiliates from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys&apos; fees) arising out of or related to your violation of these Terms & Conditions, your use of the application, or your violation of any rights of another party.
                </p>

                {/* Section 11 */}
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-6 mb-3">
                  11. Service Availability
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  We strive to maintain continuous availability of our services but do not guarantee uninterrupted access. The application may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control. We reserve the right to modify, suspend, or discontinue any part of the service at any time without prior notice.
                </p>

                {/* Section 12 */}
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-6 mb-3">
                  12. Governing Law
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  These Terms & Conditions shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Any disputes arising under or in connection with these terms shall be subject to the exclusive jurisdiction of the courts located within the United States.
                </p>

                {/* Section 13 */}
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-6 mb-3">
                  13. Changes to Terms
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  We reserve the right to update or modify these Terms & Conditions at any time. Material changes will be communicated through the application or via email. Your continued use of the application after such modifications constitutes your acceptance of the updated terms. We encourage you to review these terms periodically.
                </p>

                {/* Section 14 */}
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-6 mb-3">
                  14. Contact Information
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  If you have any questions, concerns, or requests regarding these Terms & Conditions or our Privacy Policy, please contact us at:
                </p>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 pl-5">
                  <p><strong>Email:</strong> support@pottylogger.com</p>
                  <p><strong>Subject Line:</strong> Terms & Privacy Inquiry</p>
                </div>

                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                  By using Habit-a-Day, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions and Privacy Policy.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-200 p-6 dark:border-zinc-700">
              <button
                onClick={() => setShowTermsModal(false)}
                className={`w-full rounded-xl px-4 py-3 font-medium text-white transition-colors ${
                  gender === 'female'
                    ? 'bg-pink-500 hover:bg-pink-600 active:bg-pink-700'
                    : 'bg-teal-500 hover:bg-teal-600 active:bg-teal-700'
                }`}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
