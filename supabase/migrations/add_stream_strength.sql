-- Add stream_strength column to bathroom_entries table
-- Run this in the Supabase SQL Editor

ALTER TABLE bathroom_entries
ADD COLUMN IF NOT EXISTS stream_strength TEXT CHECK (stream_strength IS NULL OR stream_strength IN ('strong', 'normal', 'weak', 'intermittent', 'dribbling'));

-- Add comment for documentation
COMMENT ON COLUMN bathroom_entries.stream_strength IS 'Stream strength for pee entries: strong, normal, weak, intermittent, dribbling';
