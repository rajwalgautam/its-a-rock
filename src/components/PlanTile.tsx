import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { formatGradeLabel } from '@/utils/formatters';
import type { PlanSummary } from '@/types';

interface PlanTileProps {
  summary: PlanSummary;
  /** Side length in px (tiles are square). */
  size: number;
  /**
   * How many plans this tile stands for. `1` (default) is a plain card; higher
   * renders a stacked look with the count, standing in for a climb's plans.
   */
  stackCount?: number;
  onPress: (summary: PlanSummary) => void;
}

/** Peek (px) of the backing cards behind a stack. */
const STACK_PEEK = 6;

/**
 * A Plans-tab card: the plan's photo with the climb's grade/gym overlaid and a
 * play badge showing the move count. When it represents a stack of a climb's
 * plans, backing cards peek out behind it and a count badge is shown.
 */
export function PlanTile({ summary, size, stackCount = 1, onPress }: PlanTileProps): React.JSX.Element {
  const { colors } = useTheme();
  const stacked = stackCount > 1;
  // Leave room at the bottom-right for the backing cards to peek out.
  const cardSize = stacked ? size - STACK_PEEK : size;
  const { route } = summary;
  const hasPhoto = summary.photoUri !== null && summary.photoUri.length > 0;
  const smallFont = cardSize < 130;

  return (
    <Pressable
      onPress={() => onPress(summary)}
      accessibilityRole="button"
      accessibilityLabel={
        stacked
          ? `${stackCount} plans for ${formatGradeLabel(route.grade)} at ${route.gym.name}`
          : `Plan for ${formatGradeLabel(route.grade)} at ${route.gym.name}, ${summary.moveCount} moves`
      }
      style={({ pressed }) => [{ width: size, height: size, opacity: pressed ? 0.85 : 1 }]}
    >
      {stacked && (
        <>
          <View
            style={[
              styles.backing,
              {
                width: cardSize,
                height: cardSize,
                left: STACK_PEEK,
                top: STACK_PEEK,
                backgroundColor: colors.tilePlaceholder,
                borderColor: colors.border,
              },
            ]}
          />
          <View
            style={[
              styles.backing,
              {
                width: cardSize,
                height: cardSize,
                left: STACK_PEEK / 2,
                top: STACK_PEEK / 2,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          />
        </>
      )}

      <View
        style={[
          styles.card,
          { width: cardSize, height: cardSize, backgroundColor: colors.tilePlaceholder },
        ]}
      >
        {hasPhoto ? (
          <Image source={{ uri: summary.photoUri! }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="footsteps-outline" size={cardSize * 0.28} color={colors.textMuted} />
          </View>
        )}

        <View style={[styles.playBadge, { backgroundColor: colors.overlay }]}>
          <Ionicons name="play" size={12} color={colors.onOverlay} />
          <Text style={[styles.playText, { color: colors.onOverlay }]}>{summary.moveCount}</Text>
        </View>

        {stacked && (
          <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.countText, { color: colors.onPrimary }]}>{stackCount}</Text>
          </View>
        )}

        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <Text
            style={[
              styles.grade,
              { color: colors.onOverlay, fontSize: smallFont ? FONT_SIZE.sm : FONT_SIZE.md },
            ]}
            numberOfLines={1}
          >
            {formatGradeLabel(route.grade)}
          </Text>
          <Text style={[styles.location, { color: colors.onOverlay }]} numberOfLines={1}>
            {route.gym.name}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backing: {
    position: 'absolute',
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  card: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBadge: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: SPACING.xs,
    height: 22,
    borderRadius: RADIUS.full,
  },
  playText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  countBadge: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: 2,
  },
  grade: {
    fontWeight: '800',
  },
  location: {
    fontSize: FONT_SIZE.xs,
    opacity: 0.9,
  },
});
