'use client';

import { Gender } from '@/lib/types';

type ViewType = 'home' | 'potty' | 'history' | 'faq' | 'water' | 'water-history' | 'water-faq' | 'food' | 'food-history' | 'food-faq';

interface MobileBottomNavProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onOpenMore: () => void;
  gender: Gender;
}

export function MobileBottomNav({ currentView, onNavigate, onOpenMore, gender }: MobileBottomNavProps) {
  const activeColor = gender === 'female' ? 'text-pink-500' : 'text-teal-500';
  const activeBg = gender === 'female' ? 'bg-pink-100 dark:bg-pink-900/30' : 'bg-teal-100 dark:bg-teal-900/30';
  const inactiveColor = 'text-zinc-400 dark:text-zinc-500';

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      view: 'home' as ViewType,
      isActive: currentView === 'home',
      icon: () => (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'food',
      label: 'Food',
      view: 'food' as ViewType,
      isActive: ['food', 'food-history', 'food-faq'].includes(currentView),
      icon: () => (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M7 4v17m-3 -17v3a3 3 0 1 0 6 0v-3" />
          <path d="M14 8a3 4 0 1 0 6 0a3 4 0 1 0 -6 0" />
          <path d="M17 12v9" />
        </svg>
      ),
    },
    {
      id: 'potty',
      label: 'Potty',
      view: 'potty' as ViewType,
      isActive: ['potty', 'history', 'faq'].includes(currentView),
      icon: () => (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M3 10a3 7 0 1 0 6 0a3 7 0 1 0 -6 0" />
          <path d="M21 10c0 -3.866 -1.343 -7 -3 -7" />
          <path d="M6 3h12" />
          <path d="M21 10v10l-3 -1l-3 2l-3 -3l-3 2v-10" />
          <path d="M6 10h.01" />
        </svg>
      ),
    },
    {
      id: 'water',
      label: 'Water',
      view: 'water' as ViewType,
      isActive: ['water', 'water-history', 'water-faq'].includes(currentView),
      icon: () => (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M10 5h4v-2a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v2" />
          <path d="M14 3.5c0 1.626 .507 3.212 1.45 4.537l.05 .07a8.093 8.093 0 0 1 1.5 4.694v6.199a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2v-6.2c0 -1.682 .524 -3.322 1.5 -4.693l.05 -.07a7.823 7.823 0 0 0 1.45 -4.537" />
          <path d="M7 14.803a2.4 2.4 0 0 0 1 -.803a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 1 -.805" />
        </svg>
      ),
    },
    {
      id: 'more',
      label: 'More',
      view: null,
      isActive: false,
      icon: () => (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-zinc-200/50 dark:bg-zinc-900/95 dark:border-zinc-700/50 pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'more') {
                onOpenMore();
              } else if (item.view) {
                onNavigate(item.view);
              }
            }}
            className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-xl min-w-[60px] transition-all ${
              item.isActive
                ? `${activeColor} ${activeBg}`
                : inactiveColor
            }`}
          >
            {item.icon()}
            <span className={`text-[10px] mt-1 font-medium ${item.isActive ? '' : 'text-zinc-500 dark:text-zinc-400'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
