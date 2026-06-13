import { computeWeeklyStats, type RouteForStats } from '@/utils/routeStats';
import { weekStartMs } from '@/utils/dateUtils';

// Anchor "now" to a fixed Wednesday so week boundaries are deterministic.
const NOW = new Date(2026, 5, 10, 12, 0).getTime(); // Wed Jun 10 2026, noon
const MONDAY = weekStartMs(NOW); // Mon Jun 8 2026 00:00
const DAY = 24 * 60 * 60 * 1000;

function route(partial: Partial<RouteForStats>): RouteForStats {
  return { completed: false, createdAt: NOW, completedAt: null, ...partial };
}

describe('computeWeeklyStats', () => {
  it('reports the Monday week start', () => {
    expect(computeWeeklyStats([], NOW).weekStart).toBe(MONDAY);
  });

  it('counts routes added this week and distinct visit days', () => {
    const routes = [
      route({ createdAt: MONDAY + 1 * DAY }),
      route({ createdAt: MONDAY + 1 * DAY + 3 * 60 * 60 * 1000 }), // same day
      route({ createdAt: MONDAY + 3 * DAY }),
    ];
    const stats = computeWeeklyStats(routes, NOW);
    expect(stats.addedThisWeek).toBe(3);
    expect(stats.visits).toBe(2);
  });

  it('excludes routes created before this week', () => {
    const stats = computeWeeklyStats([route({ createdAt: MONDAY - 2 * DAY })], NOW);
    expect(stats.addedThisWeek).toBe(0);
    expect(stats.visits).toBe(0);
  });

  it('counts sends completed this week by completedAt', () => {
    const routes = [
      route({ completed: true, completedAt: MONDAY + 2 * DAY, createdAt: MONDAY - 30 * DAY }),
      route({ completed: true, completedAt: MONDAY - 5 * DAY, createdAt: MONDAY - 40 * DAY }),
    ];
    const stats = computeWeeklyStats(routes, NOW);
    expect(stats.completedThisWeek).toBe(1);
  });

  it('counts all-time active projects regardless of week', () => {
    const routes = [
      route({ completed: false, createdAt: MONDAY - 100 * DAY }),
      route({ completed: false, createdAt: MONDAY + 1 * DAY }),
      route({ completed: true, completedAt: MONDAY + 1 * DAY }),
    ];
    expect(computeWeeklyStats(routes, NOW).activeProjects).toBe(2);
  });

  it('includes the week boundaries inclusively', () => {
    const routes = [
      route({ createdAt: MONDAY }),
      route({ createdAt: MONDAY + 7 * DAY - 1 }), // Sunday 23:59:59.999
    ];
    expect(computeWeeklyStats(routes, NOW).addedThisWeek).toBe(2);
  });
});
