import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { DARK, LIGHT, Palette } from '@/constants/theme';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { ThemeMode } from '@/types';

interface ThemeContextValue {
  /** Active palette — what components read. */
  colors: Palette;
  /** The user's chosen mode (may be 'system'). */
  mode: ThemeMode;
  /** The concrete scheme in effect after resolving 'system'. */
  scheme: 'light' | 'dark';
  /** Persisted via useSettingsStore. */
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const mode = useSettingsStore((s) => s.themeMode);
  const setMode = useSettingsStore((s) => s.setThemeMode);
  const systemScheme = useColorScheme();

  const value = useMemo<ThemeContextValue>(() => {
    const scheme: 'light' | 'dark' =
      mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
    return {
      colors: scheme === 'dark' ? DARK : LIGHT,
      mode,
      scheme,
      setMode,
    };
  }, [mode, systemScheme, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === null) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
