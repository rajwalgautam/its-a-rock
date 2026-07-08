import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { IN_APP_UPDATES_ENABLED } from '@/constants/features';
import { FONT_SIZE, RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useSettingsStore } from '@/store/useSettingsStore';
import { GRADE_SYSTEMS, GRADE_SYSTEM_ORDER } from '@/constants/grades';
import { LocationsManager } from '@/components/LocationsManager';
import {
  downloadAndInstallApk,
  formatLastChecked,
  getLastCheckedAt,
  performUpdateCheck,
  releaseTagUrl,
} from '@/utils/updateChecker';
import type { ThemeMode } from '@/types';

const MODES: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
  { mode: 'system', label: 'System' },
];

export default function Settings(): React.JSX.Element {
  const { colors, mode, setMode } = useTheme();
  const promptSendVideo = useSettingsStore((s) => s.promptSendVideo);
  const setPromptSendVideo = useSettingsStore((s) => s.setPromptSendVideo);
  const muteVideosByDefault = useSettingsStore((s) => s.muteVideosByDefault);
  const setMuteVideosByDefault = useSettingsStore((s) => s.setMuteVideosByDefault);
  const gradeSystem = useSettingsStore((s) => s.gradeSystem);
  const setGradeSystem = useSettingsStore((s) => s.setGradeSystem);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checking, setChecking] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [downloading, setDownloading] = useState(false);

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
      setHasChecked(true);
    } finally {
      setChecking(false);
    }
  }

  async function downloadUpdate(): Promise<void> {
    if (downloading || latestVersion === null) return;
    setDownloading(true);
    try {
      await downloadAndInstallApk(latestVersion);
    } catch {
      Alert.alert('Download failed', 'Opening the release page in your browser instead.');
      void Linking.openURL(releaseTagUrl(latestVersion));
    } finally {
      setDownloading(false);
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

        <SectionLabel label="Grades" />
        <View style={[styles.card, { backgroundColor: colors.surface }, SHADOW.sm]}>
          <View style={[styles.segmented, { backgroundColor: colors.surfaceAlt }]}>
            {GRADE_SYSTEM_ORDER.map((system) => {
              const active = system === gradeSystem;
              return (
                <Pressable
                  key={system}
                  onPress={() => setGradeSystem(system)}
                  style={[styles.segment, active && { backgroundColor: colors.surface }]}
                >
                  <Text
                    style={{
                      color: active ? colors.primary : colors.textSecondary,
                      fontWeight: '700',
                      fontSize: FONT_SIZE.sm,
                    }}
                  >
                    {GRADE_SYSTEMS[system].label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.rowHint, { color: colors.textMuted, marginTop: SPACING.sm }]}>
            The scale used when logging a climb&apos;s grade. Existing climbs keep the
            grade they were logged with.
          </Text>
        </View>

        <SectionLabel label="Logging" />
        <View style={[styles.card, { backgroundColor: colors.surface }, SHADOW.sm]}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                Prompt for send video
              </Text>
              <Text style={[styles.rowHint, { color: colors.textMuted }]}>
                Offer to attach a video when you mark a climb completed
              </Text>
            </View>
            <Switch
              value={promptSendVideo}
              onValueChange={setPromptSendVideo}
              trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                Mute videos by default
              </Text>
              <Text style={[styles.rowHint, { color: colors.textMuted }]}>
                Start videos muted when you open them
              </Text>
            </View>
            <Switch
              value={muteVideosByDefault}
              onValueChange={setMuteVideosByDefault}
              trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        </View>

        <SectionLabel label="Locations" />
        <LocationsManager />

        <SectionLabel label="About" />
        <View style={[styles.card, { backgroundColor: colors.surface }, SHADOW.sm]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Version</Text>
            <Text style={[styles.rowValue, { color: colors.textSecondary }]}>v{version}</Text>
          </View>
          {IN_APP_UPDATES_ENABLED && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Pressable
                style={styles.row}
                onPress={() => void (latestVersion !== null ? downloadUpdate() : checkForUpdates())}
                disabled={checking || downloading}
              >
                <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Check for Updates</Text>
                <Text style={[styles.rowValue, { color: colors.primary }]}>
                  {checking
                    ? 'Checking…'
                    : downloading
                      ? 'Downloading…'
                      : latestVersion !== null
                        ? `v${latestVersion} available →`
                        : hasChecked
                          ? 'Up to date'
                          : 'Check'}
                </Text>
              </Pressable>
              <Text style={[styles.lastChecked, { color: colors.textMuted }]}>
                {formatLastChecked(lastChecked)}
              </Text>
            </>
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Pressable style={styles.row} onPress={() => router.push('/releases')}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Release notes</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
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
  rowText: {
    flex: 1,
    marginRight: SPACING.md,
  },
  rowLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  rowHint: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
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
