# FitTrack MVP - Setup Guide

This guide will help you set up the FitTrack fitness tracking app with Supabase backend.

## Prerequisites

- A Supabase account (free tier works)
- Access to the platform's Environment Variables UI

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" and sign in
3. Click "New project"
4. Enter:
   - **Project name**: `fittrack` (or any name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project" and wait 2-3 minutes

## Step 2: Run Database Migration

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy the entire contents of `/supabase/migrations/001_mvp.sql`
4. Paste into the SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned."

This creates all required tables:
- `user_profiles` - User body information
- `user_goals` - Fitness goals
- `daily_checkins` - Daily tracking data
- `meals` - Meal logging
- `activities` - Exercise tracking

## Step 3: Create Demo User

1. In Supabase, go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter:
   - **Email**: `demo@fittrack.app` (or any email)
   - **Password**: Choose a secure password
   - **Auto Confirm User**: ✅ Check this box!
4. Click **Create user**

> ⚠️ **Important**: Make sure "Auto Confirm User" is checked, otherwise the demo login won't work.

## Step 4: Get API Keys

1. In Supabase, go to **Project Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL**: Under "Project URL" section
   - **anon public key**: Under "Project API keys" → `anon` `public`

## Step 5: Set Environment Variables

In your platform's Environment Variables/Secrets UI, add these 4 variables:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_DEMO_EMAIL=demo@fittrack.app
EXPO_PUBLIC_DEMO_PASSWORD=your-demo-password
```

Replace with your actual values from Steps 3 and 4.

## Step 6: Test the App

1. Refresh the app preview
2. You should see the Login screen (not the "Supabase Not Configured" screen)
3. Tap **"Try Demo"**
4. You should be logged in and see the Dashboard!

## Troubleshooting

### "Supabase Not Configured" screen appears
- Check that all 4 environment variables are set correctly
- Make sure there are no extra spaces in the values
- Try the "Retry Config" button after setting variables

### "Login failed" error
- Verify the demo user email and password match exactly
- Make sure the demo user is confirmed (not pending)
- Check Supabase Auth → Users to verify user exists

### "Invalid API key" error
- Double-check you copied the `anon` key (not service_role)
- Ensure the full key is copied without truncation

### Database errors after login
- Verify the migration SQL ran successfully
- Check SQL Editor → "Table Editor" to see if tables exist
- Re-run the migration if needed

## App Features

### Dashboard
- View daily calorie progress (target - consumed = remaining)
- Track water intake with quick-add buttons (+250ml, +500ml)
- Monitor sleep hours
- See 7-day exercise chart

### Check-in
- Log meals by category (breakfast, lunch, dinner, snacks)
- Add water intake
- Record sleep hours
- Log exercise activities

### Profile
- Update body information (height, weight, age)
- Set activity level
- Configure fitness goals
- Logout option

### AI Tab
- Placeholder UI for future AI coach integration
- Chat interface ready for LLM integration

## Database Schema Overview

```
user_profiles
├── user_id (UUID, PK)
├── height_cm
├── current_weight_kg
├── age
└── activity_level

user_goals
├── id (UUID, PK)
├── user_id
├── target_weight_kg
├── daily_calorie_target
├── daily_water_goal_ml
└── sleep_goal_hours

daily_checkins
├── id (UUID, PK)
├── user_id
├── checkin_date
├── total_calories_consumed
├── water_intake_ml
└── sleep_hours

activities
├── id (UUID, PK)
├── user_id
├── checkin_id
├── activity_type
├── duration_minutes
└── calories_burned
```

All tables have Row Level Security (RLS) enabled - users can only access their own data.
