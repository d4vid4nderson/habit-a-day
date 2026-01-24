'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { WaterEntry, WaterUnit } from '@/lib/types';
import {
  fetchWaterEntries,
  createWaterEntry as createWaterEntryService,
  deleteWaterEntry as deleteWaterEntryService,
  subscribeToWaterEntries,
} from '@/lib/services/waterService';

export function useWaterIntake() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WaterEntry[]>([]);
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
        const data = await fetchWaterEntries(user.id);
        setEntries(data);
        setError(null);

        // Subscribe to real-time updates
        unsubscribe = subscribeToWaterEntries(user.id, (updatedEntries) => {
          setEntries(updatedEntries);
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch water entries'));
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
    async (amount: number, unit: WaterUnit, notes?: string, timestamp?: number) => {
      if (!user) return;

      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimisticEntry: WaterEntry = {
        id: tempId,
        amount,
        unit,
        timestamp: timestamp || Date.now(),
        notes: notes?.trim() || undefined,
      };

      setEntries((prev) => [optimisticEntry, ...prev]);

      try {
        const newEntry = await createWaterEntryService(user.id, amount, unit, notes, timestamp);
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
        await deleteWaterEntryService(entryId);
      } catch (err) {
        // Rollback on error
        setEntries(previousEntries);
        throw err;
      }
    },
    [user, entries]
  );

  // Convert any unit to oz (base unit for calculations)
  const toOz = (amount: number, unit: WaterUnit): number => {
    switch (unit) {
      case 'oz': return amount;
      case 'ml': return amount / 29.5735;
      case 'cups': return amount * 8; // 1 cup = 8 oz
      case 'L': return amount * 33.814; // 1 L = 33.814 oz
      default: return amount;
    }
  };

  // Convert oz to any target unit
  const fromOz = (ozAmount: number, targetUnit: WaterUnit): number => {
    switch (targetUnit) {
      case 'oz': return ozAmount;
      case 'ml': return ozAmount * 29.5735;
      case 'cups': return ozAmount / 8;
      case 'L': return ozAmount / 33.814;
      default: return ozAmount;
    }
  };

  // Calculate total water intake for today
  const getTodayTotal = useCallback((targetUnit: WaterUnit = 'oz') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    const totalOz = entries
      .filter((e) => e.timestamp >= todayStart && e.timestamp < todayEnd)
      .reduce((total, entry) => {
        return total + toOz(entry.amount, entry.unit);
      }, 0);

    return fromOz(totalOz, targetUnit);
  }, [entries]);

  return {
    entries,
    loading,
    error,
    createEntry,
    deleteEntry,
    getTodayTotal,
  };
}
