import { applyHistoryFilters, DEFAULT_HISTORY_FILTERS, hasActiveFilters } from '@/utils/historyFilters';
import type { HistoryFilters, RouteWithGym } from '@/types';

let nextId = 1;

function route(partial: Partial<RouteWithGym> & { gymId: number; gymName: string }): RouteWithGym {
  const id = nextId++;
  return {
    id,
    name: null,
    gymId: partial.gymId,
    photoUri: null,
    photoWidth: null,
    photoHeight: null,
    grade: partial.grade ?? null,
    completed: partial.completed ?? false,
    notes: null,
    startedAt: null,
    completedAt: null,
    createdAt: partial.createdAt ?? id,
    updatedAt: id,
    gym: {
      id: partial.gymId,
      name: partial.gymName,
      normalizedName: partial.gymName.toLowerCase(),
      createdAt: 0,
      updatedAt: 0,
    },
  };
}

function filters(p: Partial<HistoryFilters>): HistoryFilters {
  return { ...DEFAULT_HISTORY_FILTERS, ...p };
}

const ROUTES: RouteWithGym[] = [
  route({ gymId: 1, gymName: 'Aiguille', grade: 'V2', completed: true, createdAt: 100 }),
  route({ gymId: 2, gymName: 'Boulder Co', grade: 'V5', completed: false, createdAt: 300 }),
  route({ gymId: 1, gymName: 'Aiguille', grade: 'V8', completed: false, createdAt: 200 }),
  route({ gymId: 2, gymName: 'Boulder Co', grade: null, completed: true, createdAt: 400 }),
];

describe('applyHistoryFilters', () => {
  it('returns all routes sorted newest-first by default', () => {
    const out = applyHistoryFilters(ROUTES, DEFAULT_HISTORY_FILTERS);
    expect(out.map((r) => r.createdAt)).toEqual([400, 300, 200, 100]);
  });

  it('filters by completion status', () => {
    expect(applyHistoryFilters(ROUTES, filters({ completion: 'completed' }))).toHaveLength(2);
    expect(applyHistoryFilters(ROUTES, filters({ completion: 'projects' }))).toHaveLength(2);
  });

  it('filters by gym', () => {
    const out = applyHistoryFilters(ROUTES, filters({ gymId: 1 }));
    expect(out.every((r) => r.gymId === 1)).toBe(true);
    expect(out).toHaveLength(2);
  });

  it('filters by grade range and drops ungraded climbs', () => {
    const out = applyHistoryFilters(ROUTES, filters({ gradeMin: 'V3', gradeMax: 'V6' }));
    expect(out.map((r) => r.grade)).toEqual(['V5']);
  });

  it('treats modifiers as the same rung when filtering by grade', () => {
    const withMods = [route({ gymId: 1, gymName: 'A', grade: 'V5+' }), route({ gymId: 1, gymName: 'A', grade: 'V5-' })];
    const out = applyHistoryFilters(withMods, filters({ gradeMin: 'V5', gradeMax: 'V5' }));
    expect(out).toHaveLength(2);
  });

  it('sorts by grade ascending and descending', () => {
    const asc = applyHistoryFilters(ROUTES, filters({ sort: 'grade-asc' }));
    expect(asc.map((r) => r.grade)).toEqual([null, 'V2', 'V5', 'V8']);
    const desc = applyHistoryFilters(ROUTES, filters({ sort: 'grade-desc' }));
    expect(desc.map((r) => r.grade)).toEqual(['V8', 'V5', 'V2', null]);
  });

  it('sorts by gym name', () => {
    const out = applyHistoryFilters(ROUTES, filters({ sort: 'gym-asc' }));
    expect(out[0].gym.name).toBe('Aiguille');
  });

  it('does not mutate the input array', () => {
    const input = [...ROUTES];
    applyHistoryFilters(input, filters({ sort: 'date-asc' }));
    expect(input).toEqual(ROUTES);
  });
});

describe('hasActiveFilters', () => {
  it('is false for defaults and true once a filter is set', () => {
    expect(hasActiveFilters(DEFAULT_HISTORY_FILTERS)).toBe(false);
    expect(hasActiveFilters(filters({ gymId: 1 }))).toBe(true);
    expect(hasActiveFilters(filters({ sort: 'grade-asc' }))).toBe(false);
  });
});
