// Pure helpers for the editable move sequence. The planner screen keeps moves in
// local state as `DraftMove`s (a stable key + the persisted fields), edits them
// through these functions, then persists via `savePlanMoves`. Keeping the logic
// here makes it unit-testable without a renderer or a database.

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
}

/** Build editable moves from a persisted plan (keys are the row ids). */
export function fromPlan(plan: RoutePlan): DraftMove[] {
  return plan.moves.map((m) => ({
    key: String(m.id),
    limb: m.limb,
    x: m.x,
    y: m.y,
    holdId: m.holdId,
  }));
}

/** Strip editor-only fields for persistence; array order becomes `sequence`. */
export function toInputs(moves: DraftMove[]): PlanMoveInput[] {
  return moves.map((m) => ({ limb: m.limb, x: m.x, y: m.y, holdId: m.holdId }));
}

export function appendMove(moves: DraftMove[], move: DraftMove): DraftMove[] {
  return [...moves, move];
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

/** Remove a move by key. */
export function removeMove(moves: DraftMove[], key: string): DraftMove[] {
  return moves.filter((m) => m.key !== key);
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
