-- Allow zero calorie entries (specifically for beverages like water, diet sodas, etc.)
-- Drop the existing calories check constraint that blocks zero values
ALTER TABLE food_entries DROP CONSTRAINT IF EXISTS food_entries_calories_check;

-- Add a new constraint that allows non-negative values (including zero)
ALTER TABLE food_entries ADD CONSTRAINT food_entries_calories_check CHECK (calories >= 0);
