import { useMemo, useState } from 'react';
import { Image, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { toNormalized, toScreen, type Point } from '@/utils/coords';
import { imageLayout } from '@/utils/imageLayout';
import { LimbMarker } from '@/components/plan/LimbMarker';
import type { Limb } from '@/types';

export interface CanvasMarker {
  key: string;
  limb: Limb;
  /** Normalized position in [0,1]. */
  x: number;
  y: number;
  color: string;
  /** Sequence badge (1-based), or null to hide it. */
  badge: number | null;
  /** Render as a small numbered dot instead of a full labeled marker. */
  dot?: boolean;
  /** Frame id; markers sharing one are joined by a dotted connector. */
  groupId?: number | null;
  /** Force the selected (emphasized) styling regardless of `selectedKey`. */
  highlighted?: boolean;
  /** Greyed-out "floating" annotation — an optional/uncommitted hold. */
  floating?: boolean;
  /** This limb's latest placement — flagged as part of the current stance. */
  current?: boolean;
}

/** Radius (image px) around a marker within which a tap selects rather than places. */
const MARKER_GUARD = 24;
/** How far in the user can pinch-zoom. */
const MAX_SCALE = 4;

interface PlanCanvasProps {
  photoUri: string;
  /** Intrinsic photo pixel dimensions; markers are anchored relative to these. */
  imgW: number;
  imgH: number;
  markers: CanvasMarker[];
  /** When true, markers can be dragged and empty taps place a new move. */
  editable: boolean;
  /** When true, markers glide to new positions (playback). */
  animatedMarkers?: boolean;
  /** Size multiplier for the limb bubbles (user-configurable). */
  bubbleScale?: number;
  /** Opacity for the limb bubbles/badges (user-configurable transparency). */
  bubbleOpacity?: number;
  selectedKey?: string | null;
  onPlace?: (norm: Point) => void;
  onSelectMarker?: (key: string) => void;
  onCommitMarker?: (key: string, norm: Point) => void;
  onToggleFloating?: (key: string) => void;
}

/**
 * The photo with an absolutely-positioned overlay of limb markers. Touch
 * positions map to/from normalized coordinates via the contain-fit rect, so the
 * overlay is correct on any screen size or orientation.
 */
export function PlanCanvas({
  photoUri,
  imgW,
  imgH,
  markers,
  editable,
  animatedMarkers = false,
  bubbleScale = 1,
  bubbleOpacity = 1,
  selectedKey = null,
  onPlace,
  onSelectMarker,
  onCommitMarker,
  onToggleFloating,
}: PlanCanvasProps): React.JSX.Element {
  const { colors } = useTheme();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const layout = useMemo(
    () => imageLayout(size.w, size.h, imgW, imgH),
    [size.w, size.h, imgW, imgH],
  );

  // Zoom/pan transform of the content layer. With `transformOrigin: top-left`
  // the mapping is a plain affine — screen = translate + scale * local — so a
  // touch inverts cleanly to image space: local = (screen - translate) / scale.
  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  // Captured at pinch start so updates are relative to a stable baseline.
  const startScale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  function onLayout(e: LayoutChangeEvent): void {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  }

  function place(sx: number, sy: number): void {
    if (layout.displayedW <= 0 || onPlace === undefined) return;
    // Ignore taps that land on an existing marker — those are handled by the
    // marker's own tap (select), so placing here too would double-fire.
    const onMarker = markers.some((m) => {
      const c = toScreen({ x: m.x, y: m.y }, layout);
      return Math.hypot(c.x - sx, c.y - sy) <= MARKER_GUARD;
    });
    if (onMarker) return;
    onPlace(toNormalized({ x: sx, y: sy }, layout));
  }

  // Keep the scaled content covering the container so it can't be panned off.
  function clampTranslate(s: number): void {
    'worklet';
    tx.value = Math.min(0, Math.max(size.w * (1 - s), tx.value));
    ty.value = Math.min(0, Math.max(size.h * (1 - s), ty.value));
  }

  const pinch = Gesture.Pinch()
    .onStart((e) => {
      startScale.value = scale.value;
      // Record the image-space point under the fingers *once*. The zoom stays
      // anchored to this captured point rather than the live focal: as a finger
      // lifts to end the pinch, the reported focal collapses from the two-finger
      // midpoint to the remaining finger, and following it would snap the image.
      focalX.value = (e.focalX - tx.value) / scale.value;
      focalY.value = (e.focalY - ty.value) / scale.value;
    })
    .onUpdate((e) => {
      const next = Math.min(MAX_SCALE, Math.max(1, startScale.value * e.scale));
      // Keep the captured focal point fixed on screen as the scale changes, by
      // adjusting translation by the scale delta. This is incremental (+=) so it
      // composes with the simultaneous two-finger pan below instead of stomping
      // it — and it never reads the live focal, so finger lifts can't jump it.
      tx.value += (scale.value - next) * focalX.value;
      ty.value += (scale.value - next) * focalY.value;
      scale.value = next;
      clampTranslate(next);
    });

  // Two-finger drag pans; one finger stays free for placing/dragging markers.
  const panCanvas = Gesture.Pan()
    .minPointers(2)
    .onChange((e) => {
      tx.value += e.changeX;
      ty.value += e.changeY;
      clampTranslate(scale.value);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDistance(20)
    .onEnd(() => {
      scale.value = withTiming(1, { duration: 220 });
      tx.value = withTiming(0, { duration: 220 });
      ty.value = withTiming(0, { duration: 220 });
    });

  // Recreated each render so it captures the current layout; harmless for taps.
  const tap = Gesture.Tap()
    .maxDistance(10)
    .enabled(editable && onPlace !== undefined)
    .onEnd((e) => {
      // Invert the zoom transform: container point → image-space point.
      runOnJS(place)((e.x - tx.value) / scale.value, (e.y - ty.value) / scale.value);
    });

  const gesture = Gesture.Race(
    Gesture.Simultaneous(pinch, panCanvas),
    Gesture.Exclusive(doubleTap, tap),
  );

  const contentStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]} onLayout={onLayout}>
      {/* Outer view stays untransformed so gesture coords are in container space. */}
      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill} collapsable={false}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.content, contentStyle]}>
            <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="contain" />
            {layout.displayedW > 0 &&
              frameConnectors(markers).map((seg) => (
                <Connector
                  key={seg.key}
                  a={toScreen({ x: seg.ax, y: seg.ay }, layout)}
                  b={toScreen({ x: seg.bx, y: seg.by }, layout)}
                  color={colors.onOverlay}
                />
              ))}
            {layout.displayedW > 0 &&
              markers.map((m) => (
                <LimbMarker
                  key={m.key}
                  x={m.x}
                  y={m.y}
                  layout={layout}
                  color={m.color}
                  limb={m.limb}
                  badge={m.badge}
                  selected={m.key === selectedKey || m.highlighted === true}
                  draggable={editable}
                  animated={animatedMarkers}
                  compact={m.dot}
                  floating={m.floating}
                  current={m.current}
                  bubbleScale={bubbleScale}
                  bubbleOpacity={bubbleOpacity}
                  scale={scale}
                  onSelect={() => onSelectMarker?.(m.key)}
                  onCommit={(norm) => onCommitMarker?.(m.key, norm)}
                  onToggleFloating={
                    editable && onToggleFloating ? () => onToggleFloating(m.key) : undefined
                  }
                />
              ))}
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

interface ConnectorSegment {
  key: string;
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

/** Line segments joining consecutive markers that share a non-null `groupId`. */
function frameConnectors(markers: CanvasMarker[]): ConnectorSegment[] {
  const segments: ConnectorSegment[] = [];
  for (let i = 1; i < markers.length; i++) {
    const a = markers[i - 1]!;
    const b = markers[i]!;
    if (a.groupId != null && a.groupId === b.groupId) {
      segments.push({ key: `${a.key}-${b.key}`, ax: a.x, ay: a.y, bx: b.x, by: b.y });
    }
  }
  return segments;
}

/** A dotted line between two screen points, drawn as evenly-spaced dots. */
function Connector({ a, b, color }: { a: Point; b: Point; color: string }): React.JSX.Element {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const count = Math.max(2, Math.round(Math.hypot(dx, dy) / 12));
  const dots = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    dots.push(
      <View
        key={i}
        pointerEvents="none"
        style={[styles.connDot, { left: a.x + dx * t - 2, top: a.y + dy * t - 2, backgroundColor: color }]}
      />,
    );
  }
  return <>{dots}</>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  connDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.85,
  },
  // Top-left origin makes the zoom transform a plain affine (see above).
  content: {
    transformOrigin: 'top left',
  },
});
