import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { ColumnDensity } from '@/types';

const DENSITIES: Array<{ density: ColumnDensity; label: string }> = [
  { density: 2, label: 'Large' },
  { density: 3, label: 'Medium' },
  { density: 4, label: 'Small' },
];

/** Segmented column density control with label. */
export function ColumnDensityControl(): React.JSX.Element {
  const { colors } = useTheme();
  const density = useSettingsStore((s) => s.columnDensity);
  const setDensity = useSettingsStore((s) => s.setColumnDensity);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>Columns</Text>
      <View style={[styles.group, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        {DENSITIES.map(({ density: d, label }) => {
          const active = d === density;
          return (
            <Pressable
              key={d}
              onPress={() => setDensity(d)}
              accessibilityRole="button"
              accessibilityLabel={`${label} (${d} columns)`}
              accessibilityState={{ selected: active }}
              style={[styles.segment, active && { backgroundColor: colors.surface }]}
            >
              <Text
                style={{
                  color: active ? colors.primary : colors.textMuted,
                  fontSize: FONT_SIZE.sm,
                  fontWeight: '700',
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  group: {
    flexDirection: 'row',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 2,
    gap: 2,
  },
  segment: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
  },
});
