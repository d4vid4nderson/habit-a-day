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
  const [selectedType, setSelectedType] = useState<BathroomType | null>(null);
  const [notes, setNotes] = useState('');

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

  const handleSelect = (type: BathroomType) => {
    setSelectedType(type);
    setNotes('');
  };

  const handleSave = () => {
    if (!selectedType) return;
    const entry = createEntry(selectedType, notes);
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        entries: [entry, ...prev.entries],
      };
    });
    setSelectedType(null);
    setNotes('');
  };

  const handleCancel = () => {
    setSelectedType(null);
    setNotes('');
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

  const typeConfig = {
    poop: { emoji: '💩', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    pee: { emoji: '🍆', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-safe dark:bg-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            🚽 Potty Time
          </h1>
          {!selectedType && (
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
          )}
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        {selectedType ? (
          /* Entry Mode - type selected, add notes */
          <div className="space-y-6">
            <div className={`flex aspect-square w-full items-center justify-center rounded-3xl ${typeConfig[selectedType].bg}`}>
              <span className="text-9xl">{typeConfig[selectedType].emoji}</span>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes (optional)..."
              className="min-h-[120px] w-full resize-none rounded-xl border border-zinc-200 bg-white p-4 text-base leading-relaxed focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 rounded-xl bg-zinc-200 py-4 text-base font-medium text-zinc-700 active:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:active:bg-zinc-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 rounded-xl bg-emerald-600 py-4 text-base font-medium text-white active:bg-emerald-700"
              >
                Save
              </button>
            </div>
          </div>
        ) : showHistory ? (
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
              <LogButton type="poop" onLog={handleSelect} />
              <LogButton type="pee" onLog={handleSelect} />
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
