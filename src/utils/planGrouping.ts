import type { PlanSummary, RouteWithGym } from '@/types';

/** A climb and all of its plans, for the Plans tab's stacked view. */
export interface PlanStack {
  route: RouteWithGym;
  plans: PlanSummary[];
}

/**
 * Group plans by the climb they belong to, preserving the input order: each
 * stack appears at the position of its climb's first plan, and the plans within
 * a stack stay in their original (newest-first) order. So a flat list already
 * sorted by recency collapses into stacks without reshuffling.
 */
export function groupPlansByRoute(plans: PlanSummary[]): PlanStack[] {
  const stacks: PlanStack[] = [];
  const byRoute = new Map<number, PlanStack>();
  for (const plan of plans) {
    const existing = byRoute.get(plan.routeId);
    if (existing !== undefined) {
      existing.plans.push(plan);
    } else {
      const stack: PlanStack = { route: plan.route, plans: [plan] };
      byRoute.set(plan.routeId, stack);
      stacks.push(stack);
    }
  }
  return stacks;
}
