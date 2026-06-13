import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { ThemeMode } from '@/types';

// Placeholder home screen for the v0.1.0 foundation. It exists to prove the
// app boots and the theme toggle flips light/dark live and persists. The real
// tab navigation and My Climbing screen arrive in v0.2.0 (issues #14, #15).
const MODES: ThemeMode[] = ['light', 'dark', 'system'];

export default function Home(): React.JSX.Element {
  const { colors, mode, scheme, setMode } = useTheme();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>It&apos;s A Rock</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Foundation scaffold — active scheme: {scheme}
        </Text>

        <View style={styles.modes}>
          {MODES.map((m) => {
            const active = m === mode;
            return (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? colors.onPrimary : colors.textSecondary,
                    fontSize: FONT_SIZE.md,
                    fontWeight: '600',
                  }}
                >
                  {m}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
  },
  modes: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  chip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
});
