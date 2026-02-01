-- Add custom goal columns to profiles table
-- Allows users to override calculated dietary needs

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS daily_calories_goal INTEGER CHECK (daily_calories_goal IS NULL OR daily_calories_goal > 0),
ADD COLUMN IF NOT EXISTS protein_goal INTEGER CHECK (protein_goal IS NULL OR protein_goal >= 0),
ADD COLUMN IF NOT EXISTS carbs_goal INTEGER CHECK (carbs_goal IS NULL OR carbs_goal >= 0),
ADD COLUMN IF NOT EXISTS fat_goal INTEGER CHECK (fat_goal IS NULL OR fat_goal >= 0),
ADD COLUMN IF NOT EXISTS water_goal INTEGER CHECK (water_goal IS NULL OR water_goal > 0);

COMMENT ON COLUMN profiles.daily_calories_goal IS 'Custom daily calorie goal (overrides calculated value)';
COMMENT ON COLUMN profiles.protein_goal IS 'Custom daily protein goal in grams';
COMMENT ON COLUMN profiles.carbs_goal IS 'Custom daily carbs goal in grams';
COMMENT ON COLUMN profiles.fat_goal IS 'Custom daily fat goal in grams';
COMMENT ON COLUMN profiles.water_goal IS 'Custom daily water goal in fl.oz';
