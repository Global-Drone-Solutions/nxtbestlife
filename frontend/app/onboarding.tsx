import React, { useState, useMemo } from 'react';
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

type Gender = 'male' | 'female';

export default function OnboardingScreen() {
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const { saveProfile, saveGoal } = useDataStore();

  // Step state: 1, 2, or 3
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Loading state
  const [isSaving, setIsSaving] = useState(false);

  // Step 1: Profile fields
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);

  // Step 2: Goal fields
  const [targetWeight, setTargetWeight] = useState('');
  const [daysToGoal, setDaysToGoal] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate daily calories using the provided formula
  const dailyCalories = useMemo(() => {
    const w = parseFloat(weight) || 0;
    const h = parseFloat(height) || 0;
    const a = parseInt(age) || 0;
    const wg = parseFloat(targetWeight) || 0;
    const d = parseInt(daysToGoal) || 1;
    const g = gender;

    if (!w || !h || !a || !g || !wg || !d) return 0;

    const G = g === 'male' ? 5 : -161;
    const fixedAdd = g === 'male' ? 2600 : 2000;

    const calories =
      (10 * w + 6.25 * h - 5 * a + G) +
      fixedAdd +
      ((wg - w) * 7700 / d);

    return Math.round(calories);
  }, [height, weight, age, gender, targetWeight, daysToGoal]);

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    const h = parseInt(height);
    if (!height || h < 50 || h > 300) {
      newErrors.height = 'Enter valid height (50-300 cm)';
    }

    const w = parseFloat(weight);
    if (!weight || w < 20 || w > 500) {
      newErrors.weight = 'Enter valid weight (20-500 kg)';
    }

    const a = parseInt(age);
    if (!age || a < 10 || a > 120) {
      newErrors.age = 'Enter valid age (10-120)';
    }

    if (!gender) {
      newErrors.gender = 'Please select your gender';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    const tw = parseFloat(targetWeight);
    if (!targetWeight || tw < 20 || tw > 500) {
      newErrors.targetWeight = 'Enter valid target weight (20-500 kg)';
    }

    const d = parseInt(daysToGoal);
    if (!daysToGoal || d < 1 || d > 365) {
      newErrors.daysToGoal = 'Enter valid days (1-365)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else if (step === 2) {
      if (validateStep2()) {
        setStep(3);
      }
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };

  const handleConfirm = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User session not found. Please login again.');
      router.replace('/');
      return;
    }

    if (!gender) {
      Alert.alert('Error', 'Gender is required');
      return;
    }

    setIsSaving(true);

    try {
      // Save profile
      await saveProfile({
        user_id: user.id,
        height_cm: parseInt(height),
        current_weight_kg: parseFloat(weight),
        age: parseInt(age),
        activity_level: 'moderate', // Default activity level
        gender: gender,
      });

      // Save goal
      await saveGoal({
        user_id: user.id,
        target_weight_kg: parseFloat(targetWeight),
        daily_calorie_target: dailyCalories,
        days_to_goal: parseInt(daysToGoal),
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

  const progressWidth = step === 1 ? '33%' : step === 2 ? '66%' : '100%';

  const renderStep1 = () => (
    <GlassCard style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="body" size={24} color={theme.primary} />
        <Text style={[styles.cardTitle, { color: theme.text }]}>Basic Information</Text>
      </View>

      <View style={styles.inputGroup}>
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

      <View style={styles.inputGroup}>
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

      <View style={styles.inputGroup}>
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

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Gender *</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[
              styles.genderButton,
              {
                backgroundColor: gender === 'male' ? theme.primary : theme.background,
                borderColor: errors.gender ? theme.error : theme.border,
              }
            ]}
            onPress={() => {
              setGender('male');
              setErrors({ ...errors, gender: '' });
            }}
          >
            <Ionicons 
              name="male" 
              size={24} 
              color={gender === 'male' ? '#fff' : theme.primary} 
            />
            <Text style={[
              styles.genderText,
              { color: gender === 'male' ? '#fff' : theme.text }
            ]}>Male</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderButton,
              {
                backgroundColor: gender === 'female' ? theme.secondary : theme.background,
                borderColor: errors.gender ? theme.error : theme.border,
              }
            ]}
            onPress={() => {
              setGender('female');
              setErrors({ ...errors, gender: '' });
            }}
          >
            <Ionicons 
              name="female" 
              size={24} 
              color={gender === 'female' ? '#fff' : theme.secondary} 
            />
            <Text style={[
              styles.genderText,
              { color: gender === 'female' ? '#fff' : theme.text }
            ]}>Female</Text>
          </TouchableOpacity>
        </View>
        {renderError('gender')}
      </View>
    </GlassCard>
  );

  const renderStep2 = () => (
    <GlassCard style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="flag" size={24} color={theme.secondary} />
        <Text style={[styles.cardTitle, { color: theme.text }]}>Your Goals</Text>
      </View>

      <View style={styles.inputGroup}>
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

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Days to Reach Goal *</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.background, color: theme.text, borderColor: errors.daysToGoal ? theme.error : theme.border }
          ]}
          placeholder="90"
          placeholderTextColor={theme.textMuted}
          keyboardType="number-pad"
          value={daysToGoal}
          onChangeText={(text) => {
            setDaysToGoal(text);
            setErrors({ ...errors, daysToGoal: '' });
          }}
        />
        {renderError('daysToGoal')}
        <Text style={[styles.hint, { color: theme.textMuted }]}>
          How many days do you want to achieve your target weight?
        </Text>
      </View>
    </GlassCard>
  );

  const renderStep3 = () => (
    <GlassCard style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="checkmark-circle" size={24} color={theme.success || '#4CAF50'} />
        <Text style={[styles.cardTitle, { color: theme.text }]}>Review Your Information</Text>
      </View>

      <View style={styles.summarySection}>
        <Text style={[styles.summaryTitle, { color: theme.textSecondary }]}>Basic Information</Text>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Height</Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>{height} cm</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Current Weight</Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>{weight} kg</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Age</Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>{age} years</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Gender</Text>
          <Text style={[styles.summaryValue, { color: theme.text, textTransform: 'capitalize' }]}>{gender}</Text>
        </View>
      </View>

      <View style={[styles.summarySection, { marginTop: 16 }]}>
        <Text style={[styles.summaryTitle, { color: theme.textSecondary }]}>Goals</Text>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Target Weight</Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>{targetWeight} kg</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Days to Goal</Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>{daysToGoal} days</Text>
        </View>
      </View>

      {/* Daily Calories Highlight */}
      <View style={[styles.caloriesCard, { backgroundColor: theme.primary + '15' }]}>
        <View style={styles.caloriesHeader}>
          <Ionicons name="flame" size={28} color={theme.primary} />
          <Text style={[styles.caloriesTitle, { color: theme.text }]}>Your Daily Calorie Target</Text>
        </View>
        <Text style={[styles.caloriesValue, { color: theme.primary }]}>
          {dailyCalories.toLocaleString()}
        </Text>
        <Text style={[styles.caloriesUnit, { color: theme.textMuted }]}>calories per day</Text>
        <Text style={[styles.caloriesNote, { color: theme.textSecondary }]}>
          This is calculated based on your profile and goals
        </Text>
      </View>
    </GlassCard>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          {step > 1 ? (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.logoSmall, { backgroundColor: theme.primary + '20' }]}>
              <Ionicons name="fitness" size={24} color={theme.primary} />
            </View>
          )}
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Welcome to FitTrack</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Step {step} of 3
            </Text>
          </View>
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View style={[styles.progressFill, { backgroundColor: theme.primary, width: progressWidth }]} />
          </View>
          <Text style={[styles.progressText, { color: theme.textMuted }]}>
            {step === 1 && 'Tell us about yourself'}
            {step === 2 && 'Set your goals'}
            {step === 3 && 'Review and confirm'}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {/* Action Button */}
          {step < 3 ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={handleNext}
            >
              <Text style={styles.actionButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.success || '#4CAF50' },
                isSaving && styles.buttonDisabled
              ]}
              onPress={handleConfirm}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.actionButtonText}>Confirm & Start</Text>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          )}

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
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
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
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    marginTop: 6,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  genderText: {
    fontSize: 15,
    fontWeight: '500',
  },
  summarySection: {
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  caloriesCard: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  caloriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  caloriesTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  caloriesValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  caloriesUnit: {
    fontSize: 14,
    marginTop: 4,
  },
  caloriesNote: {
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  actionButtonText: {
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
