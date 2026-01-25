import { createClient } from '@/lib/supabase/client';
import { Gender, WeightUnit, UserGoal } from '@/lib/types';

function getSupabase() {
  return createClient();
}

export type Theme = 'light' | 'dark' | 'system';

export interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  avatar_url: string | null;
  oauth_avatar_url: string | null; // Avatar from OAuth provider (Google/Facebook/Apple)
  height_feet: number | null;
  height_inches: number | null;
  height_cm: number | null;
  height_unit: 'imperial' | 'metric' | null;
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

export interface ProfileSetupData {
  first_name: string;
  last_name: string;
  gender: Gender;
  age?: number | null;
  avatar_url?: string | null;
  weight?: number | null;
  weight_unit?: WeightUnit | null;
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Profile doesn't exist yet
      return null;
    }
    console.error('Error fetching profile:', error);
    throw error;
  }

  return data;
}

export async function createProfile(
  userId: string,
  email: string | null,
  displayName: string | null
): Promise<UserProfile> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .insert({
      id: userId,
      email,
      display_name: displayName,
      gender: 'male',
      theme: 'system',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating profile:', error);
    throw error;
  }

  return data;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'gender' | 'theme' | 'display_name' | 'first_name' | 'last_name' | 'age' | 'avatar_url' | 'height_feet' | 'height_inches' | 'height_cm' | 'height_unit' | 'weight' | 'weight_unit' | 'profile_completed'>>
): Promise<UserProfile> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  return data;
}

export async function getOrCreateProfile(
  userId: string,
  email: string | null,
  displayName: string | null
): Promise<UserProfile> {
  let profile = await fetchProfile(userId);

  if (!profile) {
    profile = await createProfile(userId, email, displayName);
  }

  return profile;
}

export function getDefaultAvatarUrl(userId: string, gender: Gender): string {
  // alohe/avatars - professional cartoon avatars
  // Use a consistent avatar based on userId hash
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const avatarNum = (hash % 27) + 1;
  return `https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_${avatarNum}.png`;
}

export async function fetchDefaultAvatarUrl(userId: string, gender: Gender): Promise<string> {
  try {
    const response = await fetch(`/api/avatar?gender=${gender}&seed=${userId}&format=json`);
    const data = await response.json();
    return data.url;
  } catch {
    // Fallback to DiceBear
    const style = gender === 'female' ? 'lorelei' : 'micah';
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${userId}`;
  }
}

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  const supabase = getSupabase();
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/avatar.${fileExt}`;

  // Delete any existing avatar first
  await supabase.storage.from('avatars').remove([fileName]);

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true });

  if (uploadError) {
    console.error('Error uploading avatar:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);

  return data.publicUrl;
}

export async function getUserGoals(userId: string): Promise<UserGoal[]> {
  const { data, error } = await getSupabase()
    .from('user_goals')
    .select('*')
    .eq('user_id', userId)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching user goals:', error);
    throw error;
  }

  return data || [];
}

export async function saveUserGoals(
  userId: string,
  goals: string[]
): Promise<UserGoal[]> {
  const supabase = getSupabase();

  // Delete existing goals
  await supabase.from('user_goals').delete().eq('user_id', userId);

  // Insert new goals (only non-empty ones)
  const goalsToInsert = goals
    .filter((goal) => goal.trim().length > 0)
    .slice(0, 3) // Max 3 goals
    .map((goal_text, index) => ({
      user_id: userId,
      goal_text: goal_text.trim(),
      display_order: index + 1,
    }));

  if (goalsToInsert.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('user_goals')
    .insert(goalsToInsert)
    .select();

  if (error) {
    console.error('Error saving user goals:', error);
    throw error;
  }

  return data || [];
}

export async function completeProfileSetup(
  userId: string,
  setupData: ProfileSetupData,
  goals: string[]
): Promise<UserProfile> {
  // Save goals first
  await saveUserGoals(userId, goals);

  // Update profile with setup data and mark as completed
  const profile = await updateProfile(userId, {
    ...setupData,
    profile_completed: true,
  });

  return profile;
}

// Current terms version - update this when terms change
export const CURRENT_TERMS_VERSION = '1.0.0';

export async function acceptTerms(userId: string): Promise<UserProfile> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .update({
      terms_accepted_at: new Date().toISOString(),
      terms_version: CURRENT_TERMS_VERSION,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error accepting terms:', error.message, error.code, error.details);
    throw new Error(error.message || 'Failed to accept terms');
  }

  return data;
}

export function hasAcceptedCurrentTerms(profile: UserProfile | null): boolean {
  if (!profile) return false;
  if (!profile.terms_accepted_at) return false;
  // Check if they've accepted the current version
  return profile.terms_version === CURRENT_TERMS_VERSION;
}
