import {
  compareGrades,
  formatGrade,
  formatGradeRange,
  gradeRungIndex,
  gradeSortValue,
  gradeSystemOf,
  isGradeRange,
  isKnownGrade,
  isValidGradeOrRange,
  parseGrade,
  parseGradeRange,
} from '@/utils/gradeUtils';

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

describe('grade ranges', () => {
  it('formats and parses a range round-trip', () => {
    expect(formatGradeRange('V0', 'V2')).toBe('V0-V2');
    expect(parseGradeRange('V0-V2')).toEqual({
      min: { base: 'V0', modifier: '' },
      max: { base: 'V2', modifier: '' },
    });
  });

  it('parses ranges with modifiers on either end', () => {
    expect(parseGradeRange('V4--V6')).toEqual({
      min: { base: 'V4', modifier: '-' },
      max: { base: 'V6', modifier: '' },
    });
    expect(parseGradeRange('V4+-V6-')).toEqual({
      min: { base: 'V4', modifier: '+' },
      max: { base: 'V6', modifier: '-' },
    });
  });

  it('does not treat a single softer grade as a range', () => {
    expect(parseGradeRange('V4-')).toBeNull();
    expect(isGradeRange('V4-')).toBe(false);
    expect(parseGrade('V4-')).toEqual({ base: 'V4', modifier: '-' });
  });

  it('distinguishes ranges from single grades', () => {
    expect(isGradeRange('V0-V2')).toBe(true);
    expect(isGradeRange('V4+')).toBe(false);
    expect(parseGradeRange('V0')).toBeNull();
    expect(parseGradeRange('V99-V2')).toBeNull();
  });

  it('validates ranges only when the start is at or below the end', () => {
    expect(isValidGradeOrRange('V0-V2')).toBe(true);
    expect(isValidGradeOrRange('V4-V4')).toBe(true);
    expect(isValidGradeOrRange('V5-V2')).toBe(false);
    expect(isValidGradeOrRange('V4+')).toBe(true);
    expect(isValidGradeOrRange(null)).toBe(false);
  });

  it('sorts a range by its lower bound', () => {
    expect(gradeSortValue('V2-V6')).toBe(gradeSortValue('V2'));
    expect(compareGrades('V0-V2', 'V3')).toBeLessThan(0);
  });
});

describe('multi-system grades', () => {
  it('recognizes YDS and French tokens as known grades', () => {
    expect(isKnownGrade('5.10a')).toBe(true);
    expect(isKnownGrade('6b+')).toBe(true);
    expect(isKnownGrade('V4+')).toBe(true);
    expect(isKnownGrade('nonsense')).toBe(false);
    expect(isKnownGrade(null)).toBe(false);
  });

  it('validates single grades in any supported system', () => {
    expect(isValidGradeOrRange('5.11a')).toBe(true);
    expect(isValidGradeOrRange('7c+')).toBe(true);
    expect(isValidGradeOrRange('5.99z')).toBe(false);
  });

  it('identifies which system a grade belongs to', () => {
    expect(gradeSystemOf('V4+')).toBe('V');
    expect(gradeSystemOf('5.12a')).toBe('YDS');
    expect(gradeSystemOf('6a+')).toBe('French');
    expect(gradeSystemOf('nope')).toBeNull();
  });

  it('orders within YDS and within French ascending', () => {
    expect(gradeSortValue('5.10a')).toBeLessThan(gradeSortValue('5.10b'));
    expect(gradeSortValue('5.9')).toBeLessThan(gradeSortValue('5.10a'));
    expect(gradeSortValue('6a')).toBeLessThan(gradeSortValue('6a+'));
    expect(gradeSortValue('7c+')).toBeLessThan(gradeSortValue('8a'));
  });

  it('folds V modifiers onto their base for rung filtering', () => {
    expect(gradeRungIndex('V4+')).toBe(gradeRungIndex('V4-'));
    expect(gradeRungIndex('V4')).toBeLessThan(gradeRungIndex('V5'));
    expect(gradeRungIndex('5.10a')).toBeLessThan(gradeRungIndex('5.10b'));
    expect(gradeRungIndex('nonsense')).toBe(-1);
  });
});
