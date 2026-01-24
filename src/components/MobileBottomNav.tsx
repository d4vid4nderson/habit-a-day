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
  const inactiveColor = 'text-zinc-400 dark:text-zinc-500';

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      view: 'home' as ViewType,
      isActive: currentView === 'home',
      icon: (active: boolean) => (
        <svg className="h-6 w-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5} d={active
            ? "M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
            : "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          } />
        </svg>
      ),
    },
    {
      id: 'food',
      label: 'Food',
      view: 'food' as ViewType,
      isActive: ['food', 'food-history', 'food-faq'].includes(currentView),
      icon: (active: boolean) => (
        <svg className="h-6 w-6" fill={active ? 'currentColor' : 'none'} stroke={active ? 'none' : 'currentColor'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          {active ? (
            <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
          ) : (
            <>
              <path d="M7 4v17m-3 -17v3a3 3 0 1 0 6 0v-3" />
              <path d="M14 8a3 4 0 1 0 6 0a3 4 0 1 0 -6 0" />
              <path d="M17 12v9" />
            </>
          )}
        </svg>
      ),
    },
    {
      id: 'potty',
      label: 'Potty',
      view: 'potty' as ViewType,
      isActive: ['potty', 'history', 'faq'].includes(currentView),
      icon: (active: boolean) => (
        <svg className="h-6 w-6" fill={active ? 'currentColor' : 'none'} stroke={active ? 'none' : 'currentColor'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          {active ? (
            <path d="M6 3h12v2H6V3zm-3 7c0-2.76 1.79-5 4-5h10c2.21 0 4 2.24 4 5v1c0 1.1-.9 2-2 2h-1v8c0 .55-.45 1-1 1H8c-.55 0-1-.45-1-1v-8H6c-1.1 0-2-.9-2-2v-1z"/>
          ) : (
            <>
              <path d="M3 10a3 7 0 1 0 6 0a3 7 0 1 0 -6 0" />
              <path d="M21 10c0 -3.866 -1.343 -7 -3 -7" />
              <path d="M6 3h12" />
              <path d="M21 10v10l-3 -1l-3 2l-3 -3l-3 2v-10" />
              <path d="M6 10h.01" />
            </>
          )}
        </svg>
      ),
    },
    {
      id: 'water',
      label: 'Water',
      view: 'water' as ViewType,
      isActive: ['water', 'water-history', 'water-faq'].includes(currentView),
      icon: (active: boolean) => (
        <svg className="h-6 w-6" fill={active ? 'currentColor' : 'none'} stroke={active ? 'none' : 'currentColor'} strokeWidth={1.5} viewBox="0 0 24 24">
          <path d={active
            ? "M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z"
            : "M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z"
          } />
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
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl min-w-[60px] transition-colors ${
              item.isActive ? activeColor : inactiveColor
            }`}
          >
            {item.icon(item.isActive)}
            <span className={`text-[10px] mt-1 font-medium ${item.isActive ? '' : 'text-zinc-500 dark:text-zinc-400'}`}>
              {item.label}
            </span>
            {item.isActive && (
              <div className={`absolute bottom-1 w-1 h-1 rounded-full ${gender === 'female' ? 'bg-pink-500' : 'bg-teal-500'}`} />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
