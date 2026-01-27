import { StyleSheet } from 'react-native';

export const lightTheme = {
  background: '#F5F7FA',
  surface: 'rgba(255, 255, 255, 0.85)',
  surfaceGlass: 'rgba(255, 255, 255, 0.65)',
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  secondary: '#10B981',
  accent: '#6366F1',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: 'rgba(0, 0, 0, 0.08)',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  cardShadow: 'rgba(0, 0, 0, 0.1)',
};

export const darkTheme = {
  background: '#0F172A',
  surface: 'rgba(30, 41, 59, 0.85)',
  surfaceGlass: 'rgba(30, 41, 59, 0.65)',
  primary: '#60A5FA',
  primaryDark: '#3B82F6',
  secondary: '#34D399',
  accent: '#818CF8',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: 'rgba(255, 255, 255, 0.1)',
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',
  cardShadow: 'rgba(0, 0, 0, 0.3)',
};

export type Theme = typeof lightTheme;

export const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  glassCard: {
    backgroundColor: theme.surfaceGlass,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  text: {
    color: theme.text,
  },
  textSecondary: {
    color: theme.textSecondary,
  },
});
