'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { BathroomEntry, BathroomType, UrineColor } from '@/lib/types';
import {
  fetchEntries,
  createEntry as createEntryService,
  deleteEntry as deleteEntryService,
  subscribeToEntries,
} from '@/lib/services/entriesService';

export function useEntries() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<BathroomEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch entries on mount and when user changes
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const loadEntries = async () => {
      try {
        setLoading(true);
        const data = await fetchEntries(user.id);
        setEntries(data);
        setError(null);

        // Subscribe to real-time updates
        unsubscribe = subscribeToEntries(user.id, (updatedEntries) => {
          setEntries(updatedEntries);
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch entries'));
      } finally {
        setLoading(false);
      }
    };

    loadEntries();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const createEntry = useCallback(
    async (type: BathroomType, notes?: string, timestamp?: number, urineColor?: UrineColor) => {
      if (!user) return;

      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimisticEntry: BathroomEntry = {
        id: tempId,
        type,
        timestamp: timestamp || Date.now(),
        notes: notes?.trim() || undefined,
        urine_color: type === 'pee' ? urineColor : undefined,
      };

      setEntries((prev) => [optimisticEntry, ...prev]);

      try {
        const newEntry = await createEntryService(user.id, type, notes, timestamp, urineColor);
        // Replace optimistic entry with real one
        setEntries((prev) =>
          prev.map((e) => (e.id === tempId ? newEntry : e))
        );
        return newEntry;
      } catch (err) {
        // Rollback on error
        setEntries((prev) => prev.filter((e) => e.id !== tempId));
        throw err;
      }
    },
    [user]
  );

  const deleteEntry = useCallback(
    async (entryId: string) => {
      if (!user) return;

      // Optimistic update
      const previousEntries = entries;
      setEntries((prev) => prev.filter((e) => e.id !== entryId));

      try {
        await deleteEntryService(entryId);
      } catch (err) {
        // Rollback on error
        setEntries(previousEntries);
        throw err;
      }
    },
    [user, entries]
  );

  return {
    entries,
    loading,
    error,
    createEntry,
    deleteEntry,
  };
}
