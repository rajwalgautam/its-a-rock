import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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
  /** Greyed-out "floating" annotation — an optional/uncommitted hold. */
  floating?: boolean;
  /** This limb's latest placement — draw a "current stance" ring. */
  current?: boolean;
  /** Dim the marker (a superseded, non-current placement). */
  muted?: boolean;
  /**
   * When false, the marker ignores touches entirely (no select/drag) and lets
   * them fall through to the canvas — so a tap near a superseded move places a
   * new overlapping one instead of re-selecting the old one. Defaults to true.
   */
  interactive?: boolean;
  /** Size multiplier for the visible dot (user-configurable bubble size). */
  bubbleScale?: number;
  /** Opacity multiplier for the dot/badge (user-configurable transparency). */
  bubbleOpacity?: number;
  /**
   * Live canvas zoom factor. Drag deltas arrive in screen pixels, so they are
   * divided by this to move the marker the right amount in image space.
   */
  scale?: SharedValue<number>;
  onSelect?: () => void;
  /** Called with the new normalized position when a drag ends. */
  onCommit?: (norm: Point) => void;
  /** Double-tap toggles the floating (greyed-out) annotation. */
  onToggleFloating?: () => void;
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
  floating = false,
  current = false,
  muted = false,
  interactive = true,
  bubbleScale = 1,
  bubbleOpacity = 1,
  scale,
  onSelect,
  onCommit,
  onToggleFloating,
}: LimbMarkerProps): React.JSX.Element {
  // Dot grows with the user's bubble-size preference; the touch box keeps the
  // 44dp a11y minimum but expands to wrap a dot larger than that.
  const dotSize = (compact ? DOT_SM : DOT) * bubbleScale;
  const touchSize = Math.max(TOUCH, dotSize + SPACING.sm);
  // The hand/foot glyph fills most of the dot.
  const iconSize = Math.max(8, Math.round(dotSize * 0.66));
  const badgeSize = Math.max(13, Math.round((compact ? 12 : 15) * bubbleScale));
  const badgeFont = Math.max(7, Math.round((compact ? 8 : 9) * bubbleScale));
  // Current-stance ring: a thin accent halo sitting just outside the dot.
  const ringGap = Math.max(2, Math.round(3 * bubbleScale));
  const ringWidth = Math.max(1.5, Math.round(2 * bubbleScale));

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

  function toggleFloating(): void {
    onToggleFloating?.();
  }

  function liftHaptic(): void {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  // A marker only moves after a deliberate hold, so casual taps (select) and
  // one-finger canvas gestures don't nudge it. The hold "lifts" it, then the
  // finger drags it.
  const pan = Gesture.Pan()
    .enabled(draggable && interactive)
    .activateAfterLongPress(300)
    .onStart(() => {
      runOnJS(liftHaptic)();
    })
    .onChange((e) => {
      const s = scale ? scale.value : 1;
      posX.value += e.changeX / s;
      posY.value += e.changeY / s;
    })
    .onEnd(() => {
      runOnJS(commit)(posX.value, posY.value);
    });

  const doubleTap = Gesture.Tap()
    .enabled(onToggleFloating !== undefined && interactive)
    .numberOfTaps(2)
    .maxDistance(20)
    .onEnd(() => {
      runOnJS(toggleFloating)();
    });

  const tap = Gesture.Tap()
    .enabled(interactive)
    .onEnd(() => {
      runOnJS(select)();
    });

  // Double-tap must win over single-tap; the hold-to-drag pan races alongside.
  const gesture = Gesture.Race(pan, Gesture.Exclusive(doubleTap, tap));

  const style = useAnimatedStyle(() => ({
    left: posX.value - touchSize / 2,
    top: posY.value - touchSize / 2,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        // Superseded markers don't intercept touches, so a tap near one places a
        // new overlapping move instead of re-selecting the old one.
        pointerEvents={interactive ? 'auto' : 'none'}
        style={[
          styles.touch,
          // Non-current placements are dimmed, but a tapped marker un-dims so it
          // stays legible and easy to drag.
          { width: touchSize, height: touchSize, opacity: bubbleOpacity * (muted && !selected ? 0.4 : 1) },
          style,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${LIMB_NAME[limb]} marker${current ? `, current ${LIMB_NAME[limb].toLowerCase()}` : ''}`}
        accessibilityHint={floating ? 'Floating; double-tap to restore' : 'Double-tap to mark floating'}
      >
        <Animated.View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: color,
              // Floating markers keep their color but wear a dashed black border.
              borderColor: floating ? '#000000' : '#FFFFFF',
              borderStyle: floating ? 'dashed' : 'solid',
              borderWidth: selected ? (compact ? 2.5 : 3) : floating ? 2 : 1.5,
            },
          ]}
        >
          {current && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.ring,
                {
                  top: -ringGap,
                  left: -ringGap,
                  right: -ringGap,
                  bottom: -ringGap,
                  borderRadius: dotSize / 2 + ringGap,
                  borderWidth: ringWidth,
                },
              ]}
            />
          )}
          <MaterialCommunityIcons
            name={LIMB_ICON[limb]}
            size={iconSize}
            color="#FFFFFF"
            style={LIMB_ICON_FLIP[limb] ? styles.flip : undefined}
          />
          {/* Anchored to the dot (not the larger touch box) so it stays pinned
              to the marker even when the bubble is scaled small. */}
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
              <Text
                numberOfLines={1}
                style={[styles.badgeText, { color, fontSize: badgeFont }]}
              >
                {badge}
              </Text>
            </Animated.View>
          )}
        </Animated.View>
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
  // A bright amber halo, distinct from the white selection border, marking the
  // limb's latest placement (the current body position).
  ring: {
    position: 'absolute',
    borderColor: '#FFC400',
  },
  flip: {
    transform: [{ scaleX: -1 }],
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    paddingHorizontal: 4,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    // Grow leftward to fit a two-digit sequence number without clipping.
    overflow: 'visible',
  },
  badgeText: {
    fontWeight: '800',
  },
});
