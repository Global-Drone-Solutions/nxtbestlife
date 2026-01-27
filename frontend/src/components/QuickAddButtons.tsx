import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeStore } from '../store/themeStore';

interface QuickAddButtonsProps {
  amounts: number[];
  unit: string;
  onAdd: (amount: number) => void;
}

export const QuickAddButtons: React.FC<QuickAddButtonsProps> = ({ amounts, unit, onAdd }) => {
  const { theme } = useThemeStore();

  return (
    <View style={styles.container}>
      {amounts.map((amount) => (
        <TouchableOpacity
          key={amount}
          style={[
            styles.button,
            { backgroundColor: theme.primary + '20', borderColor: theme.primary }
          ]}
          onPress={() => onAdd(amount)}
        >
          <Text style={[styles.buttonText, { color: theme.primary }]}>
            +{amount}{unit}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
