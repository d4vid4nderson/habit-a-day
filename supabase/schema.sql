-- Potty Logger Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (stores user preferences)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  age INTEGER CHECK (age IS NULL OR (age >= 13 AND age <= 120)),
  avatar_url TEXT,
  oauth_avatar_url TEXT,  -- Avatar from OAuth provider (Google/Facebook/Apple) - used as fallback
  weight DECIMAL(5,2) CHECK (weight IS NULL OR weight > 0),
  weight_unit TEXT CHECK (weight_unit IS NULL OR weight_unit IN ('kg', 'lbs')) DEFAULT 'lbs',
  gender TEXT CHECK (gender IN ('male', 'female')) DEFAULT 'male',
  theme TEXT CHECK (theme IN ('light', 'dark', 'system')) DEFAULT 'system',
  profile_completed BOOLEAN DEFAULT FALSE,
  daily_calories_goal INTEGER CHECK (daily_calories_goal IS NULL OR daily_calories_goal > 0),
  protein_goal INTEGER CHECK (protein_goal IS NULL OR protein_goal >= 0),
  carbs_goal INTEGER CHECK (carbs_goal IS NULL OR carbs_goal >= 0),
  fat_goal INTEGER CHECK (fat_goal IS NULL OR fat_goal >= 0),
  water_goal INTEGER CHECK (water_goal IS NULL OR water_goal > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bathroom entries table
CREATE TABLE IF NOT EXISTS bathroom_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('poop', 'pee')) NOT NULL,
  timestamp BIGINT NOT NULL, -- Unix timestamp in milliseconds
  notes TEXT,
  urine_color INTEGER CHECK (urine_color IS NULL OR (urine_color >= 1 AND urine_color <= 8)), -- Hydration level 1-8
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bathroom_entries_user_id ON bathroom_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_bathroom_entries_timestamp ON bathroom_entries(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_bathroom_entries_user_timestamp ON bathroom_entries(user_id, timestamp DESC);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bathroom_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for bathroom_entries
CREATE POLICY "Users can view their own entries"
  ON bathroom_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entries"
  ON bathroom_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries"
  ON bathroom_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries"
  ON bathroom_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically create a profile on user signup
-- Captures OAuth provider profile photos (Google, Facebook, Apple)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  oauth_avatar TEXT;
  oauth_full_name TEXT;
  first_name_val TEXT;
  last_name_val TEXT;
BEGIN
  -- Extract avatar URL from OAuth metadata (Google uses 'picture', others use 'avatar_url')
  oauth_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  -- Extract full name from OAuth metadata
  oauth_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name'
  );

  -- Parse first and last name from full name
  IF oauth_full_name IS NOT NULL AND oauth_full_name != '' THEN
    first_name_val := split_part(oauth_full_name, ' ', 1);
    last_name_val := CASE
      WHEN position(' ' in oauth_full_name) > 0
      THEN substring(oauth_full_name from position(' ' in oauth_full_name) + 1)
      ELSE NULL
    END;
  END IF;

  INSERT INTO public.profiles (id, email, display_name, avatar_url, oauth_avatar_url, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    oauth_full_name,
    oauth_avatar,      -- Set initial avatar to OAuth avatar
    oauth_avatar,      -- Store OAuth avatar separately for fallback
    first_name_val,
    last_name_val
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bathroom_entries_updated_at
  BEFORE UPDATE ON bathroom_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for bathroom_entries (optional, for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE bathroom_entries;

-- Food entries table
CREATE TABLE IF NOT EXISTS food_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  meal_type TEXT NOT NULL,
  calories INTEGER NOT NULL,
  carbs INTEGER CHECK (carbs IS NULL OR carbs >= 0),
  fat INTEGER CHECK (fat IS NULL OR fat >= 0),
  protein INTEGER CHECK (protein IS NULL OR protein >= 0),
  timestamp BIGINT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT food_entries_meal_type_check CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'beverage', 'dessert'))
);

