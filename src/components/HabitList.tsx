'use client';

import { useState } from 'react';
import { Habit } from '@/lib/types';

interface HabitListProps {
  habits: Habit[];
  completedHabits: Record<string, boolean>;
  onToggleHabit: (habitId: string) => void;
  onAddHabit: (name: string) => void;
  onRemoveHabit: (habitId: string) => void;
}

export function HabitList({
  habits,
  completedHabits,
  onToggleHabit,
  onAddHabit,
  onRemoveHabit,
}: HabitListProps) {
  const [newHabit, setNewHabit] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHabit.trim()) {
      onAddHabit(newHabit.trim());
      setNewHabit('');
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
        Daily Habits
      </h2>

      <div className="space-y-2">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="flex items-center justify-between rounded-lg bg-zinc-100 px-4 py-3 dark:bg-zinc-800"
          >
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={completedHabits[habit.id] || false}
                onChange={() => onToggleHabit(habit.id)}
                className="h-5 w-5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span
                className={
                  completedHabits[habit.id]
                    ? 'text-zinc-400 line-through'
                    : 'text-zinc-700 dark:text-zinc-300'
                }
              >
                {habit.name}
              </span>
            </label>
            <button
              onClick={() => onRemoveHabit(habit.id)}
              className="text-zinc-400 hover:text-red-500"
              title="Remove habit"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {isAdding ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            placeholder="New habit name..."
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(false)}
            className="rounded-lg px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full rounded-lg border-2 border-dashed border-zinc-300 py-2 text-sm text-zinc-500 hover:border-emerald-500 hover:text-emerald-600 dark:border-zinc-600"
        >
          + Add Habit
        </button>
      )}
    </div>
  );
}
