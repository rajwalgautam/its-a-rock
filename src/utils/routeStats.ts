import { DailyRouteStats, RouteTagId, RouteWithRelations, SummaryStats } from '@/types';
import { toDateString } from './dateUtils';

export function buildDailyStats(routes: RouteWithRelations[]): Record<string, DailyRouteStats> {
  return routes.reduce<Record<string, DailyRouteStats>>((acc, route) => {
    const date = toDateString(route.climbedAt);
    const existing = acc[date] ?? {
      date,
      totalRoutes: 0,
      completedRoutes: 0,
      totalAttempts: 0,
      gymIds: [],
      tagCounts: {},
    };

    existing.totalRoutes += 1;
    existing.completedRoutes += route.completed ? 1 : 0;
    existing.totalAttempts += route.attempts;
    if (!existing.gymIds.includes(route.gymId)) {
      existing.gymIds.push(route.gymId);
    }
    for (const tagId of route.tags) {
      existing.tagCounts[tagId] = (existing.tagCounts[tagId] ?? 0) + 1;
    }

    acc[date] = existing;
    return acc;
  }, {});
}

export function buildSummaryStats(routes: RouteWithRelations[]): SummaryStats {
  const completedRoutes = routes.filter((route) => route.completed);
  const totalAttempts = routes.reduce((sum, route) => sum + route.attempts, 0);
  const gymCounts = new Map<number, { name: string; count: number }>();
  const tagCounts = new Map<RouteTagId, number>();
  const days = new Set<string>();

  for (const route of routes) {
    days.add(toDateString(route.climbedAt));
    gymCounts.set(route.gymId, {
      name: route.gym.name,
      count: (gymCounts.get(route.gymId)?.count ?? 0) + 1,
    });
    for (const tagId of route.tags) {
      tagCounts.set(tagId, (tagCounts.get(tagId) ?? 0) + 1);
    }
  }

  const mostClimbedGym = Array.from(gymCounts.values()).sort((a, b) => b.count - a.count)[0];
  const mostCommonTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tagId, count]) => ({ tagId, count }));

  return {
    totalRoutes: routes.length,
    completedRoutes: completedRoutes.length,
    completionRate: routes.length === 0 ? 0 : completedRoutes.length / routes.length,
    totalAttempts,
    avgAttemptsPerCompleted: completedRoutes.length === 0
      ? 0
      : completedRoutes.reduce((sum, route) => sum + route.attempts, 0) / completedRoutes.length,
    daysClimbed: days.size,
    activeGyms: gymCounts.size,
    mostClimbedGymName: mostClimbedGym?.name ?? null,
    mostCommonTags,
  };
}
