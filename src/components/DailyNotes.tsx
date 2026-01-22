'use client';

interface DailyNotesProps {
  notes: string;
  onNotesChange: (notes: string) => void;
}

export function DailyNotes({ notes, onNotesChange }: DailyNotesProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
        Notes
      </h2>

      <textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="How was your day? Any thoughts or reflections..."
        className="h-32 w-full resize-none rounded-lg border border-zinc-300 p-3 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500"
      />
    </div>
  );
}
