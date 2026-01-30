import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LineChart } from 'react-native-gifted-charts';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { useDataStore } from '../../src/store/dataStore';
import { GlassCard } from '../../src/components/GlassCard';
import { ProgressBar } from '../../src/components/ProgressBar';
import { QuickAddButtons } from '../../src/components/QuickAddButtons';
import { getTodayDate, formatDateDisplay } from '../../src/lib/db';
import { 
  isOfflineDemoEnabled, 
  getOfflineGoal, 
  getOfflineTodayCheckin, 
  getOfflineChartData,
  addOfflineWater,
  OfflineGoal,
  OfflineCheckin,
  OfflineChartData,
} from '../../src/lib/offlineStore';

export default function DashboardScreen() {
  const { theme, isDark, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const { 
    profile, 
    goal, 
    selectedDate,
    selectedCheckin,
    chartData, 
    isLoading,
    setSelectedDate,
    goToPreviousDay,
    goToNextDay,
    loadUserData,
    loadCheckinByDate,
    loadChartData,
    updateWater,
    refreshData,
  } = useDataStore();

  const [refreshing, setRefreshing] = useState(false);
  
  // Memoize isOffline to prevent recalculation on every render
  const isOffline = useMemo(() => isOfflineDemoEnabled(), []);
  
  const today = getTodayDate();
  // Normalize selectedDate for comparison (strip time component if present)
  const normalizedSelectedDate = selectedDate.split('T')[0];
  const isToday = normalizedSelectedDate === today;
  const canGoNext = normalizedSelectedDate < today;
  
  // Debug logging
  console.log('[DateBar Debug]', { selectedDate, normalizedSelectedDate, today, isToday, canGoNext, isOffline });

  // Offline state
  const [offlineGoal, setOfflineGoal] = useState<OfflineGoal | null>(null);
  const [offlineCheckin, setOfflineCheckin] = useState<OfflineCheckin | null>(null);
  const [offlineChartData, setOfflineChartData] = useState<OfflineChartData[]>([]);
  
  // Track the last loaded date to avoid redundant loads
  const lastLoadedDateRef = useRef<string | null>(null);
  // Track if user data (profile/goal) has been loaded
  const userDataLoadedRef = useRef(false);
  // Track if currently loading
  const loadingRef = useRef(false);

  const loadOfflineData = useCallback(async () => {
    const [goalData, checkinData, chartDataArr] = await Promise.all([
      getOfflineGoal(),
      getOfflineTodayCheckin(),
      getOfflineChartData(),
    ]);
    setOfflineGoal(goalData);
    setOfflineCheckin(checkinData);
    setOfflineChartData(chartDataArr);
  }, []);

  // Combined effect: handles initial load and date changes
  useEffect(() => {
    console.log('[Dashboard Effect]', { isOffline, userId: user?.id, normalizedSelectedDate, loadingRef: loadingRef.current, lastLoadedDate: lastLoadedDateRef.current });
    
    // Skip if offline mode
    if (isOffline) {
      loadOfflineData();
      return;
    }
    
    // Skip if no user
    if (!user?.id) return;
    
    // Prevent concurrent loads
    if (loadingRef.current) {
      console.log('[Dashboard Effect] Skipping - already loading');
      return;
    }
    
    // Check if we need to load user data (only once per session)
    const needsUserData = !userDataLoadedRef.current;
    
    // Check if we need to load checkin for current date
    const needsCheckinData = lastLoadedDateRef.current !== normalizedSelectedDate;
    
    console.log('[Dashboard Effect] Needs', { needsUserData, needsCheckinData });
    
    // Skip if nothing needs to be loaded
    if (!needsUserData && !needsCheckinData) {
      console.log('[Dashboard Effect] Skipping - nothing to load');
      return;
    }
    
    // Mark as loading
    loadingRef.current = true;
    console.log('[Dashboard Effect] Starting load');
    
    // Execute async operations
    (async () => {
      try {
        // Load user profile and goal only once
        if (needsUserData) {
          await loadUserData(user.id);
          await loadChartData(user.id);
          userDataLoadedRef.current = true;
        }
        
        // Load checkin for current date
        if (needsCheckinData) {
          await loadCheckinByDate(user.id, normalizedSelectedDate);
          lastLoadedDateRef.current = normalizedSelectedDate;
        }
        console.log('[Dashboard Effect] Load complete');
      } finally {
        loadingRef.current = false;
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isOffline, normalizedSelectedDate]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (isOffline) {
      await loadOfflineData();
    } else if (user?.id) {
      // Reset the refs to force reload
      userDataLoadedRef.current = false;
      lastLoadedDateRef.current = null;
      await refreshData(user.id);
      userDataLoadedRef.current = true;
      lastLoadedDateRef.current = normalizedSelectedDate;
    }
    setRefreshing(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isOffline, normalizedSelectedDate]);

  const handleAddWater = async (amount: number) => {
    if (isOffline) {
      const updated = await addOfflineWater(amount);
      setOfflineCheckin(updated);
    } else if (user?.id) {
      await updateWater(user.id, amount);
    }
  };

  const handlePreviousDay = () => {
    if (!isOffline) {
      goToPreviousDay();
    }
  };

  const handleNextDay = () => {
    if (!isOffline && canGoNext) {
      goToNextDay();
    }
  };

  // Use offline or online data
  const currentGoal = isOffline ? offlineGoal : goal;
  const currentCheckin = isOffline ? offlineCheckin : selectedCheckin;

  // Calculate calories
  const targetCalories = currentGoal?.daily_calorie_target || 2000;
  const consumedCalories = currentCheckin?.total_calories_consumed || 0;
  const remainingCalories = targetCalories - consumedCalories;
  const caloriesProgress = consumedCalories / targetCalories;

  // Water
  const waterGoal = currentGoal?.daily_water_goal_ml || 2000;
  const waterIntake = currentCheckin?.water_intake_ml || 0;
  const waterProgress = waterIntake / waterGoal;

  // Sleep
  const sleepGoal = currentGoal?.sleep_goal_hours || 8;
  const sleepHours = currentCheckin?.sleep_hours || 0;
  const sleepProgress = sleepHours / sleepGoal;

  // Chart data
  const lineData = isOffline 
    ? offlineChartData.map(d => ({
        value: d.calories_burned,
        label: d.date.slice(5), // MM-DD format
        labelTextStyle: { color: theme.textMuted, fontSize: 10 },
      }))
    : chartData.map(d => ({
        value: d.calories,
        label: d.date,
        labelTextStyle: { color: theme.textMuted, fontSize: 10 },
      }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Dashboard</Text>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
          <Ionicons 
            name={isDark ? 'sunny' : 'moon'} 
            size={24} 
            color={theme.text} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Offline Demo Banner */}
        {isOffline && (
          <View style={[styles.offlineBanner, { backgroundColor: theme.warning + '20', borderColor: theme.warning }]}>
            <Ionicons name="cloud-offline" size={16} color={theme.warning} />
            <Text style={[styles.offlineBannerText, { color: theme.warning }]}>
              Offline Demo (no cloud)
            </Text>
          </View>
        )}

        {/* Calories Card */}
        <GlassCard style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="flame" size={24} color={theme.warning} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Calories</Text>
            </View>
            <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/checkin', params: { date: selectedDate } })}>
              <Text style={[styles.addLink, { color: theme.primary }]}>+ Add Meal</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.caloriesFormula}>
            <View style={styles.calorieItem}>
              <Text style={[styles.calorieValue, { color: theme.text }]}>{targetCalories}</Text>
              <Text style={[styles.calorieLabel, { color: theme.textMuted }]}>Target</Text>
            </View>
            <Text style={[styles.calorieOperator, { color: theme.textSecondary }]}>-</Text>
            <View style={styles.calorieItem}>
              <Text style={[styles.calorieValue, { color: theme.warning }]}>{consumedCalories}</Text>
              <Text style={[styles.calorieLabel, { color: theme.textMuted }]}>Consumed</Text>
            </View>
            <Text style={[styles.calorieOperator, { color: theme.textSecondary }]}>=</Text>
            <View style={styles.calorieItem}>
              <Text style={[styles.calorieValue, { color: remainingCalories >= 0 ? theme.success : theme.error }]}>
                {remainingCalories}
              </Text>
              <Text style={[styles.calorieLabel, { color: theme.textMuted }]}>Remaining</Text>
            </View>
          </View>
          
          <ProgressBar 
            progress={caloriesProgress} 
            height={10} 
            color={caloriesProgress > 1 ? theme.error : theme.warning} 
          />
        </GlassCard>

        {/* Date Navigation Bar */}
        <View style={[styles.dateBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity 
            style={[styles.dateNavButton, { backgroundColor: theme.background }]}
            onPress={handlePreviousDay}
            disabled={isOffline}
          >
            <Ionicons 
              name="chevron-back" 
              size={20} 
              color={isOffline ? theme.textMuted : theme.primary} 
            />
          </TouchableOpacity>
          
          <View style={styles.dateLabelContainer}>
            <Ionicons name="calendar-outline" size={16} color={theme.primary} />
            <Text style={[styles.dateLabel, { color: theme.text }]}>
              {formatDateDisplay(normalizedSelectedDate)}
            </Text>
            {isOffline && (
              <Text style={[styles.offlineHint, { color: theme.warning }]}> (offline)</Text>
            )}
          </View>
          
          <TouchableOpacity 
            style={[
              styles.dateNavButton, 
              { backgroundColor: (canGoNext && !isOffline) ? theme.background : theme.border },
            ]}
            onPress={handleNextDay}
            disabled={!canGoNext || isOffline}
          >
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={(canGoNext && !isOffline) ? theme.primary : theme.textMuted} 
            />
          </TouchableOpacity>
        </View>

        {/* Offline hint */}
        {isOffline && (
          <Text style={[styles.offlineDateHint, { color: theme.warning }]}>
            Offline mode: only today's data available
          </Text>
        )}

        {/* Water Card */}
        <GlassCard style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="water" size={24} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Water</Text>
            </View>
            <Text style={[styles.cardValue, { color: theme.text }]}>
              {waterIntake} / {waterGoal} ml
            </Text>
          </View>
          
          <ProgressBar progress={waterProgress} height={8} color={theme.primary} />
          <QuickAddButtons amounts={[250, 500]} unit="ml" onAdd={handleAddWater} />
        </GlassCard>

        {/* Sleep Card */}
        <GlassCard style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="moon" size={24} color={theme.accent} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Sleep</Text>
            </View>
            <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/checkin', params: { date: selectedDate } })}>
              <Ionicons name="pencil" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.sleepRow}>
            <Text style={[styles.sleepValue, { color: theme.text }]}>
              {sleepHours.toFixed(1)}h
            </Text>
            <Text style={[styles.sleepGoal, { color: theme.textMuted }]}>
              of {sleepGoal}h goal
            </Text>
          </View>
          
          <ProgressBar progress={sleepProgress} height={8} color={theme.accent} />
        </GlassCard>

        {/* Exercise Chart Card */}
        <GlassCard style={[styles.card, styles.chartCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="barbell" size={24} color={theme.secondary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Exercise (7 Days)</Text>
            </View>
          </View>
          
          {lineData.length > 0 && lineData.some(d => d.value > 0) ? (
            <View style={styles.chartContainer}>
              <LineChart
                data={lineData}
                width={280}
                height={150}
                spacing={40}
                color={theme.secondary}
                thickness={2}
                dataPointsColor={theme.secondary}
                dataPointsRadius={4}
                startFillColor={theme.secondary + '40'}
                endFillColor={theme.secondary + '10'}
                areaChart
                curved
                yAxisTextStyle={{ color: theme.textMuted, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: theme.textMuted, fontSize: 10 }}
                hideRules
                yAxisColor={theme.border}
                xAxisColor={theme.border}
                noOfSections={4}
              />
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="fitness-outline" size={48} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                No exercise data yet
              </Text>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: theme.secondary }]}
                onPress={() => router.push({ pathname: '/(tabs)/checkin', params: { date: selectedDate } })}
              >
                <Text style={styles.addButtonText}>Log Activity</Text>
              </TouchableOpacity>
            </View>
          )}
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  themeToggle: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    gap: 6,
  },
  offlineBannerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  addLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  caloriesFormula: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  calorieItem: {
    alignItems: 'center',
  },
  calorieValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  calorieLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  calorieOperator: {
    fontSize: 24,
    fontWeight: '300',
  },
  // Date Navigation Bar
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  offlineHint: {
    fontSize: 12,
    fontWeight: '500',
  },
  offlineDateHint: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  dateNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  sleepRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
  },
  sleepValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  sleepGoal: {
    fontSize: 14,
  },
  chartCard: {
    paddingBottom: 8,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
