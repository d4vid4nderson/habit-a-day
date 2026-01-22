'use client';

import { BathroomEntry } from '@/lib/types';
import { formatTime, formatDate, groupEntriesByDate } from '@/lib/storage';

interface HistoryProps {
  entries: BathroomEntry[];
  onDelete: (id: string) => void;
}

const typeConfig = {
  poop: { emoji: '💩', label: 'Poop' },
  pee: { emoji: '🍆', label: 'Pee' },
};

export function History({ entries, onDelete }: HistoryProps) {
  const grouped = groupEntriesByDate(entries);

  if (entries.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-zinc-400">No entries yet</p>
        <p className="mt-1 text-sm text-zinc-500">Tap a button above to log</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([dateKey, dayEntries]) => (
        <div key={dateKey}>
          <h3 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {formatDate(dayEntries[0].timestamp)}
          </h3>
          <div className="space-y-2">
            {dayEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{typeConfig[entry.type].emoji}</span>
                  <div>
                    <p className="font-medium text-zinc-800 dark:text-zinc-200">
                      {typeConfig[entry.type].label}
                    </p>
                    <p className="text-sm text-zinc-500">{formatTime(entry.timestamp)}</p>
                  </div>
                </div>
                <button
                  onClick={() => onDelete(entry.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 active:bg-zinc-200 dark:active:bg-zinc-700"
                  aria-label="Delete entry"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
