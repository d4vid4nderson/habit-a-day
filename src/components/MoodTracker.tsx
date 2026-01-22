'use client';

interface MoodTrackerProps {
  mood: number | null;
  onMoodChange: (mood: number) => void;
}

const moods = [
  { value: 1, emoji: '😔', label: 'Bad' },
  { value: 2, emoji: '😕', label: 'Meh' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];

export function MoodTracker({ mood, onMoodChange }: MoodTrackerProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
        How are you feeling?
      </h2>

      <div className="flex justify-between gap-2">
        {moods.map((m) => (
          <button
            key={m.value}
            onClick={() => onMoodChange(m.value)}
            className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-3 transition-all ${
              mood === m.value
                ? 'bg-emerald-100 ring-2 ring-emerald-500 dark:bg-emerald-900/30'
                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
            }`}
          >
            <span className="text-2xl">{m.emoji}</span>
            <span className="text-xs text-zinc-600 dark:text-zinc-400">{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
