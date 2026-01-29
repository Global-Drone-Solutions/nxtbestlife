// Database row types matching Supabase schema

export interface UserProfile {
  user_id: string;
  height_cm: number;
  current_weight_kg: number;
  age: number | null;
  activity_level: string;
  gender: 'male' | 'female';
  created_at: string;
  updated_at: string;
}

export interface UserGoal {
  id: string;
  user_id: string;
  target_weight_kg: number;
  daily_calorie_target: number;
  daily_water_goal_ml: number;
  sleep_goal_hours: number;
  days_to_goal?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyCheckin {
  id: string;
  user_id: string;
  checkin_date: string;
  total_calories_consumed: number;
  water_intake_ml: number;
  sleep_hours: number | null;
  steps_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  checkin_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  estimated_calories: number;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  checkin_id: string;
  activity_type: string;
  duration_minutes: number;
  calories_burned: number | null;
  created_at: string;
}
