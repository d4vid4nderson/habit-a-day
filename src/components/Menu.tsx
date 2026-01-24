'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useProfile } from '@/lib/hooks/useProfile';
import { Gender } from '@/lib/types';
import { Theme } from '@/lib/services/profileService';

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

  // Sync local theme state with profile theme
  useEffect(() => {
    setLocalTheme(theme);
  }, [theme]);

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
        className={`fixed right-0 top-0 z-50 h-full w-72 bg-white shadow-xl transition-transform duration-300 dark:bg-zinc-900 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* User Info Header */}
        <div className="flex items-center gap-3 border-b border-zinc-200 p-4 dark:border-zinc-700">
          {user && profile && (
            <>
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="h-12 w-12 rounded-full object-cover"
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

        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>

          <div className="space-y-2">
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

            {/* Divider */}
            <div className="my-3 border-t border-zinc-200 dark:border-zinc-700" />

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
                      <a
                        href="#"
                        className="flex w-full items-center gap-3 rounded-xl bg-zinc-100 px-4 py-3 text-zinc-700 transition-colors active:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 8h-1.81c-.45-.78-1.07-1.45-1.82-1.96l.93-.93a.996.996 0 10-1.41-1.41l-1.47 1.47C12.96 5.06 12.49 5 12 5s-.96.06-1.41.17L9.11 3.7a.996.996 0 10-1.41 1.41l.92.93C7.88 6.55 7.26 7.22 6.81 8H5c-.55 0-1 .45-1 1s.45 1 1 1h1.09c-.05.33-.09.66-.09 1v1H5c-.55 0-1 .45-1 1s.45 1 1 1h1v1c0 .34.04.67.09 1H5c-.55 0-1 .45-1 1s.45 1 1 1h1.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H19c.55 0 1-.45 1-1s-.45-1-1-1h-1.09c.05-.33.09-.66.09-1v-1h1c.55 0 1-.45 1-1s-.45-1-1-1h-1v-1c0-.34-.04-.67-.09-1H19c.55 0 1-.45 1-1s-.45-1-1-1zm-6 8h-2c-.55 0-1-.45-1-1s.45-1 1-1h2c.55 0 1 .45 1 1s-.45 1-1 1zm0-4h-2c-.55 0-1-.45-1-1s.45-1 1-1h2c.55 0 1 .45 1 1s-.45 1-1 1z"/>
                        </svg>
                        <span className="font-medium">Report a Bug</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer content */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
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
            All rights reserved. Version 1.0
          </p>
        </div>
      </div>
    </>
  );
}
