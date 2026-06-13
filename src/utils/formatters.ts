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

/** Display string for a possibly-missing grade. */
export function formatGradeLabel(grade: string | null | undefined): string {
  return grade !== null && grade !== undefined && grade.trim().length > 0
    ? grade.trim()
    : 'Ungraded';
}
