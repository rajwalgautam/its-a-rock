import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import {
  MAX_BUBBLE_SCALE,
  MIN_BUBBLE_SCALE,
  nearestBubbleScale,
  stepBubbleScale,
} from '@/constants/plan';
import { useTheme } from '@/theme/ThemeProvider';
import { LimbSelector } from '@/components/plan/LimbSelector';
import type { Limb } from '@/types';

const PLAY_SIZE = 64;
const ACTION_SIZE = 48;

interface PlanEditBarProps {
  activeLimb: Limb;
  onLimbChange: (limb: Limb) => void;
  grouping: boolean;
  onToggleGroup: () => void;
  /** Grouping is unavailable (e.g. during the initial 4-limb seeding). */
  groupDisabled?: boolean;
  onPlay: () => void;
  playDisabled: boolean;
  moveCount: number;
  onOpenList: () => void;
  bubbleScale: number;
  onBubbleScaleChange: (value: number) => void;
}

/**
 * The route planner's edit-mode bottom bar: a bubble-size control, the limb
 * selector, and the primary action row (group · play · sequence).
 */
export function PlanEditBar({
  activeLimb,
  onLimbChange,
  grouping,
  onToggleGroup,
  groupDisabled = false,
  onPlay,
  playDisabled,
  moveCount,
  onOpenList,
  bubbleScale,
  onBubbleScaleChange,
}: PlanEditBarProps): React.JSX.Element {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, SPACING.sm),
        },
      ]}
    >
      <BubbleSizeControl value={bubbleScale} onChange={onBubbleScaleChange} />

      <LimbSelector active={activeLimb} onChange={onLimbChange} />

      <View style={styles.actions}>
        <View style={[styles.side, styles.sideStart]}>
          <Pressable
            onPress={onToggleGroup}
            disabled={groupDisabled}
            style={[
              styles.actionBtn,
              {
                backgroundColor: grouping ? colors.primary : colors.surfaceAlt,
                opacity: groupDisabled ? 0.4 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: grouping, disabled: groupDisabled }}
            accessibilityLabel={grouping ? 'Grouping on' : 'Group moves'}
          >
            <Ionicons
              name="git-merge"
              size={22}
              color={grouping ? colors.onPrimary : colors.textPrimary}
            />
          </Pressable>
        </View>

        <View style={styles.center}>
          <Pressable
            onPress={onPlay}
            disabled={playDisabled}
            style={[
              styles.playBtn,
              { backgroundColor: colors.primary, opacity: playDisabled ? 0.4 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Play route"
          >
            <Ionicons name="play" size={30} color={colors.onPrimary} />
          </Pressable>
        </View>

        <View style={[styles.side, styles.sideEnd]}>
          <Pressable
            onPress={onOpenList}
            style={[styles.actionBtn, { backgroundColor: colors.surfaceAlt }]}
            accessibilityRole="button"
            accessibilityLabel="Show move sequence"
          >
            <Ionicons name="list" size={22} color={colors.textPrimary} />
            {moveCount > 0 && (
              <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.countText, { color: colors.onPrimary }]}>{moveCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function BubbleSizeControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}): React.JSX.Element {
  const { colors } = useTheme();
  const scale = nearestBubbleScale(value);
  const atMin = scale <= MIN_BUBBLE_SCALE;
  const atMax = scale >= MAX_BUBBLE_SCALE;
  const preview = Math.round(10 * scale);

  return (
    <View style={styles.sizeRow}>
      <Text style={[styles.sizeLabel, { color: colors.textSecondary }]}>Bubble size</Text>
      <View style={styles.sizeStepper}>
        <Pressable
          onPress={() => onChange(stepBubbleScale(scale, -1))}
          disabled={atMin}
          hitSlop={8}
          style={[
            styles.sizeBtn,
            { backgroundColor: colors.surfaceAlt, opacity: atMin ? 0.4 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Smaller bubbles"
        >
          <Ionicons name="remove" size={18} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.preview} accessibilityElementsHidden>
          <View
            style={{
              width: preview,
              height: preview,
              borderRadius: preview / 2,
              backgroundColor: colors.primary,
            }}
          />
        </View>
        <Pressable
          onPress={() => onChange(stepBubbleScale(scale, 1))}
          disabled={atMax}
          hitSlop={8}
          style={[
            styles.sizeBtn,
            { backgroundColor: colors.surfaceAlt, opacity: atMax ? 0.4 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Larger bubbles"
        >
          <Ionicons name="add" size={18} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: SPACING.xs,
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xs,
  },
  sizeLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  sizeStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sizeBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.xs,
  },
  side: {
    flex: 1,
    justifyContent: 'center',
  },
  sideStart: {
    alignItems: 'flex-start',
  },
  sideEnd: {
    alignItems: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  actionBtn: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: PLAY_SIZE,
    height: PLAY_SIZE,
    borderRadius: PLAY_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
