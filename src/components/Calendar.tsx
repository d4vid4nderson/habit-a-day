'use client';

interface CalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  hasEntries: (date: string) => boolean;
}

export function Calendar({ selectedDate, onSelectDate, hasEntries }: CalendarProps) {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateMonth(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full active:bg-zinc-100 dark:active:bg-zinc-700"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          {monthName}
        </h2>
        <button
          onClick={() => navigateMonth(1)}
          className="flex h-10 w-10 items-center justify-center rounded-full active:bg-zinc-100 dark:active:bg-zinc-700"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-zinc-500">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => (
          <div key={i} className="aspect-square p-0.5">
            {day && (
              <button
                onClick={() => onSelectDate(getDateString(day))}
                className={`flex h-full w-full flex-col items-center justify-center rounded-full text-sm transition-colors ${
                  isSelected(day)
                    ? 'bg-purple-600 font-semibold text-white'
                    : isToday(day)
                    ? 'bg-purple-100 font-semibold text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                    : 'active:bg-zinc-100 dark:active:bg-zinc-700'
                }`}
              >
                <span>{day}</span>
                {hasEntries(getDateString(day)) && !isSelected(day) && (
                  <span className="mt-0.5 h-1 w-1 rounded-full bg-purple-500" />
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
