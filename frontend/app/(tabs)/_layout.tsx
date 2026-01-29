import React, { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { isOfflineDemoEnabled } from '../../src/lib/offlineStore';
import { View, Platform, ActivityIndicator, Text } from 'react-native';

export default function TabsLayout() {
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const isOffline = isOfflineDemoEnabled();
  const hasRedirected = useRef(false);

  // Auth guard: redirect to login if not authenticated
  // This runs on mount AND when user changes (e.g., after logout)
  useEffect(() => {
    if (!isOffline && !user && !hasRedirected.current) {
      hasRedirected.current = true;
      console.log('[TabsLayout] No user and not offline, redirecting to login');
      router.replace('/');
    }
  }, [user, isOffline]);

  // If not authenticated and not offline, show loading while redirecting
  if (!isOffline && !user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 16, color: theme.textSecondary }}>Redirecting...</Text>
      </View>
    );
  }

  // If offline mode or user exists, render tabs
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          height: Platform.OS === 'ios' ? 88 : 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="checkin"
        options={{
          title: 'Check-in',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
    );
  }

  // Fallback: show nothing while waiting for auth check
  return null;
}
