'use client';

import { useState, useEffect } from 'react';
import { HabitList } from '@/components/HabitList';
import { MoodTracker } from '@/components/MoodTracker';
import { DailyNotes } from '@/components/DailyNotes';
import { Calendar } from '@/components/Calendar';
import { TrackerData, Habit, DayEntry } from '@/lib/types';
import { loadData, saveData, getToday, getEmptyEntry, formatDate } from '@/lib/storage';

export default function Home() {
  const [data, setData] = useState<TrackerData | null>(null);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [showCalendar, setShowCalendar] = useState(false);

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

  const currentEntry = data.entries[selectedDate] || getEmptyEntry(selectedDate);

  const updateEntry = (updates: Partial<DayEntry>) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        entries: {
          ...prev.entries,
          [selectedDate]: {
            ...currentEntry,
            ...updates,
          },
        },
      };
    });
  };

  const toggleHabit = (habitId: string) => {
    updateEntry({
      habits: {
        ...currentEntry.habits,
        [habitId]: !currentEntry.habits[habitId],
      },
    });
  };

  const addHabit = (name: string) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name,
    };
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        habits: [...prev.habits, newHabit],
      };
    });
  };

  const removeHabit = (habitId: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        habits: prev.habits.filter((h) => h.id !== habitId),
      };
    });
  };

  const setMood = (mood: number) => {
    updateEntry({ mood });
  };

  const setNotes = (notes: string) => {
    updateEntry({ notes });
  };

  const goToToday = () => {
    setSelectedDate(getToday());
    setShowCalendar(false);
  };

  const isToday = selectedDate === getToday();

  return (
    <div className="min-h-screen bg-zinc-50 pb-safe dark:bg-zinc-900">
      {/* Mobile Header - Fixed */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Habit-a-Day
          </h1>
          <div className="flex items-center gap-2">
            {!isToday && (
              <button
                onClick={goToToday}
                className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 active:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
              >
                Today
              </button>
            )}
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 active:bg-zinc-200 dark:bg-zinc-800 dark:active:bg-zinc-700"
              aria-label="Toggle calendar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Date Display */}
        <div className="border-t border-zinc-100 px-4 py-2 dark:border-zinc-800">
          <p className="text-center text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {formatDate(selectedDate)}
            {isToday && <span className="ml-2 text-emerald-600 dark:text-emerald-400">(Today)</span>}
          </p>
        </div>
      </header>

      {/* Calendar Drawer */}
      {showCalendar && (
        <div className="border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-800/50">
          <Calendar
            entries={data.entries}
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              setSelectedDate(date);
              setShowCalendar(false);
            }}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="mx-auto max-w-lg px-4 py-4">
        <div className="space-y-4">
          {/* Habits Section */}
          <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
            <HabitList
              habits={data.habits}
              completedHabits={currentEntry.habits}
              onToggleHabit={toggleHabit}
              onAddHabit={addHabit}
              onRemoveHabit={removeHabit}
            />
          </section>

          {/* Mood Section */}
          <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
            <MoodTracker mood={currentEntry.mood} onMoodChange={setMood} />
          </section>

          {/* Notes Section */}
          <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
            <DailyNotes notes={currentEntry.notes} onNotesChange={setNotes} />
          </section>
        </div>

        <footer className="mt-6 pb-4 text-center text-xs text-zinc-400">
          Data stored locally on your device
        </footer>
      </main>
    </div>
  );
}
