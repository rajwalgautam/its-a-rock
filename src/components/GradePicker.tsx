import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { GRADE_SYSTEMS } from '@/constants/grades';
import { useTheme } from '@/theme/ThemeProvider';
import { useSettingsStore } from '@/store/useSettingsStore';
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
 * Grade selector. The active system (Settings → Grades) decides the scale: the
 * V-scale offers bases + a -/+ modifier and an optional "Range" (e.g. "V0–V2"),
 * while YDS and French present a single ascending scale of tokens.
 */
export function GradePicker({ value, onChange }: GradePickerProps): React.JSX.Element {
  const gradeSystem = useSettingsStore((s) => s.gradeSystem);
  if (gradeSystem !== 'V') {
    return (
      <SimpleScale
        grades={GRADE_SYSTEMS[gradeSystem].grades}
        value={value}
        onChange={onChange}
      />
    );
  }
  return <VGradePicker value={value} onChange={onChange} />;
}

/** A single ascending row of grade chips (YDS / French); tap the active to clear. */
function SimpleScale({
  grades,
  value,
  onChange,
}: {
  grades: readonly string[];
  value: string | null;
  onChange: (grade: string | null) => void;
}): React.JSX.Element {
  const { colors } = useTheme();
  const selected = value !== null ? value.trim() : null;
  return (
    <View style={styles.scale}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {grades.map((g) => {
          const active = g === selected;
          return (
            <Pressable
              key={g}
              onPress={() => onChange(active ? null : g)}
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
                {g}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** The V-scale picker: base chips + -/+ modifier, with an optional range mode. */
function VGradePicker({ value, onChange }: GradePickerProps): React.JSX.Element {
  const { colors } = useTheme();
  const range = parseGradeRange(value);
  const [rangeMode, setRangeMode] = useState(range !== null);

  // In range mode the endpoints are bare bases (e.g. "V4", "V5") — a range like
  // "V4+ – V5-" isn't a real-world label, so the +/- modifiers are dropped.
  const minStr = rangeMode
    ? range !== null
      ? range.min.base
      : (parseGrade(value)?.base ?? null)
    : parseGrade(value) !== null
      ? value!.trim()
      : null;
  const maxStr = rangeMode && range !== null ? range.max.base : null;

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
          <GradeScale value={minStr} onChange={(g) => emit(g, maxStr)} showModifiers={false} />
          <Text style={[styles.scaleLabel, { color: colors.textMuted }]}>To</Text>
          <GradeScale value={maxStr} onChange={(g) => emit(minStr, g)} showModifiers={false} />
        </View>
      )}
    </View>
  );
}

interface GradeScaleProps {
  value: string | null;
  onChange: (grade: string | null) => void;
  /** Show the softer/even/harder modifier row. Hidden for range endpoints. */
  showModifiers?: boolean;
}

/** V-scale base selector plus a -/+ modifier toggle for a single grade. */
function GradeScale({ value, onChange, showModifiers = true }: GradeScaleProps): React.JSX.Element {
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

      {showModifiers && (
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
      )}
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
