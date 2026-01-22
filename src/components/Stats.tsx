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
      <div className="flex-1 rounded-xl bg-teal-50 p-3 text-center dark:bg-teal-900/20">
        <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">{todayPoop}</p>
        <p className="text-xs text-teal-600 dark:text-teal-500">💩 today</p>
      </div>
      <div className="flex-1 rounded-xl bg-purple-50 p-3 text-center dark:bg-purple-900/20">
        <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{todayPee}</p>
        <p className="text-xs text-purple-600 dark:text-purple-500">🍆 today</p>
      </div>
    </div>
  );
}
