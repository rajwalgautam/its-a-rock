import { contrastColor, luminance } from '@/utils/color';

describe('luminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(luminance('#000000')).toBeCloseTo(0);
    expect(luminance('#FFFFFF')).toBeCloseTo(1);
  });

  it('accepts shorthand hex and a missing leading hash', () => {
    expect(luminance('fff')).toBeCloseTo(1);
    expect(luminance('#000')).toBeCloseTo(0);
  });

  it('returns 0 for an unparseable value', () => {
    expect(luminance('not-a-color')).toBe(0);
  });
});

describe('contrastColor', () => {
  it('picks white on dark backgrounds', () => {
    expect(contrastColor('#111111')).toBe('#FFFFFF');
    expect(contrastColor('#2563EB')).toBe('#FFFFFF');
  });

  it('picks black on light backgrounds', () => {
    expect(contrastColor('#FFFFFF')).toBe('#000000');
    expect(contrastColor('#EEEEEE')).toBe('#000000');
  });
});
