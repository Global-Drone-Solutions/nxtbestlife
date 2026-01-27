import React, { useEffect, useCallback } from 'react';
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

export default function DashboardScreen() {
  const { theme, isDark, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const { 
    profile, 
    goal, 
    todayCheckin, 
    chartData, 
    isLoading,
    loadUserData,
    loadTodayCheckin,
    loadChartData,
    updateWater,
    refreshData,
  } = useDataStore();

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (user?.id) {
      refreshData(user.id);
    }
  }, [user?.id]);

  const onRefresh = useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await refreshData(user.id);
    setRefreshing(false);
  }, [user?.id]);

  const handleAddWater = async (amount: number) => {
    if (user?.id) {
      await updateWater(user.id, amount);
    }
  };

  // Calculate calories
  const targetCalories = goal?.daily_calorie_target || 2000;
  const consumedCalories = todayCheckin?.total_calories_consumed || 0;
  const remainingCalories = targetCalories - consumedCalories;
  const caloriesProgress = consumedCalories / targetCalories;

  // Water
  const waterGoal = goal?.daily_water_goal_ml || 2000;
  const waterIntake = todayCheckin?.water_intake_ml || 0;
  const waterProgress = waterIntake / waterGoal;

  // Sleep
  const sleepGoal = goal?.sleep_goal_hours || 8;
  const sleepHours = todayCheckin?.sleep_hours || 0;
  const sleepProgress = sleepHours / sleepGoal;

  // Chart data
  const lineData = chartData.map(d => ({
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
        {/* Calories Card */}
        <GlassCard style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="flame" size={24} color={theme.warning} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Calories</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/checkin')}>
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

        {/* Today Summary Chip */}
        <View style={styles.summaryChip}>
          <Ionicons name="calendar" size={16} color={theme.primary} />
          <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
            Today's Summary
          </Text>
        </View>

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
            <TouchableOpacity onPress={() => router.push('/(tabs)/checkin')}>
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
                onPress={() => router.push('/(tabs)/checkin')}
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
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '500',
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
