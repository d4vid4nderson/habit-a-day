'use client';

import { BathroomEntry } from '@/lib/types';
import { PoopIcon, PeeIcon } from './icons/BathroomIcons';
import { useProfile } from '@/lib/hooks/useProfile';

interface StatsProps {
  entries: BathroomEntry[];
}

export function Stats({ entries }: StatsProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { gender } = useProfile();

  const todayEntries = entries.filter((e) => e.timestamp >= today.getTime());
  const todayPoop = todayEntries.filter((e) => e.type === 'poop').length;
  const todayPee = todayEntries.filter((e) => e.type === 'pee').length;

  const poopColors = gender === 'female'
    ? { bg: 'bg-pink-50 dark:bg-pink-900/20', number: 'text-pink-700 dark:text-pink-400', text: 'text-pink-600 dark:text-pink-500' }
    : { bg: 'bg-teal-50 dark:bg-teal-900/20', number: 'text-teal-700 dark:text-teal-400', text: 'text-teal-600 dark:text-teal-500' };

  const peeColors = gender === 'female'
    ? { bg: 'bg-purple-50 dark:bg-purple-900/20', number: 'text-purple-700 dark:text-purple-400', text: 'text-purple-600 dark:text-purple-500' }
    : { bg: 'bg-blue-50 dark:bg-blue-900/20', number: 'text-blue-700 dark:text-blue-400', text: 'text-blue-600 dark:text-blue-500' };

  return (
    <div className="flex gap-4">
      <div className={`flex-1 rounded-xl p-3 text-center ${poopColors.bg}`}>
        <p className={`text-2xl font-bold ${poopColors.number}`}>{todayPoop}</p>
        <p className={`flex items-center justify-center gap-1 text-xs ${poopColors.text}`}>
          <PoopIcon className="w-4 h-4" /> today
        </p>
      </div>
      <div className={`flex-1 rounded-xl p-3 text-center ${peeColors.bg}`}>
        <p className={`text-2xl font-bold ${peeColors.number}`}>{todayPee}</p>
        <p className={`flex items-center justify-center gap-1 text-xs ${peeColors.text}`}>
          <PeeIcon className="w-4 h-4" /> today
        </p>
      </div>
    </div>
  );
}
