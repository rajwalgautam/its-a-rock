import { compareGrades, formatGrade, gradeSortValue, parseGrade } from '@/utils/gradeUtils';

describe('formatGrade', () => {
  it('joins base and modifier', () => {
    expect(formatGrade('V4', '+')).toBe('V4+');
    expect(formatGrade('V4', '-')).toBe('V4-');
    expect(formatGrade('V4')).toBe('V4');
    expect(formatGrade('VB')).toBe('VB');
  });
});

describe('parseGrade', () => {
  it('parses base + modifier', () => {
    expect(parseGrade('V4+')).toEqual({ base: 'V4', modifier: '+' });
    expect(parseGrade('V10-')).toEqual({ base: 'V10', modifier: '-' });
    expect(parseGrade('VB')).toEqual({ base: 'VB', modifier: '' });
  });

  it('trims whitespace', () => {
    expect(parseGrade('  V7  ')).toEqual({ base: 'V7', modifier: '' });
  });

  it('returns null for invalid or empty input', () => {
    expect(parseGrade(null)).toBeNull();
    expect(parseGrade(undefined)).toBeNull();
    expect(parseGrade('')).toBeNull();
    expect(parseGrade('V13')).toBeNull();
    expect(parseGrade('5.10a')).toBeNull();
    expect(parseGrade('V4++')).toBeNull();
  });
});

describe('grade ordering', () => {
  it('orders modifiers within a base: V4- < V4 < V4+', () => {
    expect(gradeSortValue('V4-')).toBeLessThan(gradeSortValue('V4'));
    expect(gradeSortValue('V4')).toBeLessThan(gradeSortValue('V4+'));
  });

  it('orders V4+ below V5-', () => {
    expect(gradeSortValue('V4+')).toBeLessThan(gradeSortValue('V5-'));
  });

  it('sorts an array ascending by difficulty', () => {
    const sorted = ['V5', 'V4+', 'VB', 'V4-', 'V10'].sort(compareGrades);
    expect(sorted).toEqual(['VB', 'V4-', 'V4+', 'V5', 'V10']);
  });

  it('ranks unknown grades below everything', () => {
    expect(compareGrades(null, 'VB')).toBeLessThan(0);
    expect(gradeSortValue('nonsense')).toBe(-1);
  });
});
