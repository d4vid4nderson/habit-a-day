import { TrackerData, DayEntry } from './types';

const STORAGE_KEY = 'habit-a-day-data';

const defaultData: TrackerData = {
  habits: [
    { id: '1', name: 'Exercise' },
    { id: '2', name: 'Read' },
    { id: '3', name: 'Meditate' },
  ],
  entries: {},
};

export function loadData(): TrackerData {
  if (typeof window === 'undefined') return defaultData;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return defaultData;

  try {
    return JSON.parse(stored);
  } catch {
    return defaultData;
  }
}

export function saveData(data: TrackerData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function getEmptyEntry(date: string): DayEntry {
  return {
    date,
    habits: {},
    mood: null,
    notes: '',
  };
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}
