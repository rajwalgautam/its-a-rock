import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { FONT_SIZE } from '@/constants/theme';
import { toNormalized, toScreen, type Point } from '@/utils/coords';
import type { ImageRect } from '@/utils/imageLayout';

/** 44dp touch target (a11y minimum) with a smaller visible dot centered in it. */
const TOUCH = 44;
const DOT = 30;

interface LimbMarkerProps {
  /** Normalized position in [0,1] relative to the photo. */
  x: number;
  y: number;
  layout: ImageRect;
  color: string;
  label: string;
  /** Sequence badge (1-based) shown in edit mode; omit/null to hide. */
  badge?: number | null;
  selected?: boolean;
  draggable?: boolean;
  /** Glide to new positions (used in playback); instant otherwise. */
  animated?: boolean;
  onSelect?: () => void;
  /** Called with the new normalized position when a drag ends. */
  onCommit?: (norm: Point) => void;
}

/**
 * A colored, draggable limb marker positioned from normalized coordinates. Its
 * live screen position lives in shared values so dragging runs on the UI thread;
 * the position re-syncs from props whenever the underlying point or the image
 * layout changes (a drag commit, a reorder, or a rotation/resize), so there is
 * no jump between gesture end and the React state update.
 */
export function LimbMarker({
  x,
  y,
  layout,
  color,
  label,
  badge = null,
  selected = false,
  draggable = false,
  animated = false,
  onSelect,
  onCommit,
}: LimbMarkerProps): React.JSX.Element {
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
      posX.value += e.changeX;
      posY.value += e.changeY;
    })
    .onEnd(() => {
      runOnJS(commit)(posX.value, posY.value);
    });

  const tap = Gesture.Tap().onEnd(() => {
    runOnJS(select)();
  });

  const gesture = Gesture.Race(pan, tap);

  const style = useAnimatedStyle(() => ({
    left: posX.value - TOUCH / 2,
    top: posY.value - TOUCH / 2,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[styles.touch, style]}
        accessibilityRole="button"
        accessibilityLabel={`${label} marker`}
      >
        <Animated.View
          style={[
            styles.dot,
            { backgroundColor: color, borderWidth: selected ? 3 : 1.5 },
          ]}
        >
          <Text style={styles.label}>{label}</Text>
        </Animated.View>
        {badge !== null && (
          <Animated.View style={[styles.badge, { borderColor: color }]}>
            <Text style={[styles.badgeText, { color }]}>{badge}</Text>
          </Animated.View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  touch: {
    position: 'absolute',
    width: TOUCH,
    height: TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
});
