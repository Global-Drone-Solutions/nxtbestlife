import AsyncStorage from '@react-native-async-storage/async-storage';

// Check if offline demo mode is enabled
export const isOfflineDemoEnabled = (): boolean => {
  return process.env.EXPO_PUBLIC_OFFLINE_DEMO === 'true';
};

// Storage keys
const STORAGE_KEYS = {
  PROFILE: '@fittrack_offline_profile',
  GOAL: '@fittrack_offline_goal',
  TODAY_CHECKIN: '@fittrack_offline_today',
  CHART_DATA: '@fittrack_offline_chart',
  INITIALIZED: '@fittrack_offline_init',
};

// Types
export interface OfflineProfile {
  height_cm: number;
  current_weight_kg: number;
  age: number;
  activity_level: string;
}

export interface OfflineGoal {
  target_weight_kg: number;
  daily_calorie_target: number;
  daily_water_goal_ml: number;
  sleep_goal_hours: number;
}

export interface OfflineCheckin {
  date: string;
  total_calories_consumed: number;
  breakfast_calories: number;
  lunch_calories: number;
  dinner_calories: number;
  snacks_calories: number;
  water_intake_ml: number;
  sleep_hours: number;
  activities: Array<{
    type: string;
    duration: number;
    calories: number;
  }>;
}

export interface OfflineChartData {
  date: string;
  calories_burned: number;
}

// Get today's date string
const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Get last 7 days dates
const getLast7Days = (): string[] => {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

// Default data
const DEFAULT_PROFILE: OfflineProfile = {
  height_cm: 180,
  current_weight_kg: 80,
  age: 30,
  activity_level: 'moderate',
};

const DEFAULT_GOAL: OfflineGoal = {
  target_weight_kg: 72,
  daily_calorie_target: 2000,
  daily_water_goal_ml: 2000,
  sleep_goal_hours: 8,
};

const createDefaultCheckin = (): OfflineCheckin => ({
  date: getTodayDate(),
  total_calories_consumed: 850,
  breakfast_calories: 350,
  lunch_calories: 500,
  dinner_calories: 0,
  snacks_calories: 0,
  water_intake_ml: 750,
  sleep_hours: 7.5,
  activities: [
    { type: 'walk', duration: 30, calories: 150 },
  ],
});

const createDefaultChartData = (): OfflineChartData[] => {
  const dates = getLast7Days();
  const exerciseData = [
    { calories: 280 },
    { calories: 420 },
    { calories: 350 },
    { calories: 180 },
    { calories: 450 },
    { calories: 320 },
    { calories: 150 }, // Today (will be updated)
  ];
  
  return dates.map((date, i) => ({
    date,
    calories_burned: exerciseData[i].calories,
  }));
};

// Initialize offline demo data
export const initOfflineDemo = async (): Promise<boolean> => {
  try {
    const initialized = await AsyncStorage.getItem(STORAGE_KEYS.INITIALIZED);
    
    if (!initialized) {
      // First time - set all default data
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
      await AsyncStorage.setItem(STORAGE_KEYS.GOAL, JSON.stringify(DEFAULT_GOAL));
      await AsyncStorage.setItem(STORAGE_KEYS.TODAY_CHECKIN, JSON.stringify(createDefaultCheckin()));
      await AsyncStorage.setItem(STORAGE_KEYS.CHART_DATA, JSON.stringify(createDefaultChartData()));
      await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      console.log('[Offline] Demo data initialized');
    } else {
      // Check if today's checkin date matches
      const checkinStr = await AsyncStorage.getItem(STORAGE_KEYS.TODAY_CHECKIN);
      if (checkinStr) {
        const checkin = JSON.parse(checkinStr) as OfflineCheckin;
        if (checkin.date !== getTodayDate()) {
          // New day - reset today's checkin but keep totals minimal
          const newCheckin = createDefaultCheckin();
          newCheckin.total_calories_consumed = 0;
          newCheckin.breakfast_calories = 0;
          newCheckin.lunch_calories = 0;
          newCheckin.dinner_calories = 0;
          newCheckin.snacks_calories = 0;
          newCheckin.water_intake_ml = 0;
          newCheckin.activities = [];
          await AsyncStorage.setItem(STORAGE_KEYS.TODAY_CHECKIN, JSON.stringify(newCheckin));
        }
      }
      console.log('[Offline] Demo data already exists');
    }
    return true;
  } catch (error) {
    console.error('[Offline] Error initializing:', error);
    return false;
  }
};

// Reset all offline data
export const resetOfflineDemo = async (): Promise<boolean> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PROFILE,
      STORAGE_KEYS.GOAL,
      STORAGE_KEYS.TODAY_CHECKIN,
      STORAGE_KEYS.CHART_DATA,
      STORAGE_KEYS.INITIALIZED,
    ]);
    return await initOfflineDemo();
  } catch (error) {
    console.error('[Offline] Error resetting:', error);
    return false;
  }
};

