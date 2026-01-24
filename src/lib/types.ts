export type BathroomType = 'poop' | 'pee';

export type Gender = 'male' | 'female';

export type Theme = 'light' | 'dark' | 'system';

export type WeightUnit = 'kg' | 'lbs';

export interface BathroomEntry {
  id: string;
  user_id?: string;
  type: BathroomType;
  timestamp: number; // Unix timestamp in milliseconds
  notes?: string;
}

export interface TrackerData {
  entries: BathroomEntry[];
}

export type WaterUnit = 'oz' | 'ml' | 'cups' | 'L';

export interface WaterEntry {
  id: string;
  user_id?: string;
  amount: number; // Amount in the selected unit
  unit: WaterUnit;
  timestamp: number; // Unix timestamp in milliseconds
  notes?: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'beverage' | 'dessert';

export interface FoodEntry {
  id: string;
  user_id?: string;
  meal_type: MealType;
  calories: number;
  timestamp: number; // Unix timestamp in milliseconds
  notes?: string;
}

export interface UserGoal {
  id: string;
  user_id: string;
  goal_text: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  avatar_url: string | null;
  weight: number | null;
  weight_unit: WeightUnit | null;
  gender: Gender;
  theme: Theme;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}
