import { createClient } from '@/lib/supabase/client';
import { BathroomEntry, TrackerData, Gender } from '@/lib/types';

const STORAGE_KEY = 'bathroom-tracker-data';
const GENDER_KEY = 'potty-logger-gender';
const MIGRATION_KEY = 'potty-logger-migrated';

export interface LocalData {
  entries: BathroomEntry[];
  gender: Gender | null;
}

export function hasLocalData(): boolean {
  if (typeof window === 'undefined') return false;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return false;

  try {
    const data: TrackerData = JSON.parse(stored);
    return data.entries && data.entries.length > 0;
  } catch {
    return false;
  }
}

export function getLocalData(): LocalData {
  if (typeof window === 'undefined') {
    return { entries: [], gender: null };
  }

  let entries: BathroomEntry[] = [];
  let gender: Gender | null = null;

  const storedData = localStorage.getItem(STORAGE_KEY);
  if (storedData) {
    try {
      const data: TrackerData = JSON.parse(storedData);
      entries = data.entries || [];
    } catch {
      // Ignore parse errors
    }
  }

  const storedGender = localStorage.getItem(GENDER_KEY);
  if (storedGender === 'male' || storedGender === 'female') {
    gender = storedGender;
  }

  return { entries, gender };
}

export function hasMigrated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(MIGRATION_KEY) === 'true';
}

export function markAsMigrated(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MIGRATION_KEY, 'true');
}

export function clearLocalData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(GENDER_KEY);
}

export async function migrateToSupabase(
  userId: string,
  localData: LocalData
): Promise<{ entriesImported: number; genderSet: boolean }> {
  const supabase = createClient();
  let entriesImported = 0;
  let genderSet = false;

  // Import entries
  if (localData.entries.length > 0) {
    const entriesToInsert = localData.entries.map((entry) => ({
      user_id: userId,
      type: entry.type,
      timestamp: entry.timestamp,
      notes: entry.notes || null,
    }));

    const { error } = await supabase
      .from('bathroom_entries')
      .insert(entriesToInsert);

    if (error) {
      console.error('Error importing entries:', error);
      throw error;
    }

    entriesImported = localData.entries.length;
  }

  // Update gender in profile if set locally
  if (localData.gender) {
    const { error } = await supabase
      .from('profiles')
      .update({ gender: localData.gender })
      .eq('id', userId);

    if (error) {
      console.error('Error updating gender:', error);
      // Don't throw - entries were imported successfully
    } else {
      genderSet = true;
    }
  }

  return { entriesImported, genderSet };
}
