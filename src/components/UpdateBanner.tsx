import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useUpdateStore } from '@/store/useUpdateStore';
import { downloadAndInstallApk, releaseTagUrl } from '@/utils/updateChecker';

export function UpdateBanner(): React.JSX.Element | null {
  const { colors } = useTheme();
  const availableVersion = useUpdateStore((s) => s.availableVersion);
  const dismiss = useUpdateStore((s) => s.dismiss);
  const [downloading, setDownloading] = useState(false);

  if (availableVersion === null) return null;

  async function handlePress(): Promise<void> {
    if (downloading || availableVersion === null) return;
    setDownloading(true);
    try {
      await downloadAndInstallApk(availableVersion);
      void dismiss();
    } catch {
      Alert.alert('Download failed', 'Opening the release page in your browser instead.');
      void Linking.openURL(releaseTagUrl(availableVersion));
      void dismiss();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <View style={[styles.wrap, { backgroundColor: colors.primaryMuted }]}>
      <Pressable
        style={styles.banner}
        onPress={() => void handlePress()}
        disabled={downloading}
        accessibilityRole="button"
        accessibilityLabel={`Update available: version ${availableVersion}. Tap to download and install.`}
      >
        {downloading ? (
          <View style={styles.downloadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.text, { color: colors.primary }]}>Downloading v{availableVersion}…</Text>
          </View>
        ) : (
          <Text style={[styles.text, { color: colors.primary }]} numberOfLines={1}>
            v{availableVersion} available — tap to update
          </Text>
        )}
      </Pressable>
      {!downloading && (
        <Pressable
          style={styles.closeBtn}
          onPress={() => void dismiss()}
          accessibilityRole="button"
          accessibilityLabel="Dismiss update notification"
          hitSlop={8}
        >
          <Ionicons name="close" size={18} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  banner: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  downloadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  text: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
