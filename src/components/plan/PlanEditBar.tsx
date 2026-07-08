import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import {
  MAX_BUBBLE_OPACITY,
  MAX_BUBBLE_SCALE,
  MIN_BUBBLE_OPACITY,
  MIN_BUBBLE_SCALE,
  nearestBubbleOpacity,
  nearestBubbleScale,
  stepBubbleOpacity,
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
  /** Limbs the selector offers; defaults to all four (hands-only passes two). */
  limbs?: readonly Limb[];
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
  bubbleOpacity: number;
  onBubbleOpacityChange: (value: number) => void;
  onHelp: () => void;
  onUndo: () => void;
  undoDisabled: boolean;
}

/**
 * The route planner's edit-mode bottom bar: a bubble-size control, the limb
 * selector, and the primary action row (group · play · sequence).
 */
export function PlanEditBar({
  activeLimb,
  onLimbChange,
  limbs,
  grouping,
  onToggleGroup,
  groupDisabled = false,
  onPlay,
  playDisabled,
  moveCount,
  onOpenList,
  bubbleScale,
  onBubbleScaleChange,
  bubbleOpacity,
  onBubbleOpacityChange,
  onHelp,
  onUndo,
  undoDisabled,
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
      <View style={styles.controls}>
        <BubbleSizeControl value={bubbleScale} onChange={onBubbleScaleChange} />
        <BubbleOpacityControl value={bubbleOpacity} onChange={onBubbleOpacityChange} />
      </View>

      <LimbSelector active={activeLimb} onChange={onLimbChange} limbs={limbs} />

      <View style={styles.actions}>
        <View style={[styles.side, styles.sideStart]}>
          <Pressable
            onPress={onUndo}
            disabled={undoDisabled}
            style={[
              styles.actionBtn,
              { backgroundColor: colors.surfaceAlt, opacity: undoDisabled ? 0.4 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityState={{ disabled: undoDisabled }}
            accessibilityLabel="Undo last edit"
          >
            <Ionicons name="arrow-undo" size={22} color={colors.textPrimary} />
          </Pressable>
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
            onPress={onHelp}
            style={[styles.actionBtn, { backgroundColor: colors.surfaceAlt }]}
            accessibilityRole="button"
            accessibilityLabel="How the planner works"
          >
            <Ionicons name="help-circle-outline" size={22} color={colors.textPrimary} />
          </Pressable>
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

/** A labeled −/＋ stepper with a live preview dot between the buttons. */
function StepperControl({
  label,
  preview,
  atMin,
  atMax,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
}: {
  label: string;
  preview: React.ReactNode;
  atMin: boolean;
  atMax: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseLabel: string;
  increaseLabel: string;
}): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <View style={styles.sizeRow}>
      <Text style={[styles.sizeLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.sizeStepper}>
        <Pressable
          onPress={onDecrease}
          disabled={atMin}
          hitSlop={8}
          style={[styles.sizeBtn, { backgroundColor: colors.surfaceAlt, opacity: atMin ? 0.4 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel={decreaseLabel}
        >
          <Ionicons name="remove" size={18} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.preview} accessibilityElementsHidden>
          {preview}
        </View>
        <Pressable
          onPress={onIncrease}
          disabled={atMax}
          hitSlop={8}
          style={[styles.sizeBtn, { backgroundColor: colors.surfaceAlt, opacity: atMax ? 0.4 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel={increaseLabel}
        >
          <Ionicons name="add" size={18} color={colors.textPrimary} />
        </Pressable>
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
  const preview = Math.round(10 * scale);

  return (
    <StepperControl
      label="Bubble size"
      atMin={scale <= MIN_BUBBLE_SCALE}
      atMax={scale >= MAX_BUBBLE_SCALE}
      onDecrease={() => onChange(stepBubbleScale(scale, -1))}
      onIncrease={() => onChange(stepBubbleScale(scale, 1))}
      decreaseLabel="Smaller bubbles"
      increaseLabel="Larger bubbles"
      preview={
        <View
          style={{
            width: preview,
            height: preview,
            borderRadius: preview / 2,
            backgroundColor: colors.primary,
          }}
        />
      }
    />
  );
}

function BubbleOpacityControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}): React.JSX.Element {
  const { colors } = useTheme();
  const opacity = nearestBubbleOpacity(value);

  return (
    <StepperControl
      label="Opacity"
      atMin={opacity <= MIN_BUBBLE_OPACITY}
      atMax={opacity >= MAX_BUBBLE_OPACITY}
      onDecrease={() => onChange(stepBubbleOpacity(opacity, -1))}
      onIncrease={() => onChange(stepBubbleOpacity(opacity, 1))}
      decreaseLabel="More transparent bubbles"
      increaseLabel="More opaque bubbles"
      preview={
        <View
          style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: colors.primary, opacity }}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: SPACING.xs,
  },
  controls: {
    gap: SPACING.xs,
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.md,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sideStart: {
    justifyContent: 'flex-start',
  },
  sideEnd: {
    justifyContent: 'flex-end',
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
