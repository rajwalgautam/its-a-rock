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
    });
    expect(await loadSettings()).toEqual({
      themeMode: 'dark',
      columnDensity: 1,
      promptSendVideo: false,
      muteVideosByDefault: false,
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
      }),
    );
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
