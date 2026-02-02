'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { PhysicalTherapyEntry } from '@/lib/types';
import {
  fetchPTEntries,
  createPTEntry as createPTEntryService,
  deletePTEntry as deletePTEntryService,
  subscribeToPTEntries,
  CreatePTEntryOptions,
} from '@/lib/services/physicalTherapyService';

export function usePhysicalTherapy() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<PhysicalTherapyEntry[]>([]);
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
        const data = await fetchPTEntries(user.id);
        setEntries(data);
        setError(null);

        // Subscribe to real-time updates
        unsubscribe = subscribeToPTEntries(user.id, (updatedEntries) => {
          setEntries(updatedEntries);
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch PT entries'));
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
    async (
      exerciseName: string,
      notes?: string,
      timestamp?: number,
      options?: CreatePTEntryOptions
    ) => {
      if (!user) return;

      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimisticEntry: PhysicalTherapyEntry = {
        id: tempId,
        exercise_name: exerciseName,
        duration_minutes: options?.duration_minutes,
        sets: options?.sets,
        reps: options?.reps,
        pain_level: options?.pain_level,
        timestamp: timestamp || Date.now(),
        notes: notes?.trim() || undefined,
      };

      setEntries((prev) => [optimisticEntry, ...prev]);

      try {
        const newEntry = await createPTEntryService(user.id, exerciseName, notes, timestamp, options);
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
        await deletePTEntryService(entryId);
      } catch (err) {
        // Rollback on error
        setEntries(previousEntries);
        throw err;
      }
    },
    [user, entries]
  );

  // Calculate total PT sessions for today
  const getTodayTotal = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    return entries.filter((e) => e.timestamp >= todayStart && e.timestamp < todayEnd).length;
  }, [entries]);

  // Calculate total PT minutes for today
  const getTodayMinutes = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    return entries
      .filter((e) => e.timestamp >= todayStart && e.timestamp < todayEnd)
      .reduce((total, entry) => total + (entry.duration_minutes || 0), 0);
  }, [entries]);

  return {
    entries,
    loading,
    error,
    createEntry,
    deleteEntry,
    getTodayTotal,
    getTodayMinutes,
  };
}
