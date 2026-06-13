import { create } from 'zustand';
import type { Gym, RouteInput, RouteWithGym, WeeklyStats } from '@/types';
import {
  createRoute,
  deleteRoute,
  getGyms,
  getProjects,
  getRouteById,
  getRoutes,
  resetAllData,
  updateRoute,
} from '@/db/queries';
import { computeWeeklyStats } from '@/utils/routeStats';

interface RouteState {
  routes: RouteWithGym[];
  projects: RouteWithGym[];
  gyms: Gym[];
  weeklyStats: WeeklyStats | null;
  isLoading: boolean;
  error: string | null;
  loadRoutes: () => Promise<void>;
  loadProjects: () => Promise<void>;
  loadGyms: () => Promise<void>;
  loadWeeklyStats: () => Promise<void>;
  getRoute: (id: number) => Promise<RouteWithGym | null>;
  addRoute: (input: RouteInput) => Promise<RouteWithGym>;
  editRoute: (id: number, input: RouteInput) => Promise<RouteWithGym>;
  removeRoute: (id: number) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useRouteStore = create<RouteState>((set, get) => ({
  routes: [],
  projects: [],
  gyms: [],
  weeklyStats: null,
  isLoading: false,
  error: null,

  loadRoutes: async () => {
    set({ isLoading: true, error: null });
    try {
      const routes = await getRoutes();
      set({ routes, isLoading: false });
    } catch (e) {
      set({ error: errMessage(e), isLoading: false });
    }
  },

  loadProjects: async () => {
    set({ error: null });
    try {
      const projects = await getProjects();
      set({ projects });
    } catch (e) {
      set({ error: errMessage(e) });
    }
  },

  loadGyms: async () => {
    set({ error: null });
    try {
      const gyms = await getGyms();
      set({ gyms });
    } catch (e) {
      set({ error: errMessage(e) });
    }
  },

  loadWeeklyStats: async () => {
    set({ error: null });
    try {
      const all = await getRoutes();
      set({ weeklyStats: computeWeeklyStats(all) });
    } catch (e) {
      set({ error: errMessage(e) });
    }
  },

  getRoute: async (id) => {
    return getRouteById(id);
  },

  addRoute: async (input) => {
    const route = await createRoute(input);
    await refresh(get);
    return route;
  },

  editRoute: async (id, input) => {
    const route = await updateRoute(id, input);
    await refresh(get);
    return route;
  },

  removeRoute: async (id) => {
    await deleteRoute(id);
    await refresh(get);
  },

  clearAll: async () => {
    await resetAllData();
    set({ routes: [], projects: [], gyms: [], weeklyStats: computeWeeklyStats([]) });
  },
}));

/** Re-read the lists that a mutation can affect. */
async function refresh(get: () => RouteState): Promise<void> {
  await Promise.all([
    get().loadRoutes(),
    get().loadProjects(),
    get().loadGyms(),
    get().loadWeeklyStats(),
  ]);
}

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Unknown error';
}
