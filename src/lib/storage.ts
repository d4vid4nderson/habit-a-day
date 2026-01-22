import { TrackerData, BathroomEntry, BathroomType } from './types';

const STORAGE_KEY = 'bathroom-tracker-data';

const defaultData: TrackerData = {
  entries: [],
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

export function createEntry(type: BathroomType, notes?: string): BathroomEntry {
  return {
    id: Date.now().toString(),
    type,
    timestamp: Date.now(),
    notes: notes?.trim() || undefined,
  };
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function getDateKey(timestamp: number): string {
  return new Date(timestamp).toDateString();
}

export function groupEntriesByDate(entries: BathroomEntry[]): Map<string, BathroomEntry[]> {
  const grouped = new Map<string, BathroomEntry[]>();

  // Sort by most recent first
  const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);

  for (const entry of sorted) {
    const key = getDateKey(entry.timestamp);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(entry);
  }

  return grouped;
}
