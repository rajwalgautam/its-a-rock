import { StyleSheet, Text, View } from 'react-native';
import { FONT_SIZE, RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';

interface StatCardProps {
  label: string;
  value: string;
  /** Optional secondary line under the value. */
  sublabel?: string;
  /** Accent color for the value. Defaults to the brand primary. */
  accentColor?: string;
}

/** A headline-number card for the My Climbing stats row. */
export function StatCard({
  label,
  value,
  sublabel,
  accentColor,
}: StatCardProps): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }, SHADOW.sm]}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <Text
        style={[styles.value, { color: accentColor ?? colors.primary }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      {sublabel !== undefined && (
        <Text style={[styles.sublabel, { color: colors.textSecondary }]}>{sublabel}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '28%',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
  },
  sublabel: {
    fontSize: FONT_SIZE.sm,
  },
});
