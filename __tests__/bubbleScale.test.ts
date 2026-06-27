import {
  BUBBLE_SCALES,
  MAX_BUBBLE_SCALE,
  MIN_BUBBLE_SCALE,
  nearestBubbleScale,
  stepBubbleScale,
} from '@/constants/plan';

describe('nearestBubbleScale', () => {
  it('snaps to the closest allowed size', () => {
    expect(nearestBubbleScale(1)).toBe(1);
    expect(nearestBubbleScale(0.72)).toBe(0.7);
    expect(nearestBubbleScale(1.33)).toBe(1.4);
  });

  it('clamps values outside the range to the ends', () => {
    expect(nearestBubbleScale(0.1)).toBe(MIN_BUBBLE_SCALE);
    expect(nearestBubbleScale(99)).toBe(MAX_BUBBLE_SCALE);
  });
});

describe('stepBubbleScale', () => {
  it('moves to the adjacent size', () => {
    expect(stepBubbleScale(1, 1)).toBe(1.2);
    expect(stepBubbleScale(1, -1)).toBe(0.85);
  });

  it('stays put at the ends', () => {
    expect(stepBubbleScale(MIN_BUBBLE_SCALE, -1)).toBe(MIN_BUBBLE_SCALE);
    expect(stepBubbleScale(MAX_BUBBLE_SCALE, 1)).toBe(MAX_BUBBLE_SCALE);
  });

  it('snaps an off-grid value before stepping', () => {
    // 1.05 snaps to 1, then one step up is 1.2.
    expect(stepBubbleScale(1.05, 1)).toBe(1.2);
  });

  it('only ever returns allowed sizes', () => {
    for (const s of BUBBLE_SCALES) {
      expect(BUBBLE_SCALES).toContain(stepBubbleScale(s, 1));
      expect(BUBBLE_SCALES).toContain(stepBubbleScale(s, -1));
    }
  });
});
