import { createClient } from '@/lib/supabase/client';
import { FoodEntry, MealType } from '@/lib/types';

function getSupabase() {
  return createClient();
}

export interface DbFoodEntry {
  id: string;
  user_id: string;
  meal_type: MealType;
  calories: number;
  timestamp: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function toAppEntry(dbEntry: DbFoodEntry): FoodEntry {
  return {
    id: dbEntry.id,
    meal_type: dbEntry.meal_type,
    calories: dbEntry.calories,
    timestamp: dbEntry.timestamp,
    notes: dbEntry.notes || undefined,
  };
}

export async function fetchFoodEntries(userId: string): Promise<FoodEntry[]> {
  const { data, error } = await getSupabase()
    .from('food_entries')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching food entries:', error);
    throw error;
  }

  return (data || []).map(toAppEntry);
}

export async function createFoodEntry(
  userId: string,
  mealType: MealType,
  calories: number,
  notes?: string,
  timestamp?: number
): Promise<FoodEntry> {
  const now = timestamp || Date.now();

  const { data, error } = await getSupabase()
    .from('food_entries')
    .insert({
      user_id: userId,
      meal_type: mealType,
      calories,
      timestamp: now,
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating food entry:', JSON.stringify(error, null, 2));
    console.error('Input data:', { userId, mealType, calories, notes, timestamp: now });
    throw new Error(error.message || 'Failed to create food entry');
  }

  return toAppEntry(data);
}

export async function deleteFoodEntry(entryId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('food_entries')
    .delete()
    .eq('id', entryId);

  if (error) {
    console.error('Error deleting food entry:', error);
    throw error;
  }
}

export async function updateFoodEntry(
  entryId: string,
  updates: Partial<Pick<FoodEntry, 'meal_type' | 'calories' | 'notes' | 'timestamp'>>
): Promise<FoodEntry> {
  const { data, error } = await getSupabase()
    .from('food_entries')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .select()
    .single();

  if (error) {
    console.error('Error updating food entry:', error);
    throw error;
  }

  return toAppEntry(data);
}

export function subscribeToFoodEntries(
  userId: string,
  callback: (entries: FoodEntry[]) => void
) {
  const supabase = getSupabase();
  const channel = supabase
    .channel('food_entries_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'food_entries',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        // Refetch all entries on any change
        const entries = await fetchFoodEntries(userId);
        callback(entries);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Dietary calculations based on user profile
export interface DietaryNeeds {
  dailyCalories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber: number; // grams
  water: number; // oz
}

export function calculateDietaryNeeds(
  gender: 'male' | 'female',
  age: number | null,
  weightLbs: number | null
): DietaryNeeds {
  // Default values if age/weight not provided
  const effectiveAge = age || 30;
  const effectiveWeight = weightLbs || (gender === 'male' ? 180 : 150);

  // Mifflin-St Jeor Equation for BMR
  // For men: BMR = (10 × weight in kg) + (6.25 × height in cm) − (5 × age) + 5
  // For women: BMR = (10 × weight in kg) + (6.25 × height in cm) − (5 × age) − 161
  // We'll estimate height based on gender averages since we don't have it
  const weightKg = effectiveWeight * 0.453592;
  const estimatedHeightCm = gender === 'male' ? 175 : 162;

  let bmr: number;
  if (gender === 'male') {
    bmr = (10 * weightKg) + (6.25 * estimatedHeightCm) - (5 * effectiveAge) + 5;
  } else {
    bmr = (10 * weightKg) + (6.25 * estimatedHeightCm) - (5 * effectiveAge) - 161;
  }

  // Assuming light activity level (sedentary to lightly active)
  const activityMultiplier = 1.375;
  const dailyCalories = Math.round(bmr * activityMultiplier);

  // Macronutrient distribution (balanced diet)
  // Protein: 20-25% of calories, 4 cal/g
  // Carbs: 45-55% of calories, 4 cal/g
  // Fat: 25-30% of calories, 9 cal/g
  const proteinCalories = dailyCalories * 0.22;
  const carbCalories = dailyCalories * 0.50;
  const fatCalories = dailyCalories * 0.28;

  return {
    dailyCalories,
    protein: Math.round(proteinCalories / 4),
    carbs: Math.round(carbCalories / 4),
    fat: Math.round(fatCalories / 9),
    fiber: gender === 'male' ? 38 : 25, // Recommended daily fiber
    water: gender === 'male' ? 125 : 91, // oz (3.7L for men, 2.7L for women)
  };
}

export function getMealTypeLabel(mealType: MealType): string {
  switch (mealType) {
    case 'breakfast':
      return 'Breakfast';
    case 'lunch':
      return 'Lunch';
    case 'dinner':
      return 'Dinner';
    case 'snack':
      return 'Snack';
    case 'beverage':
      return 'Beverage';
    case 'dessert':
      return 'Dessert';
    default:
      return mealType;
  }
}
