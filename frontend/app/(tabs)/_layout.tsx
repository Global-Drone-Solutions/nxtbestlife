import React, { useEffect, useState } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { isOfflineDemoEnabled } from '../../src/lib/offlineStore';
import { View, Platform } from 'react-native';

export default function TabsLayout() {
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const isOffline = isOfflineDemoEnabled();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Check auth on mount only
  useEffect(() => {
    if (!isOffline && !user) {
      console.log('[TabsLayout] No user and not offline, will redirect to login');
      setShouldRedirect(true);
    }
  }, []); // Only run once on mount

  // Auth guard: redirect to login if not authenticated
  if (shouldRedirect) {
    return <Redirect href="/" />;
  }

  // If offline mode or user exists, render tabs
  if (isOffline || user) {
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
