export interface Habit {
  id: string;
  name: string;
}

export interface DayEntry {
  date: string; // YYYY-MM-DD format
  habits: Record<string, boolean>; // habitId -> completed
  mood: number | null; // 1-5 scale
  notes: string;
}

export interface TrackerData {
  habits: Habit[];
  entries: Record<string, DayEntry>; // date -> entry
}
