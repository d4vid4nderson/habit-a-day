import { createClient } from '@/lib/supabase/client';
import { BathroomEntry, BathroomType, UrineColor, StreamStrength } from '@/lib/types';

function getSupabase() {
  return createClient();
}

export interface DbBathroomEntry {
  id: string;
  user_id: string;
  type: BathroomType;
  timestamp: number;
  notes: string | null;
  urine_color: number | null;
  stream_strength: string | null;
  created_at: string;
  updated_at: string;
}

function toAppEntry(dbEntry: DbBathroomEntry): BathroomEntry {
  return {
    id: dbEntry.id,
    type: dbEntry.type,
    timestamp: dbEntry.timestamp,
    notes: dbEntry.notes || undefined,
    urine_color: dbEntry.urine_color as UrineColor | undefined,
    stream_strength: dbEntry.stream_strength as StreamStrength | undefined,
  };
}

export async function fetchEntries(userId: string): Promise<BathroomEntry[]> {
  const { data, error } = await getSupabase()
    .from('bathroom_entries')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching entries:', error);
    throw error;
  }

  return (data || []).map(toAppEntry);
}

export async function createEntry(
  userId: string,
  type: BathroomType,
  notes?: string,
  timestamp?: number,
  urineColor?: UrineColor,
  streamStrength?: StreamStrength
): Promise<BathroomEntry> {
  const now = timestamp || Date.now();

  const { data, error } = await getSupabase()
    .from('bathroom_entries')
    .insert({
      user_id: userId,
      type,
      timestamp: now,
      notes: notes?.trim() || null,
      urine_color: type === 'pee' ? urineColor || null : null,
      stream_strength: type === 'pee' ? streamStrength || null : null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating entry:', error);
    throw error;
  }

  return toAppEntry(data);
}

export async function deleteEntry(entryId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('bathroom_entries')
    .delete()
    .eq('id', entryId);

  if (error) {
    console.error('Error deleting entry:', error);
    throw error;
  }
}

export async function updateEntry(
  entryId: string,
  updates: Partial<Pick<BathroomEntry, 'notes' | 'timestamp' | 'urine_color'>>
): Promise<BathroomEntry> {
  const { data, error } = await getSupabase()
    .from('bathroom_entries')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .select()
    .single();

  if (error) {
    console.error('Error updating entry:', error);
    throw error;
  }

  return toAppEntry(data);
}

export function subscribeToEntries(
  userId: string,
  callback: (entries: BathroomEntry[]) => void
) {
  const supabase = getSupabase();
  const channel = supabase
    .channel('bathroom_entries_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bathroom_entries',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        // Refetch all entries on any change
        const entries = await fetchEntries(userId);
        callback(entries);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
