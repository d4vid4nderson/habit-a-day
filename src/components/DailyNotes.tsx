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
        placeholder="How was your day? Any thoughts..."
        className="min-h-[120px] w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-base leading-relaxed focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-200 dark:placeholder-zinc-500 dark:focus:bg-zinc-700"
      />
    </div>
  );
}
