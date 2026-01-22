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
  const [editMode, setEditMode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHabit.trim()) {
      onAddHabit(newHabit.trim());
      setNewHabit('');
      setIsAdding(false);
    }
  };

  const completedCount = habits.filter((h) => completedHabits[h.id]).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          Habits
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">
            {completedCount}/{habits.length}
          </span>
          {habits.length > 0 && (
            <button
              onClick={() => setEditMode(!editMode)}
              className="rounded-lg px-2 py-1 text-sm text-zinc-500 active:bg-zinc-100 dark:active:bg-zinc-700"
            >
              {editMode ? 'Done' : 'Edit'}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="flex items-center gap-3 rounded-xl bg-zinc-50 px-4 py-4 active:bg-zinc-100 dark:bg-zinc-700/50 dark:active:bg-zinc-700"
          >
            {editMode ? (
              <>
                <span className="flex-1 text-zinc-700 dark:text-zinc-300">
                  {habit.name}
                </span>
                <button
                  onClick={() => onRemoveHabit(habit.id)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 active:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            ) : (
              <button
                onClick={() => onToggleHabit(habit.id)}
                className="flex flex-1 items-center gap-3"
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors ${
                    completedHabits[habit.id]
                      ? 'border-emerald-500 bg-emerald-500'
                      : 'border-zinc-300 dark:border-zinc-600'
                  }`}
                >
                  {completedHabits[habit.id] && (
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span
                  className={`text-base ${
                    completedHabits[habit.id]
                      ? 'text-zinc-400 line-through'
                      : 'text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {habit.name}
                </span>
              </button>
            )}
          </div>
        ))}
      </div>

      {isAdding ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="text"
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            placeholder="Enter habit name..."
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base focus:border-emerald-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-emerald-600 py-3 text-base font-medium text-white active:bg-emerald-700"
            >
              Add Habit
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewHabit('');
              }}
              className="rounded-xl px-6 py-3 text-base text-zinc-600 active:bg-zinc-100 dark:text-zinc-400 dark:active:bg-zinc-700"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 py-4 text-base text-zinc-500 active:border-emerald-500 active:text-emerald-600 dark:border-zinc-600"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Habit
        </button>
      )}
    </div>
  );
}
