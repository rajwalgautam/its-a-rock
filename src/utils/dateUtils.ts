/** Local midnight (00:00:00.000) of the given timestamp. */
export function startOfDayMs(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Local end-of-day (23:59:59.999) of the given timestamp. */
export function endOfDayMs(ms: number): number {
  const d = new Date(ms);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/** Local midnight of the Monday of the week containing `ms`. */
export function weekStartMs(ms: number): number {
  const d = new Date(ms);
  const daysSinceMonday = (d.getDay() + 6) % 7; // Sun=0 → 6, Mon=1 → 0, …
  d.setDate(d.getDate() - daysSinceMonday);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Local end of the week (Sunday 23:59:59.999) containing `ms`. */
export function weekEndMs(ms: number): number {
  const start = new Date(weekStartMs(ms));
  start.setDate(start.getDate() + 6);
  start.setHours(23, 59, 59, 999);
  return start.getTime();
}

/** Stable local-day key (YYYY-MM-DD) for counting distinct days. */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}
