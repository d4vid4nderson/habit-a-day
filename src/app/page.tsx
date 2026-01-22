'use client';

import { useState, useEffect } from 'react';
import { LogButton } from '@/components/LogButton';
import { History } from '@/components/History';
import { Stats } from '@/components/Stats';
import { TrackerData, BathroomType } from '@/lib/types';
import { loadData, saveData, createEntry } from '@/lib/storage';

export default function Home() {
  const [data, setData] = useState<TrackerData | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setData(loadData());
  }, []);

  useEffect(() => {
    if (data) {
      saveData(data);
    }
  }, [data]);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  const handleLog = (type: BathroomType) => {
    const entry = createEntry(type);
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        entries: [entry, ...prev.entries],
      };
    });
  };

  const handleDelete = (id: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        entries: prev.entries.filter((e) => e.id !== id),
      };
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-safe dark:bg-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            🚽 Potty Time
          </h1>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              showHistory
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-700 active:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
            }`}
          >
            {showHistory ? 'Log' : 'History'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        {showHistory ? (
          <div className="space-y-4">
            <Stats entries={data.entries} />
            <History entries={data.entries} onDelete={handleDelete} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Today's Stats */}
            <Stats entries={data.entries} />

            {/* Big Buttons - stacked on mobile, side by side on larger screens */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <LogButton type="poop" onLog={handleLog} />
              <LogButton type="pee" onLog={handleLog} />
            </div>

            {/* Recent entries preview */}
            {data.entries.length > 0 && (
              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-semibold text-zinc-800 dark:text-zinc-200">
                    Recent
                  </h2>
                  <button
                    onClick={() => setShowHistory(true)}
                    className="text-sm text-emerald-600 dark:text-emerald-400"
                  >
                    See all
                  </button>
                </div>
                <History
                  entries={data.entries.slice(0, 5)}
                  onDelete={handleDelete}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
