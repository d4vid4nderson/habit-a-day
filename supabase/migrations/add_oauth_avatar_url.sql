-- Add oauth_avatar_url column to profiles table
-- This stores the avatar URL from OAuth providers (Google, Facebook, Apple)
-- Run this in the Supabase SQL Editor

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS oauth_avatar_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.oauth_avatar_url IS 'Avatar URL from OAuth provider (Google, Facebook, Apple) - kept in sync on each login';
