import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { FONT_SIZE, RADIUS, SPACING } from '@/constants/theme';
import { LIMB_ORDER, limbColor } from '@/constants/limbs';
import { useTheme } from '@/theme/ThemeProvider';
import { useRouteStore } from '@/store/useRouteStore';
import { usePlanStore } from '@/store/usePlanStore';
import { PlanCanvas, type CanvasMarker } from '@/components/plan/PlanCanvas';
import { LimbSelector } from '@/components/plan/LimbSelector';
import { MoveList } from '@/components/plan/MoveList';
import { PlaybackControls } from '@/components/plan/PlaybackControls';
import {
  appendMove,
  fromPlan,
  limbStanceAt,
  movingLimbAt,
  removeMove,
  reorderMoves,
  toInputs,
  updateMovePosition,
  type DraftMove,
} from '@/utils/planSequence';
import type { Limb, RouteWithGym } from '@/types';
import type { Point } from '@/utils/coords';

interface Ready {
  status: 'ready';
  photoUri: string;
  mediaId: number;
  imgW: number;
  imgH: number;
}
type LoadState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'no-photo' }
  | Ready;

/** Pick the photo a plan is drawn on: the cached cover, else the first photo. */
function planPhoto(route: RouteWithGym): RouteWithGym['media'][number] | null {
  const photos = route.media.filter((m) => m.type === 'photo');
  if (photos.length === 0) return null;
  const cover = photos.find((m) => m.uri === route.photoUri);
  return cover ?? photos[0]!;
}

/** Resolve intrinsic pixel size, falling back to a runtime measure. */
async function resolveDimensions(
  uri: string,
  width: number | null,
  height: number | null,
): Promise<{ w: number; h: number } | null> {
  if (width != null && height != null && width > 0 && height > 0) {
    return { w: width, h: height };
  }
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (w, h) => resolve(w > 0 && h > 0 ? { w, h } : null),
      () => resolve(null),
    );
  });
}

