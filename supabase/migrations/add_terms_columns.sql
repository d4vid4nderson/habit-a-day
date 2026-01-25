-- Add terms acceptance columns to profiles table
-- Run this in the Supabase SQL Editor

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS terms_version TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.terms_accepted_at IS 'Timestamp when user accepted the terms and conditions';
COMMENT ON COLUMN profiles.terms_version IS 'Version of terms accepted (e.g., 1.0.0)';
