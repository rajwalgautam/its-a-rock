import { create } from 'zustand';
import type { ColumnDensity, ThemeMode } from '@/types';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type Settings,
} from '@/storage/settingsStorage';

interface SettingsState extends Settings {
  isLoaded: boolean;
  load: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => void;
  setColumnDensity: (density: ColumnDensity) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  themeMode: DEFAULT_SETTINGS.themeMode,
  columnDensity: DEFAULT_SETTINGS.columnDensity,
  isLoaded: false,

  load: async () => {
    const settings = await loadSettings();
    set({ ...settings, isLoaded: true });
  },

  setThemeMode: (mode) => {
    set({ themeMode: mode });
    void persist(get);
  },

  setColumnDensity: (density) => {
    set({ columnDensity: density });
    void persist(get);
  },
}));

function persist(get: () => SettingsState): Promise<void> {
  const { themeMode, columnDensity } = get();
  return saveSettings({ themeMode, columnDensity });
}
