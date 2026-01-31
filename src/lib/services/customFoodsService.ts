import { createClient } from '@/lib/supabase/client';
import { CustomFood } from '@/lib/types';

function getSupabase() {
  return createClient();
}

interface DbCustomFood {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  calories: number;
  carbs: number | null;
  fat: number | null;
  protein: number | null;
  serving_size: string | null;
  created_at: string;
  updated_at: string;
}

function toAppFood(dbFood: DbCustomFood): CustomFood {
  return {
    id: dbFood.id,
    name: dbFood.name,
    brand: dbFood.brand || undefined,
    barcode: dbFood.barcode || undefined,
    calories: dbFood.calories,
    carbs: dbFood.carbs ?? undefined,
    fat: dbFood.fat ?? undefined,
    protein: dbFood.protein ?? undefined,
    serving_size: dbFood.serving_size || undefined,
  };
}

export async function fetchCustomFoods(userId: string): Promise<CustomFood[]> {
  const { data, error } = await getSupabase()
    .from('custom_foods')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching custom foods:', error);
    throw new Error(error.message);
  }

  return (data || []).map(toAppFood);
}

export async function searchCustomFoods(
  userId: string,
  query: string
): Promise<CustomFood[]> {
  const { data, error } = await getSupabase()
    .from('custom_foods')
    .select('*')
    .eq('user_id', userId)
    .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
    .order('name', { ascending: true })
    .limit(20);

  if (error) {
    console.error('Error searching custom foods:', error);
    throw new Error(error.message);
  }

  return (data || []).map(toAppFood);
}

export async function findCustomFoodByBarcode(
  userId: string,
  barcode: string
): Promise<CustomFood | null> {
  const { data, error } = await getSupabase()
    .from('custom_foods')
    .select('*')
    .eq('user_id', userId)
    .eq('barcode', barcode)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error finding custom food by barcode:', error);
    throw new Error(error.message);
  }

  return data ? toAppFood(data) : null;
}

export interface CreateCustomFoodOptions {
  name: string;
  brand?: string;
  barcode?: string;
  calories: number;
  carbs?: number;
  fat?: number;
  protein?: number;
  serving_size?: string;
}

export async function createCustomFood(
  userId: string,
  options: CreateCustomFoodOptions
): Promise<CustomFood> {
  const { data, error } = await getSupabase()
    .from('custom_foods')
    .insert({
      user_id: userId,
      name: options.name.trim(),
      brand: options.brand?.trim() || null,
      barcode: options.barcode?.trim() || null,
      calories: options.calories,
      carbs: options.carbs ?? null,
      fat: options.fat ?? null,
      protein: options.protein ?? null,
      serving_size: options.serving_size?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating custom food:', error);
    throw new Error(error.message);
  }

  return toAppFood(data);
}

export async function updateCustomFood(
  foodId: string,
  updates: Partial<CreateCustomFoodOptions>
): Promise<CustomFood> {
  const updateData: Record<string, unknown> = {};

  if (updates.name !== undefined) updateData.name = updates.name.trim();
  if (updates.brand !== undefined) updateData.brand = updates.brand?.trim() || null;
  if (updates.barcode !== undefined) updateData.barcode = updates.barcode?.trim() || null;
  if (updates.calories !== undefined) updateData.calories = updates.calories;
  if (updates.carbs !== undefined) updateData.carbs = updates.carbs ?? null;
  if (updates.fat !== undefined) updateData.fat = updates.fat ?? null;
  if (updates.protein !== undefined) updateData.protein = updates.protein ?? null;
  if (updates.serving_size !== undefined) updateData.serving_size = updates.serving_size?.trim() || null;

  const { data, error } = await getSupabase()
    .from('custom_foods')
    .update(updateData)
    .eq('id', foodId)
    .select()
    .single();

  if (error) {
    console.error('Error updating custom food:', error);
    throw new Error(error.message);
  }

  return toAppFood(data);
}

export async function deleteCustomFood(foodId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('custom_foods')
    .delete()
    .eq('id', foodId);

  if (error) {
    console.error('Error deleting custom food:', error);
    throw new Error(error.message);
  }
}
