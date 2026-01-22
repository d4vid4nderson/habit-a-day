'use client';

import { DayEntry } from '@/lib/types';

interface CalendarProps {
  entries: Record<string, DayEntry>;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function Calendar({ entries, selectedDate, onSelectDate }: CalendarProps) {
  const today = new Date();
  const currentMonth = new Date(selectedDate + 'T00:00:00');

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();

  const days: (number | null)[] = [];
  for (let i = 0; i < startPadding; i++) {
    days.push(null);
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(i);
  }

  const monthName = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const navigateMonth = (delta: number) => {
    const newDate = new Date(year, month + delta, 1);
    const newDateStr = newDate.toISOString().split('T')[0];
    onSelectDate(newDateStr);
  };

  const getDateString = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const hasEntry = (day: number) => {
    const dateStr = getDateString(day);
    const entry = entries[dateStr];
    if (!entry) return false;
    return (
      Object.values(entry.habits).some(Boolean) ||
      entry.mood !== null ||
      entry.notes.trim() !== ''
    );
  };

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return getDateString(day) === selectedDate;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateMonth(-1)}
          className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          {monthName}
        </h2>
        <button
          onClick={() => navigateMonth(1)}
          className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-500">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => (
          <div key={i} className="aspect-square">
            {day && (
              <button
                onClick={() => onSelectDate(getDateString(day))}
                className={`flex h-full w-full flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                  isSelected(day)
                    ? 'bg-emerald-600 text-white'
                    : isToday(day)
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <span>{day}</span>
                {hasEntry(day) && !isSelected(day) && (
                  <span className="mt-0.5 h-1 w-1 rounded-full bg-emerald-500" />
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
