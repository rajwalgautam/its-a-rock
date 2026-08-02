import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { toNormalized, toScreen, type Point } from '@/utils/coords';
import { imageLayout, type ImageRect } from '@/utils/imageLayout';
import { LimbMarker } from '@/components/plan/LimbMarker';
import { LIMB_ORDER } from '@/constants/limbs';
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
  /** Dim the marker (a superseded, non-current placement). */
  muted?: boolean;
  /** Contributes to the center-of-mass centroid (a current-stance limb). */
  comMember?: boolean;
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
  /**
   * Manual center-of-mass override for the current/shown frame (normalized), or
   * null to show the auto-calculated centroid of the current stance.
   */
  centerOfMass?: Point | null;
  /**
   * Playback only: the fully-resolved center of mass for the shown frame
   * (override if set, else the frame's centroid), normalized. When provided, the
   * dot glides straight to this point instead of tracking the live limb mirrors —
   * so it interpolates smoothly across frames even as the stance gains a limb or
   * flips between an auto and a manual center of mass. Null/omitted in edit mode.
   */
  comPlayback?: Point | null;
  onPlace?: (norm: Point) => void;
  onSelectMarker?: (key: string) => void;
  onCommitMarker?: (key: string, norm: Point) => void;
  onToggleFloating?: (key: string) => void;
  /** Commit a dragged center-of-mass position (normalized) as a frame override. */
  onCommitCom?: (norm: Point) => void;
  /** Reset the current frame's center of mass back to the auto centroid. */
  onClearCom?: () => void;
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
  centerOfMass = null,
  comPlayback = null,
  onPlace,
  onSelectMarker,
  onCommitMarker,
  onToggleFloating,
  onCommitCom,
  onClearCom,
}: PlanCanvasProps): React.JSX.Element {
  const { colors } = useTheme();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const layout = useMemo(
    () => imageLayout(size.w, size.h, imgW, imgH),
    [size.w, size.h, imgW, imgH],
  );

  // Live screen positions of the four limbs, mirrored from their markers, so the
  // center of mass is derived on the UI thread (tracking drags and glides).
  const lhX = useSharedValue(0);
  const lhY = useSharedValue(0);
  const rhX = useSharedValue(0);
  const rhY = useSharedValue(0);
  const lfX = useSharedValue(0);
  const lfY = useSharedValue(0);
  const rfX = useSharedValue(0);
  const rfY = useSharedValue(0);
  const liveX: Record<Limb, SharedValue<number>> = { LH: lhX, RH: rhX, LF: lfX, RF: rfX };
  const liveY: Record<Limb, SharedValue<number>> = { LH: lhY, RH: rhY, LF: lfY, RF: rfY };

  // The limbs that make up the current stance (one marker each). The center of
  // mass is the centroid of these; it needs at least two to be meaningful.
  const comLimbs = LIMB_ORDER.filter((l) => markers.some((m) => m.limb === l && m.comMember === true));
  const showCom = layout.displayedW > 0 && comLimbs.length >= 2;
  const comTargets = comLimbs.map((l) => ({ x: liveX[l], y: liveY[l] }));

  // Centroid of the current-stance limbs, recomputed on the UI thread whenever
  // any of their live positions changes. Null until at least two are placed.
  const autoCom = useDerivedValue<Point | null>(() => {
    if (comTargets.length < 2) return null;
    let sx = 0;
    let sy = 0;
    for (const t of comTargets) {
      sx += t.x.value;
      sy += t.y.value;
    }
    return { x: sx / comTargets.length, y: sy / comTargets.length };
  });

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
    // Ignore taps that land on an *interactive* marker — those are handled by
    // the marker's own tap (select), so placing here too would double-fire.
    // Superseded (muted) markers are non-interactive, so a tap near one places a
    // new overlapping move instead of being swallowed.
    const onMarker = markers.some((m) => {
      if (m.muted === true) return false;
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
                  muted={m.muted}
                  // In edit mode, only current-stance markers stay interactive;
                  // superseded ones let taps through to place a new move. Play
                  // mode markers are never interactive.
                  interactive={editable && m.muted !== true}
                  bubbleScale={bubbleScale}
                  bubbleOpacity={bubbleOpacity}
                  scale={scale}
                  liveX={m.comMember === true ? liveX[m.limb] : undefined}
                  liveY={m.comMember === true ? liveY[m.limb] : undefined}
                  onSelect={() => onSelectMarker?.(m.key)}
                  onCommit={(norm) => onCommitMarker?.(m.key, norm)}
                  onToggleFloating={
                    editable && onToggleFloating ? () => onToggleFloating(m.key) : undefined
                  }
                />
              ))}
            {showCom && (
              <CenterOfMass
                autoCom={autoCom}
                override={centerOfMass}
                playbackTarget={comPlayback}
                targets={comTargets}
                layout={layout}
                color={colors.planCom}
                editable={editable}
                animated={animatedMarkers}
                bubbleScale={bubbleScale}
                bubbleOpacity={bubbleOpacity}
                scale={scale}
                onCommit={onCommitCom}
                onClear={onClearCom}
              />
            )}
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