// Profile operations
export const getOfflineProfile = async (): Promise<OfflineProfile> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
    return data ? JSON.parse(data) : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
};

export const saveOfflineProfile = async (profile: OfflineProfile): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
};

// Goal operations
export const getOfflineGoal = async (): Promise<OfflineGoal> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.GOAL);
    return data ? JSON.parse(data) : DEFAULT_GOAL;
  } catch {
    return DEFAULT_GOAL;
  }
};

export const saveOfflineGoal = async (goal: OfflineGoal): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.GOAL, JSON.stringify(goal));
};

// Today's checkin operations
export const getOfflineTodayCheckin = async (): Promise<OfflineCheckin> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TODAY_CHECKIN);
    if (data) {
      const checkin = JSON.parse(data) as OfflineCheckin;
      // Ensure date is today
      if (checkin.date !== getTodayDate()) {
        const newCheckin = createDefaultCheckin();
        newCheckin.total_calories_consumed = 0;
        newCheckin.breakfast_calories = 0;
        newCheckin.lunch_calories = 0;
        newCheckin.dinner_calories = 0;
        newCheckin.snacks_calories = 0;
        newCheckin.water_intake_ml = 0;
        newCheckin.activities = [];
        await AsyncStorage.setItem(STORAGE_KEYS.TODAY_CHECKIN, JSON.stringify(newCheckin));
        return newCheckin;
      }
      return checkin;
    }
    return createDefaultCheckin();
  } catch {
    return createDefaultCheckin();
  }
};

export const saveOfflineTodayCheckin = async (checkin: OfflineCheckin): Promise<void> => {
  checkin.date = getTodayDate();
  // Recalculate total calories
  checkin.total_calories_consumed = 
    checkin.breakfast_calories + 
    checkin.lunch_calories + 
    checkin.dinner_calories + 
    checkin.snacks_calories;
  await AsyncStorage.setItem(STORAGE_KEYS.TODAY_CHECKIN, JSON.stringify(checkin));
};

// Water quick add
export const addOfflineWater = async (amount: number): Promise<OfflineCheckin> => {
  const checkin = await getOfflineTodayCheckin();
  checkin.water_intake_ml += amount;
  await saveOfflineTodayCheckin(checkin);
  return checkin;
};

// Update sleep
export const updateOfflineSleep = async (hours: number): Promise<OfflineCheckin> => {
  const checkin = await getOfflineTodayCheckin();
  checkin.sleep_hours = hours;
  await saveOfflineTodayCheckin(checkin);
  return checkin;
};

// Add activity
export const addOfflineActivity = async (activity: { type: string; duration: number; calories: number }): Promise<OfflineCheckin> => {
  const checkin = await getOfflineTodayCheckin();
  checkin.activities.push(activity);
  await saveOfflineTodayCheckin(checkin);
  
  // Update chart data for today
  const chartData = await getOfflineChartData();
  const today = getTodayDate();
  const todayIndex = chartData.findIndex(d => d.date === today);
  if (todayIndex >= 0) {
    chartData[todayIndex].calories_burned += activity.calories;
  } else {
    chartData.push({ date: today, calories_burned: activity.calories });
  }
  await AsyncStorage.setItem(STORAGE_KEYS.CHART_DATA, JSON.stringify(chartData));
  
  return checkin;
};

// Chart data operations
export const getOfflineChartData = async (): Promise<OfflineChartData[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CHART_DATA);
    if (data) {
      const chartData = JSON.parse(data) as OfflineChartData[];
      // Filter to last 7 days
      const last7 = getLast7Days();
      return last7.map(date => {
        const found = chartData.find(d => d.date === date);
        return found || { date, calories_burned: 0 };
      });
    }
    return createDefaultChartData();
  } catch {
    return createDefaultChartData();
  }
};

// Update meals
export const updateOfflineMeals = async (meals: {
  breakfast: number;
  lunch: number;
  dinner: number;
  snacks: number;
}): Promise<OfflineCheckin> => {
  const checkin = await getOfflineTodayCheckin();
  checkin.breakfast_calories = meals.breakfast;
  checkin.lunch_calories = meals.lunch;
  checkin.dinner_calories = meals.dinner;
  checkin.snacks_calories = meals.snacks;
  await saveOfflineTodayCheckin(checkin);
  return checkin;
};
