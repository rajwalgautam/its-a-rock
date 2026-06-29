import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_BUBBLE_SCALE,
  MAX_BUBBLE_SCALE,
  MIN_BUBBLE_SCALE,
} from '@/constants/plan';
import type { ColumnDensity, NotesLayout, ThemeMode } from '@/types';

const SETTINGS_KEY = '@itsarock/settings';

export interface Settings {
  themeMode: ThemeMode;
  columnDensity: ColumnDensity;
  lastLocationName?: string;
  /** Offer to attach a send video when a climb is marked completed. */
  promptSendVideo: boolean;
  /** Start videos muted when opened in the viewer. */
  muteVideosByDefault: boolean;
  /** Size multiplier for the route planner's limb bubbles on the photo. */
  bubbleScale: number;
  /** How a climb's notes are laid out on the detail card. */
  notesLayout: NotesLayout;
}

export const DEFAULT_SETTINGS: Settings = {
  themeMode: 'system',
  columnDensity: 2,
  lastLocationName: undefined,
  promptSendVideo: true,
  muteVideosByDefault: true,
  bubbleScale: DEFAULT_BUBBLE_SCALE,
  notesLayout: 'rows',
};

const VALID_MODES: ThemeMode[] = ['light', 'dark', 'system'];
const VALID_DENSITIES: ColumnDensity[] = [1, 2, 3, 4];
const VALID_NOTES_LAYOUTS: NotesLayout[] = ['rows', 'grid'];

function validBubbleScale(value: unknown): number {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= MIN_BUBBLE_SCALE &&
    value <= MAX_BUBBLE_SCALE
    ? value
    : DEFAULT_SETTINGS.bubbleScale;
}

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
    lastLocationName: parsed.lastLocationName ?? undefined,
    promptSendVideo:
      typeof parsed.promptSendVideo === 'boolean'
        ? parsed.promptSendVideo
        : DEFAULT_SETTINGS.promptSendVideo,
    muteVideosByDefault:
      typeof parsed.muteVideosByDefault === 'boolean'
        ? parsed.muteVideosByDefault
        : DEFAULT_SETTINGS.muteVideosByDefault,
    bubbleScale: validBubbleScale(parsed.bubbleScale),
    notesLayout: VALID_NOTES_LAYOUTS.includes(parsed.notesLayout as NotesLayout)
      ? (parsed.notesLayout as NotesLayout)
      : DEFAULT_SETTINGS.notesLayout,
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