/** 44dp touch target for the CoM dot, matching the limb markers' a11y minimum. */
const COM_TOUCH = 44;
const COM_DOT = 22;

interface CenterOfMassProps {
  /** UI-thread centroid of the current stance (null until two limbs are placed). */
  autoCom: SharedValue<Point | null>;
  /** Manual override for the current/shown frame (normalized), or null for auto. */
  override: Point | null;
  /**
   * Playback only: the resolved center of mass for the shown frame (normalized).
   * When set, the dot glides to it directly rather than tracking the live limbs.
   */
  playbackTarget: Point | null;
  /** Live screen positions of the limbs the dotted lines connect to. */
  targets: { x: SharedValue<number>; y: SharedValue<number> }[];
  layout: ImageRect;
  color: string;
  /** Edit mode: the dot can be held-then-dragged and double-tapped to reset. */
  editable: boolean;
  /** Play mode: glide the dot between frames like the limb markers. */
  animated: boolean;
  bubbleScale: number;
  bubbleOpacity: number;
  scale: SharedValue<number>;
  onCommit?: (norm: Point) => void;
  onClear?: () => void;
}

/**
 * The green center-of-mass dot with dotted lines radiating to each limb. Its
 * position is, in priority order, the live drag, the frame's manual override, or
 * the auto centroid — so it tracks limb drags live, sits where the climber put
 * it when overridden, and glides between frames during playback. It carries no
 * limb glyph and wears a ring so it never reads as the (also green) left hand.
 */
