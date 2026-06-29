import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '@/storage/settingsStorage';

describe('settingsStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns defaults when nothing is stored', async () => {
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('round-trips saved settings', async () => {
    await saveSettings({
      themeMode: 'dark',
      columnDensity: 1,
      promptSendVideo: false,
      muteVideosByDefault: false,
      bubbleScale: 1.4,
      notesLayout: 'grid',
    });
    expect(await loadSettings()).toEqual({
      themeMode: 'dark',
      columnDensity: 1,
      promptSendVideo: false,
      muteVideosByDefault: false,
      bubbleScale: 1.4,
      notesLayout: 'grid',
    });
  });

  it('falls back to defaults for invalid stored values', async () => {
    await AsyncStorage.setItem(
      '@itsarock/settings',
      JSON.stringify({
        themeMode: 'neon',
        columnDensity: 9,
        promptSendVideo: 'yes',
        muteVideosByDefault: 'no',
        bubbleScale: 99,
      }),
    );
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('clamps an out-of-range bubbleScale to the default', async () => {
    await saveSettings({ ...DEFAULT_SETTINGS, bubbleScale: 0.1 });
    expect((await loadSettings()).bubbleScale).toBe(DEFAULT_SETTINGS.bubbleScale);
  });
});
