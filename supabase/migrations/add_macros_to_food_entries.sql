-- Add macronutrient columns to food_entries table
-- Allows tracking of carbs, fat, and protein in grams

ALTER TABLE food_entries
ADD COLUMN IF NOT EXISTS carbs INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fat INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS protein INTEGER DEFAULT NULL;

-- Add check constraints to ensure non-negative values
ALTER TABLE food_entries
ADD CONSTRAINT food_entries_carbs_check CHECK (carbs IS NULL OR carbs >= 0),
ADD CONSTRAINT food_entries_fat_check CHECK (fat IS NULL OR fat >= 0),
ADD CONSTRAINT food_entries_protein_check CHECK (protein IS NULL OR protein >= 0);
