// Pure helpers for the editable move sequence. The planner screen keeps moves in
// local state as `DraftMove`s (a stable key + the persisted fields), edits them
// through these functions, then persists via `savePlanMoves`. Keeping the logic
// here makes it unit-testable without a renderer or a database.

import { LIMB_ORDER } from '@/constants/limbs';
import type { Limb, PlanMoveInput, RoutePlan } from '@/types';
import type { Point } from './coords';

/** A move while editing: a stable React key plus the fields we persist. */
export interface DraftMove {
  key: string;
  limb: Limb;
  /** Normalized position in [0,1]. */
  x: number;
  y: number;
  holdId: number | null;
  /**
   * Frame id: moves sharing the same non-null `groupId` move together (one
   * frame). Null is a solo move.
   */
  groupId: number | null;
  /** Visual-only flag: greyed out to mark an optional/uncommitted hold. */
  floating: boolean;
}

/** Build editable moves from a persisted plan (keys are the row ids). */
export function fromPlan(plan: RoutePlan): DraftMove[] {
  return plan.moves.map((m) => ({
    key: String(m.id),
    limb: m.limb,
    x: m.x,
    y: m.y,
    holdId: m.holdId,
    groupId: m.groupId,
    floating: m.floating,
  }));
}

/** Strip editor-only fields for persistence; array order becomes `sequence`. */
export function toInputs(moves: DraftMove[]): PlanMoveInput[] {
  return moves.map((m) => ({
    limb: m.limb,
    x: m.x,
    y: m.y,
    holdId: m.holdId,
    groupId: m.groupId,
    floating: m.floating,
  }));
}

/** Toggle a move's floating (greyed-out) annotation by key. */
export function toggleFloating(moves: DraftMove[], key: string): DraftMove[] {
  return moves.map((m) => (m.key === key ? { ...m, floating: !m.floating } : m));
}

/**
 * The keys of the moves that make up the current body position: for each limb,
 * the key of its last placement in sequence (at most four). Used to flag the
 * "current stance" markers while editing.
 */
export function currentStanceKeys(moves: DraftMove[]): Set<string> {
  const latest = new Map<Limb, string>();
  for (const m of moves) latest.set(m.limb, m.key);
  return new Set(latest.values());
}

export function appendMove(moves: DraftMove[], move: DraftMove): DraftMove[] {
  return [...moves, move];
}

// ---- Initial 4-limb seeding ----

/** Distinct limbs already placed anywhere in the draft. */
export function placedLimbs(moves: DraftMove[]): Set<Limb> {
  return new Set(moves.map((m) => m.limb));
}

/**
 * Whether the plan is still in its starting-stance "seeding" phase — the user
 * must place all four limbs before free editing begins. True until every limb
 * in `LIMB_ORDER` has at least one placement.
 */
export function isSeeding(moves: DraftMove[]): boolean {
  return placedLimbs(moves).size < LIMB_ORDER.length;
}

/**
 * The next limb to place during seeding: scan `LIMB_ORDER` starting just after
 * `current` (wrapping) and return the first limb not yet placed. Falls back to
 * `current` when every limb is already down.
 */
export function nextSeedLimb(current: Limb, moves: DraftMove[]): Limb {
  const placed = placedLimbs(moves);
  const start = LIMB_ORDER.indexOf(current);
  for (let i = 1; i <= LIMB_ORDER.length; i++) {
    const candidate = LIMB_ORDER[(start + i) % LIMB_ORDER.length]!;
    if (!placed.has(candidate)) return candidate;
  }
  return current;
}

/** Next group id for a plan: one past the largest in use (ids are per-plan). */
export function nextGroupId(moves: DraftMove[]): number {
  let max = 0;
  for (const m of moves) {
    if (m.groupId !== null && m.groupId > max) max = m.groupId;
  }
  return max + 1;
}

/** Update a single move's position by key (used by drag-to-adjust). */
export function updateMovePosition(
  moves: DraftMove[],
  key: string,
  x: number,
  y: number,
): DraftMove[] {
  return moves.map((m) => (m.key === key ? { ...m, x, y } : m));
}

