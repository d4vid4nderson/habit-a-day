'use client';

import { useEffect, useState } from 'react';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: 'log' | 'history') => void;
  currentView: 'log' | 'history';
}

type Theme = 'light' | 'dark' | 'system';

export function Menu({ isOpen, onClose, onNavigate, currentView }: MenuProps) {
  const [theme, setTheme] = useState<Theme>('system');
  const [showSettings, setShowSettings] = useState(false);

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

  const handleNavigation = (view: 'log' | 'history') => {
    onNavigate(view);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

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
                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
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
                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                  : 'text-zinc-700 active:bg-zinc-100 dark:text-zinc-300 dark:active:bg-zinc-800'
              }`}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">History</span>
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
                <p className="py-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">Appearance</p>
                {[
                  { value: 'light' as Theme, label: 'Light', icon: '☀️' },
                  { value: 'dark' as Theme, label: 'Dark', icon: '🌙' },
                  { value: 'system' as Theme, label: 'System', icon: '⚙️' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleThemeChange(option.value)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                      theme === option.value
                        ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                        : 'bg-zinc-100 text-zinc-700 active:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    <span className="text-lg">{option.icon}</span>
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
        </div>
      </div>
    </>
  );
}
