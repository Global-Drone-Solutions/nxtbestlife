import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { useDataStore } from '../../src/store/dataStore';
import { GlassCard } from '../../src/components/GlassCard';
import { QuickAddButtons } from '../../src/components/QuickAddButtons';

const ACTIVITY_TYPES = ['walk', 'run', 'gym', 'swim', 'cycle', 'yoga', 'other'];

export default function CheckInScreen() {
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const { 
    todayCheckin, 
    goal,
    loadTodayCheckin,
    updateWater, 
    updateSleep, 
    updateCalories,
    addActivity,
  } = useDataStore();

  // Meal inputs
  const [breakfast, setBreakfast] = useState('');
  const [lunch, setLunch] = useState('');
  const [dinner, setDinner] = useState('');
  const [snacks, setSnacks] = useState('');

  // Sleep
  const [sleepHours, setSleepHours] = useState('');

  // Activity
  const [activityType, setActivityType] = useState('walk');
  const [activityDuration, setActivityDuration] = useState('');
  const [activityCalories, setActivityCalories] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadTodayCheckin(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    if (todayCheckin) {
      setSleepHours(todayCheckin.sleep_hours?.toString() || '');
    }
  }, [todayCheckin]);

  const handleAddWater = async (amount: number) => {
    if (user?.id) {
      await updateWater(user.id, amount);
    }
  };

  const handleSaveMeals = async () => {
    if (!user?.id) return;

    const total = 
      (parseInt(breakfast) || 0) + 
      (parseInt(lunch) || 0) + 
      (parseInt(dinner) || 0) + 
      (parseInt(snacks) || 0);

    await updateCalories(user.id, total);
    Alert.alert('Success', 'Meals saved successfully!');
  };

  const handleSaveSleep = async () => {
    if (!user?.id) return;
    const hours = parseFloat(sleepHours) || 0;
    await updateSleep(user.id, hours);
    Alert.alert('Success', 'Sleep hours saved!');
  };

  const handleLogActivity = async () => {
    if (!user?.id) return;
    
    const duration = parseInt(activityDuration) || 0;
    const calories = parseInt(activityCalories) || 0;

    if (duration === 0) {
      Alert.alert('Error', 'Please enter activity duration');
      return;
    }

    await addActivity(user.id, {
      type: activityType,
      duration,
      calories,
    });

    // Reset fields
    setActivityDuration('');
    setActivityCalories('');
    Alert.alert('Success', 'Activity logged!');
  };

  const waterIntake = todayCheckin?.water_intake_ml || 0;
  const waterGoal = goal?.daily_water_goal_ml || 2000;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Daily Check-in</Text>
          <Text style={[styles.headerDate, { color: theme.textSecondary }]}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Meals Section */}
          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="restaurant" size={24} color={theme.warning} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Meals (kcal)</Text>
            </View>

            <View style={styles.mealsGrid}>
              <View style={styles.mealInput}>
                <Text style={[styles.mealLabel, { color: theme.textSecondary }]}>Breakfast</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  placeholder="0"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                  value={breakfast}
                  onChangeText={setBreakfast}
                />
              </View>
              <View style={styles.mealInput}>
                <Text style={[styles.mealLabel, { color: theme.textSecondary }]}>Lunch</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  placeholder="0"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                  value={lunch}
                  onChangeText={setLunch}
                />
              </View>
              <View style={styles.mealInput}>
                <Text style={[styles.mealLabel, { color: theme.textSecondary }]}>Dinner</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  placeholder="0"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                  value={dinner}
                  onChangeText={setDinner}
                />
              </View>
              <View style={styles.mealInput}>
                <Text style={[styles.mealLabel, { color: theme.textSecondary }]}>Snacks</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  placeholder="0"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                  value={snacks}
                  onChangeText={setSnacks}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: theme.warning }]}
              onPress={handleSaveMeals}
            >
              <Text style={styles.saveButtonText}>Save Meals</Text>
            </TouchableOpacity>
          </GlassCard>

          {/* Water Section */}
          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="water" size={24} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Water</Text>
              <Text style={[styles.waterAmount, { color: theme.primary }]}>
                {waterIntake} / {waterGoal} ml
              </Text>
            </View>
            <QuickAddButtons amounts={[250, 500, 1000]} unit="ml" onAdd={handleAddWater} />
          </GlassCard>

          {/* Sleep Section */}
          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="moon" size={24} color={theme.accent} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Sleep</Text>
            </View>
            
            <View style={styles.sleepRow}>
              <Text style={[styles.sleepLabel, { color: theme.textSecondary }]}>Hours slept last night:</Text>
              <TextInput
                style={[styles.sleepInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                placeholder="8"
                placeholderTextColor={theme.textMuted}
                keyboardType="decimal-pad"
                value={sleepHours}
                onChangeText={setSleepHours}
              />
              <TouchableOpacity 
                style={[styles.smallSaveButton, { backgroundColor: theme.accent }]}
                onPress={handleSaveSleep}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* Activity Section */}
          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="barbell" size={24} color={theme.secondary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Log Activity</Text>
            </View>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Activity Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activityPicker}>
              {ACTIVITY_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.activityChip,
                    { 
                      backgroundColor: activityType === type ? theme.secondary : theme.background,
                      borderColor: theme.secondary,
                    }
                  ]}
                  onPress={() => setActivityType(type)}
                >
                  <Text style={[
                    styles.activityChipText,
                    { color: activityType === type ? '#fff' : theme.secondary }
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.activityInputs}>
              <View style={styles.activityInputWrapper}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Duration (min)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  placeholder="30"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                  value={activityDuration}
                  onChangeText={setActivityDuration}
                />
              </View>
              <View style={styles.activityInputWrapper}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Calories (est.)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  placeholder="200"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                  value={activityCalories}
                  onChangeText={setActivityCalories}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: theme.secondary }]}
              onPress={handleLogActivity}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Log Activity</Text>
            </TouchableOpacity>
          </GlassCard>

          {/* Back to Dashboard */}
          <TouchableOpacity 
            style={[styles.backButton, { borderColor: theme.primary }]}
            onPress={() => router.push('/(tabs)')}
          >
            <Ionicons name="arrow-back" size={20} color={theme.primary} />
            <Text style={[styles.backButtonText, { color: theme.primary }]}>Back to Dashboard</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerDate: {
    fontSize: 14,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  mealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mealInput: {
    width: '47%',
  },
  mealLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  waterAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  sleepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sleepLabel: {
    fontSize: 14,
    flex: 1,
  },
  sleepInput: {
    width: 70,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  smallSaveButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    marginBottom: 8,
  },
  activityPicker: {
    marginBottom: 16,
  },
  activityChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  activityChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  activityInputWrapper: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 8,
    marginTop: 8,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
