import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { LIMB_NAME } from '@/constants/limbs';
import { useTheme } from '@/theme/ThemeProvider';
import type { Limb } from '@/types';

const THUMB = 16;

interface PlaybackControlsProps {
  /** Current step in [0, total]; 0 is the start (nothing placed). */
  step: number;
  total: number;
  movingLimb: Limb | null;
  onStep: (step: number) => void;
  onExit: () => void;
}

/** Bottom playback bar: scrub track, prev/next, and a current-move caption. */
export function PlaybackControls({
  step,
  total,
  movingLimb,
  onStep,
  onExit,
}: PlaybackControlsProps): React.JSX.Element {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const caption =
    step === 0
      ? 'Start'
      : `Move ${step} of ${total}${movingLimb !== null ? ` — ${LIMB_NAME[movingLimb]}` : ''}`;

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
      <View style={styles.captionRow}>
        <Text style={[styles.caption, { color: colors.textPrimary }]}>{caption}</Text>
        <Pressable onPress={onExit} hitSlop={8} accessibilityLabel="Exit playback" style={styles.exit}>
          <Ionicons name="create-outline" size={18} color={colors.primary} />
          <Text style={[styles.exitText, { color: colors.primary }]}>Edit</Text>
        </Pressable>
      </View>

      <Track step={step} total={total} onStep={onStep} />

      <View style={styles.buttons}>
        <StepButton
          icon="play-back"
          label="Previous move"
          disabled={step <= 0}
          onPress={() => onStep(step - 1)}
        />
        <Text style={[styles.counter, { color: colors.textSecondary }]}>
          {step} / {total}
        </Text>
        <StepButton
          icon="play-forward"
          label="Next move"
          disabled={step >= total}
          onPress={() => onStep(step + 1)}
        />
      </View>
    </View>
  );
}

function Track({
  step,
  total,
  onStep,
}: {
  step: number;
  total: number;
  onStep: (step: number) => void;
}): React.JSX.Element {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const ratio = total > 0 ? step / total : 0;

  function scrubTo(x: number): void {
    if (width <= 0 || total <= 0) return;
    const r = Math.max(0, Math.min(1, x / width));
    onStep(Math.round(r * total));
  }

  const pan = Gesture.Pan()
    .onBegin((e) => runOnJS(scrubTo)(e.x))
    .onChange((e) => runOnJS(scrubTo)(e.x));

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.trackHit} accessibilityLabel="Scrub moves">
        <View
          style={[styles.track, { backgroundColor: colors.surfaceAlt }]}
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        >
          <View style={[styles.fill, { backgroundColor: colors.primary, width: `${ratio * 100}%` }]} />
          <View
            style={[
              styles.thumb,
              { backgroundColor: colors.primary, left: Math.max(0, ratio * width - THUMB / 2) },
            ]}
          />
        </View>
      </View>
    </GestureDetector>
  );
}

function StepButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  disabled: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      hitSlop={8}
      style={[
        styles.stepBtn,
        { backgroundColor: colors.surfaceAlt, opacity: disabled ? 0.4 : 1 },
      ]}
    >
      <Ionicons name={icon} size={22} color={colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  caption: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  exit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  exitText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  trackHit: {
    height: 32,
    justifyContent: 'center',
  },
  track: {
    height: 6,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
  },
  fill: {
    height: 6,
    borderRadius: RADIUS.full,
  },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    top: -(THUMB - 6) / 2,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xl,
  },
  counter: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    minWidth: 56,
    textAlign: 'center',
  },
  stepBtn: {
    width: 52,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
