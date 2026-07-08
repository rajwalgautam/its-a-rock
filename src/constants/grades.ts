import type { GradeBase, GradeModifier, GradeSystem } from '@/types';

// V-scale bases in ascending difficulty order. VB ("V-Beginner") sits below V0.
export const GRADE_BASES: readonly GradeBase[] = [
  'VB',
  'V0',
  'V1',
  'V2',
  'V3',
  'V4',
  'V5',
  'V6',
  'V7',
  'V8',
  'V9',
  'V10',
  'V11',
  'V12',
] as const;

// Ordered so a modifier nudges difficulty within a base: V4- < V4 < V4+.
export const GRADE_MODIFIERS: readonly GradeModifier[] = ['-', '', '+'] as const;

// Yosemite Decimal System, ascending. Below 5.10 there are no letter suffixes;
// from 5.10 up each number splits into a/b/c/d.
export const YDS_GRADES: readonly string[] = [
  '5.2', '5.3', '5.4', '5.5', '5.6', '5.7', '5.8', '5.9',
  '5.10a', '5.10b', '5.10c', '5.10d',
  '5.11a', '5.11b', '5.11c', '5.11d',
  '5.12a', '5.12b', '5.12c', '5.12d',
  '5.13a', '5.13b', '5.13c', '5.13d',
  '5.14a', '5.14b', '5.14c', '5.14d',
  '5.15a', '5.15b', '5.15c',
] as const;

// French sport grades, ascending.
export const FRENCH_GRADES: readonly string[] = [
  '1', '2', '3', '4',
  '5a', '5b', '5c',
  '6a', '6a+', '6b', '6b+', '6c', '6c+',
  '7a', '7a+', '7b', '7b+', '7c', '7c+',
  '8a', '8a+', '8b', '8b+', '8c', '8c+',
  '9a', '9a+', '9b', '9b+',
] as const;

/**
 * The V-scale as a flat ascending list of full tokens (base + modifier), e.g.
 * "VB-", "VB", "VB+", "V0-", … Used for cross-system ordering; the V picker
 * itself still works in bases + modifiers for a tighter UI.
 */
export const V_GRADES: readonly string[] = GRADE_BASES.flatMap((base) =>
  GRADE_MODIFIERS.map((mod) => `${base}${mod}`),
);

export interface GradeSystemMeta {
  /** Human label for the settings picker. */
  readonly label: string;
  /** Ascending full-token list used by the picker and for ordering. */
  readonly grades: readonly string[];
  /** Ascending "rung" list used for min/max grade filtering (modifiers folded). */
  readonly rungs: readonly string[];
}

/** Registry of the grading systems the app can present. */
export const GRADE_SYSTEMS: Record<GradeSystem, GradeSystemMeta> = {
  V: { label: 'V-Scale', grades: V_GRADES, rungs: GRADE_BASES },
  YDS: { label: 'YDS', grades: YDS_GRADES, rungs: YDS_GRADES },
  French: { label: 'French', grades: FRENCH_GRADES, rungs: FRENCH_GRADES },
};

export const GRADE_SYSTEM_ORDER: readonly GradeSystem[] = ['V', 'YDS', 'French'];
