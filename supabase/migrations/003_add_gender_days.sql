-- Migration to add gender to user_profiles and days_to_goal to user_goals
-- Run this in your Supabase SQL Editor

-- Add gender column to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));

-- Add days_to_goal column to user_goals
ALTER TABLE user_goals 
ADD COLUMN IF NOT EXISTS days_to_goal INT;
