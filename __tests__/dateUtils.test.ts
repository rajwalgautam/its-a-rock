import { dateStringToDate, getCalendarDays, getMonthRange, toDateString } from '@/utils/dateUtils';

describe('dateUtils', () => {
  it('formats local date strings', () => {
    expect(toDateString(new Date(2026, 4, 2))).toBe('2026-05-02');
  });

  it('parses local date strings', () => {
    const date = dateStringToDate('2026-05-02');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(4);
    expect(date.getDate()).toBe(2);
  });

  it('builds a six-week calendar grid', () => {
    const days = getCalendarDays(2026, 4);
    expect(days).toHaveLength(42);
    expect(days.some((day) => day.date === '2026-05-01')).toBe(true);
  });

  it('creates month ranges that contain the full month', () => {
    const { start, end } = getMonthRange(2026, 4);
    expect(toDateString(start)).toBe('2026-05-01');
    expect(toDateString(end)).toBe('2026-05-31');
  });
});
