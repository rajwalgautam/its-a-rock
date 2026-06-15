import { formatGradeLabel } from '@/utils/formatters';

describe('formatGradeLabel', () => {
  it('returns single grades as-is (trimmed)', () => {
    expect(formatGradeLabel('V4+')).toBe('V4+');
    expect(formatGradeLabel('  V7  ')).toBe('V7');
  });

  it('renders ranges with an en dash', () => {
    expect(formatGradeLabel('V0-V2')).toBe('V0 – V2');
    expect(formatGradeLabel('V4--V6+')).toBe('V4- – V6+');
  });

  it('falls back to "Ungraded" for empty input', () => {
    expect(formatGradeLabel(null)).toBe('Ungraded');
    expect(formatGradeLabel(undefined)).toBe('Ungraded');
    expect(formatGradeLabel('   ')).toBe('Ungraded');
  });
});
