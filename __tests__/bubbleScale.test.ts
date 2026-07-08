import {
  BUBBLE_OPACITIES,
  BUBBLE_SCALES,
  MAX_BUBBLE_OPACITY,
  MAX_BUBBLE_SCALE,
  MIN_BUBBLE_OPACITY,
  MIN_BUBBLE_SCALE,
  nearestBubbleOpacity,
  nearestBubbleScale,
  stepBubbleOpacity,
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

describe('nearestBubbleOpacity', () => {
  it('snaps to the closest allowed opacity', () => {
    expect(nearestBubbleOpacity(1)).toBe(1);
    expect(nearestBubbleOpacity(0.52)).toBe(0.5);
    expect(nearestBubbleOpacity(0.7)).toBe(0.65);
  });

  it('clamps values outside the range to the ends', () => {
    expect(nearestBubbleOpacity(0)).toBe(MIN_BUBBLE_OPACITY);
    expect(nearestBubbleOpacity(5)).toBe(MAX_BUBBLE_OPACITY);
  });
});

describe('stepBubbleOpacity', () => {
  it('moves to the adjacent opacity', () => {
    expect(stepBubbleOpacity(0.65, 1)).toBe(0.8);
    expect(stepBubbleOpacity(0.65, -1)).toBe(0.5);
  });

  it('stays put at the ends', () => {
    expect(stepBubbleOpacity(MIN_BUBBLE_OPACITY, -1)).toBe(MIN_BUBBLE_OPACITY);
    expect(stepBubbleOpacity(MAX_BUBBLE_OPACITY, 1)).toBe(MAX_BUBBLE_OPACITY);
  });

  it('only ever returns allowed opacities', () => {
    for (const o of BUBBLE_OPACITIES) {
      expect(BUBBLE_OPACITIES).toContain(stepBubbleOpacity(o, 1));
      expect(BUBBLE_OPACITIES).toContain(stepBubbleOpacity(o, -1));
    }
  });
});
