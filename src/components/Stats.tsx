'use client';

import { BathroomEntry } from '@/lib/types';

interface StatsProps {
  entries: BathroomEntry[];
}

export function Stats({ entries }: StatsProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayEntries = entries.filter((e) => e.timestamp >= today.getTime());
  const todayPoop = todayEntries.filter((e) => e.type === 'poop').length;
  const todayPee = todayEntries.filter((e) => e.type === 'pee').length;

  return (
    <div className="flex gap-4">
      <div className="flex-1 rounded-xl bg-cyan-50 p-3 text-center dark:bg-cyan-900/20">
        <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">{todayPoop}</p>
        <p className="text-xs text-cyan-600 dark:text-cyan-500">💩 today</p>
      </div>
      <div className="flex-1 rounded-xl bg-violet-50 p-3 text-center dark:bg-violet-900/20">
        <p className="text-2xl font-bold text-violet-700 dark:text-violet-400">{todayPee}</p>
        <p className="text-xs text-violet-600 dark:text-violet-500">🍆 today</p>
      </div>
    </div>
  );
}
