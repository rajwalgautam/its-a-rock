import { DARK, LIGHT } from '@/constants/theme';

describe('theme palettes', () => {
  it('LIGHT and DARK expose an identical key set', () => {
    expect(Object.keys(LIGHT).sort()).toEqual(Object.keys(DARK).sort());
  });

  it('every palette value is a non-empty string', () => {
    for (const palette of [LIGHT, DARK]) {
      for (const value of Object.values(palette)) {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });
});
