import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { GRADE_BASES, GRADE_MODIFIERS, formatGrade, parseGrade } from '@/utils/gradeUtils';
import type { GradeBase, GradeModifier } from '@/types';

interface GradePickerProps {
  value: string | null;
  onChange: (grade: string | null) => void;
}

/** V-scale base selector plus a -/+ modifier toggle. Grade is optional. */
export function GradePicker({ value, onChange }: GradePickerProps): React.JSX.Element {
  const { colors } = useTheme();
  const parsed = parseGrade(value);
  const selectedBase = parsed?.base ?? null;
  const selectedMod = parsed?.modifier ?? '';

  function selectBase(base: GradeBase): void {
    if (base === selectedBase && selectedMod === '') {
      onChange(null); // tapping the active base again clears it
      return;
    }
    onChange(formatGrade(base, selectedBase === base ? selectedMod : ''));
  }

  function selectModifier(mod: GradeModifier): void {
    if (selectedBase === null) return;
    onChange(formatGrade(selectedBase, mod === selectedMod ? '' : mod));
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {GRADE_BASES.map((base) => {
          const active = base === selectedBase;
          return (
            <Pressable
              key={base}
              onPress={() => selectBase(base)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.surfaceAlt,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: active ? colors.onPrimary : colors.textSecondary,
                  fontSize: FONT_SIZE.md,
                  fontWeight: '700',
                }}
              >
                {base}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.modifierRow}>
        {GRADE_MODIFIERS.map((mod) => {
          const label = mod === '' ? 'even' : mod === '+' ? 'harder (+)' : 'softer (−)';
          const active = mod === selectedMod && selectedBase !== null;
          const disabled = selectedBase === null;
          return (
            <Pressable
              key={mod || 'even'}
              onPress={() => selectModifier(mod)}
              disabled={disabled}
              style={[
                styles.modChip,
                {
                  backgroundColor: active ? colors.primaryMuted : colors.surface,
                  borderColor: active ? colors.primary : colors.border,
                  opacity: disabled ? 0.4 : 1,
                },
              ]}
            >
              <Text
                style={{
                  color: active ? colors.primary : colors.textSecondary,
                  fontSize: FONT_SIZE.sm,
                  fontWeight: '600',
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
    gap: SPACING.sm,
  },
  row: {
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  chip: {
    minWidth: 48,
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  modifierRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  modChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
});
