import { create } from 'zustand';
import { UserProfile, UserGoal, DailyCheckin, Activity, Meal } from '../types/db';
import * as db from '../lib/db';

interface MealInputs {
  breakfast: number;
  lunch: number;
  dinner: number;
  snacks: number;
}

interface DataState {
  profile: UserProfile | null;
  goal: UserGoal | null;
  todayCheckin: DailyCheckin | null;
  todayMeals: Meal[];
  recentActivities: Activity[];
  chartData: { date: string; calories: number }[];
  isLoading: boolean;
  
  loadUserData: (userId: string) => Promise<void>;
  loadTodayCheckin: (userId: string) => Promise<void>;
  loadTodayMeals: (checkinId: string) => Promise<void>;
  loadChartData: (userId: string) => Promise<void>;
  updateWater: (userId: string, amount: number) => Promise<void>;
  updateSleep: (userId: string, hours: number) => Promise<void>;
  updateCalories: (userId: string, calories: number) => Promise<void>;
  saveMeals: (userId: string, meals: MealInputs) => Promise<void>;
  saveProfile: (profile: Partial<UserProfile> & { user_id: string }) => Promise<void>;
  saveGoal: (goal: Partial<UserGoal> & { user_id: string }) => Promise<void>;
  addActivity: (userId: string, activity: { type: string; duration: number; calories: number }) => Promise<void>;
  refreshData: (userId: string) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  profile: null,
  goal: null,
  todayCheckin: null,
  todayMeals: [],
  recentActivities: [],
  chartData: [],
  isLoading: false,

  loadUserData: async (userId: string) => {
    set({ isLoading: true });
    try {
      const [profile, goal] = await Promise.all([
        db.getUserProfile(userId),
        db.getUserGoal(userId),
      ]);
      set({ profile, goal });
    } catch (err) {
      console.log('Error loading user data:', err);
    }
    set({ isLoading: false });
  },

  loadTodayCheckin: async (userId: string) => {
    try {
      const checkin = await db.getOrCreateTodayCheckin(userId);
      set({ todayCheckin: checkin });
      
      // Also load meals for today's checkin
      if (checkin) {
        await get().loadTodayMeals(checkin.id);
      }
    } catch (err) {
      console.log('Error loading today checkin:', err);
    }
  },

  loadTodayMeals: async (checkinId: string) => {
    try {
      const meals = await db.getMealsForCheckin(checkinId);
      set({ todayMeals: meals });
    } catch (err) {
      console.log('Error loading today meals:', err);
    }
  },

  loadChartData: async (userId: string) => {
    try {
      const dates = db.getLastNDays(7);
      const checkins = await db.getCheckinsForDates(userId, dates);
      const activities = await db.getActivitiesLastNDays(userId, 7);

      // Map activities by checkin_id with type annotation
      const activityByCheckin: Record<string, Activity> = {};
      activities.forEach(a => {
        activityByCheckin[a.checkin_id] = a;
      });

      // Create chart data
      const chartData = dates.map(date => {
        const checkin = checkins.find(c => c.checkin_date === date);
        let calories = 0;
        if (checkin && activityByCheckin[checkin.id]) {
          calories = activityByCheckin[checkin.id].calories_burned || 0;
        }
        return {
          date: date.slice(5), // MM-DD format
          calories,
        };
      });

      set({ chartData, recentActivities: activities });
    } catch (err) {
      console.log('Error loading chart data:', err);
    }
  },

  updateWater: async (userId: string, amount: number) => {
    const { todayCheckin } = get();
    if (!todayCheckin) return;

    const newAmount = (todayCheckin.water_intake_ml || 0) + amount;
    const updated = await db.upsertDailyCheckin({
      ...todayCheckin,
      user_id: userId,
      water_intake_ml: newAmount,
    });
    if (updated) {
      set({ todayCheckin: updated });
    }
  },

  updateSleep: async (userId: string, hours: number) => {
    const { todayCheckin } = get();
    if (!todayCheckin) return;

    const updated = await db.upsertDailyCheckin({
      ...todayCheckin,
      user_id: userId,
      sleep_hours: hours,
    });
    if (updated) {
      set({ todayCheckin: updated });
    }
  },

  updateCalories: async (userId: string, calories: number) => {
    const { todayCheckin } = get();
    if (!todayCheckin) return;

    const updated = await db.upsertDailyCheckin({
      ...todayCheckin,
      user_id: userId,
      total_calories_consumed: calories,
    });
    if (updated) {
      set({ todayCheckin: updated });
    }
  },

  saveProfile: async (profile: Partial<UserProfile> & { user_id: string }) => {
    const updated = await db.upsertUserProfile(profile);
    if (updated) {
      set({ profile: updated });
    }
  },

  saveGoal: async (goal: Partial<UserGoal> & { user_id: string }) => {
    const updated = await db.upsertUserGoal({ ...goal, is_active: true });
    if (updated) {
      set({ goal: updated });
    }
  },

  addActivity: async (userId: string, activity: { type: string; duration: number; calories: number }) => {
    const { todayCheckin } = get();
    if (!todayCheckin) return;

    await db.insertActivity({
      user_id: userId,
      checkin_id: todayCheckin.id,
      activity_type: activity.type,
      duration_minutes: activity.duration,
      calories_burned: activity.calories,
    });

    // Reload chart data
    await get().loadChartData(userId);
  },

  refreshData: async (userId: string) => {
    await Promise.all([
      get().loadUserData(userId),
      get().loadTodayCheckin(userId),
      get().loadChartData(userId),
    ]);
  },
}));
