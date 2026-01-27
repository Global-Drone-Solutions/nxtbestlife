import { getSupabase } from './supabaseClient';
import { UserProfile, UserGoal, DailyCheckin, Meal, Activity } from '../types/db';

// Helper to get today's date in YYYY-MM-DD format
export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Get last N days dates
export const getLastNDays = (n: number): string[] => {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

// User Profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.log('Error fetching profile:', error.message);
    return null;
  }
  return data;
};

export const upsertUserProfile = async (profile: Partial<UserProfile> & { user_id: string }): Promise<UserProfile | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({ ...profile, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    console.log('Error upserting profile:', error.message);
    return null;
  }
  return data;
};

// User Goals
export const getUserGoal = async (userId: string): Promise<UserGoal | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.log('Error fetching goal:', error.message);
    return null;
  }
  return data;
};

export const upsertUserGoal = async (goal: Partial<UserGoal> & { user_id: string }): Promise<UserGoal | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_goals')
    .upsert({ ...goal, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    console.log('Error upserting goal:', error.message);
    return null;
  }
  return data;
};

// Daily Checkins
export const getTodayCheckin = async (userId: string): Promise<DailyCheckin | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;

  const today = getTodayDate();
  const { data, error } = await supabase
    .from('daily_checkins')
    .select('*')
    .eq('user_id', userId)
    .eq('checkin_date', today)
    .single();

  if (error) {
    console.log('Error fetching today checkin:', error.message);
    return null;
  }
  return data;
};

export const upsertDailyCheckin = async (checkin: Partial<DailyCheckin> & { user_id: string; checkin_date: string }): Promise<DailyCheckin | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('daily_checkins')
    .upsert({ ...checkin, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    console.log('Error upserting checkin:', error.message);
    return null;
  }
  return data;
};

export const getOrCreateTodayCheckin = async (userId: string): Promise<DailyCheckin | null> => {
  let checkin = await getTodayCheckin(userId);
  if (!checkin) {
    checkin = await upsertDailyCheckin({
      user_id: userId,
      checkin_date: getTodayDate(),
      total_calories_consumed: 0,
      water_intake_ml: 0,
      sleep_hours: null,
      steps_count: null,
    });
  }
  return checkin;
};

// Activities (for exercise chart)
export const getActivitiesLastNDays = async (userId: string, days: number): Promise<Activity[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];

  const dates = getLastNDays(days);
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  const { data, error } = await supabase
    .from('activities')
    .select('*, daily_checkins!inner(checkin_date)')
    .eq('user_id', userId)
    .gte('daily_checkins.checkin_date', startDate)
    .lte('daily_checkins.checkin_date', endDate)
    .order('created_at', { ascending: true });

  if (error) {
    console.log('Error fetching activities:', error.message);
    return [];
  }
  return data || [];
};

export const insertActivity = async (activity: Omit<Activity, 'id' | 'created_at'>): Promise<Activity | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('activities')
    .insert(activity)
    .select()
    .single();

  if (error) {
    console.log('Error inserting activity:', error.message);
    return null;
  }
  return data;
};

// Meals
export const getMealsForCheckin = async (checkinId: string): Promise<Meal[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('checkin_id', checkinId);

  if (error) {
    console.log('Error fetching meals:', error.message);
    return [];
  }
  return data || [];
};

export const insertMeal = async (meal: Omit<Meal, 'id' | 'created_at'>): Promise<Meal | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('meals')
    .insert(meal)
    .select()
    .single();

  if (error) {
    console.log('Error inserting meal:', error.message);
    return null;
  }
  return data;
};

// Get daily checkins for multiple dates (for chart data)
export const getCheckinsForDates = async (userId: string, dates: string[]): Promise<DailyCheckin[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('daily_checkins')
    .select('*')
    .eq('user_id', userId)
    .in('checkin_date', dates)
    .order('checkin_date', { ascending: true });

  if (error) {
    console.log('Error fetching checkins:', error.message);
    return [];
  }
  return data || [];
};
