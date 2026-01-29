import React, { useState } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useThemeStore } from '../src/store/themeStore';
import { useAuthStore } from '../src/store/authStore';
import { useDataStore } from '../src/store/dataStore';
import { GlassCard } from '../src/components/GlassCard';

const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'];

export default function OnboardingScreen() {
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const { saveProfile, saveGoal } = useDataStore();

  // Loading state
  const [isSaving, setIsSaving] = useState(false);

  // Profile fields
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [activityLevel, setActivityLevel] = useState('moderate');

  // Goal fields
  const [targetWeight, setTargetWeight] = useState('');
  const [calorieTarget, setCalorieTarget] = useState('2000');
  const [waterGoal, setWaterGoal] = useState('2000');
  const [sleepGoal, setSleepGoal] = useState('8');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Profile validation
    if (!height || parseInt(height) < 50 || parseInt(height) > 300) {
      newErrors.height = 'Enter valid height (50-300 cm)';
    }
    if (!weight || parseFloat(weight) < 20 || parseFloat(weight) > 500) {
      newErrors.weight = 'Enter valid weight (20-500 kg)';
    }
    if (!age || parseInt(age) < 10 || parseInt(age) > 120) {
      newErrors.age = 'Enter valid age (10-120)';
    }

    // Goal validation
    if (!targetWeight || parseFloat(targetWeight) < 20 || parseFloat(targetWeight) > 500) {
      newErrors.targetWeight = 'Enter valid target weight';
    }
    if (!calorieTarget || parseInt(calorieTarget) < 500 || parseInt(calorieTarget) > 10000) {
      newErrors.calorieTarget = 'Enter valid calorie target (500-10000)';
    }
    if (!waterGoal || parseInt(waterGoal) < 500 || parseInt(waterGoal) > 10000) {
      newErrors.waterGoal = 'Enter valid water goal (500-10000 ml)';
    }
    if (!sleepGoal || parseFloat(sleepGoal) < 1 || parseFloat(sleepGoal) > 24) {
      newErrors.sleepGoal = 'Enter valid sleep goal (1-24 hrs)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleComplete = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User session not found. Please login again.');
      router.replace('/');
      return;
    }

    setIsSaving(true);

    try {
      // Save profile first
      await saveProfile({
        user_id: user.id,
        height_cm: parseInt(height),
        current_weight_kg: parseFloat(weight),
        age: parseInt(age),
        activity_level: activityLevel,
      });

      // Then save goal
      await saveGoal({
        user_id: user.id,
        target_weight_kg: parseFloat(targetWeight),
        daily_calorie_target: parseInt(calorieTarget),
        daily_water_goal_ml: parseInt(waterGoal),
        sleep_goal_hours: parseFloat(sleepGoal),
      });

      // Navigate to dashboard
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Onboarding save error:', error);
      Alert.alert('Error', 'Failed to save your information. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderError = (field: string) => {
    if (errors[field]) {
      return <Text style={[styles.errorText, { color: theme.error }]}>{errors[field]}</Text>;
    }
    return null;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header - No back button */}
        <View style={styles.header}>
          <View style={[styles.logoSmall, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="fitness" size={24} color={theme.primary} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Welcome to FitTrack</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Let's set up your profile
            </Text>
          </View>
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View style={[styles.progressFill, { backgroundColor: theme.primary, width: '50%' }]} />
          </View>
          <Text style={[styles.progressText, { color: theme.textMuted }]}>
            Complete all fields to continue
          </Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Body Info */}
          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="body" size={24} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Basic Information</Text>
            </View>

            <View style={styles.inputGrid}>
              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Height (cm) *</Text>
                <TextInput
                  style={[
                    styles.input, 
                    { backgroundColor: theme.background, color: theme.text, borderColor: errors.height ? theme.error : theme.border }
                  ]}
                  placeholder="180"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                  value={height}
                  onChangeText={(text) => {
                    setHeight(text);
                    setErrors({ ...errors, height: '' });
                  }}
                />
                {renderError('height')}
              </View>
              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Weight (kg) *</Text>
                <TextInput
                  style={[
                    styles.input, 
                    { backgroundColor: theme.background, color: theme.text, borderColor: errors.weight ? theme.error : theme.border }
                  ]}
                  placeholder="80"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="decimal-pad"
                  value={weight}
                  onChangeText={(text) => {
                    setWeight(text);
                    setErrors({ ...errors, weight: '' });
                  }}
                />
                {renderError('weight')}
              </View>
              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Age *</Text>
                <TextInput
                  style={[
                    styles.input, 
                    { backgroundColor: theme.background, color: theme.text, borderColor: errors.age ? theme.error : theme.border }
                  ]}
                  placeholder="30"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                  value={age}
                  onChangeText={(text) => {
                    setAge(text);
                    setErrors({ ...errors, age: '' });
                  }}
                />
                {renderError('age')}
              </View>
            </View>

            <Text style={[styles.label, { color: theme.textSecondary, marginTop: 12 }]}>Activity Level *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.levelPicker}>
              {ACTIVITY_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.levelChip,
                    { 
                      backgroundColor: activityLevel === level ? theme.primary : theme.background,
                      borderColor: theme.primary,
                    }
                  ]}
                  onPress={() => setActivityLevel(level)}
                >
                  <Text style={[
                    styles.levelChipText,
                    { color: activityLevel === level ? '#fff' : theme.primary }
                  ]}>
                    {level.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </GlassCard>

          {/* Goals */}
          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="flag" size={24} color={theme.secondary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Your Goals</Text>
            </View>

            <View style={styles.inputGrid}>
              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Target Weight (kg) *</Text>
                <TextInput
                  style={[
                    styles.input, 
                    { backgroundColor: theme.background, color: theme.text, borderColor: errors.targetWeight ? theme.error : theme.border }
                  ]}
                  placeholder="72"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="decimal-pad"
                  value={targetWeight}
                  onChangeText={(text) => {
                    setTargetWeight(text);
                    setErrors({ ...errors, targetWeight: '' });
                  }}
                />
                {renderError('targetWeight')}
              </View>
              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Daily Calories *</Text>
                <TextInput
                  style={[
                    styles.input, 
                    { backgroundColor: theme.background, color: theme.text, borderColor: errors.calorieTarget ? theme.error : theme.border }
                  ]}
                  placeholder="2000"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                  value={calorieTarget}
                  onChangeText={(text) => {
                    setCalorieTarget(text);
                    setErrors({ ...errors, calorieTarget: '' });
                  }}
                />
                {renderError('calorieTarget')}
              </View>
              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Water Goal (ml) *</Text>
                <TextInput
                  style={[
                    styles.input, 
                    { backgroundColor: theme.background, color: theme.text, borderColor: errors.waterGoal ? theme.error : theme.border }
                  ]}
                  placeholder="2000"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                  value={waterGoal}
                  onChangeText={(text) => {
                    setWaterGoal(text);
                    setErrors({ ...errors, waterGoal: '' });
                  }}
                />
                {renderError('waterGoal')}
              </View>
              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Sleep Goal (hrs) *</Text>
                <TextInput
                  style={[
                    styles.input, 
                    { backgroundColor: theme.background, color: theme.text, borderColor: errors.sleepGoal ? theme.error : theme.border }
                  ]}
                  placeholder="8"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="decimal-pad"
                  value={sleepGoal}
                  onChangeText={(text) => {
                    setSleepGoal(text);
                    setErrors({ ...errors, sleepGoal: '' });
                  }}
                />
                {renderError('sleepGoal')}
              </View>
            </View>
          </GlassCard>

          {/* Complete Button */}
          <TouchableOpacity 
            style={[
              styles.completeButton, 
              { backgroundColor: theme.primary },
              isSaving && styles.buttonDisabled
            ]}
            onPress={handleComplete}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.completeButtonText}>Complete Setup</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {/* Info text */}
          <Text style={[styles.infoText, { color: theme.textMuted }]}>
            You can update these settings anytime from your Profile.
          </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  logoSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
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
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  inputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  inputWrapper: {
    width: '47%',
  },
  label: {
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
  errorText: {
    fontSize: 11,
    marginTop: 4,
  },
  levelPicker: {
    marginBottom: 8,
  },
  levelChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  levelChipText: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  infoText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
});
