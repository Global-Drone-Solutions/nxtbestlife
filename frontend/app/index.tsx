import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../src/store/themeStore';
import { useAuthStore } from '../src/store/authStore';
import { getSupabaseConfig, initSupabase, resetSupabaseInstance } from '../src/lib/supabaseClient';

export default function Index() {
  const { theme } = useThemeStore();
  const { user, demoLogin, isLoading, error, checkSession } = useAuthStore();
  const [configStatus, setConfigStatus] = useState<'checking' | 'configured' | 'missing'>('checking');
  const [showLogin, setShowLogin] = useState(false);

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
    if (configStatus === 'configured') {
      checkSession().then(() => {
        if (useAuthStore.getState().user) {
          router.replace('/(tabs)');
        }
      });
    }
  }, [configStatus]);

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  const handleDemoLogin = async () => {
    const success = await demoLogin();
    if (success) {
      router.replace('/(tabs)');
    }
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

  // Checking config
  if (configStatus === 'checking') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.subtitle, { color: theme.textSecondary, marginTop: 16 }]}>
            Checking configuration...
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
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={[styles.logoCircle, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="fitness" size={48} color={theme.primary} />
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>FitTrack</Text>
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>
            Your personal fitness companion
          </Text>
        </View>

        {/* Dev-only: Show demo email */}
        <View style={[styles.devInfo, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.devLabel, { color: theme.textMuted }]}>DEV - Demo Email:</Text>
          <Text style={[styles.devValue, { color: theme.text }]}>
            {config.demoEmail || '(not set)'}
          </Text>
        </View>

        {error && (
          <View style={[styles.errorBox, { backgroundColor: theme.error + '20' }]}>
            <Ionicons name="alert-circle" size={20} color={theme.error} />
            <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={handleDemoLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="rocket" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Try Demo</Text>
            </>
          )}
        </TouchableOpacity>

        {configStatus === 'missing' && (
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.primary }]}
            onPress={() => setShowLogin(false)}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>View Setup Instructions</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.retryLink}
          onPress={checkConfig}
        >
          <Ionicons name="refresh" size={16} color={theme.textMuted} />
          <Text style={[styles.retryText, { color: theme.textMuted }]}>Retry Config</Text>
        </TouchableOpacity>
      </View>

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
});
