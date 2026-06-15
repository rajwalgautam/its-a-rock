import { formatGrade, parseGradeRange } from '@/utils/gradeUtils';

/** Short human date, e.g. "Jun 13, 2026". Returns "" for null/invalid. */
export function formatDate(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '';
  const d = new Date(ms);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** A route's completion status as a label. */
export function statusLabel(completed: boolean): string {
  return completed ? 'Sent' : 'Project';
}

/** Display string for a possibly-missing grade. Ranges render as "V0 – V2". */
export function formatGradeLabel(grade: string | null | undefined): string {
  if (grade === null || grade === undefined || grade.trim().length === 0) {
    return 'Ungraded';
  }
  const range = parseGradeRange(grade);
  if (range !== null) {
    return `${formatGrade(range.min.base, range.min.modifier)} – ${formatGrade(range.max.base, range.max.modifier)}`;
  }
  return grade.trim();
}

/** Short date format: "Jun 13" for current year, "Jun 13 2025" for other years. */
export function formatShortDate(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '';
  const d = new Date(ms);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const isCurrentYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: isCurrentYear ? undefined : 'numeric',
  });
}
