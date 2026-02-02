import { createClient } from '@/lib/supabase/client';
import { PhysicalTherapyEntry } from '@/lib/types';

function getSupabase() {
  return createClient();
}

export interface DbPTEntry {
  id: string;
  user_id: string;
  exercise_name: string;
  duration_minutes: number | null;
  sets: number | null;
  reps: number | null;
  pain_level: number | null;
  timestamp: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function toAppEntry(dbEntry: DbPTEntry): PhysicalTherapyEntry {
  return {
    id: dbEntry.id,
    exercise_name: dbEntry.exercise_name,
    duration_minutes: dbEntry.duration_minutes || undefined,
    sets: dbEntry.sets || undefined,
    reps: dbEntry.reps || undefined,
    pain_level: dbEntry.pain_level || undefined,
    timestamp: dbEntry.timestamp,
    notes: dbEntry.notes || undefined,
  };
}

export async function fetchPTEntries(userId: string): Promise<PhysicalTherapyEntry[]> {
  const { data, error } = await getSupabase()
    .from('pt_entries')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching PT entries:', error);
    throw error;
  }

  return (data || []).map(toAppEntry);
}

export interface CreatePTEntryOptions {
  duration_minutes?: number;
  sets?: number;
  reps?: number;
  pain_level?: number;
}

export async function createPTEntry(
  userId: string,
  exerciseName: string,
  notes?: string,
  timestamp?: number,
  options?: CreatePTEntryOptions
): Promise<PhysicalTherapyEntry> {
  const now = timestamp || Date.now();

  const { data, error } = await getSupabase()
    .from('pt_entries')
    .insert({
      user_id: userId,
      exercise_name: exerciseName,
      duration_minutes: options?.duration_minutes || null,
      sets: options?.sets || null,
      reps: options?.reps || null,
      pain_level: options?.pain_level || null,
      timestamp: now,
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating PT entry:', error);
    throw error;
  }

  return toAppEntry(data);
}

export async function deletePTEntry(entryId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('pt_entries')
    .delete()
    .eq('id', entryId);

  if (error) {
    console.error('Error deleting PT entry:', error);
    throw error;
  }
}

export async function updatePTEntry(
  entryId: string,
  updates: Partial<Omit<PhysicalTherapyEntry, 'id' | 'user_id'>>
): Promise<PhysicalTherapyEntry> {
  const { data, error } = await getSupabase()
    .from('pt_entries')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .select()
    .single();

  if (error) {
    console.error('Error updating PT entry:', error);
    throw error;
  }

  return toAppEntry(data);
}

export function subscribeToPTEntries(
  userId: string,
  callback: (entries: PhysicalTherapyEntry[]) => void
) {
  const supabase = getSupabase();
  const channel = supabase
    .channel('pt_entries_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pt_entries',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        // Refetch all entries on any change
        const entries = await fetchPTEntries(userId);
        callback(entries);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
