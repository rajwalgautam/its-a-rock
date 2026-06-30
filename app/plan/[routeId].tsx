import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { FONT_SIZE, SPACING } from '@/constants/theme';
import { LIMB_NAME, LIMB_ORDER, limbColor } from '@/constants/limbs';
import { useTheme } from '@/theme/ThemeProvider';
import { useRouteStore } from '@/store/useRouteStore';
import { usePlanStore } from '@/store/usePlanStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { PlanCanvas, type CanvasMarker } from '@/components/plan/PlanCanvas';
import { PlanEditBar } from '@/components/plan/PlanEditBar';
import { MoveList } from '@/components/plan/MoveList';
import { HelpSheet } from '@/components/plan/HelpSheet';
import { PlaybackControls } from '@/components/plan/PlaybackControls';
import {
  addToFrame,
  appendMove,
  frameStanceAt,
  framesOf,
  fromPlan,
  groupMoves,
  isSeeding,
  movingLimbsAt,
  nextGroupId,
  nextSeedLimb,
  removeFromFrame,
  removeMove,
  reorderFrames,
  toggleFloating,
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
  /** The note's text, shown as context while planning (null when none). */
  noteBody: string | null;
}

/** Pick the media a note's plan is drawn on. */
function notePhoto(route: RouteWithGym, noteId: number): RouteWithGym['media'][number] | null {
  const note = route.noteEntries.find((n) => n.id === noteId);
  if (note?.media != null && note.media.type === 'photo') return note.media;
  return null;
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
  const router = useRouter();
  const params = useLocalSearchParams<{ routeId: string; noteId?: string }>();
  const getRoute = useRouteStore((s) => s.getRoute);
  const loadPlan = usePlanStore((s) => s.loadPlan);
  const loadNotePlan = usePlanStore((s) => s.loadNotePlan);
  const saveMoves = usePlanStore((s) => s.saveMoves);
  const bubbleScale = useSettingsStore((s) => s.bubbleScale);
  const setBubbleScale = useSettingsStore((s) => s.setBubbleScale);

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [moves, setMoves] = useState<DraftMove[]>([]);
  const [activeLimb, setActiveLimb] = useState<Limb>('LH');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // When grouping is on, every placement joins `groupId`; off means solo moves.
  const [groupId, setGroupId] = useState<number | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mode, setMode] = useState<'edit' | 'play'>('edit');
  const [step, setStep] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const tempCounter = useRef(0);
  // Mirrors `moves` so handlers always read the latest array, immune to the
  // stale closures that rapid taps would otherwise hit.
  const movesRef = useRef<DraftMove[]>([]);
  // Pre-edit snapshots for undo; in-memory only, reset when a plan (re)loads.
  const undoStack = useRef<DraftMove[][]>([]);

  const applyMoves = useCallback((next: DraftMove[]) => {
    movesRef.current = next;
    setMoves(next);
  }, []);

  const routeId = Number(params.routeId);
  const noteId = params.noteId !== undefined ? Number(params.noteId) : null;

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
        // A note id scopes the plan to a single note's media; otherwise fall
        // back to the route's cover photo (legacy route-level plans).
        const photo =
          noteId !== null && Number.isFinite(noteId)
            ? notePhoto(route, noteId)
            : planPhoto(route);
        if (photo === null) {
          setState({ status: 'no-photo' });
          return;
        }
        // Load/create the plan first — this persists the photo to durable
        // storage and repoints its URI; re-read the route to get that URI.
        const plan =
          noteId !== null && Number.isFinite(noteId)
            ? await loadNotePlan(routeId, noteId, photo.id)
            : await loadPlan(routeId, photo.id);
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
        undoStack.current = [];
        setCanUndo(false);
        const note =
          noteId !== null && Number.isFinite(noteId)
            ? (durable ?? route).noteEntries.find((n) => n.id === noteId)
            : undefined;
        setState({
          status: 'ready',
          photoUri: durablePhoto.uri,
          mediaId: photo.id,
          imgW: dims.w,
          imgH: dims.h,
          noteBody: note?.body ?? null,
        });
      })();
      return () => {
        active = false;
      };
    }, [routeId, noteId, getRoute, loadPlan, loadNotePlan, applyMoves]),
  );

  /** Apply an edit, persist it, then reconcile keys/sequence from the save. */
  const persist = useCallback(
    async (next: DraftMove[]) => {
      applyMoves(next);
      const saved = await saveMoves(toInputs(next));
      if (saved !== null) applyMoves(fromPlan(saved));
    },
    [saveMoves, applyMoves],
  );

  /** Persist an edit, snapshotting the pre-edit state so it can be undone. */
  const commitMoves = useCallback(
    async (next: DraftMove[]) => {
      // Keep the last 50 snapshots to bound memory on long sessions.
      undoStack.current = [...undoStack.current.slice(-49), movesRef.current];
      setCanUndo(true);
      await persist(next);
    },
    [persist],
  );

  /** Revert the most recent edit, re-committing the prior snapshot. */
  const handleUndo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (prev === undefined) return;
    setCanUndo(undoStack.current.length > 0);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void persist(prev);
  }, [persist]);

  function handlePlace(norm: Point): void {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // While seeding the starting stance, every placement is solo (grouping is
    // disabled) and the active limb auto-advances to the next unplaced one.
    const seeding = isSeeding(movesRef.current);
    const move: DraftMove = {
      key: `new-${tempCounter.current++}`,
      limb: activeLimb,
      x: norm.x,
      y: norm.y,
      holdId: null,
      groupId: seeding ? null : groupId,
      floating: false,
    };
    const next = appendMove(movesRef.current, move);
    if (seeding) setActiveLimb(nextSeedLimb(activeLimb, next));
    void commitMoves(next);
  }

  function handleCommitMarker(key: string, norm: Point): void {
    void commitMoves(updateMovePosition(movesRef.current, key, norm.x, norm.y));
  }

  function handleToggleFloating(key: string): void {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void commitMoves(toggleFloating(movesRef.current, key));
  }

  /** Toggle grouping; turning it on allocates a fresh frame id for placements. */
  function toggleGrouping(): void {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGroupId((g) => (g !== null ? null : nextGroupId(movesRef.current)));
  }

  function handleReorder(from: number, to: number): void {
    void commitMoves(reorderFrames(movesRef.current, from, to));
  }

  function handleRemove(key: string): void {
    if (selectedKey === key) setSelectedKey(null);
    void commitMoves(removeMove(movesRef.current, key));
  }

  function handleGroupFromList(keys: string[]): void {
    void commitMoves(groupMoves(movesRef.current, keys));
  }

  function handleAddToFrame(key: string, frameGroupId: number): void {
    void commitMoves(addToFrame(movesRef.current, key, frameGroupId));
  }

  function handleRemoveFromFrame(key: string): void {
    void commitMoves(removeFromFrame(movesRef.current, key));
  }

  const frames = framesOf(moves);

  function enterPlay(): void {
    if (moves.length === 0) return;
    setListOpen(false);
    setStep(1);
    setMode('play');
  }

  function setPlayStep(next: number): void {
    setStep(Math.max(0, Math.min(next, frames.length)));
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
  const seeding = isSeeding(moves);
  // Grouping is suppressed until the starting stance is complete.
  const grouping = !seeding && groupId !== null;
  const placedCount = new Set(moves.map((m) => m.limb)).size;
  const safeStep = Math.min(step, frames.length);
  const movingLimbs = playing ? movingLimbsAt(moves, safeStep) : [];

  let markers: CanvasMarker[];
  if (playing) {
    const stance = frameStanceAt(moves, safeStep);
    const moving = new Set(movingLimbs);
    markers = LIMB_ORDER.filter((l) => stance[l] !== null).map((l) => ({
      key: `play-${l}`,
      limb: l,
      x: stance[l]!.x,
      y: stance[l]!.y,
      color: limbColor(colors, l),
      badge: null,
      highlighted: moving.has(l),
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
      groupId: m.groupId,
      floating: m.floating,
    }));
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Done planning"
            >
              <Ionicons name="checkmark" size={26} color={colors.primary} />
            </Pressable>
          ),
        }}
      />
      <View style={styles.canvas}>
        <PlanCanvas
          photoUri={state.photoUri}
          imgW={state.imgW}
          imgH={state.imgH}
          markers={markers}
          editable={!playing}
          animatedMarkers={playing}
          bubbleScale={bubbleScale}
          selectedKey={playing ? null : selectedKey}
          onPlace={handlePlace}
          onSelectMarker={setSelectedKey}
          onCommitMarker={handleCommitMarker}
          onToggleFloating={handleToggleFloating}
        />
        {!playing && (seeding || grouping) && (
          <View style={styles.hint} pointerEvents="none">
            <Text style={[styles.hintText, { color: colors.onOverlay, backgroundColor: colors.overlay }]}>
              {seeding
                ? `Place all 4 limbs to set your start (${placedCount}/4) — tap the wall to place your ${LIMB_NAME[activeLimb].toLowerCase()}.`
                : grouping
                  ? 'Grouping on — limbs you place now move together.'
                  : ''}
            </Text>
          </View>
        )}
      </View>

      {state.noteBody !== null && state.noteBody.length > 0 && (
        <ScrollView
          style={[styles.noteBlurb, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
          contentContainerStyle={styles.noteBlurbContent}
          showsVerticalScrollIndicator
        >
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>{state.noteBody}</Text>
        </ScrollView>
      )}

      {playing ? (
        <PlaybackControls
          step={safeStep}
          total={frames.length}
          movingLimbs={movingLimbs}
          onStep={setPlayStep}
          onExit={() => setMode('edit')}
        />
      ) : (
        <PlanEditBar
          activeLimb={activeLimb}
          onLimbChange={setActiveLimb}
          grouping={grouping}
          onToggleGroup={toggleGrouping}
          groupDisabled={seeding}
          onPlay={enterPlay}
          playDisabled={moves.length === 0 || seeding}
          moveCount={moves.length}
          onOpenList={() => setListOpen(true)}
          bubbleScale={bubbleScale}
          onBubbleScaleChange={setBubbleScale}
          onHelp={() => setHelpOpen(true)}
          onUndo={handleUndo}
          undoDisabled={!canUndo}
        />
      )}

      <HelpSheet visible={helpOpen} onClose={() => setHelpOpen(false)} />

      <MoveList
        visible={listOpen}
        onClose={() => setListOpen(false)}
        moves={moves}
        selectedKey={selectedKey}
        onSelect={setSelectedKey}
        onReorder={handleReorder}
        onRemove={handleRemove}
        onGroup={handleGroupFromList}
        onAddToFrame={handleAddToFrame}
        onRemoveFromFrame={handleRemoveFromFrame}
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
  noteBlurb: {
    flexGrow: 0,
    maxHeight: 96,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  noteBlurbContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  noteText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
});
