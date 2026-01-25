export type BathroomType = 'poop' | 'pee';

// Urine color levels based on hydration chart (1-8)
export type UrineColor = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const URINE_COLORS: {
  level: UrineColor;
  color: string;
  label: string;
  status: string;
}[] = [
  { level: 1, color: '#F5F5DC', label: 'Clear', status: 'Hydrated' },
  { level: 2, color: '#FFFACD', label: 'Pale Yellow', status: 'Hydrated' },
  { level: 3, color: '#FFF59D', label: 'Light Yellow', status: 'Mildly Dehydrated' },
  { level: 4, color: '#FFEE58', label: 'Yellow', status: 'Mildly Dehydrated' },
  { level: 5, color: '#FFD54F', label: 'Dark Yellow', status: 'Dehydrated' },
  { level: 6, color: '#FFCA28', label: 'Amber', status: 'Dehydrated' },
  { level: 7, color: '#C9A227', label: 'Dark Amber', status: 'Very Dehydrated' },
  { level: 8, color: '#A67C00', label: 'Brown', status: 'Very Dehydrated' },
];

export type Gender = 'male' | 'female';

export type Theme = 'light' | 'dark' | 'system';

export type WeightUnit = 'kg' | 'lbs';

export type HeightUnit = 'imperial' | 'metric';

export type StreamStrength = 'strong' | 'normal' | 'weak' | 'intermittent' | 'dribbling';

export interface BathroomEntry {
  id: string;
  user_id?: string;
  type: BathroomType;
  timestamp: number; // Unix timestamp in milliseconds
  notes?: string;
  urine_color?: UrineColor; // Only for pee entries
  stream_strength?: StreamStrength; // Only for pee entries
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
  height_feet: number | null;
  height_inches: number | null;
  height_cm: number | null;
  height_unit: HeightUnit | null;
  weight: number | null;
  weight_unit: WeightUnit | null;
  gender: Gender;
  theme: Theme;
  profile_completed: boolean;
  terms_accepted_at: string | null;
  terms_version: string | null;
  created_at: string;
  updated_at: string;
}
