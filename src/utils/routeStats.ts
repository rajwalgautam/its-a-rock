import type { BoulderRoute, WeeklyStats } from '@/types';
import { dayKey, weekEndMs, weekStartMs } from '@/utils/dateUtils';

/** The subset of route fields the weekly-stats math needs. */
export type RouteForStats = Pick<
  BoulderRoute,
  'completed' | 'createdAt' | 'completedAt'
>;

/**
 * Compute this-week stats from the full route list. The week runs Monday 00:00
 * to Sunday 23:59:59.999 local time, relative to `now`.
 *
 * - visits: distinct local days on which a route was created this week
 * - completedThisWeek: routes whose completedAt falls in this week
 * - addedThisWeek: routes created this week
 * - activeProjects: routes not yet completed (all-time, not just this week)
 */
export function computeWeeklyStats(
  routes: readonly RouteForStats[],
  now: number = Date.now(),
): WeeklyStats {
  const start = weekStartMs(now);
  const end = weekEndMs(now);

  const visitDays = new Set<string>();
  let addedThisWeek = 0;
  let completedThisWeek = 0;
  let activeProjects = 0;

  for (const r of routes) {
    if (r.createdAt >= start && r.createdAt <= end) {
      addedThisWeek += 1;
      visitDays.add(dayKey(r.createdAt));
    }
    if (
      r.completed &&
      r.completedAt !== null &&
      r.completedAt >= start &&
      r.completedAt <= end
    ) {
      completedThisWeek += 1;
    }
    if (!r.completed) {
      activeProjects += 1;
    }
  }

  return {
    weekStart: start,
    visits: visitDays.size,
    completedThisWeek,
    addedThisWeek,
    activeProjects,
  };
}
