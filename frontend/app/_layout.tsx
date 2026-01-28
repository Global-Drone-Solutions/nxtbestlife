import React, { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeStore } from '../src/store/themeStore';
import { isOfflineDemoEnabled, initOfflineDemo, resetOfflineDemo } from '../src/lib/offlineStore';

export default function RootLayout() {
  const { isDark, theme } = useThemeStore();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        if (isOfflineDemoEnabled()) {
          console.log('[App] Offline demo mode enabled');
          const success = await initOfflineDemo();
          if (!success) {
            setError('Failed to initialize offline demo data');
            return;
          }
          // Small delay to ensure state is ready
          setTimeout(() => {
            setIsReady(true);
            router.replace('/(tabs)');
          }, 100);
        } else {
          setIsReady(true);
        }
      } catch (err: any) {
        console.error('[App] Init error:', err);
        setError(err.message || 'Unknown error');
      }
    };
    init();
  }, []);

  const handleReset = async () => {
    setError(null);
    const success = await resetOfflineDemo();
    if (success) {
      setIsReady(true);
      router.replace('/(tabs)');
    } else {
      setError('Failed to reset demo data');
    }
  };

  // Show error screen with reset button
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Text style={[styles.errorTitle, { color: theme.error }]}>Something went wrong</Text>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>{error}</Text>
        <TouchableOpacity 
          style={[styles.resetButton, { backgroundColor: theme.primary }]}
          onPress={handleReset}
        >
          <Text style={styles.resetButtonText}>Reset Demo Data</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show loading while initializing offline demo
  if (!isReady && isOfflineDemoEnabled()) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading demo...
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'fade',
        }}
      >
        {isOfflineDemoEnabled() ? (
          // In offline mode, only show tabs (no login)
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        ) : (
          // Normal mode with login
          <>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </>
        )}
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  resetButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
