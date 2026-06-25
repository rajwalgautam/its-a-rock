import { create } from 'zustand';
import type { PlanMoveInput, RoutePlan } from '@/types';
import {
  getOrCreatePlanForRoute,
  persistPlanPhoto,
  savePlanMoves,
} from '@/db/queries';

interface PlanState {
  plan: RoutePlan | null;
  isLoading: boolean;
  error: string | null;
  /**
   * Load (or create) the route's plan on the given photo. Also persists the
   * photo to durable storage so the plan can't be orphaned by cache eviction.
   */
  loadPlan: (routeId: number, mediaId: number | null) => Promise<RoutePlan | null>;
  /** Replace the current plan's moves (renumbering sequence) and persist. */
  saveMoves: (moves: PlanMoveInput[]) => Promise<RoutePlan | null>;
  clear: () => void;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  plan: null,
  isLoading: false,
  error: null,

  loadPlan: async (routeId, mediaId) => {
    set({ isLoading: true, error: null });
    try {
      // Durability is best-effort: a failed copy must not block planning.
      if (mediaId !== null) {
        try {
          await persistPlanPhoto(mediaId);
        } catch {
          // ignore — fall back to the original (cache) URI
        }
      }
      const plan = await getOrCreatePlanForRoute(routeId, mediaId);
      set({ plan, isLoading: false });
      return plan;
    } catch (e) {
      set({ error: errMessage(e), isLoading: false });
      return null;
    }
  },

  saveMoves: async (moves) => {
    const current = get().plan;
    if (current === null) return null;
    try {
      const plan = await savePlanMoves(current.id, moves);
      set({ plan });
      return plan;
    } catch (e) {
      set({ error: errMessage(e) });
      return null;
    }
  },

  clear: () => set({ plan: null, error: null, isLoading: false }),
}));

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Unknown error';
}
