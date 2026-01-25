'use client';

import { useState, useRef, useEffect } from 'react';
import { Gender } from '@/lib/types';

type ViewType = 'home' | 'potty' | 'history' | 'faq' | 'water' | 'water-history' | 'water-faq' | 'food' | 'food-history' | 'food-faq';

interface DesktopNavProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onOpenSettings: () => void;
  gender: Gender;
  avatarUrl?: string | null;
  userName?: string | null;
}

export function DesktopNav({ currentView, onNavigate, onOpenSettings, gender, avatarUrl, userName }: DesktopNavProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const headerGradient = gender === 'female'
    ? 'from-pink-500 via-purple-500 to-fuchsia-400'
    : 'from-teal-500 via-cyan-500 to-blue-500';

  const activeClass = gender === 'female'
    ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
    : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';

  const hoverClass = gender === 'female'
    ? 'hover:bg-pink-50 dark:hover:bg-pink-900/20'
    : 'hover:bg-teal-50 dark:hover:bg-teal-900/20';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      view: 'home' as ViewType,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'food',
      label: 'Food Journal',
      view: 'food' as ViewType,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M7 4v17m-3 -17v3a3 3 0 1 0 6 0v-3" />
          <path d="M14 8a3 4 0 1 0 6 0a3 4 0 1 0 -6 0" />
          <path d="M17 12v9" />
        </svg>
      ),
      subItems: [
        { label: 'Log Food', view: 'food' as ViewType },
        { label: gender === 'female' ? 'Herstory' : 'History', view: 'food-history' as ViewType },
        { label: 'Dietary FAQs', view: 'food-faq' as ViewType },
      ],
    },
    {
      id: 'physical-therapy',
      label: 'Physical Therapy',
      view: null,
      disabled: true,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M2 12h1" />
          <path d="M6 8h-2a1 1 0 0 0 -1 1v6a1 1 0 0 0 1 1h2" />
          <path d="M6 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1" />
          <path d="M9 12h6" />
          <path d="M15 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1" />
          <path d="M18 8h2a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-2" />
          <path d="M22 12h-1" />
        </svg>
      ),
    },
    {
      id: 'potty',
      label: 'Potty Logger',
      view: 'potty' as ViewType,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M3 10a3 7 0 1 0 6 0a3 7 0 1 0 -6 0" />
          <path d="M21 10c0 -3.866 -1.343 -7 -3 -7" />
          <path d="M6 3h12" />
          <path d="M21 10v10l-3 -1l-3 2l-3 -3l-3 2v-10" />
          <path d="M6 10h.01" />
        </svg>
      ),
      subItems: [
        { label: 'Log', view: 'potty' as ViewType },
        { label: gender === 'female' ? 'Herstory' : 'History', view: 'history' as ViewType },
        { label: 'Potty FAQs', view: 'faq' as ViewType },
      ],
    },
    {
      id: 'water',
      label: 'Water Intake',
      view: 'water' as ViewType,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z" />
        </svg>
      ),
      subItems: [
        { label: 'Log Water', view: 'water' as ViewType },
        { label: gender === 'female' ? 'Herstory' : 'History', view: 'water-history' as ViewType },
        { label: 'Hydration FAQs', view: 'water-faq' as ViewType },
      ],
    },
  ];

  const isViewActive = (item: typeof navItems[0]) => {
    if (item.id === 'home') return currentView === 'home';
    if (item.id === 'food') return ['food', 'food-history', 'food-faq'].includes(currentView);
    if (item.id === 'potty') return ['potty', 'history', 'faq'].includes(currentView);
    if (item.id === 'water') return ['water', 'water-history', 'water-faq'].includes(currentView);
    return false;
  };

  return (
    <nav className="hidden lg:flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-sm border-b border-zinc-200/50 dark:bg-zinc-900/80 dark:border-zinc-700/50 sticky top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 shrink-0">
          <div className={`absolute inset-0 rounded-xl bg-gradient-to-br shadow-lg ${headerGradient} ${gender === 'female' ? 'shadow-pink-500/20' : 'shadow-teal-500/20'}`} />
          <div className="absolute inset-[3px] rounded-[9px] bg-white dark:bg-zinc-900 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="22" stroke={`url(#navGrad-${gender})`} strokeWidth="3" fill="none" />
              <path d="M26 40 L35 49 L54 28" stroke={`url(#navGrad-${gender})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <defs>
                <linearGradient id={`navGrad-${gender}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  {gender === 'female' ? (
                    <>
                      <stop offset="0%" stopColor="#ec4899"/>
                      <stop offset="50%" stopColor="#a855f7"/>
                      <stop offset="100%" stopColor="#d946ef"/>
                    </>
                  ) : (
                    <>
                      <stop offset="0%" stopColor="#14b8a6"/>
                      <stop offset="50%" stopColor="#06b6d4"/>
                      <stop offset="100%" stopColor="#3b82f6"/>
                    </>
                  )}
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <div>
          <span className={`text-2xl font-bold bg-gradient-to-r ${headerGradient} bg-clip-text text-transparent`}>
            Habit-a-Day
          </span>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Start your journey to healing one day at a time.
          </p>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex items-center gap-1" ref={dropdownRef}>
        {navItems.map((item) => (
          <div key={item.id} className="relative">
            {item.subItems ? (
              <>
                <button
                  onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                    isViewActive(item) ? activeClass : `text-zinc-600 dark:text-zinc-400 ${hoverClass}`
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  <svg className={`h-4 w-4 transition-transform ${activeDropdown === item.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {activeDropdown === item.id && (
                  <div className="absolute top-full left-0 mt-1 py-2 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 min-w-[180px] z-50">
                    {item.subItems.map((subItem) => (
                      <button
                        key={subItem.view}
                        onClick={() => {
                          onNavigate(subItem.view);
                          setActiveDropdown(null);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                          currentView === subItem.view
                            ? activeClass
                            : `text-zinc-600 dark:text-zinc-400 ${hoverClass}`
                        }`}
                      >
                        {subItem.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : item.disabled ? (
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
              >
                {item.icon}
                <span>{item.label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400">
                  Soon
                </span>
              </div>
            ) : (
              <button
                onClick={() => item.view && onNavigate(item.view)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                  isViewActive(item) ? activeClass : `text-zinc-600 dark:text-zinc-400 ${hoverClass}`
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Profile/Settings */}
      <button
        onClick={onOpenSettings}
        className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${hoverClass}`}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profile" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <svg className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
        {userName && (
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{userName}</span>
        )}
        <svg className="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </nav>
  );
}
