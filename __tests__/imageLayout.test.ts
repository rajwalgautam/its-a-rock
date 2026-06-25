import { imageLayout } from '@/utils/imageLayout';

describe('imageLayout', () => {
  it('letterboxes a landscape image in a portrait container (width-limited)', () => {
    // container 400x800, image 2:1 → width-limited: 400x200, centered vertically.
    const rect = imageLayout(400, 800, 2000, 1000);
    expect(rect.displayedW).toBe(400);
    expect(rect.displayedH).toBe(200);
    expect(rect.offsetX).toBe(0);
    expect(rect.offsetY).toBe(300);
  });

  it('pillarboxes a portrait image in a landscape container (height-limited)', () => {
    // container 800x400, image 1:2 → height-limited: 200x400, centered horizontally.
    const rect = imageLayout(800, 400, 1000, 2000);
    expect(rect.displayedW).toBe(200);
    expect(rect.displayedH).toBe(400);
    expect(rect.offsetX).toBe(300);
    expect(rect.offsetY).toBe(0);
  });

  it('fills exactly when aspects match', () => {
    const rect = imageLayout(300, 600, 1000, 2000);
    expect(rect).toEqual({ displayedW: 300, displayedH: 600, offsetX: 0, offsetY: 0 });
  });

  it('centers a square image in a portrait container', () => {
    const rect = imageLayout(400, 800, 1000, 1000);
    expect(rect.displayedW).toBe(400);
    expect(rect.displayedH).toBe(400);
    expect(rect.offsetX).toBe(0);
    expect(rect.offsetY).toBe(200);
  });

  it('returns a zero rect for unknown or non-positive dimensions', () => {
    const zero = { displayedW: 0, displayedH: 0, offsetX: 0, offsetY: 0 };
    expect(imageLayout(0, 800, 1000, 1000)).toEqual(zero);
    expect(imageLayout(400, 800, 0, 1000)).toEqual(zero);
    expect(imageLayout(400, 800, 1000, -1)).toEqual(zero);
  });
});
