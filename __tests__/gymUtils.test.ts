import { formatGymName, normalizeGymName } from '@/utils/gymUtils';

describe('normalizeGymName', () => {
  it('lowercases, trims, and collapses internal whitespace', () => {
    expect(normalizeGymName('  Movement   Englewood ')).toBe('movement englewood');
  });

  it('treats differently-cased/spaced names as the same key (dedupe)', () => {
    expect(normalizeGymName('Movement Englewood')).toBe(
      normalizeGymName('movement   englewood'),
    );
  });

  it('handles location-style names', () => {
    expect(normalizeGymName('Denver, CO')).toBe('denver, co');
  });
});

describe('formatGymName', () => {
  it('trims and collapses whitespace but preserves casing', () => {
    expect(formatGymName('  Movement   Englewood ')).toBe('Movement Englewood');
  });
});
