import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { FONT_SIZE, RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import {
  formatLastChecked,
  getLastCheckedAt,
  performUpdateCheck,
} from '@/utils/updateChecker';
import type { ThemeMode } from '@/types';

const MODES: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
  { mode: 'system', label: 'System' },
];

export default function Settings(): React.JSX.Element {
  const { colors, mode, setMode } = useTheme();
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checking, setChecking] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);

  const version = Constants.expoConfig?.version ?? '—';

  useEffect(() => {
    void getLastCheckedAt().then(setLastChecked);
  }, []);

  async function checkForUpdates(): Promise<void> {
    if (checking) return;
    setChecking(true);
    try {
      const result = await performUpdateCheck();
      setLatestVersion(result.isNewer ? result.remoteVersion : null);
      setLastChecked(await getLastCheckedAt());
    } finally {
      setChecking(false);
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>Settings</Text>

        <SectionLabel label="Appearance" />
        <View style={[styles.card, { backgroundColor: colors.surface }, SHADOW.sm]}>
          <View style={[styles.segmented, { backgroundColor: colors.surfaceAlt }]}>
            {MODES.map(({ mode: m, label }) => {
              const active = m === mode;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMode(m)}
                  style={[styles.segment, active && { backgroundColor: colors.surface }]}
                >
                  <Text
                    style={{
                      color: active ? colors.primary : colors.textSecondary,
                      fontWeight: '700',
                      fontSize: FONT_SIZE.sm,
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <SectionLabel label="About" />
        <View style={[styles.card, { backgroundColor: colors.surface }, SHADOW.sm]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Version</Text>
            <Text style={[styles.rowValue, { color: colors.textSecondary }]}>v{version}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Pressable style={styles.row} onPress={() => void checkForUpdates()} disabled={checking}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Check for Updates</Text>
            <Text style={[styles.rowValue, { color: colors.primary }]}>
              {checking
                ? 'Checking…'
                : latestVersion !== null
                  ? `v${latestVersion} available →`
                  : 'Check'}
            </Text>
          </Pressable>
          <Text style={[styles.lastChecked, { color: colors.textMuted }]}>
            {formatLastChecked(lastChecked)}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ label }: { label: string }): React.JSX.Element {
  const { colors } = useTheme();
  return <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{label}</Text>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  screenTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    marginBottom: SPACING.sm,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: SPACING.md,
  },
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: RADIUS.md,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  rowLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  rowValue: {
    fontSize: FONT_SIZE.md,
  },
  divider: {
    height: 1,
    marginVertical: SPACING.xs,
  },
  lastChecked: {
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs,
  },
});
