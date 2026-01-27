import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeStore } from '../store/themeStore';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  height = 8,
  color,
}) => {
  const { theme } = useThemeStore();
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={[
      styles.container, 
      { height, backgroundColor: theme.border }
    ]}>
      <View 
        style={[
          styles.fill,
          { 
            width: `${clampedProgress * 100}%`,
            backgroundColor: color || theme.primary,
          }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
