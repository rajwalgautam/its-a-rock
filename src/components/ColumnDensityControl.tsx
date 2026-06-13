import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { ColumnDensity } from '@/types';

const DENSITIES: ColumnDensity[] = [2, 3, 4];

/** Segmented 2/3/4 control bound to the app-wide column density setting. */
export function ColumnDensityControl(): React.JSX.Element {
  const { colors } = useTheme();
  const density = useSettingsStore((s) => s.columnDensity);
  const setDensity = useSettingsStore((s) => s.setColumnDensity);

  return (
    <View style={[styles.group, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
      {DENSITIES.map((d) => {
        const active = d === density;
        return (
          <Pressable
            key={d}
            onPress={() => setDensity(d)}
            accessibilityRole="button"
            accessibilityLabel={`${d} columns`}
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
              {d}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 2,
    gap: 2,
  },
  segment: {
    width: 34,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
  },
});
