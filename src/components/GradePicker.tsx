import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import {
  GRADE_BASES,
  GRADE_MODIFIERS,
  formatGrade,
  formatGradeRange,
  parseGrade,
  parseGradeRange,
} from '@/utils/gradeUtils';
import { useState } from 'react';
import type { GradeBase, GradeModifier } from '@/types';

interface GradePickerProps {
  value: string | null;
  onChange: (grade: string | null) => void;
}

/**
 * Grade selector. By default it picks a single V-scale grade; the "Range"
 * toggle reveals a second scale so a climb can be logged as e.g. "V0–V2".
 */
export function GradePicker({ value, onChange }: GradePickerProps): React.JSX.Element {
  const { colors } = useTheme();
  const range = parseGradeRange(value);
  const [rangeMode, setRangeMode] = useState(range !== null);

  const minStr = range !== null ? formatGrade(range.min.base, range.min.modifier) : (parseGrade(value) !== null ? value!.trim() : null);
  const maxStr = range !== null ? formatGrade(range.max.base, range.max.modifier) : null;

  function emit(min: string | null, max: string | null): void {
    if (rangeMode && min !== null && max !== null) {
      onChange(formatGradeRange(min, max));
    } else {
      onChange(min);
    }
  }

  function toggleRange(): void {
    if (rangeMode) {
      setRangeMode(false);
      onChange(minStr); // collapse to the single lower grade
    } else {
      setRangeMode(true); // value stays a single grade until a max is chosen
    }
  }

  return (
    <View style={styles.container}>
      <Pressable
        onPress={toggleRange}
        style={styles.rangeToggle}
        accessibilityRole="switch"
        accessibilityState={{ checked: rangeMode }}
      >
        <View
          style={[
            styles.checkbox,
            {
              borderColor: colors.border,
              backgroundColor: rangeMode ? colors.primary : 'transparent',
            },
          ]}
        />
        <Text style={[styles.rangeToggleLabel, { color: colors.textSecondary }]}>Range</Text>
      </Pressable>

      {!rangeMode ? (
        <GradeScale value={minStr} onChange={onChange} />
      ) : (
        <View style={styles.scaleGroup}>
          <Text style={[styles.scaleLabel, { color: colors.textMuted }]}>From</Text>
          <GradeScale value={minStr} onChange={(g) => emit(g, maxStr)} />
          <Text style={[styles.scaleLabel, { color: colors.textMuted }]}>To</Text>
          <GradeScale value={maxStr} onChange={(g) => emit(minStr, g)} />
        </View>
      )}
    </View>
  );
}

interface GradeScaleProps {
  value: string | null;
  onChange: (grade: string | null) => void;
}

/** V-scale base selector plus a -/+ modifier toggle for a single grade. */
function GradeScale({ value, onChange }: GradeScaleProps): React.JSX.Element {
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
    <View style={styles.scale}>
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
  rangeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    alignSelf: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
  },
  rangeToggleLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  scaleGroup: {
    gap: SPACING.xs,
  },
  scaleLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scale: {
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
