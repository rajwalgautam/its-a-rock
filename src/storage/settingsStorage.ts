import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ColumnDensity, ThemeMode } from '@/types';

const SETTINGS_KEY = '@itsarock/settings';

export interface Settings {
  themeMode: ThemeMode;
  columnDensity: ColumnDensity;
}

export const DEFAULT_SETTINGS: Settings = {
  themeMode: 'system',
  columnDensity: 2,
};

const VALID_MODES: ThemeMode[] = ['light', 'dark', 'system'];
const VALID_DENSITIES: ColumnDensity[] = [2, 3, 4];

export async function loadSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (raw === null) return { ...DEFAULT_SETTINGS };
  const parsed = JSON.parse(raw) as Partial<Settings>;
  return {
    themeMode: VALID_MODES.includes(parsed.themeMode as ThemeMode)
      ? (parsed.themeMode as ThemeMode)
      : DEFAULT_SETTINGS.themeMode,
    columnDensity: VALID_DENSITIES.includes(parsed.columnDensity as ColumnDensity)
      ? (parsed.columnDensity as ColumnDensity)
      : DEFAULT_SETTINGS.columnDensity,
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
