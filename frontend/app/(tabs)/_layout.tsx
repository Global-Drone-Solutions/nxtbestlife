import React, { useEffect, useState } from 'react';
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
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');

  // Check auth once on mount
  useEffect(() => {
    const checkAuth = () => {
      if (isOffline) {
        setAuthStatus('authenticated');
        return;
      }
      
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        setAuthStatus('authenticated');
      } else {
        setAuthStatus('unauthenticated');
        console.log('[TabsLayout] No user, redirecting to login');
        // Delay redirect to prevent render conflicts
        setTimeout(() => {
          router.replace('/');
        }, 100);
      }
    };
    
    checkAuth();
  }, []); // Empty deps - only run once on mount

  // Show loading while checking
  if (authStatus === 'checking' || authStatus === 'unauthenticated') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 16, color: theme.textSecondary }}>
          {authStatus === 'unauthenticated' ? 'Redirecting to login...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  // Authenticated - render tabs
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
