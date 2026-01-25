'use client';

import Link from 'next/link';
import { useProfile } from '@/lib/hooks/useProfile';
import { APP_VERSION } from '@/lib/version';

export function Footer() {
  const { gender } = useProfile();

  const gradientClass = gender === 'female'
    ? 'from-pink-400 via-purple-500 to-purple-400'
    : 'from-teal-400 via-blue-500 to-blue-400';

  const linkClass = gender === 'female'
    ? 'text-pink-500 hover:text-pink-600 dark:text-pink-400 dark:hover:text-pink-300'
    : 'text-teal-500 hover:text-teal-600 dark:text-teal-400 dark:hover:text-teal-300';

  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-700 dark:bg-zinc-900/80">
      <div className="mx-auto max-w-lg px-4 py-4 text-sm">
        <h3 className={`text-lg font-bold bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent`}>Habit-a-Day</h3>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Start your journey to healing one day at a time.
        </p>
        <p className="mt-2 text-zinc-400 dark:text-zinc-500">
          © 2026 Built for <span title="Shits and Giggles" className="cursor-default">💩 &amp; 🤭</span>.
        </p>
        <p className="text-zinc-400 dark:text-zinc-500">
          All rights reserved. Version {APP_VERSION}
        </p>
        <p className="mt-2 text-zinc-400 dark:text-zinc-500">
          <Link href="/privacy" className={linkClass}>Privacy Policy</Link>
          <span className="mx-2">·</span>
          <Link href="/terms" className={linkClass}>Terms & Conditions</Link>
        </p>
      </div>
    </footer>
  );
}

export const FOOTER_HEIGHT = 'pb-32';
