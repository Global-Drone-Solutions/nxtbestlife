# FitTrack - Mobile Fitness Tracker MVP

A production-ready mobile fitness tracking app built with Expo React Native + TypeScript and Supabase.

## Features

- 📊 **Dashboard** - Track calories, water, sleep, and exercise at a glance
- 🍽️ **Meal Logging** - Log breakfast, lunch, dinner, and snacks
- 💧 **Water Tracking** - Quick-add buttons for easy hydration tracking
- 😴 **Sleep Monitoring** - Track sleep hours vs your goal
- 🏃 **Exercise Logging** - Log activities with duration and calories burned
- 📈 **7-Day Chart** - Visualize your exercise progress
- 👤 **Profile Management** - Update body info and fitness goals
- 🌙 **Dark Mode** - Light and dark theme support

## Tech Stack

- **Frontend**: Expo React Native + TypeScript
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **State**: Zustand
- **Charts**: react-native-gifted-charts
- **UI**: Custom glassmorphic design system

## Quick Start

1. Set up Supabase (see [SETUP.md](docs/SETUP.md))
2. Configure environment variables
3. Tap "Try Demo" to explore the app

## Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_DEMO_EMAIL=demo@fittrack.app
EXPO_PUBLIC_DEMO_PASSWORD=your_demo_password
```

## Project Structure

```
frontend/
├── app/                    # Expo Router screens
│   ├── index.tsx          # Login/ConfigGate screen
│   └── (tabs)/            # Tab navigation
│       ├── index.tsx      # Dashboard
│       ├── ai.tsx         # AI Coach placeholder
│       ├── checkin.tsx    # Daily check-in
│       └── profile.tsx    # User profile
├── src/
│   ├── components/        # Reusable UI components
│   ├── lib/              # Supabase client, DB helpers
│   ├── store/            # Zustand stores
│   └── types/            # TypeScript types
supabase/
└── migrations/           # SQL migrations
docs/
└── SETUP.md             # Setup instructions
```

## Demo Mode

This MVP uses a demo user for instant app access:
- No registration flow required
- 1-tap "Try Demo" button on login
- Auto-seeds sample data on first login

## License

MIT
