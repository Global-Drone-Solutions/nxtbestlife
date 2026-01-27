import { create } from 'zustand';
import { lightTheme, darkTheme, Theme } from '../lib/theme';

interface ThemeState {
  isDark: boolean;
  theme: Theme;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,
  theme: lightTheme,
  toggleTheme: () => {
    const isDark = !get().isDark;
    set({ isDark, theme: isDark ? darkTheme : lightTheme });
  },
}));
