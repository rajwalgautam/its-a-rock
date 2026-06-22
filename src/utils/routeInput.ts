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
    // Only carry the gallery when it's been loaded (detail view). For routes
    // taken from a list query (media empty/unloaded) we leave `media` undefined
    // so a quick toggle preserves the existing gallery instead of clearing it;
    // the cached cover (photoUri) keeps the tile intact.
    media:
      route.media.length > 0
        ? route.media.map((m) => ({
            uri: m.uri,
            type: m.type,
            width: m.width,
            height: m.height,
          }))
        : undefined,
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
