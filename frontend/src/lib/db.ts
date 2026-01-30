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

// Format date for display (e.g., "Jan 30 · Fri")
export const formatDateDisplay = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  const today = getTodayDate();
  
  if (dateStr === today) {
    return 'Today';
  }
  
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', weekday: 'short' };
  const formatted = date.toLocaleDateString('en-US', options);
  // Convert "Fri, Jan 30" to "Jan 30 · Fri"
  const parts = formatted.split(', ');
  if (parts.length === 2) {
    return `${parts[1]} · ${parts[0]}`;
  }
  return formatted;
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

  // First, deactivate all existing goals for this user
  await supabase
    .from('user_goals')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', goal.user_id)
    .eq('is_active', true);

  // Then insert the new goal as active
  const { data, error } = await supabase
    .from('user_goals')
    .insert({ ...goal, is_active: true, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    console.log('Error inserting goal:', error.message);
    return null;
  }
  return data;
};

// ============================================
// Daily Checkins - Date-based functions
// ============================================

// Get checkin by specific date
export const getCheckinByDate = async (userId: string, date: string): Promise<DailyCheckin | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('daily_checkins')
    .select('*')
    .eq('user_id', userId)
    .eq('checkin_date', date)
    .single();

  if (error) {
    console.log('Error fetching checkin for date:', error.message);
    return null;
  }
  return data;
};

// Get or create checkin for a specific date
export const getOrCreateCheckinByDate = async (userId: string, date: string): Promise<DailyCheckin | null> => {
  let checkin = await getCheckinByDate(userId, date);
  if (!checkin) {
    checkin = await upsertDailyCheckin({
      user_id: userId,
      checkin_date: date,
      total_calories_consumed: 0,
      water_intake_ml: 0,
      sleep_hours: null,
      steps_count: null,
    });
  }
  return checkin;
};

// Legacy: Get today's checkin
export const getTodayCheckin = async (userId: string): Promise<DailyCheckin | null> => {
  return getCheckinByDate(userId, getTodayDate());
};

export const upsertDailyCheckin = async (checkin: Partial<DailyCheckin> & { user_id: string; checkin_date: string }): Promise<DailyCheckin | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('daily_checkins')
    .upsert(
      { ...checkin, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,checkin_date' }
    )
    .select()
    .single();

  if (error) {
    console.log('Error upserting checkin:', error.message);
    return null;
  }
  return data;
};

// Legacy: Get or create today's checkin
export const getOrCreateTodayCheckin = async (userId: string): Promise<DailyCheckin | null> => {
  return getOrCreateCheckinByDate(userId, getTodayDate());
};

// ============================================
// Activities (for exercise chart)
// ============================================

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

// Add activity by date (get/create checkin first)
export const addActivityByDate = async (
  userId: string, 
  date: string, 
  activity: { type: string; duration: number; calories: number }
): Promise<Activity | null> => {
  const checkin = await getOrCreateCheckinByDate(userId, date);
  if (!checkin) return null;

  return insertActivity({
    user_id: userId,
    checkin_id: checkin.id,
    activity_type: activity.type,
    duration_minutes: activity.duration,
    calories_burned: activity.calories,
  });
};

// ============================================
// Meals
// ============================================

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

// Upsert meals for a checkin - deletes existing meals and inserts new ones
export const upsertMeals = async (
  userId: string,
  checkinId: string,
  meals: { breakfast: number; lunch: number; dinner: number; snacks: number }
): Promise<Meal[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];

  // Delete existing meals for this checkin
  await supabase
    .from('meals')
    .delete()
    .eq('checkin_id', checkinId);

  // Prepare new meal records (only insert if calories > 0)
  const mealRecords: Omit<Meal, 'id' | 'created_at'>[] = [];
  
  if (meals.breakfast > 0) {
    mealRecords.push({ user_id: userId, checkin_id: checkinId, meal_type: 'breakfast', estimated_calories: meals.breakfast });
  }
  if (meals.lunch > 0) {
    mealRecords.push({ user_id: userId, checkin_id: checkinId, meal_type: 'lunch', estimated_calories: meals.lunch });
  }
  if (meals.dinner > 0) {
    mealRecords.push({ user_id: userId, checkin_id: checkinId, meal_type: 'dinner', estimated_calories: meals.dinner });
  }
  if (meals.snacks > 0) {
    mealRecords.push({ user_id: userId, checkin_id: checkinId, meal_type: 'snack', estimated_calories: meals.snacks });
  }

  if (mealRecords.length === 0) return [];

  const { data, error } = await supabase
    .from('meals')
    .insert(mealRecords)
    .select();

  if (error) {
    console.log('Error upserting meals:', error.message);
    return [];
  }
  return data || [];
};

// Save meals by date (get/create checkin first)
export const saveMealsByDate = async (
  userId: string,
  date: string,
  meals: { breakfast: number; lunch: number; dinner: number; snacks: number }
): Promise<{ checkin: DailyCheckin | null; meals: Meal[] }> => {
  const checkin = await getOrCreateCheckinByDate(userId, date);
  if (!checkin) return { checkin: null, meals: [] };

  // Calculate total calories
  const total = meals.breakfast + meals.lunch + meals.dinner + meals.snacks;

  // Update checkin with total calories
  const updatedCheckin = await upsertDailyCheckin({
    ...checkin,
    user_id: userId,
    checkin_date: date,
    total_calories_consumed: total,
  });

  // Write individual meal records
  const savedMeals = await upsertMeals(userId, checkin.id, meals);

  return { checkin: updatedCheckin, meals: savedMeals };
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

// ============================================
// Date-based water update
// ============================================
export const updateWaterByDate = async (
  userId: string,
  date: string,
  amount: number
): Promise<DailyCheckin | null> => {
  const checkin = await getOrCreateCheckinByDate(userId, date);
  if (!checkin) return null;

  const newAmount = (checkin.water_intake_ml || 0) + amount;
  return upsertDailyCheckin({
    ...checkin,
    user_id: userId,
    checkin_date: date,
    water_intake_ml: newAmount,
  });
};

// ============================================
// Date-based sleep update
// ============================================
export const updateSleepByDate = async (
  userId: string,
  date: string,
  hours: number
): Promise<DailyCheckin | null> => {
  const checkin = await getOrCreateCheckinByDate(userId, date);
  if (!checkin) return null;

  return upsertDailyCheckin({
    ...checkin,
    user_id: userId,
    checkin_date: date,
    sleep_hours: hours,
  });
};