/** Move the item at `from` to `to`, shifting the rest; no-op for bad indices. */
export function reorderMoves(moves: DraftMove[], from: number, to: number): DraftMove[] {
  if (from < 0 || from >= moves.length || to < 0 || to >= moves.length || from === to) {
    return moves;
  }
  const next = [...moves];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

/** Remove a move by key, dissolving its frame if only one member is left. */
export function removeMove(moves: DraftMove[], key: string): DraftMove[] {
  const target = moves.find((m) => m.key === key);
  const next = moves.filter((m) => m.key !== key);
  if (target?.groupId != null) {
    const remaining = next.filter((m) => m.groupId === target.groupId);
    if (remaining.length <= 1) {
      return next.map((m) =>
        m.groupId === target.groupId ? { ...m, groupId: null } : m,
      );
    }
  }
  return next;
}

// ---- Frames (grouped, simultaneous moves) ----

/**
 * Partition moves into frames. A frame is a maximal run of adjacent moves
 * sharing the same non-null `groupId`; every solo (null) move is its own frame.
 */
export function framesOf(moves: DraftMove[]): DraftMove[][] {
  const frames: DraftMove[][] = [];
  for (const m of moves) {
    const last = frames[frames.length - 1];
    const prev = last?.[last.length - 1];
    if (last !== undefined && prev !== undefined && m.groupId !== null && prev.groupId === m.groupId) {
      last.push(m);
    } else {
      frames.push([m]);
    }
  }
  return frames;
}

/** Reorder whole frames (by frame index), keeping each frame's members together. */
export function reorderFrames(moves: DraftMove[], from: number, to: number): DraftMove[] {
  const frames = framesOf(moves);
  if (from < 0 || from >= frames.length || to < 0 || to >= frames.length || from === to) {
    return moves;
  }
  const next = [...frames];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next.flat();
}

/**
 * Add the move `key` to the frame `groupId`, placing it right after the frame's
 * last member so the frame stays contiguous. No-op if the target frame is empty
 * or already contains the move's limb (a frame holds distinct limbs).
 */
export function addToFrame(moves: DraftMove[], key: string, groupId: number): DraftMove[] {
  const moving = moves.find((m) => m.key === key);
  const target = moves.filter((m) => m.groupId === groupId);
  if (moving === undefined || target.length === 0) return moves;
  if (target.some((m) => m.limb === moving.limb)) return moves;

  const without = moves.filter((m) => m.key !== key);
  const anchorKey = target[target.length - 1]!.key;
  const idx = without.findIndex((m) => m.key === anchorKey);
  const updated = { ...moving, groupId };
  return [...without.slice(0, idx + 1), updated, ...without.slice(idx + 1)];
}

/**
 * Remove the move `key` from its frame, making it solo. It is re-inserted right
 * after the frame's last remaining member so the rest stays contiguous; a frame
 * left with one member dissolves to solo too.
 */
export function removeFromFrame(moves: DraftMove[], key: string): DraftMove[] {
  const moving = moves.find((m) => m.key === key);
  if (moving === undefined || moving.groupId === null) return moves;
  const gid = moving.groupId;
  const remaining = moves.filter((m) => m.groupId === gid && m.key !== key);
  if (remaining.length === 0) {
    return moves.map((m) => (m.key === key ? { ...m, groupId: null } : m));
  }

  const without = moves.filter((m) => m.key !== key);
  const anchorKey = remaining[remaining.length - 1]!.key;
  const dissolve = remaining.length <= 1;
  const next = dissolve
    ? without.map((m) => (m.groupId === gid ? { ...m, groupId: null } : m))
    : without;
  const idx = next.findIndex((m) => m.key === anchorKey);
  const updated = { ...moving, groupId: null };
  return [...next.slice(0, idx + 1), updated, ...next.slice(idx + 1)];
}

/**
 * Promote two or more moves (by key) into a new frame, gathered contiguously at
 * the position of the earliest one. No-op unless at least two distinct-limbed
 * moves are selected (a frame holds distinct limbs).
 */
export function groupMoves(moves: DraftMove[], keys: string[]): DraftMove[] {
  const keySet = new Set(keys);
  const selected = moves.filter((m) => keySet.has(m.key));
  if (selected.length < 2) return moves;
  const limbs = selected.map((m) => m.limb);
  if (new Set(limbs).size !== limbs.length) return moves;

  const gid = nextGroupId(moves);
  const grouped = selected.map((m) => ({ ...m, groupId: gid }));
  const firstIdx = moves.findIndex((m) => keySet.has(m.key));
  const before = moves.slice(0, firstIdx).filter((m) => !keySet.has(m.key));
  const after = moves.slice(firstIdx).filter((m) => !keySet.has(m.key));
  return [...before, ...grouped, ...after];
}

// ---- Playback (derived state, nothing extra stored) ----

/** Each limb's position after a given number of moves, or null if unplaced. */
export type LimbStance = Record<Limb, Point | null>;

/**
 * The stance after the first `step` moves (clamped to [0, length]). A limb holds
 * its most recent placement until it moves again; at step 0 nothing is placed.
 */
export function limbStanceAt(moves: DraftMove[], step: number): LimbStance {
  const clamped = Math.max(0, Math.min(step, moves.length));
  const stance: LimbStance = { LH: null, RH: null, LF: null, RF: null };
  for (let i = 0; i < clamped; i++) {
    const m = moves[i]!;
    stance[m.limb] = { x: m.x, y: m.y };
  }
  return stance;
}

/** The limb that moves to reach `step` (i.e. move #step), or null at the start. */
export function movingLimbAt(moves: DraftMove[], step: number): Limb | null {
  if (step <= 0 || step > moves.length) return null;
  return moves[step - 1]!.limb;
}

/**
 * The stance after the first `frameStep` frames (clamped to [0, frame count]).
 * Like `limbStanceAt` but a step advances a whole frame, so grouped limbs land
 * together.
 */
export function frameStanceAt(moves: DraftMove[], frameStep: number): LimbStance {
  const frames = framesOf(moves);
  const clamped = Math.max(0, Math.min(frameStep, frames.length));
  const stance: LimbStance = { LH: null, RH: null, LF: null, RF: null };
  for (let i = 0; i < clamped; i++) {
    for (const m of frames[i]!) {
      stance[m.limb] = { x: m.x, y: m.y };
    }
  }
  return stance;
}

/** The limbs that move to reach frame `frameStep` (1-based), or [] at the start. */
export function movingLimbsAt(moves: DraftMove[], frameStep: number): Limb[] {
  const frames = framesOf(moves);
  if (frameStep <= 0 || frameStep > frames.length) return [];
  return frames[frameStep - 1]!.map((m) => m.limb);
}
