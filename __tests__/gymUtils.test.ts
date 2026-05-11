import { formatGymName, isValidGymName, normalizeGymName } from '@/utils/gymUtils';

describe('gymUtils', () => {
  it('normalizes gym names case-insensitively', () => {
    expect(normalizeGymName('  The   Cliffs  ')).toBe('the cliffs');
  });

  it('formats gym display names without extra spaces', () => {
    expect(formatGymName('  Movement   LIC ')).toBe('Movement LIC');
  });

  it('rejects empty gym names', () => {
    expect(isValidGymName('   ')).toBe(false);
    expect(isValidGymName('Local Gym')).toBe(true);
  });
});
