'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { FoodEntry, MealType } from '@/lib/types';
import {
  fetchFoodEntries,
  createFoodEntry as createFoodEntryService,
  deleteFoodEntry as deleteFoodEntryService,
  subscribeToFoodEntries,
  CreateFoodEntryOptions,
} from '@/lib/services/foodService';

export function useFoodJournal() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
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
        const data = await fetchFoodEntries(user.id);
        setEntries(data);
        setError(null);

        // Subscribe to real-time updates
        unsubscribe = subscribeToFoodEntries(user.id, (updatedEntries) => {
          setEntries(updatedEntries);
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch food entries'));
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
    async (mealType: MealType, calories: number, notes?: string, timestamp?: number, options?: CreateFoodEntryOptions) => {
      if (!user) return;

      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimisticEntry: FoodEntry = {
        id: tempId,
        meal_type: mealType,
        calories,
        carbs: options?.carbs,
        fat: options?.fat,
        protein: options?.protein,
        timestamp: timestamp || Date.now(),
        notes: notes?.trim() || undefined,
      };

      setEntries((prev) => [optimisticEntry, ...prev]);

      try {
        const newEntry = await createFoodEntryService(user.id, mealType, calories, notes, timestamp, options);
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
        await deleteFoodEntryService(entryId);
      } catch (err) {
        // Rollback on error
        setEntries(previousEntries);
        throw err;
      }
    },
    [user, entries]
  );

  // Calculate total calories for today
  const getTodayTotal = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    return entries
      .filter((e) => e.timestamp >= todayStart && e.timestamp < todayEnd)
      .reduce((total, entry) => total + entry.calories, 0);
  }, [entries]);

  // Get entries grouped by meal type for today
  const getTodayByMeal = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    const todayEntries = entries.filter(
      (e) => e.timestamp >= todayStart && e.timestamp < todayEnd
    );

    return {
      breakfast: todayEntries.filter((e) => e.meal_type === 'breakfast'),
      lunch: todayEntries.filter((e) => e.meal_type === 'lunch'),
      dinner: todayEntries.filter((e) => e.meal_type === 'dinner'),
      snack: todayEntries.filter((e) => e.meal_type === 'snack'),
      beverage: todayEntries.filter((e) => e.meal_type === 'beverage'),
      dessert: todayEntries.filter((e) => e.meal_type === 'dessert'),
    };
  }, [entries]);

  // Get calories by meal type for today
  const getTodayCaloriesByMeal = useCallback(() => {
    const byMeal = getTodayByMeal();
    return {
      breakfast: byMeal.breakfast.reduce((sum, e) => sum + e.calories, 0),
      lunch: byMeal.lunch.reduce((sum, e) => sum + e.calories, 0),
      dinner: byMeal.dinner.reduce((sum, e) => sum + e.calories, 0),
      snack: byMeal.snack.reduce((sum, e) => sum + e.calories, 0),
      beverage: byMeal.beverage.reduce((sum, e) => sum + e.calories, 0),
      dessert: byMeal.dessert.reduce((sum, e) => sum + e.calories, 0),
    };
  }, [getTodayByMeal]);

  // Get macro totals for today
  const getTodayMacros = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    const todayEntries = entries.filter(
      (e) => e.timestamp >= todayStart && e.timestamp < todayEnd
    );

    return {
      carbs: todayEntries.reduce((sum, e) => sum + (e.carbs || 0), 0),
      fat: todayEntries.reduce((sum, e) => sum + (e.fat || 0), 0),
      protein: todayEntries.reduce((sum, e) => sum + (e.protein || 0), 0),
    };
  }, [entries]);

  return {
    entries,
    loading,
    error,
    createEntry,
    deleteEntry,
    getTodayTotal,
    getTodayByMeal,
    getTodayCaloriesByMeal,
    getTodayMacros,
  };
}
