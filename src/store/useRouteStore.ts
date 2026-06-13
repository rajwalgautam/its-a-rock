import { create } from 'zustand';
import type { Gym, RouteInput, RouteWithGym } from '@/types';
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

// Weekly stats live on this store too (see docs/BLUEPRINT.md §7) but the
// computation (routeStats) is added with the My Climbing work — issue #29.

interface RouteState {
  routes: RouteWithGym[];
  projects: RouteWithGym[];
  gyms: Gym[];
  isLoading: boolean;
  error: string | null;
  loadRoutes: () => Promise<void>;
  loadProjects: () => Promise<void>;
  loadGyms: () => Promise<void>;
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
    set({ routes: [], projects: [], gyms: [] });
  },
}));

/** Re-read the lists that a mutation can affect. */
async function refresh(get: () => RouteState): Promise<void> {
  await Promise.all([get().loadRoutes(), get().loadProjects(), get().loadGyms()]);
}

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Unknown error';
}
