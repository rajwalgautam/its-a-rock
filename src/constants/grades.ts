import type { GradeBase, GradeModifier } from '@/types';

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
