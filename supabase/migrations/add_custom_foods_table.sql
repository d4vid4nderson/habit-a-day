-- Create custom_foods table for user-saved food items
-- This allows users to save foods they frequently eat for quick re-entry

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

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS custom_foods_user_id_idx ON custom_foods(user_id);

-- Create index on barcode for quick barcode lookups
CREATE INDEX IF NOT EXISTS custom_foods_barcode_idx ON custom_foods(barcode) WHERE barcode IS NOT NULL;

-- Create index for text search on name and brand
CREATE INDEX IF NOT EXISTS custom_foods_name_idx ON custom_foods(user_id, name);

-- Enable Row Level Security
ALTER TABLE custom_foods ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own custom foods
CREATE POLICY "Users can view own custom foods" ON custom_foods
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own custom foods
CREATE POLICY "Users can insert own custom foods" ON custom_foods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own custom foods
CREATE POLICY "Users can update own custom foods" ON custom_foods
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own custom foods
CREATE POLICY "Users can delete own custom foods" ON custom_foods
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for custom_foods
ALTER PUBLICATION supabase_realtime ADD TABLE custom_foods;
