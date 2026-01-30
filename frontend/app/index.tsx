import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../src/store/themeStore';
import { useAuthStore } from '../src/store/authStore';
import { useDataStore } from '../src/store/dataStore';
import { getSupabaseConfig, initSupabase, resetSupabaseInstance } from '../src/lib/supabaseClient';
import { isOfflineDemoEnabled, initOfflineDemo, setOfflineModeActive } from '../src/lib/offlineStore';
import * as db from '../src/lib/db';

export default function Index() {
  const { theme } = useThemeStore();
  const { user, login, signUp, demoLogin, isLoading, error, debugLog, checkSession, setError } = useAuthStore();
  const { loadUserData } = useDataStore();
  const [configStatus, setConfigStatus] = useState<'checking' | 'configured' | 'missing'>('checking');
  const [showLogin, setShowLogin] = useState(false);
  const [isEnteringDemo, setIsEnteringDemo] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  
  // Auth form state
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Check if offline demo mode is enabled
  const isOffline = isOfflineDemoEnabled();

  // Email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check if user needs onboarding (profile or goal missing)
  const checkOnboardingStatus = async (userId: string): Promise<boolean> => {
    try {
      const [profile, goal] = await Promise.all([
        db.getUserProfile(userId),
        db.getUserGoal(userId),
      ]);
      // Returns true if onboarding is needed (either profile or goal is missing)
      return !profile || !goal;
    } catch (err) {
      console.log('Error checking onboarding status:', err);
      return true; // Default to needing onboarding on error
    }
  };

  // Handle navigation after login
  const handlePostLoginNavigation = async (userId: string) => {
    if (isOffline) {
      // Offline mode skips onboarding
      router.replace('/(tabs)');
      return;
    }

    setIsCheckingOnboarding(true);
    try {
      const needsOnboarding = await checkOnboardingStatus(userId);
      if (needsOnboarding) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err) {
      console.error('Error navigating after login:', err);
      router.replace('/(tabs)'); // Fallback to dashboard
    } finally {
      setIsCheckingOnboarding(false);
    }
  };

  const checkConfig = () => {
    setConfigStatus('checking');
    resetSupabaseInstance();
    const config = getSupabaseConfig();
    
    if (config.isConfigured) {
      initSupabase();
      setConfigStatus('configured');
    } else {
      setConfigStatus('missing');
    }
  };

  useEffect(() => {
    checkConfig();
  }, []);

  useEffect(() => {
    if (configStatus === 'configured' && !isOffline) {
      // Run checkSession and mark auth as checked when complete
      checkSession().finally(() => {
        setIsAuthChecked(true);
      });
    } else if (isOffline) {
      // In offline mode, auth check is not needed
      setIsAuthChecked(true);
    }
  }, [configStatus, isOffline]);

  // Navigate to dashboard if user is authenticated after auth check
  useEffect(() => {
    if (isAuthChecked && user && !isCheckingOnboarding) {
      handlePostLoginNavigation(user.id);
    }
  }, [isAuthChecked, user]);

  const handleDemoLogin = async () => {
    const success = await demoLogin();
    if (success) {
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        await handlePostLoginNavigation(currentUser.id);
      }
    }
  };

  // Handle login with email/password
  const handleLogin = async () => {
    // Clear previous errors
    setError(null);

    // Validate email
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate password
    if (!password) {
      setError('Please enter your password');
      return;
    }

    const success = await login(email.trim(), password);
    if (success) {
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        await handlePostLoginNavigation(currentUser.id);
      }
    }
  };

  // Handle sign up with email/password
  const handleSignUp = async () => {
    // Clear previous errors
    setError(null);

    // Validate email
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate password
    if (!password) {
      setError('Please enter a password');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Validate confirm password
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const success = await signUp(email.trim(), password);
    if (success) {
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        await handlePostLoginNavigation(currentUser.id);
      }
    }
  };

  // Switch between login and signup modes
  const switchAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
    setError(null);
    setPassword('');
    setConfirmPassword('');
  };

  // Handle entering offline demo mode
  const handleEnterOfflineDemo = async () => {
    setIsEnteringDemo(true);
    try {
      await initOfflineDemo();
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Error entering offline demo:', err);
    }
    setIsEnteringDemo(false);
  };

  // Config not configured screen
  if (configStatus === 'missing' && !showLogin) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>
          <Ionicons name="warning" size={64} color={theme.warning} />
          <Text style={[styles.title, { color: theme.text }]}>Supabase Not Configured</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Please set the following environment variables:
          </Text>
          
          <View style={[styles.codeBlock, { backgroundColor: theme.surface }]}>
            <Text style={[styles.code, { color: theme.primary }]}>EXPO_PUBLIC_SUPABASE_URL</Text>
            <Text style={[styles.code, { color: theme.primary }]}>EXPO_PUBLIC_SUPABASE_ANON_KEY</Text>
            <Text style={[styles.code, { color: theme.primary }]}>EXPO_PUBLIC_DEMO_EMAIL</Text>
            <Text style={[styles.code, { color: theme.primary }]}>EXPO_PUBLIC_DEMO_PASSWORD</Text>
          </View>

          <Text style={[styles.instructions, { color: theme.textMuted }]}>
            After setting the environment variables, tap "Retry Config" to reload.
          </Text>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={checkConfig}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Retry Config</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.primary }]}
            onPress={() => setShowLogin(true)}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Go to Login UI</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Checking config or auth
  if (configStatus === 'checking' || isCheckingOnboarding || (!isOffline && !isAuthChecked)) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.subtitle, { color: theme.textSecondary, marginTop: 16 }]}>
            {isCheckingOnboarding ? 'Checking your profile...' : 
             !isAuthChecked ? 'Checking session...' : 'Checking configuration...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get config for dev display
  const config = getSupabaseConfig();

  // Login Screen
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <View style={[styles.logoCircle, { backgroundColor: theme.primary + '20' }]}>
              <Ionicons name="fitness" size={48} color={theme.primary} />
            </View>
            <Text style={[styles.appName, { color: theme.text }]}>FitTrack</Text>
            <Text style={[styles.tagline, { color: theme.textSecondary }]}>
              Your personal fitness companion
            </Text>
          </View>

          {/* Offline Demo Mode - Primary Button */}
          {isOffline && (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.success }]}
              onPress={handleEnterOfflineDemo}
              disabled={isEnteringDemo}
            >
              {isEnteringDemo ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="play-circle" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Enter Demo</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Show Supabase login only if not in offline mode */}
          {!isOffline && (
            <>
              {/* Auth Mode Tabs */}
              <View style={[styles.authTabs, { backgroundColor: theme.surface }]}>
                <TouchableOpacity
                  style={[
                    styles.authTab,
                    authMode === 'login' && { backgroundColor: theme.primary }
                  ]}
                  onPress={() => switchAuthMode()}
                  disabled={authMode === 'login'}
                >
                  <Text style={[
                    styles.authTabText,
                    { color: authMode === 'login' ? '#fff' : theme.textSecondary }
                  ]}>
                    Login
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.authTab,
                    authMode === 'signup' && { backgroundColor: theme.primary }
                  ]}
                  onPress={() => switchAuthMode()}
                  disabled={authMode === 'signup'}
                >
                  <Text style={[
                    styles.authTabText,
                    { color: authMode === 'signup' ? '#fff' : theme.textSecondary }
                  ]}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Error Display */}
              {error && (
                <View style={[styles.errorBox, { backgroundColor: theme.error + '20' }]}>
                  <Ionicons name="alert-circle" size={20} color={theme.error} />
                  <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
                </View>
              )}

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Email</Text>
                <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                  <Ionicons name="mail-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Enter your email"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Password</Text>
                <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder={authMode === 'signup' ? 'Min 6 characters' : 'Enter your password'}
                    placeholderTextColor={theme.textMuted}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                    <Ionicons 
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                      size={20} 
                      color={theme.textMuted} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password (Sign Up only) */}
              {authMode === 'signup' && (
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Confirm Password</Text>
                  <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                    <Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="Re-enter your password"
                      placeholderTextColor={theme.textMuted}
                      secureTextEntry={!showPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </View>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                onPress={authMode === 'login' ? handleLogin : handleSignUp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name={authMode === 'login' ? 'log-in' : 'person-add'} size={20} color="#fff" />
                    <Text style={styles.primaryButtonText}>
                      {authMode === 'login' ? 'Login' : 'Sign Up'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Demo Login Link */}
              {config.hasDemoCredentials && (
                <TouchableOpacity
                  style={styles.demoLink}
                  onPress={handleDemoLogin}
                  disabled={isLoading}
                >
                  <Text style={[styles.demoLinkText, { color: theme.primary }]}>
                    Use Demo Account
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Secondary: Enter offline demo even when Supabase is configured */}
          {!isOffline && (
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.success }]}
              onPress={handleEnterOfflineDemo}
              disabled={isEnteringDemo}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.success }]}>
                Enter Offline Demo
              </Text>
            </TouchableOpacity>
          )}

          {configStatus === 'missing' && (
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.primary, marginTop: 8 }]}
              onPress={() => setShowLogin(false)}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>View Setup Instructions</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.textMuted }]}>
          Track meals, water, sleep & exercise
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  codeBlock: {
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 13,
    marginVertical: 4,
  },
  instructions: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  retryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
  },
  retryText: {
    fontSize: 14,
  },
  footer: {
    paddingBottom: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
  },
  devInfo: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  devLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  devValue: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  debugLogBox: {
    maxHeight: 120,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    width: '100%',
  },
  debugLogText: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  authTabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    width: '100%',
  },
  authTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  authTabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  eyeButton: {
    padding: 4,
  },
  demoLink: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  demoLinkText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
