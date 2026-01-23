'use client';

import { useEffect, useState } from 'react';
import { useGender } from '@/lib/GenderContext';
import { Gender } from '@/lib/types';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: 'log' | 'history' | 'faq') => void;
  currentView: 'log' | 'history' | 'faq';
}

type Theme = 'light' | 'dark' | 'system';

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
  const [theme, setTheme] = useState<Theme>('system');
  const [showSettings, setShowSettings] = useState(false);
  const [showGender, setShowGender] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const { gender, setGender } = useGender();

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    }
  }, []);

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

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const handleNavigation = (view: 'log' | 'history' | 'faq') => {
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
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Menu</h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full active:bg-zinc-100 dark:active:bg-zinc-800"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <div className="space-y-2">
            {/* Navigation */}
            <button
              onClick={() => handleNavigation('log')}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                currentView === 'log'
                  ? activeClass
                  : 'text-zinc-700 active:bg-zinc-100 dark:text-zinc-300 dark:active:bg-zinc-800'
              }`}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">Log</span>
            </button>

            <button
              onClick={() => handleNavigation('history')}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                currentView === 'history'
                  ? activeClass
                  : 'text-zinc-700 active:bg-zinc-100 dark:text-zinc-300 dark:active:bg-zinc-800'
              }`}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{gender === 'female' ? 'Herstory' : 'History'}</span>
            </button>

            {/* Divider */}
            <div className="my-3 border-t border-zinc-200 dark:border-zinc-700" />

            {/* FAQs */}
            <button
              onClick={() => handleNavigation('faq')}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                currentView === 'faq'
                  ? activeClass
                  : 'text-zinc-700 active:bg-zinc-100 dark:text-zinc-300 dark:active:bg-zinc-800'
              }`}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Potty FAQs</span>
            </button>

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
                          onClick={() => setGender(option.value)}
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
                            theme === option.value
                              ? activeClass
                              : 'bg-zinc-100 text-zinc-700 active:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          <option.Icon className="h-5 w-5" />
                          <span className="font-medium">{option.label}</span>
                          {theme === option.value && (
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
        <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-200 p-4 dark:border-zinc-700">
          <h3 className={`text-lg font-bold bg-gradient-to-r ${gender === 'female' ? 'from-pink-400 via-purple-500 to-purple-400' : 'from-teal-400 via-blue-500 to-blue-400'} bg-clip-text text-transparent`}>Potty Logger</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Simple bathroom tracking for health and wellness.
          </p>
          <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
            © 2026 Built with 💩 by David Anderson.
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            All rights reserved. Version 1.0
          </p>
        </div>
      </div>
    </>
  );
}
