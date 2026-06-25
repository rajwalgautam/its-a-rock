import { useMemo, useState } from 'react';
import { Image, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { LIMB_LABEL } from '@/constants/limbs';
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
}

/** Radius (px) around a marker within which a tap selects rather than places. */
const MARKER_GUARD = 24;

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
  selectedKey?: string | null;
  onPlace?: (norm: Point) => void;
  onSelectMarker?: (key: string) => void;
  onCommitMarker?: (key: string, norm: Point) => void;
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
  selectedKey = null,
  onPlace,
  onSelectMarker,
  onCommitMarker,
}: PlanCanvasProps): React.JSX.Element {
  const { colors } = useTheme();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const layout = useMemo(
    () => imageLayout(size.w, size.h, imgW, imgH),
    [size.w, size.h, imgW, imgH],
  );

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

  // Recreated each render so it captures the current layout; harmless for taps.
  const tap = Gesture.Tap()
    .maxDistance(10)
    .enabled(editable && onPlace !== undefined)
    .onEnd((e) => {
      runOnJS(place)(e.x, e.y);
    });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]} onLayout={onLayout}>
      <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="contain" />
      <GestureDetector gesture={tap}>
        <View style={StyleSheet.absoluteFill} collapsable={false}>
          {layout.displayedW > 0 &&
            markers.map((m) => (
              <LimbMarker
                key={m.key}
                x={m.x}
                y={m.y}
                layout={layout}
                color={m.color}
                label={LIMB_LABEL[m.limb]}
                badge={m.badge}
                selected={m.key === selectedKey}
                draggable={editable}
                animated={animatedMarkers}
                onSelect={() => onSelectMarker?.(m.key)}
                onCommit={(norm) => onCommitMarker?.(m.key, norm)}
              />
            ))}
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
});
