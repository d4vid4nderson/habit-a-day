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

  const isToday = selectedDate === getToday();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Habit-a-Day
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Track your daily habits, mood, and thoughts
          </p>
        </header>

        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-800">
            <Calendar
              entries={data.entries}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {formatDate(selectedDate)}
              </h2>
              {isToday && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Today
                </span>
              )}
            </div>

            <div className="space-y-6">
              <HabitList
                habits={data.habits}
                completedHabits={currentEntry.habits}
                onToggleHabit={toggleHabit}
                onAddHabit={addHabit}
                onRemoveHabit={removeHabit}
              />

              <hr className="border-zinc-200 dark:border-zinc-700" />

              <MoodTracker mood={currentEntry.mood} onMoodChange={setMood} />

              <hr className="border-zinc-200 dark:border-zinc-700" />

              <DailyNotes notes={currentEntry.notes} onNotesChange={setNotes} />
            </div>
          </div>
        </div>

        <footer className="mt-8 text-center text-sm text-zinc-500">
          Your data is stored locally in your browser
        </footer>
      </div>
    </div>
  );
}