function CenterOfMass({
  autoCom,
  override,
  playbackTarget,
  targets,
  layout,
  color,
  editable,
  animated,
  bubbleScale,
  bubbleOpacity,
  scale,
  onCommit,
  onClear,
}: CenterOfMassProps): React.JSX.Element {
  const dotSize = COM_DOT * bubbleScale;
  const touchSize = Math.max(COM_TOUCH, dotSize + 12);

  // The override, animated so it glides between frames in playback. Kept in sync
  // by the effect below; read by `pos` when an override is present.
  const ovX = useSharedValue(0);
  const ovY = useSharedValue(0);
  // The live drag position while the dot is being moved.
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragging = useSharedValue(false);
  const hasOverride = override !== null;

  // Playback position: a single point that glides straight to the frame's
  // resolved center of mass. Unlike the live centroid, it doesn't lurch when a
  // limb joins the stance (its mirror starts stale) or when a frame flips
  // between an auto and a manual center of mass — it just interpolates.
  const playX = useSharedValue(playbackTarget !== null ? toScreen(playbackTarget, layout).x : 0);
  const playY = useSharedValue(playbackTarget !== null ? toScreen(playbackTarget, layout).y : 0);
  const playing = playbackTarget !== null;
  const primed = useRef(false);

  useEffect(() => {
    if (playbackTarget === null) {
      primed.current = false;
      return;
    }
    const s = toScreen(playbackTarget, layout);
    // First frame lands instantly; later frames glide with the marker timing.
    if (primed.current) {
      playX.value = withTiming(s.x, { duration: 280 });
      playY.value = withTiming(s.y, { duration: 280 });
    } else {
      playX.value = s.x;
      playY.value = s.y;
    }
    primed.current = true;
  }, [playbackTarget, layout, playX, playY]);

  useEffect(() => {
    if (override !== null) {
      const s = toScreen(override, layout);
      if (animated) {
        ovX.value = withTiming(s.x, { duration: 280 });
        ovY.value = withTiming(s.y, { duration: 280 });
      } else {
        ovX.value = s.x;
        ovY.value = s.y;
      }
    }
    // A committed/cleared override has landed in props, so end any drag hold
    // without the position snapping back to the centroid for a frame.
    dragging.value = false;
  }, [override, layout, animated, ovX, ovY, dragging]);

  // The dot's live screen position: a drag wins; then, in playback, the glided
  // resolved point; otherwise (editing) the override, then the auto centroid.
  const pos = useDerivedValue<Point | null>(() => {
    if (dragging.value) return { x: dragX.value, y: dragY.value };
    if (playing) return { x: playX.value, y: playY.value };
    if (hasOverride) return { x: ovX.value, y: ovY.value };
    return autoCom.value;
  });

  function commit(sx: number, sy: number): void {
    onCommit?.(toNormalized({ x: sx, y: sy }, layout));
  }

  function liftHaptic(): void {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  const pan = Gesture.Pan()
    .enabled(editable && onCommit !== undefined)
    .activateAfterLongPress(300)
    .onStart(() => {
      const p = pos.value;
      if (p !== null) {
        dragX.value = p.x;
        dragY.value = p.y;
      }
      dragging.value = true;
      runOnJS(liftHaptic)();
    })
    .onChange((e) => {
      const s = scale.value;
      dragX.value += e.changeX / s;
      dragY.value += e.changeY / s;
    })
    .onEnd(() => {
      // Leave `dragging` true until the committed override arrives via props (the
      // effect clears it), so the dot holds its spot instead of flashing back.
      runOnJS(commit)(dragX.value, dragY.value);
    });

  const doubleTap = Gesture.Tap()
    .enabled(editable && onClear !== undefined)
    .numberOfTaps(2)
    .maxDistance(20)
    .onEnd(() => {
      if (onClear) runOnJS(onClear)();
    });

  const gesture = Gesture.Race(pan, doubleTap);

  const dotStyle = useAnimatedStyle(() => {
    const p = pos.value;
    if (p === null) return { opacity: 0, left: -9999, top: -9999 };
    return {
      opacity: bubbleOpacity,
      left: p.x - touchSize / 2,
      top: p.y - touchSize / 2,
    };
  });

  return (
    <>
      {targets.map((t, i) => (
        <ComConnector key={i} com={pos} tx={t.x} ty={t.y} color={color} />
      ))}
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[styles.comTouch, { width: touchSize, height: touchSize }, dotStyle]}
          accessibilityRole="button"
          accessibilityLabel="Center of mass"
          accessibilityHint={editable ? 'Hold and drag to adjust; double-tap to reset' : undefined}
        >
          <View
            style={[
              styles.comDot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: color,
              },
            ]}
          />
        </Animated.View>
      </GestureDetector>
    </>
  );
}

/** A straight dashed line from the (animated) CoM point to a limb's live point. */
function ComConnector({
  com,
  tx,
  ty,
  color,
}: {
  com: SharedValue<Point | null>;
  tx: SharedValue<number>;
  ty: SharedValue<number>;
  color: string;
}): React.JSX.Element {
  const style = useAnimatedStyle(() => {
    const c = com.value;
    if (c === null) return { opacity: 0, width: 0 };
    const dx = tx.value - c.x;
    const dy = ty.value - c.y;
    return {
      opacity: 0.9,
      left: c.x,
      top: c.y,
      width: Math.hypot(dx, dy),
      transform: [{ rotateZ: `${Math.atan2(dy, dx)}rad` }],
    };
  });
  return <Animated.View pointerEvents="none" style={[styles.comLine, { borderTopColor: color }, style]} />;
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
  comTouch: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // No limb glyph; a white ring + green fill (and the radiating lines) keep it
  // distinct from the green left-hand marker.
  comDot: {
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
  },
  // A 0-height view whose dashed top border is the line; rotated about its left
  // end (the CoM point) to aim at a limb.
  comLine: {
    position: 'absolute',
    height: 0,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    transformOrigin: 'top left',
  },
  // Top-left origin makes the zoom transform a plain affine (see above).
  content: {
    transformOrigin: 'top left',
  },
});
