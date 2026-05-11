import { create } from 'zustand';
import {
  createRoute,
  deleteRoute,
  getGyms,
  getRouteById,
  getRoutes,
  getRoutesForMonth,
  resetAllData,
  updateRoute,
} from '@/db/queries';
import {
  CompletedFilter,
  DailyRouteStats,
  Gym,
  RouteInput,
  RouteTagId,
  RouteWithRelations,
  SummaryStats,
} from '@/types';
import { buildDailyStats, buildSummaryStats } from '@/utils/routeStats';

interface RouteStoreState {
  routes: RouteWithRelations[];
  gyms: Gym[];
  monthRoutes: RouteWithRelations[];
  monthStats: Record<string, DailyRouteStats>;
  summaryStats: SummaryStats;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedGymId: number | null;
  completedFilter: CompletedFilter;
  selectedTagIds: RouteTagId[];
  loadRoutes: () => Promise<void>;
  loadGyms: () => Promise<void>;
  loadMonth: (year: number, month: number) => Promise<void>;
  getRoute: (id: number) => Promise<RouteWithRelations | null>;
  addRoute: (input: RouteInput) => Promise<RouteWithRelations>;
  editRoute: (id: number, input: RouteInput) => Promise<RouteWithRelations>;
  removeRoute: (id: number) => Promise<void>;
  clearAll: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedGymId: (gymId: number | null) => void;
  setCompletedFilter: (filter: CompletedFilter) => void;
  toggleTagFilter: (tagId: RouteTagId) => void;
  clearFilters: () => void;
}

const EMPTY_SUMMARY = buildSummaryStats([]);

export const useRouteStore = create<RouteStoreState>((set, get) => ({
  routes: [],
  gyms: [],
  monthRoutes: [],
  monthStats: {},
  summaryStats: EMPTY_SUMMARY,
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedGymId: null,
  completedFilter: 'all',
  selectedTagIds: [],

  async loadRoutes() {
    set({ isLoading: true, error: null });
    try {
      const state = get();
      const routes = await getRoutes({
        searchQuery: state.searchQuery,
        gymId: state.selectedGymId,
        completedFilter: state.completedFilter,
        tagIds: state.selectedTagIds,
      });
      set({ routes, summaryStats: buildSummaryStats(routes), isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Could not load routes.', isLoading: false });
    }
  },

  async loadGyms() {
    set({ gyms: await getGyms() });
  },

  async loadMonth(year, month) {
    const routes = await getRoutesForMonth(year, month);
    set({
      monthRoutes: routes,
      monthStats: buildDailyStats(routes),
      summaryStats: buildSummaryStats(routes),
    });
  },

  async getRoute(id) {
    return getRouteById(id);
  },

  async addRoute(input) {
    const route = await createRoute(input);
    await Promise.all([get().loadRoutes(), get().loadGyms()]);
    return route;
  },

  async editRoute(id, input) {
    const route = await updateRoute(id, input);
    await Promise.all([get().loadRoutes(), get().loadGyms()]);
    return route;
  },

  async removeRoute(id) {
    await deleteRoute(id);
    await get().loadRoutes();
  },

  async clearAll() {
    await resetAllData();
    set({
      routes: [],
      gyms: [],
      monthRoutes: [],
      monthStats: {},
      summaryStats: EMPTY_SUMMARY,
    });
  },

  setSearchQuery(query) {
    set({ searchQuery: query });
  },

  setSelectedGymId(gymId) {
    set({ selectedGymId: gymId });
  },

  setCompletedFilter(filter) {
    set({ completedFilter: filter });
  },

  toggleTagFilter(tagId) {
    set((state) => ({
      selectedTagIds: state.selectedTagIds.includes(tagId)
        ? state.selectedTagIds.filter((id) => id !== tagId)
        : [...state.selectedTagIds, tagId],
    }));
  },

  clearFilters() {
    set({
      searchQuery: '',
      selectedGymId: null,
      completedFilter: 'all',
      selectedTagIds: [],
    });
  },
}));
