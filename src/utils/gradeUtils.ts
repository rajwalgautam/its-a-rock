import { GRADE_BASES, GRADE_MODIFIERS } from '@/constants/grades';
import type { GradeBase, GradeModifier } from '@/types';

export interface ParsedGrade {
  base: GradeBase;
  modifier: GradeModifier;
}

const BASE_SET = new Set<string>(GRADE_BASES);
const MOD_ORDER: Record<GradeModifier, number> = { '-': 0, '': 1, '+': 2 };

/** Compose a base + modifier into the serialized string, e.g. "V4" + "+" → "V4+". */
export function formatGrade(base: GradeBase, modifier: GradeModifier = ''): string {
  return `${base}${modifier}`;
}

/**
 * Parse a serialized grade like "V4", "V4+", "V4-" into its parts, or null if
 * it isn't a recognized V-scale grade.
 */
export function parseGrade(grade: string | null | undefined): ParsedGrade | null {
  if (grade === null || grade === undefined) return null;
  const trimmed = grade.trim();
  const match = /^(V(?:B|\d{1,2}))([+-]?)$/.exec(trimmed);
  if (match === null) return null;
  const base = match[1];
  if (!BASE_SET.has(base)) return null;
  return { base: base as GradeBase, modifier: (match[2] as GradeModifier) ?? '' };
}

/**
 * A monotonic sort value for a grade so that V4- < V4 < V4+ < V5-. Unknown /
 * unparseable grades sort below everything (-1).
 */
export function gradeSortValue(grade: string | null | undefined): number {
  const parsed = parseGrade(grade);
  if (parsed === null) return -1;
  return GRADE_BASES.indexOf(parsed.base) * 3 + MOD_ORDER[parsed.modifier];
}

/**
 * Compare two grades by difficulty. Returns <0 if a is easier, >0 if harder,
 * 0 if equal. Suitable for Array.prototype.sort.
 */
export function compareGrades(a: string | null | undefined, b: string | null | undefined): number {
  return gradeSortValue(a) - gradeSortValue(b);
}

export { GRADE_BASES, GRADE_MODIFIERS };
