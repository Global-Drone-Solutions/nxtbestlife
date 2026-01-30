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
  
  // Date-based state
  selectedDate: string; // YYYY-MM-DD format
  selectedCheckin: DailyCheckin | null;
  selectedMeals: Meal[];
  
  recentActivities: Activity[];
  chartData: { date: string; calories: number }[];
  isLoading: boolean;
  
  // Actions
  setSelectedDate: (date: string) => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  
  loadUserData: (userId: string) => Promise<void>;
  loadCheckinByDate: (userId: string, date: string) => Promise<void>;
  loadMealsForCheckin: (checkinId: string) => Promise<void>;
  loadChartData: (userId: string) => Promise<void>;
  
  updateWater: (userId: string, amount: number) => Promise<void>;
  updateSleep: (userId: string, hours: number) => Promise<void>;
  saveMeals: (userId: string, meals: MealInputs) => Promise<void>;
  saveProfile: (profile: Partial<UserProfile> & { user_id: string }) => Promise<void>;
  saveGoal: (goal: Partial<UserGoal> & { user_id: string }) => Promise<void>;
  addActivity: (userId: string, activity: { type: string; duration: number; calories: number }) => Promise<void>;
  refreshData: (userId: string) => Promise<void>;
  
  // Legacy compatibility
  todayCheckin: DailyCheckin | null;
  todayMeals: Meal[];
  loadTodayCheckin: (userId: string) => Promise<void>;
  loadTodayMeals: (checkinId: string) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  profile: null,
  goal: null,
  
  // Date-based state - default to today
  selectedDate: db.getTodayDate(),
  selectedCheckin: null,
  selectedMeals: [],
  
  recentActivities: [],
  chartData: [],
  isLoading: false,

  // Date navigation
  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
  },

  goToPreviousDay: () => {
    const { selectedDate } = get();
    const currentDate = new Date(selectedDate + 'T00:00:00');
    currentDate.setDate(currentDate.getDate() - 1);
    const newDate = currentDate.toISOString().split('T')[0];
    set({ selectedDate: newDate });
  },

  goToNextDay: () => {
    const { selectedDate } = get();
    const today = db.getTodayDate();
    
    // Don't go beyond today
    if (selectedDate >= today) return;
    
    const currentDate = new Date(selectedDate + 'T00:00:00');
    currentDate.setDate(currentDate.getDate() + 1);
    const newDate = currentDate.toISOString().split('T')[0];
    set({ selectedDate: newDate });
  },

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

  loadCheckinByDate: async (userId: string, date: string) => {
    try {
      const checkin = await db.getOrCreateCheckinByDate(userId, date);
      set({ selectedCheckin: checkin });
      
      // Also load meals for this checkin
      if (checkin) {
        await get().loadMealsForCheckin(checkin.id);
      }
    } catch (err) {
      console.log('Error loading checkin for date:', err);
    }
  },

  loadMealsForCheckin: async (checkinId: string) => {
    try {
      const meals = await db.getMealsForCheckin(checkinId);
      set({ selectedMeals: meals });
    } catch (err) {
      console.log('Error loading meals:', err);
    }
  },

  // Legacy compatibility - maps to selectedCheckin/selectedMeals
  get todayCheckin() {
    return get().selectedCheckin;
  },
  
  get todayMeals() {
    return get().selectedMeals;
  },

  loadTodayCheckin: async (userId: string) => {
    const today = db.getTodayDate();
    set({ selectedDate: today });
    await get().loadCheckinByDate(userId, today);
  },

  loadTodayMeals: async (checkinId: string) => {
    await get().loadMealsForCheckin(checkinId);
  },

  loadChartData: async (userId: string) => {
    try {
      const dates = db.getLastNDays(7);
      const checkins = await db.getCheckinsForDates(userId, dates);
      const activities = await db.getActivitiesLastNDays(userId, 7);

      // Aggregate activities by checkin_id (sum calories for same day)
      const activityCaloriesByCheckin: Record<string, number> = {};
      activities.forEach(a => {
        const checkinId = a.checkin_id;
        const calories = a.calories_burned || 0;
        activityCaloriesByCheckin[checkinId] = (activityCaloriesByCheckin[checkinId] || 0) + calories;
      });

      // Create chart data
      const chartData = dates.map(date => {
        const checkin = checkins.find(c => c.checkin_date === date);
        let calories = 0;
        if (checkin && activityCaloriesByCheckin[checkin.id]) {
          calories = activityCaloriesByCheckin[checkin.id];
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
    const { selectedDate, selectedCheckin } = get();
    if (!selectedCheckin) return;

    const updated = await db.updateWaterByDate(userId, selectedDate, amount);
    if (updated) {
      set({ selectedCheckin: updated });
    }
  },

  updateSleep: async (userId: string, hours: number) => {
    const { selectedDate, selectedCheckin } = get();
    if (!selectedCheckin) return;

    const updated = await db.updateSleepByDate(userId, selectedDate, hours);
    if (updated) {
      set({ selectedCheckin: updated });
    }
  },

  saveMeals: async (userId: string, meals: MealInputs) => {
    const { selectedDate } = get();
    
    const { checkin, meals: savedMeals } = await db.saveMealsByDate(userId, selectedDate, meals);
    
    if (checkin) {
      set({ selectedCheckin: checkin, selectedMeals: savedMeals });
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
    const { selectedDate } = get();
    
    await db.addActivityByDate(userId, selectedDate, activity);

    // Reload chart data
    await get().loadChartData(userId);
  },

  refreshData: async (userId: string) => {
    const { selectedDate } = get();
    await Promise.all([
      get().loadUserData(userId),
      get().loadCheckinByDate(userId, selectedDate),
      get().loadChartData(userId),
    ]);
  },
}));
