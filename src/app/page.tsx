'use client';

import { useState, useEffect } from 'react';
import { LogButton } from '@/components/LogButton';
import { History } from '@/components/History';
import { Stats } from '@/components/Stats';
import { Calendar } from '@/components/Calendar';
import { TrackerData, BathroomType } from '@/lib/types';
import { loadData, saveData, createEntry } from '@/lib/storage';

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function Home() {
  const [data, setData] = useState<TrackerData | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedType, setSelectedType] = useState<BathroomType | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(getToday());

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

  const hasEntriesOnDate = (dateStr: string): boolean => {
    const dateStart = new Date(dateStr + 'T00:00:00').getTime();
    const dateEnd = dateStart + 24 * 60 * 60 * 1000;
    return data.entries.some((e) => e.timestamp >= dateStart && e.timestamp < dateEnd);
  };

  const getEntriesForDate = (dateStr: string) => {
    const dateStart = new Date(dateStr + 'T00:00:00').getTime();
    const dateEnd = dateStart + 24 * 60 * 60 * 1000;
    return data.entries
      .filter((e) => e.timestamp >= dateStart && e.timestamp < dateEnd)
      .sort((a, b) => b.timestamp - a.timestamp);
  };

  const typeConfig = {
    poop: { emoji: '💩', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    pee: { emoji: '🍆', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  };

  // History View
  if (showHistory) {
    const dayEntries = getEntriesForDate(selectedDate);

    return (
      <div className="min-h-screen bg-zinc-50 pb-safe dark:bg-zinc-900">
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="flex items-center px-4 py-3">
            <button
              onClick={() => {
                setShowHistory(false);
                setSelectedDate(getToday());
              }}
              className="flex items-center gap-1 text-purple-600 dark:text-purple-400"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-lg px-4 py-4">
          <div className="space-y-4">
            {/* Calendar */}
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
              <Calendar
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                hasEntries={hasEntriesOnDate}
              />
            </div>

            {/* Entries for selected day */}
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
              <h2 className="mb-3 font-semibold text-zinc-800 dark:text-zinc-200">
                {formatDateHeader(selectedDate)}
              </h2>
              {dayEntries.length > 0 ? (
                <History entries={dayEntries} onDelete={handleDelete} />
              ) : (
                <p className="py-4 text-center text-zinc-400">No entries</p>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Entry Mode - adding notes
  if (selectedType) {
    return (
      <div className="min-h-screen bg-zinc-50 pb-safe dark:bg-zinc-900">
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              🚽 Potty Tracker
            </h1>
          </div>
        </header>

        <main className="mx-auto max-w-lg px-4 py-6">
          <div className="space-y-6">
            <div className="flex justify-center py-8">
              <span className="text-[12rem]">{typeConfig[selectedType].emoji}</span>
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
        </main>
      </div>
    );
  }

  // Main Log View
  return (
    <div className="min-h-screen bg-zinc-50 pb-safe dark:bg-zinc-900">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            🚽 Potty Tracker
          </h1>
          <button
            onClick={() => setShowHistory(true)}
            className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 active:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
          >
            History
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        <div className="space-y-6">
          <Stats entries={data.entries} />

          <div className="flex flex-col gap-4 sm:flex-row">
            <LogButton type="poop" onLog={handleSelect} />
            <LogButton type="pee" onLog={handleSelect} />
          </div>

          {data.entries.length > 0 && (
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Recent
                </h2>
                <button
                  onClick={() => setShowHistory(true)}
                  className="text-sm text-purple-600 dark:text-purple-400"
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
      </main>
    </div>
  );
}
