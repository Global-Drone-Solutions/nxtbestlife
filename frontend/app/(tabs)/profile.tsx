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
import {
  isOfflineDemoEnabled,
  getOfflineProfile,
  getOfflineGoal,
  saveOfflineProfile,
  saveOfflineGoal,
  resetOfflineDemo,
  OfflineProfile,
  OfflineGoal,
} from '../../src/lib/offlineStore';

const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'];

export default function ProfileScreen() {
  const { theme } = useThemeStore();
  const { user, signOut } = useAuthStore();
  const { profile, goal, loadUserData, saveProfile, saveGoal } = useDataStore();

  const isOffline = isOfflineDemoEnabled();

  // Offline state
  const [offlineProfile, setOfflineProfile] = useState<OfflineProfile | null>(null);
  const [offlineGoal, setOfflineGoal] = useState<OfflineGoal | null>(null);

  // Profile fields
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [activityLevel, setActivityLevel] = useState('moderate');

  // Goal fields
  const [targetWeight, setTargetWeight] = useState('');
  const [calorieTarget, setCalorieTarget] = useState('');
  const [waterGoal, setWaterGoal] = useState('');
  const [sleepGoal, setSleepGoal] = useState('');

  const loadOfflineData = async () => {
    const [profileData, goalData] = await Promise.all([
      getOfflineProfile(),
      getOfflineGoal(),
    ]);
    setOfflineProfile(profileData);
    setOfflineGoal(goalData);

    // Pre-fill fields
    setHeight(profileData.height_cm?.toString() || '');
    setWeight(profileData.current_weight_kg?.toString() || '');
    setAge(profileData.age?.toString() || '');
    setActivityLevel(profileData.activity_level || 'moderate');
    setTargetWeight(goalData.target_weight_kg?.toString() || '');
    setCalorieTarget(goalData.daily_calorie_target?.toString() || '');
    setWaterGoal(goalData.daily_water_goal_ml?.toString() || '');
    setSleepGoal(goalData.sleep_goal_hours?.toString() || '');
  };

  useEffect(() => {
    if (isOffline) {
      loadOfflineData();
    } else if (user?.id) {
      loadUserData(user.id);
    }
  }, [user?.id, isOffline]);

  useEffect(() => {
    if (!isOffline && profile) {
      setHeight(profile.height_cm?.toString() || '');
      setWeight(profile.current_weight_kg?.toString() || '');
      setAge(profile.age?.toString() || '');
      setActivityLevel(profile.activity_level || 'moderate');
    }
  }, [profile, isOffline]);

  useEffect(() => {
    if (!isOffline && goal) {
      setTargetWeight(goal.target_weight_kg?.toString() || '');
      setCalorieTarget(goal.daily_calorie_target?.toString() || '');
      setWaterGoal(goal.daily_water_goal_ml?.toString() || '');
      setSleepGoal(goal.sleep_goal_hours?.toString() || '');
    }
  }, [goal, isOffline]);

  const handleSaveProfile = async () => {
    const profileData = {
      height_cm: parseInt(height) || 170,
      current_weight_kg: parseFloat(weight) || 70,
      age: parseInt(age) || 30,
      activity_level: activityLevel,
    };

    if (isOffline) {
      await saveOfflineProfile(profileData);
      setOfflineProfile(profileData);
      Alert.alert('Success', 'Profile saved!');
    } else if (user?.id) {
      await saveProfile({
        user_id: user.id,
        ...profileData,
      });
      Alert.alert('Success', 'Profile saved!');
    }
  };

  const handleSaveGoals = async () => {
    const goalData = {
      target_weight_kg: parseFloat(targetWeight) || 70,
      daily_calorie_target: parseInt(calorieTarget) || 2000,
      daily_water_goal_ml: parseInt(waterGoal) || 2000,
      sleep_goal_hours: parseFloat(sleepGoal) || 8,
    };

    if (isOffline) {
      await saveOfflineGoal(goalData);
      setOfflineGoal(goalData);
      Alert.alert('Success', 'Goals saved!');
    } else if (user?.id) {
      await saveGoal({
        user_id: user.id,
        ...goalData,
      });
      Alert.alert('Success', 'Goals saved!');
    }
  };

  const handleLogout = async () => {
    if (isOffline) {
      Alert.alert('Offline Demo', 'You are in offline demo mode. No logout needed.');
    } else {
      await signOut();
      router.replace('/');
    }
  };

  const handleResetDemo = async () => {
    Alert.alert(
      'Reset Demo Data',
      'This will reset all demo data to defaults. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetOfflineDemo();
            await loadOfflineData();
            Alert.alert('Success', 'Demo data has been reset!');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
          {!isOffline && (
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color={theme.error} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Offline Banner */}
          {isOffline && (
            <View style={[styles.offlineBanner, { backgroundColor: theme.warning + '20', borderColor: theme.warning }]}>
              <Ionicons name="cloud-offline" size={14} color={theme.warning} />
              <Text style={[styles.offlineBannerText, { color: theme.warning }]}>
                Offline Demo - data saved locally
              </Text>
            </View>
          )}

          {/* User Info */}
          <View style={styles.userCard}>
            <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
              <Ionicons name="person" size={40} color={theme.primary} />
            </View>
            <Text style={[styles.userName, { color: theme.text }]}>
              {isOffline ? 'Demo User' : 'Demo User'}
            </Text>
            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
              {isOffline ? 'offline@demo.local' : (user?.email || 'demo@fittrack.app')}
            </Text>
          </View>

          {/* Body Info */}
          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="body" size={24} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Body Information</Text>
            </View>

            <View style={styles.inputGrid}>
              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Height (cm)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  placeholder="180"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                  value={height}
                  onChangeText={setHeight}
                />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Weight (kg)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  placeholder="80"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="decimal-pad"
                  value={weight}
                  onChangeText={setWeight}
                />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Age</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  placeholder="30"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                  value={age}
                  onChangeText={setAge}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: theme.textSecondary, marginTop: 12 }]}>Activity Level</Text>
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

            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveButtonText}>Save Profile</Text>
            </TouchableOpacity>
          </GlassCard>

          {/* Goals */}
          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="flag" size={24} color={theme.secondary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Goals</Text>
            </View>

            <View style={styles.inputGrid}>
              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Target Weight (kg)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  placeholder="72"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="decimal-pad"
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Daily Calories</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  placeholder="2000"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                  value={calorieTarget}
                  onChangeText={setCalorieTarget}
                />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Water Goal (ml)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  placeholder="2000"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                  value={waterGoal}
                  onChangeText={setWaterGoal}
                />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Sleep Goal (hrs)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  placeholder="8"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="decimal-pad"
                  value={sleepGoal}
                  onChangeText={setSleepGoal}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: theme.secondary }]}
              onPress={handleSaveGoals}
            >
              <Text style={styles.saveButtonText}>Save Goals</Text>
            </TouchableOpacity>
          </GlassCard>

          {/* Reset Demo Data (offline only) */}
          {isOffline && (
            <TouchableOpacity 
              style={[styles.resetButton, { borderColor: theme.error }]}
              onPress={handleResetDemo}
            >
              <Ionicons name="refresh" size={18} color={theme.error} />
              <Text style={[styles.resetButtonText, { color: theme.error }]}>Reset Demo Data</Text>
            </TouchableOpacity>
          )}

          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={[styles.appName, { color: theme.textMuted }]}>FitTrack MVP</Text>
            <Text style={[styles.version, { color: theme.textMuted }]}>
              {isOffline ? 'Offline Demo Mode' : 'Version 1.0.0'}
            </Text>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  logoutButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 12,
    gap: 6,
  },
  offlineBannerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  userCard: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 4,
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
  saveButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 16,
    gap: 8,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 16,
  },
  appName: {
    fontSize: 14,
    fontWeight: '600',
  },
  version: {
    fontSize: 12,
    marginTop: 4,
  },
});
