import { GRADE_BASES, GRADE_MODIFIERS } from '@/constants/grades';
import type { GradeBase, GradeModifier } from '@/types';

export interface ParsedGrade {
  base: GradeBase;
  modifier: GradeModifier;
}

export interface ParsedGradeRange {
  min: ParsedGrade;
  max: ParsedGrade;
}

const BASE_SET = new Set<string>(GRADE_BASES);
const MOD_ORDER: Record<GradeModifier, number> = { '-': 0, '': 1, '+': 2 };

// A single grade token, e.g. "V4", "V4+", "VB". Ranges are two of these joined
// by a hyphen ("V0-V2"); the leading "V" of the second token disambiguates the
// hyphen from a "softer" modifier, so "V4-" stays a single grade.
const GRADE_TOKEN = 'V(?:B|\\d{1,2})[+-]?';
const RANGE_RE = new RegExp(`^(${GRADE_TOKEN})-(${GRADE_TOKEN})$`);

/** Compose a base + modifier into the serialized string, e.g. "V4" + "+" → "V4+". */
export function formatGrade(base: GradeBase, modifier: GradeModifier = ''): string {
  return `${base}${modifier}`;
}

/** Serialize a min/max pair into the stored range string, e.g. "V0-V2". */
export function formatGradeRange(min: string, max: string): string {
  return `${min}-${max}`;
}

function gradeValue(parsed: ParsedGrade): number {
  return GRADE_BASES.indexOf(parsed.base) * 3 + MOD_ORDER[parsed.modifier];
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
 * Parse a serialized range like "V0-V2" into its endpoints, or null if it isn't
 * a recognized range. Note the endpoints are not required to be ordered here;
 * use {@link isValidGradeOrRange} to reject reversed ranges.
 */
export function parseGradeRange(grade: string | null | undefined): ParsedGradeRange | null {
  if (grade === null || grade === undefined) return null;
  const match = RANGE_RE.exec(grade.trim());
  if (match === null) return null;
  const min = parseGrade(match[1]);
  const max = parseGrade(match[2]);
  if (min === null || max === null) return null;
  return { min, max };
}

/** True when the serialized grade encodes a range rather than a single grade. */
export function isGradeRange(grade: string | null | undefined): boolean {
  return parseGradeRange(grade) !== null;
}

/**
 * Accept either a valid single grade or a valid range whose start is at or
 * below its end. Used by form validation.
 */
export function isValidGradeOrRange(grade: string | null | undefined): boolean {
  if (parseGrade(grade) !== null) return true;
  const range = parseGradeRange(grade);
  return range !== null && gradeValue(range.min) <= gradeValue(range.max);
}

/**
 * A monotonic sort value for a grade so that V4- < V4 < V4+ < V5-. Ranges sort
 * by their lower bound. Unknown / unparseable grades sort below everything (-1).
 */
export function gradeSortValue(grade: string | null | undefined): number {
  const parsed = parseGrade(grade);
  if (parsed !== null) return gradeValue(parsed);
  const range = parseGradeRange(grade);
  if (range !== null) return gradeValue(range.min);
  return -1;
}

/**
 * Compare two grades by difficulty. Returns <0 if a is easier, >0 if harder,
 * 0 if equal. Suitable for Array.prototype.sort.
 */
export function compareGrades(a: string | null | undefined, b: string | null | undefined): number {
  return gradeSortValue(a) - gradeSortValue(b);
}

export { GRADE_BASES, GRADE_MODIFIERS };
