import type { RouteInput, RouteWithGym } from '@/types';

/**
 * Build a full RouteInput from an existing route (queries overwrite every
 * field on update). Pass overrides to change specific fields — e.g. quick
 * long-press toggles of completion status.
 */
export function routeToInput(route: RouteWithGym, overrides: Partial<RouteInput> = {}): RouteInput {
  return {
    name: route.name,
    gymName: route.gym.name,
    photoUri: route.photoUri,
    photoWidth: route.photoWidth,
    photoHeight: route.photoHeight,
    grade: route.grade,
    completed: route.completed,
    notes: route.notes,
    startedAt: route.startedAt,
    completedAt: route.completedAt,
    ...overrides,
  };
}
