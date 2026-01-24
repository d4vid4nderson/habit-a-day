import { createClient } from '@/lib/supabase/client';
import { WaterEntry, WaterUnit } from '@/lib/types';

function getSupabase() {
  return createClient();
}

export interface DbWaterEntry {
  id: string;
  user_id: string;
  amount: number;
  unit: WaterUnit;
  timestamp: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function toAppEntry(dbEntry: DbWaterEntry): WaterEntry {
  return {
    id: dbEntry.id,
    amount: dbEntry.amount,
    unit: dbEntry.unit,
    timestamp: dbEntry.timestamp,
    notes: dbEntry.notes || undefined,
  };
}

export async function fetchWaterEntries(userId: string): Promise<WaterEntry[]> {
  const { data, error } = await getSupabase()
    .from('water_entries')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching water entries:', error);
    throw error;
  }

  return (data || []).map(toAppEntry);
}

export async function createWaterEntry(
  userId: string,
  amount: number,
  unit: WaterUnit,
  notes?: string,
  timestamp?: number
): Promise<WaterEntry> {
  const now = timestamp || Date.now();

  const { data, error } = await getSupabase()
    .from('water_entries')
    .insert({
      user_id: userId,
      amount,
      unit,
      timestamp: now,
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating water entry:', error);
    throw error;
  }

  return toAppEntry(data);
}

export async function deleteWaterEntry(entryId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('water_entries')
    .delete()
    .eq('id', entryId);

  if (error) {
    console.error('Error deleting water entry:', error);
    throw error;
  }
}

export async function updateWaterEntry(
  entryId: string,
  updates: Partial<Pick<WaterEntry, 'amount' | 'unit' | 'notes' | 'timestamp'>>
): Promise<WaterEntry> {
  const { data, error } = await getSupabase()
    .from('water_entries')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .select()
    .single();

  if (error) {
    console.error('Error updating water entry:', error);
    throw error;
  }

  return toAppEntry(data);
}

export function subscribeToWaterEntries(
  userId: string,
  callback: (entries: WaterEntry[]) => void
) {
  const supabase = getSupabase();
  const channel = supabase
    .channel('water_entries_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'water_entries',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        // Refetch all entries on any change
        const entries = await fetchWaterEntries(userId);
        callback(entries);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
