import {
  FRENCH_GRADES,
  GRADE_BASES,
  GRADE_MODIFIERS,
  GRADE_SYSTEMS,
  V_GRADES,
  YDS_GRADES,
} from '@/constants/grades';
import type { GradeBase, GradeModifier, GradeSystem } from '@/types';

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

// A single ascending ordering across every system: V tokens, then YDS, then
// French. Grades are self-identifying (V…, 5.…, bare French tokens), so within
// a system the order is exact; across systems they group but stay stable. This
// backs sorting and validation for whichever system a climb was logged in.
const ALL_GRADES: readonly string[] = [...V_GRADES, ...YDS_GRADES, ...FRENCH_GRADES];
const GRADE_INDEX = new Map<string, number>(ALL_GRADES.map((g, i) => [g, i]));

function gradeValue(parsed: ParsedGrade): number {
  return GRADE_BASES.indexOf(parsed.base) * 3 + MOD_ORDER[parsed.modifier];
}

/** True when `grade` is a recognized single token in any supported system. */
export function isKnownGrade(grade: string | null | undefined): boolean {
  return grade != null && GRADE_INDEX.has(grade.trim());
}

/** Which system a serialized single grade belongs to, or null if unrecognized. */
export function gradeSystemOf(grade: string | null | undefined): GradeSystem | null {
  if (grade == null) return null;
  const trimmed = grade.trim();
  if (parseGrade(trimmed) !== null) return 'V';
  if ((YDS_GRADES as readonly string[]).includes(trimmed)) return 'YDS';
  if ((FRENCH_GRADES as readonly string[]).includes(trimmed)) return 'French';
  return null;
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
 * Accept a valid single grade in any supported system, or a V-scale range whose
 * start is at or below its end. Used by form validation. (Ranges are a V-scale
 * feature only; YDS/French grades are logged as a single value.)
 */
export function isValidGradeOrRange(grade: string | null | undefined): boolean {
  if (isKnownGrade(grade)) return true;
  const range = parseGradeRange(grade);
  return range !== null && gradeValue(range.min) <= gradeValue(range.max);
}

/**
 * A monotonic sort value so grades order by difficulty within a system (e.g.
 * V4- < V4 < V4+ < V5-, or 5.10a < 5.10b). V-scale ranges sort by their lower
 * bound. Unknown / unparseable grades sort below everything (-1).
 */
export function gradeSortValue(grade: string | null | undefined): number {
  if (grade == null) return -1;
  const known = GRADE_INDEX.get(grade.trim());
  if (known !== undefined) return known;
  const range = parseGradeRange(grade);
  if (range !== null) return GRADE_INDEX.get(`${range.min.base}${range.min.modifier}`) ?? -1;
  return -1;
}

/**
 * Compare two grades by difficulty. Returns <0 if a is easier, >0 if harder,
 * 0 if equal. Suitable for Array.prototype.sort.
 */
export function compareGrades(a: string | null | undefined, b: string | null | undefined): number {
  return gradeSortValue(a) - gradeSortValue(b);
}

// Ascending "rung" list across all systems, used by grade filtering so a min/max
// picked in one system compares cleanly against grades logged in that system.
const ALL_RUNGS: readonly string[] = [
  ...GRADE_SYSTEMS.V.rungs,
  ...GRADE_SYSTEMS.YDS.rungs,
  ...GRADE_SYSTEMS.French.rungs,
];
const RUNG_INDEX = new Map<string, number>(ALL_RUNGS.map((g, i) => [g, i]));

/** The ordered rung labels to show as min/max grade chips for a system. */
export function gradeRungs(system: GradeSystem): readonly string[] {
  return GRADE_SYSTEMS[system].rungs;
}

/**
 * Index of a grade's rung on the global rung list (V modifiers folded onto their
 * base), or -1 when missing/unparseable. V ranges use their lower bound. Used so
 * grade filtering treats e.g. V4-, V4 and V4+ as the same rung.
 */
export function gradeRungIndex(grade: string | null | undefined): number {
  const single = parseGrade(grade);
  if (single !== null) return RUNG_INDEX.get(single.base) ?? -1;
  const range = parseGradeRange(grade);
  if (range !== null) return RUNG_INDEX.get(range.min.base) ?? -1;
  if (grade == null) return -1;
  return RUNG_INDEX.get(grade.trim()) ?? -1;
}

export { GRADE_BASES, GRADE_MODIFIERS };
