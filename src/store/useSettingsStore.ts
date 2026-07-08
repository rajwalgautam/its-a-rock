import { create } from 'zustand';
import type { ColumnDensity, GradeSystem, NotesLayout, ThemeMode } from '@/types';
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
  setLastLocationName: (name: string) => void;
  setPromptSendVideo: (value: boolean) => void;
  setMuteVideosByDefault: (value: boolean) => void;
  setBubbleScale: (value: number) => void;
  setBubbleOpacity: (value: number) => void;
  setNotesLayout: (value: NotesLayout) => void;
  setGradeSystem: (value: GradeSystem) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  themeMode: DEFAULT_SETTINGS.themeMode,
  columnDensity: DEFAULT_SETTINGS.columnDensity,
  lastLocationName: DEFAULT_SETTINGS.lastLocationName,
  promptSendVideo: DEFAULT_SETTINGS.promptSendVideo,
  muteVideosByDefault: DEFAULT_SETTINGS.muteVideosByDefault,
  bubbleScale: DEFAULT_SETTINGS.bubbleScale,
  bubbleOpacity: DEFAULT_SETTINGS.bubbleOpacity,
  notesLayout: DEFAULT_SETTINGS.notesLayout,
  gradeSystem: DEFAULT_SETTINGS.gradeSystem,
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

  setLastLocationName: (name) => {
    set({ lastLocationName: name });
    void persist(get);
  },

  setPromptSendVideo: (value) => {
    set({ promptSendVideo: value });
    void persist(get);
  },

  setMuteVideosByDefault: (value) => {
    set({ muteVideosByDefault: value });
    void persist(get);
  },

  setBubbleScale: (value) => {
    set({ bubbleScale: value });
    void persist(get);
  },

  setBubbleOpacity: (value) => {
    set({ bubbleOpacity: value });
    void persist(get);
  },

  setNotesLayout: (value) => {
    set({ notesLayout: value });
    void persist(get);
  },

  setGradeSystem: (value) => {
    set({ gradeSystem: value });
    void persist(get);
  },
}));

function persist(get: () => SettingsState): Promise<void> {
  const {
    themeMode,
    columnDensity,
    lastLocationName,
    promptSendVideo,
    muteVideosByDefault,
    bubbleScale,
    bubbleOpacity,
    notesLayout,
    gradeSystem,
  } = get();
  return saveSettings({
    themeMode,
    columnDensity,
    lastLocationName,
    promptSendVideo,
    muteVideosByDefault,
    bubbleScale,
    bubbleOpacity,
    notesLayout,
    gradeSystem,
  });
}