-- Food entries indexes
CREATE INDEX IF NOT EXISTS idx_food_entries_user_id ON food_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_food_entries_timestamp ON food_entries(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_food_entries_user_timestamp ON food_entries(user_id, timestamp DESC);

-- Enable RLS for food_entries
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for food_entries
CREATE POLICY "Users can view their own food entries"
  ON food_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own food entries"
  ON food_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food entries"
  ON food_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food entries"
  ON food_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger for food_entries
CREATE TRIGGER update_food_entries_updated_at
  BEFORE UPDATE ON food_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for food_entries
ALTER PUBLICATION supabase_realtime ADD TABLE food_entries;

-- Water entries table
CREATE TABLE IF NOT EXISTS water_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  amount DECIMAL(6,2) NOT NULL,
  unit TEXT CHECK (unit IN ('oz', 'ml')) DEFAULT 'oz',
  timestamp BIGINT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Water entries indexes
CREATE INDEX IF NOT EXISTS idx_water_entries_user_id ON water_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_water_entries_timestamp ON water_entries(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_water_entries_user_timestamp ON water_entries(user_id, timestamp DESC);

-- Enable RLS for water_entries
ALTER TABLE water_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for water_entries
CREATE POLICY "Users can view their own water entries"
  ON water_entries FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own water entries"
  ON water_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own water entries"
  ON water_entries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own water entries"
  ON water_entries FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger for water_entries
CREATE TRIGGER update_water_entries_updated_at
  BEFORE UPDATE ON water_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for water_entries
ALTER PUBLICATION supabase_realtime ADD TABLE water_entries;

-- Physical therapy entries table
CREATE TABLE IF NOT EXISTS pt_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  duration_minutes INTEGER,
  sets INTEGER,
  reps INTEGER,
  pain_level INTEGER CHECK (pain_level IS NULL OR (pain_level >= 1 AND pain_level <= 10)),
  timestamp BIGINT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PT entries indexes
CREATE INDEX IF NOT EXISTS idx_pt_entries_user_id ON pt_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_pt_entries_timestamp ON pt_entries(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_pt_entries_user_timestamp ON pt_entries(user_id, timestamp DESC);

-- Enable RLS for pt_entries
ALTER TABLE pt_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pt_entries
CREATE POLICY "Users can view their own PT entries"
  ON pt_entries FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PT entries"
  ON pt_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PT entries"
  ON pt_entries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PT entries"
  ON pt_entries FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger for pt_entries
CREATE TRIGGER update_pt_entries_updated_at
  BEFORE UPDATE ON pt_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for pt_entries
ALTER PUBLICATION supabase_realtime ADD TABLE pt_entries;

-- Custom foods table for user-saved food items
CREATE TABLE IF NOT EXISTS custom_foods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  barcode TEXT,
  calories INTEGER NOT NULL CHECK (calories >= 0),
  carbs INTEGER CHECK (carbs IS NULL OR carbs >= 0),
  fat INTEGER CHECK (fat IS NULL OR fat >= 0),
  protein INTEGER CHECK (protein IS NULL OR protein >= 0),
  serving_size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for custom_foods
CREATE INDEX IF NOT EXISTS custom_foods_user_id_idx ON custom_foods(user_id);
CREATE INDEX IF NOT EXISTS custom_foods_barcode_idx ON custom_foods(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS custom_foods_name_idx ON custom_foods(user_id, name);

-- Enable RLS for custom_foods
ALTER TABLE custom_foods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_foods
CREATE POLICY "Users can view own custom foods" ON custom_foods
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own custom foods" ON custom_foods
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own custom foods" ON custom_foods
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own custom foods" ON custom_foods
  FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger for custom_foods
CREATE TRIGGER update_custom_foods_updated_at
  BEFORE UPDATE ON custom_foods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for custom_foods
ALTER PUBLICATION supabase_realtime ADD TABLE custom_foods;