export default function RoutePlanScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ routeId: string }>();
  const getRoute = useRouteStore((s) => s.getRoute);
  const loadPlan = usePlanStore((s) => s.loadPlan);
  const saveMoves = usePlanStore((s) => s.saveMoves);

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [moves, setMoves] = useState<DraftMove[]>([]);
  const [activeLimb, setActiveLimb] = useState<Limb>('LH');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [mode, setMode] = useState<'edit' | 'play'>('edit');
  const [step, setStep] = useState(0);
  const tempCounter = useRef(0);
  // Mirrors `moves` so handlers always read the latest array, immune to the
  // stale closures that rapid taps would otherwise hit.
  const movesRef = useRef<DraftMove[]>([]);

  const applyMoves = useCallback((next: DraftMove[]) => {
    movesRef.current = next;
    setMoves(next);
  }, []);

  const routeId = Number(params.routeId);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (!Number.isFinite(routeId)) {
          if (active) setState({ status: 'missing' });
          return;
        }
        const route = await getRoute(routeId);
        if (!active) return;
        if (route === null) {
          setState({ status: 'missing' });
          return;
        }
        const photo = planPhoto(route);
        if (photo === null) {
          setState({ status: 'no-photo' });
          return;
        }
        // Load/create the plan first — this persists the photo to durable
        // storage and repoints its URI; re-read the route to get that URI.
        const plan = await loadPlan(routeId, photo.id);
        const durable = await getRoute(routeId);
        if (!active) return;
        const durablePhoto =
          durable?.media.find((m) => m.id === photo.id) ?? photo;
        const dims = await resolveDimensions(
          durablePhoto.uri,
          durablePhoto.width,
          durablePhoto.height,
        );
        if (!active) return;
        if (dims === null) {
          setState({ status: 'no-photo' });
          return;
        }
        applyMoves(plan !== null ? fromPlan(plan) : []);
        setState({
          status: 'ready',
          photoUri: durablePhoto.uri,
          mediaId: photo.id,
          imgW: dims.w,
          imgH: dims.h,
        });
      })();
      return () => {
        active = false;
      };
    }, [routeId, getRoute, loadPlan, applyMoves]),
  );

  /** Optimistically apply an edit, persist it, then reconcile keys/sequence. */
  const commitMoves = useCallback(
    async (next: DraftMove[]) => {
      applyMoves(next);
      const saved = await saveMoves(toInputs(next));
      if (saved !== null) applyMoves(fromPlan(saved));
    },
    [saveMoves, applyMoves],
  );

  function handlePlace(norm: Point): void {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const move: DraftMove = {
      key: `new-${tempCounter.current++}`,
      limb: activeLimb,
      x: norm.x,
      y: norm.y,
      holdId: null,
    };
    void commitMoves(appendMove(movesRef.current, move));
  }

  function handleCommitMarker(key: string, norm: Point): void {
    void commitMoves(updateMovePosition(movesRef.current, key, norm.x, norm.y));
  }

  function handleReorder(from: number, to: number): void {
    void commitMoves(reorderMoves(movesRef.current, from, to));
  }

  function handleRemove(key: string): void {
    if (selectedKey === key) setSelectedKey(null);
    void commitMoves(removeMove(movesRef.current, key));
  }

  function enterPlay(): void {
    if (moves.length === 0) return;
    setListOpen(false);
    setStep(1);
    setMode('play');
  }

  function setPlayStep(next: number): void {
    setStep(Math.max(0, Math.min(next, moves.length)));
  }

  if (state.status !== 'ready') {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: colors.background }]}>
        {state.status === 'loading' && <ActivityIndicator color={colors.primary} />}
        {state.status === 'missing' && (
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            This climb couldn&apos;t be found.
          </Text>
        )}
        {state.status === 'no-photo' && (
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Add a photo to this climb to plan a route.
          </Text>
        )}
      </View>
    );
  }

  const playing = mode === 'play';
  const safeStep = Math.min(step, moves.length);
  const movingLimb = playing ? movingLimbAt(moves, safeStep) : null;

  let markers: CanvasMarker[];
  if (playing) {
    const stance = limbStanceAt(moves, safeStep);
    markers = LIMB_ORDER.filter((l) => stance[l] !== null).map((l) => ({
      key: `play-${l}`,
      limb: l,
      x: stance[l]!.x,
      y: stance[l]!.y,
      color: limbColor(colors, l),
      badge: null,
    }));
  } else {
    // Collapse every move except the latest (or the one being edited) to a
    // numbered dot, so earlier markers stop covering the holds underneath.
    markers = moves.map((m, i) => ({
      key: m.key,
      limb: m.limb,
      x: m.x,
      y: m.y,
      color: limbColor(colors, m.limb),
      badge: i + 1,
      dot: i !== moves.length - 1 && m.key !== selectedKey,
    }));
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.canvas}>
        <PlanCanvas
          photoUri={state.photoUri}
          imgW={state.imgW}
          imgH={state.imgH}
          markers={markers}
          editable={!playing}
          animatedMarkers={playing}
          selectedKey={playing ? (movingLimb !== null ? `play-${movingLimb}` : null) : selectedKey}
          onPlace={handlePlace}
          onSelectMarker={setSelectedKey}
          onCommitMarker={handleCommitMarker}
        />
        {!playing && moves.length === 0 && (
          <View style={styles.hint} pointerEvents="none">
            <Text style={[styles.hintText, { color: colors.onOverlay, backgroundColor: colors.overlay }]}>
              Pick a limb below, then tap the wall to place it.
            </Text>
          </View>
        )}

        {!playing && (
          <View style={styles.toolbar}>
            <Pressable
              onPress={() => setListOpen(true)}
              style={[styles.toolBtn, { backgroundColor: colors.overlay }]}
              accessibilityLabel="Show move sequence"
            >
              <Ionicons name="list" size={20} color={colors.onOverlay} />
              {moves.length > 0 && (
                <Text style={[styles.toolBtnBadge, { color: colors.onOverlay }]}>{moves.length}</Text>
              )}
            </Pressable>
            <Pressable
              onPress={enterPlay}
              disabled={moves.length === 0}
              style={[
                styles.toolBtn,
                { backgroundColor: colors.overlay, opacity: moves.length === 0 ? 0.4 : 1 },
              ]}
              accessibilityLabel="Play route"
            >
              <Ionicons name="play" size={20} color={colors.onOverlay} />
            </Pressable>
          </View>
        )}
      </View>

      {playing ? (
        <PlaybackControls
          step={safeStep}
          total={moves.length}
          movingLimb={movingLimb}
          onStep={setPlayStep}
          onExit={() => setMode('edit')}
        />
      ) : (
        <LimbSelector active={activeLimb} onChange={setActiveLimb} />
      )}

      <MoveList
        visible={listOpen}
        onClose={() => setListOpen(false)}
        moves={moves}
        selectedKey={selectedKey}
        onSelect={setSelectedKey}
        onReorder={handleReorder}
        onRemove={handleRemove}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  canvas: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  message: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
  },
  hint: {
    position: 'absolute',
    top: SPACING.md,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    overflow: 'hidden',
  },
  toolbar: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    minWidth: 44,
    height: 44,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
  },
  toolBtnBadge: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
});
