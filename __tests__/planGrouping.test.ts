import { groupPlansByRoute } from '@/utils/planGrouping';
import type { PlanSummary, RouteWithGym } from '@/types';

function route(id: number): RouteWithGym {
  return { id, gym: { id: 1, name: 'Gym', normalizedName: 'gym', createdAt: 0, updatedAt: 0 } } as RouteWithGym;
}

function plan(planId: number, routeId: number): PlanSummary {
  return {
    planId,
    routeId,
    noteId: planId,
    moveCount: 3,
    photoUri: null,
    updatedAt: planId,
    route: route(routeId),
  };
}

describe('groupPlansByRoute', () => {
  it('returns an empty list for no plans', () => {
    expect(groupPlansByRoute([])).toEqual([]);
  });

  it('collapses plans of the same climb into one stack', () => {
    const stacks = groupPlansByRoute([plan(1, 10), plan(2, 10), plan(3, 20)]);
    expect(stacks).toHaveLength(2);
    expect(stacks[0]!.route.id).toBe(10);
    expect(stacks[0]!.plans.map((p) => p.planId)).toEqual([1, 2]);
    expect(stacks[1]!.route.id).toBe(20);
    expect(stacks[1]!.plans.map((p) => p.planId)).toEqual([3]);
  });

  it('orders stacks by each climb’s first plan and keeps inner order', () => {
    const stacks = groupPlansByRoute([plan(1, 10), plan(2, 20), plan(3, 10)]);
    expect(stacks.map((s) => s.route.id)).toEqual([10, 20]);
    expect(stacks[0]!.plans.map((p) => p.planId)).toEqual([1, 3]);
  });
});
