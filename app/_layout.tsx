import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Slot } from 'expo-router';
import { initDatabase } from '@/db/database';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useUpdateStore } from '@/store/useUpdateStore';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

export default function RootLayout(): React.JSX.Element {
  const [ready, setReady] = useState(false);
  const loadSettings = useSettingsStore((s) => s.load);
  const runStartupCheck = useUpdateStore((s) => s.runStartupCheck);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await initDatabase();
      await loadSettings();
      if (!cancelled) setReady(true);
      void runStartupCheck();
    })();
    return () => {
      cancelled = true;
    };
  }, [loadSettings, runStartupCheck]);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar style="auto" />
        {ready ? <Slot /> : <SplashFallback />}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function SplashFallback(): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
