import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { GRADE_BASES } from '@/utils/gradeUtils';
import { DEFAULT_HISTORY_FILTERS, hasActiveFilters } from '@/utils/historyFilters';
import type {
  Gym,
  HistoryCompletion,
  HistoryFilters,
  HistorySort,
} from '@/types';

interface HistoryFilterBarProps {
  filters: HistoryFilters;
  gyms: Gym[];
  onChange: (filters: HistoryFilters) => void;
}

const COMPLETION_OPTIONS: { value: HistoryCompletion; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Sent' },
  { value: 'projects', label: 'Projects' },
];

const SORT_OPTIONS: { value: HistorySort; label: string }[] = [
  { value: 'date-desc', label: 'Newest' },
  { value: 'date-asc', label: 'Oldest' },
  { value: 'grade-desc', label: 'Hardest' },
  { value: 'grade-asc', label: 'Easiest' },
  { value: 'gym-asc', label: 'Location' },
];

/** Collapsible filter + sort controls for the History tab. */
export function HistoryFilterBar({ filters, gyms, onChange }: HistoryFilterBarProps): React.JSX.Element {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const active = hasActiveFilters(filters);

  function set<K extends keyof HistoryFilters>(key: K, value: HistoryFilters[K]): void {
    onChange({ ...filters, [key]: value });
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => setExpanded((e) => !e)}
          style={[styles.toggle, { backgroundColor: colors.surfaceAlt, borderColor: active ? colors.primary : colors.border }]}
        >
          <Ionicons name="options-outline" size={16} color={active ? colors.primary : colors.textSecondary} />
          <Text style={[styles.toggleLabel, { color: active ? colors.primary : colors.textSecondary }]}>
            Filter & sort
          </Text>
          {active && <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={active ? colors.primary : colors.textSecondary}
          />
        </Pressable>
        {active && (
          <Pressable onPress={() => onChange({ ...DEFAULT_HISTORY_FILTERS, sort: filters.sort })} hitSlop={8}>
            <Text style={[styles.clearLabel, { color: colors.textMuted }]}>Clear</Text>
          </Pressable>
        )}
      </View>

      {expanded && (
        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Group label="Show">
            <View style={styles.chipRow}>
              {COMPLETION_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  active={filters.completion === o.value}
                  onPress={() => set('completion', o.value)}
                  colors={colors}
                />
              ))}
            </View>
          </Group>

          <Group label="Sort by">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {SORT_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  active={filters.sort === o.value}
                  onPress={() => set('sort', o.value)}
                  colors={colors}
                />
              ))}
            </ScrollView>
          </Group>

          {gyms.length > 0 && (
            <Group label="Location">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                <Chip
                  label="All"
                  active={filters.gymId === null}
                  onPress={() => set('gymId', null)}
                  colors={colors}
                />
                {gyms.map((g) => (
                  <Chip
                    key={g.id}
                    label={g.name}
                    active={filters.gymId === g.id}
                    onPress={() => set('gymId', filters.gymId === g.id ? null : g.id)}
                    colors={colors}
                  />
                ))}
              </ScrollView>
            </Group>
          )}

          <Group label="Min grade">
            <GradeChips
              selected={filters.gradeMin}
              onSelect={(g) => set('gradeMin', g)}
              colors={colors}
            />
          </Group>
          <Group label="Max grade">
            <GradeChips
              selected={filters.gradeMax}
              onSelect={(g) => set('gradeMax', g)}
              colors={colors}
            />
          </Group>
        </View>
      )}
    </View>
  );
}

function GradeChips({
  selected,
  onSelect,
  colors,
}: {
  selected: string | null;
  onSelect: (grade: string | null) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}): React.JSX.Element {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {GRADE_BASES.map((base) => (
        <Chip
          key={base}
          label={base}
          active={selected === base}
          onPress={() => onSelect(selected === base ? null : base)}
          colors={colors}
        />
      ))}
    </ScrollView>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <View style={styles.group}>
      <Text style={[styles.groupLabel, { color: colors.textMuted }]}>{label}</Text>
      {children}
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
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
          fontSize: FONT_SIZE.sm,
          fontWeight: '600',
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  toggleLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: RADIUS.full,
  },
  clearLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  panel: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  group: {
    gap: SPACING.xs,
  },
  groupLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    maxWidth: 180,
  },
});
