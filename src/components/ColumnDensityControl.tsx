import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_SIZE, RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { ColumnDensity } from '@/types';

const DENSITIES: Array<{ density: ColumnDensity; label: string }> = [
  { density: 1, label: 'Single' },
  { density: 2, label: 'Large' },
  { density: 3, label: 'Medium' },
  { density: 4, label: 'Small' },
];

function labelFor(density: ColumnDensity): string {
  return DENSITIES.find((d) => d.density === density)?.label ?? 'Large';
}

/** Column density dropdown: pick how many tiles fit per row (1–4). */
export function ColumnDensityControl(): React.JSX.Element {
  const { colors } = useTheme();
  const density = useSettingsStore((s) => s.columnDensity);
  const setDensity = useSettingsStore((s) => s.setColumnDensity);
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>Columns</Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Columns: ${labelFor(density)}`}
        style={[styles.trigger, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
      >
        <Text style={[styles.triggerText, { color: colors.textPrimary }]}>{labelFor(density)}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOW.md]}>
            {DENSITIES.map(({ density: d, label }, i) => {
              const active = d === density;
              return (
                <View key={d}>
                  {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                  <Pressable
                    onPress={() => {
                      setDensity(d);
                      setOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={({ pressed }) => [
                      styles.option,
                      { backgroundColor: pressed ? colors.surfaceAlt : 'transparent' },
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? colors.primary : colors.textPrimary,
                        fontSize: FONT_SIZE.md,
                        fontWeight: active ? '700' : '500',
                      }}
                    >
                      {label}
                    </Text>
                    {active && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                  </Pressable>
                </View>
              );
            })}
          </View>
        </Pressable>
      </Modal>
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
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    minWidth: 96,
    justifyContent: 'space-between',
  },
  triggerText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  menu: {
    minWidth: 200,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  divider: {
    height: 1,
  },
});
