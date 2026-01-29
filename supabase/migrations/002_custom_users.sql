-- ============================================
-- CUSTOM USERS TABLE (Replaces Supabase Auth)
-- Copy and paste this into Supabase SQL Editor
-- ============================================

-- ============================================
-- TABLE: app_users
-- This replaces auth.users for custom authentication
-- ============================================
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for email lookups (login)
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);

-- ============================================
-- INSERT DEMO USER
-- Password: 'password' (you should hash this properly in production)
-- For demo purposes, we're storing a simple hash
-- ============================================
INSERT INTO app_users (id, email, password_hash) 
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'chrisw@dronesolutions.com',
  'password'
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- UPDATED_AT TRIGGER FOR app_users
-- ============================================
CREATE TRIGGER update_app_users_updated_at
  BEFORE UPDATE ON app_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- OPTIONAL: If you want to use this table instead of auth.users,
-- you'll need to update the foreign key references in other tables.
-- 
-- Run these ALTER statements to change references from auth.users to app_users:
-- ============================================

-- NOTE: Only run these if your tables already exist and reference auth.users
-- If you're starting fresh, skip these and update 001_mvp.sql directly

/*
-- Drop existing foreign key constraints
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
ALTER TABLE user_goals DROP CONSTRAINT IF EXISTS user_goals_user_id_fkey;
ALTER TABLE daily_checkins DROP CONSTRAINT IF EXISTS daily_checkins_user_id_fkey;
ALTER TABLE meals DROP CONSTRAINT IF EXISTS meals_user_id_fkey;
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_user_id_fkey;

-- Add new foreign key constraints referencing app_users
ALTER TABLE user_profiles 
  ADD CONSTRAINT user_profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE;

ALTER TABLE user_goals 
  ADD CONSTRAINT user_goals_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE;

ALTER TABLE daily_checkins 
  ADD CONSTRAINT daily_checkins_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE;

ALTER TABLE meals 
  ADD CONSTRAINT meals_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE;

ALTER TABLE activities 
  ADD CONSTRAINT activities_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE;
*/

-- ============================================
-- DISABLE RLS FOR app_users (or create appropriate policies)
-- For simplicity, we disable RLS on app_users
-- ============================================
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read users (for login validation)
CREATE POLICY "Allow public read for login"
  ON app_users FOR SELECT
  USING (true);

-- Allow inserts (for registration)
CREATE POLICY "Allow public insert for registration"
  ON app_users FOR INSERT
  WITH CHECK (true);
