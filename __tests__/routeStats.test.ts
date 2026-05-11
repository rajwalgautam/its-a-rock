import { RouteWithRelations } from '@/types';
import { buildDailyStats, buildSummaryStats } from '@/utils/routeStats';

const gym = {
  id: 1,
  name: 'Local Gym',
  normalizedName: 'local gym',
  createdAt: 1,
  updatedAt: 1,
};

function route(overrides: Partial<RouteWithRelations>): RouteWithRelations {
  return {
    id: 1,
    name: 'Route',
    gymId: 1,
    grade: 'V3',
    attempts: 1,
    completed: false,
    notes: null,
    climbedAt: new Date(2026, 4, 2).getTime(),
    createdAt: 1,
    updatedAt: 1,
    gym,
    tags: [],
    ...overrides,
  };
}

describe('routeStats', () => {
  it('builds daily stats by local date', () => {
    const stats = buildDailyStats([
      route({ id: 1, completed: true, attempts: 2, tags: ['technical'] }),
      route({ id: 2, completed: false, attempts: 4, tags: ['slopey'] }),
    ]);

    expect(stats['2026-05-02'].totalRoutes).toBe(2);
    expect(stats['2026-05-02'].completedRoutes).toBe(1);
    expect(stats['2026-05-02'].totalAttempts).toBe(6);
    expect(stats['2026-05-02'].tagCounts.technical).toBe(1);
  });

  it('builds summary stats', () => {
    const summary = buildSummaryStats([
      route({ id: 1, completed: true, attempts: 2, tags: ['technical'] }),
      route({ id: 2, completed: false, attempts: 4, tags: ['technical', 'slopey'] }),
    ]);

    expect(summary.totalRoutes).toBe(2);
    expect(summary.completedRoutes).toBe(1);
    expect(summary.completionRate).toBe(0.5);
    expect(summary.totalAttempts).toBe(6);
    expect(summary.mostClimbedGymName).toBe('Local Gym');
    expect(summary.mostCommonTags[0]).toEqual({ tagId: 'technical', count: 2 });
  });
});
