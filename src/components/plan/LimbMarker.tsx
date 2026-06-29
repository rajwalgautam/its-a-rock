import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { SPACING } from '@/constants/theme';
import { LIMB_ICON, LIMB_ICON_FLIP, LIMB_NAME } from '@/constants/limbs';
import { toNormalized, toScreen, type Point } from '@/utils/coords';
import type { ImageRect } from '@/utils/imageLayout';
import type { Limb } from '@/types';

/** 44dp touch target (a11y minimum) with a smaller visible dot centered in it. */
const TOUCH = 44;
const DOT = 30;
/** Collapsed marker: a small dot that barely covers the hold. */
const DOT_SM = 18;

interface LimbMarkerProps {
  /** Normalized position in [0,1] relative to the photo. */
  x: number;
  y: number;
  layout: ImageRect;
  color: string;
  /** Which limb this marker represents — drives the hand/foot icon. */
  limb: Limb;
  /** Sequence badge (1-based) shown in edit mode; omit/null to hide. */
  badge?: number | null;
  selected?: boolean;
  draggable?: boolean;
  /** Glide to new positions (used in playback); instant otherwise. */
  animated?: boolean;
  /** Collapse to a small dot so the hold underneath stays visible. */
  compact?: boolean;
  /** Size multiplier for the visible dot (user-configurable bubble size). */
  bubbleScale?: number;
  /**
   * Live canvas zoom factor. Drag deltas arrive in screen pixels, so they are
   * divided by this to move the marker the right amount in image space.
   */
  scale?: SharedValue<number>;
  onSelect?: () => void;
  /** Called with the new normalized position when a drag ends. */
  onCommit?: (norm: Point) => void;
}

/**
 * A colored, draggable limb marker positioned from normalized coordinates. It
 * shows the same hand/foot icon as the limb selector (left foot mirrored) with
 * the move's sequence number as a small badge. Its live screen position lives
 * in shared values so dragging runs on the UI thread; the position re-syncs
 * from props whenever the underlying point or the image layout changes (a drag
 * commit, a reorder, or a rotation/resize), so there is no jump between gesture
 * end and the React state update.
 */
export function LimbMarker({
  x,
  y,
  layout,
  color,
  limb,
  badge = null,
  selected = false,
  draggable = false,
  animated = false,
  compact = false,
  bubbleScale = 1,
  scale,
  onSelect,
  onCommit,
}: LimbMarkerProps): React.JSX.Element {
  // Dot grows with the user's bubble-size preference; the touch box keeps the
  // 44dp a11y minimum but expands to wrap a dot larger than that.
  const dotSize = (compact ? DOT_SM : DOT) * bubbleScale;
  const touchSize = Math.max(TOUCH, dotSize + SPACING.sm);
  // The hand/foot glyph fills most of the dot.
  const iconSize = Math.max(8, Math.round(dotSize * 0.66));
  const badgeSize = Math.max(13, Math.round((compact ? 12 : 15) * bubbleScale));
  const badgeFont = Math.max(7, Math.round((compact ? 8 : 9) * bubbleScale));

  const screen = toScreen({ x, y }, layout);
  const posX = useSharedValue(screen.x);
  const posY = useSharedValue(screen.y);

  useEffect(() => {
    if (animated) {
      posX.value = withTiming(screen.x, { duration: 280 });
      posY.value = withTiming(screen.y, { duration: 280 });
    } else {
      posX.value = screen.x;
      posY.value = screen.y;
    }
  }, [screen.x, screen.y, animated, posX, posY]);

  function commit(sx: number, sy: number): void {
    onCommit?.(toNormalized({ x: sx, y: sy }, layout));
  }

  function select(): void {
    onSelect?.();
  }

  const pan = Gesture.Pan()
    .enabled(draggable)
    .onChange((e) => {
      const s = scale ? scale.value : 1;
      posX.value += e.changeX / s;
      posY.value += e.changeY / s;
    })
    .onEnd(() => {
      runOnJS(commit)(posX.value, posY.value);
    });

  const tap = Gesture.Tap().onEnd(() => {
    runOnJS(select)();
  });

  const gesture = Gesture.Race(pan, tap);

  const style = useAnimatedStyle(() => ({
    left: posX.value - touchSize / 2,
    top: posY.value - touchSize / 2,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[styles.touch, { width: touchSize, height: touchSize }, style]}
        accessibilityRole="button"
        accessibilityLabel={`${LIMB_NAME[limb]} marker`}
      >
        <Animated.View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: color,
              borderWidth: selected ? (compact ? 2.5 : 3) : 1.5,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={LIMB_ICON[limb]}
            size={iconSize}
            color="#FFFFFF"
            style={LIMB_ICON_FLIP[limb] ? styles.flip : undefined}
          />
        </Animated.View>
        {badge !== null && (
          <Animated.View
            style={[
              styles.badge,
              {
                minWidth: badgeSize,
                height: badgeSize,
                borderRadius: badgeSize / 2,
                borderColor: color,
              },
            ]}
          >
            <Text style={[styles.badgeText, { color, fontSize: badgeFont }]}>{badge}</Text>
          </Animated.View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  // Width/height/borderRadius are applied inline so the dot can scale with the
  // user's bubble-size preference.
  touch: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flip: {
    transform: [{ scaleX: -1 }],
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    paddingHorizontal: 3,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontWeight: '800',
  },
});
