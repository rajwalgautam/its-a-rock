import { compareGrades, gradeRungIndex } from '@/utils/gradeUtils';
import type { HistoryFilters, RouteWithGym } from '@/types';

export const DEFAULT_HISTORY_FILTERS: HistoryFilters = {
  completion: 'all',
  gymId: null,
  gradeMin: null,
  gradeMax: null,
  sort: 'date-desc',
};

/** True when any filter (not sort) narrows the result set. */
export function hasActiveFilters(f: HistoryFilters): boolean {
  return (
    f.completion !== 'all' ||
    f.gymId !== null ||
    f.gradeMin !== null ||
    f.gradeMax !== null
  );
}

/** Apply completion/gym/grade filters and the chosen sort. Pure; returns a copy. */
export function applyHistoryFilters(
  routes: RouteWithGym[],
  f: HistoryFilters,
): RouteWithGym[] {
  const minIndex = gradeRungIndex(f.gradeMin);
  const maxIndex = gradeRungIndex(f.gradeMax);

  const filtered = routes.filter((r) => {
    if (f.completion === 'completed' && !r.completed) return false;
    if (f.completion === 'projects' && r.completed) return false;
    if (f.gymId !== null && r.gymId !== f.gymId) return false;

    if (f.gradeMin !== null || f.gradeMax !== null) {
      const idx = gradeRungIndex(r.grade);
      if (idx < 0) return false; // ungraded climbs drop out of grade filtering
      if (f.gradeMin !== null && idx < minIndex) return false;
      if (f.gradeMax !== null && idx > maxIndex) return false;
    }
    return true;
  });

  const sorted = [...filtered];
  switch (f.sort) {
    case 'date-asc':
      sorted.sort((a, b) => a.createdAt - b.createdAt);
      break;
    case 'grade-asc':
      sorted.sort((a, b) => compareGrades(a.grade, b.grade) || b.createdAt - a.createdAt);
      break;
    case 'grade-desc':
      sorted.sort((a, b) => compareGrades(b.grade, a.grade) || b.createdAt - a.createdAt);
      break;
    case 'gym-asc':
      sorted.sort((a, b) => a.gym.name.localeCompare(b.gym.name) || b.createdAt - a.createdAt);
      break;
    case 'date-desc':
    default:
      sorted.sort((a, b) => b.createdAt - a.createdAt);
      break;
  }
  return sorted;
}
