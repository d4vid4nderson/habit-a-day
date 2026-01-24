'use client';

import { BathroomEntry } from '@/lib/types';
import { PoopIcon, PeeIcon } from './icons/BathroomIcons';
import { useProfile } from '@/lib/hooks/useProfile';

interface HistoryProps {
  entries: BathroomEntry[];
  onDelete: (id: string) => void;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getDateKey(timestamp: number): string {
  return new Date(timestamp).toDateString();
}

function groupEntriesByDate(entries: BathroomEntry[]): Map<string, BathroomEntry[]> {
  const grouped = new Map<string, BathroomEntry[]>();

  // Sort by most recent first
  const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);

  for (const entry of sorted) {
    const key = getDateKey(entry.timestamp);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(entry);
  }

  return grouped;
}

export function History({ entries, onDelete }: HistoryProps) {
  const grouped = groupEntriesByDate(entries);
  const { gender } = useProfile();

  const poopColor = gender === 'female' ? 'text-pink-600 dark:text-pink-400' : 'text-teal-600 dark:text-teal-400';
  const peeColor = gender === 'female' ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400';

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
                className="rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {entry.type === 'poop' ? (
                      <PoopIcon className={`w-7 h-7 ${poopColor}`} />
                    ) : (
                      <PeeIcon className={`w-7 h-7 ${peeColor}`} />
                    )}
                    <div className="flex flex-col">
                      <span className={`text-base font-semibold ${entry.type === 'poop' ? poopColor : peeColor}`}>
                        {entry.type === 'poop' ? "Poop'd" : "Pee'd"}
                      </span>
                      <p className="text-xs text-zinc-500">{formatTime(entry.timestamp)}</p>
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
                {entry.notes && (
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {entry.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
