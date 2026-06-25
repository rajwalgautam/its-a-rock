import { imageLayout } from '@/utils/imageLayout';
import { toNormalized, toScreen } from '@/utils/coords';

describe('coords', () => {
  // Landscape image in a portrait container: 400x200 image rect at offsetY 300.
  const layout = imageLayout(400, 800, 2000, 1000);

  it('toScreen maps normalized points onto the image rect', () => {
    expect(toScreen({ x: 0, y: 0 }, layout)).toEqual({ x: 0, y: 300 });
    expect(toScreen({ x: 1, y: 1 }, layout)).toEqual({ x: 400, y: 500 });
    expect(toScreen({ x: 0.5, y: 0.5 }, layout)).toEqual({ x: 200, y: 400 });
  });

  it('toNormalized inverts a touch back to normalized space', () => {
    expect(toNormalized({ x: 200, y: 400 }, layout)).toEqual({ x: 0.5, y: 0.5 });
    expect(toNormalized({ x: 0, y: 300 }, layout)).toEqual({ x: 0, y: 0 });
  });

  it('clamps touches in the letterbox margins to the image edge', () => {
    expect(toNormalized({ x: 200, y: 0 }, layout)).toEqual({ x: 0.5, y: 0 });
    expect(toNormalized({ x: 200, y: 800 }, layout)).toEqual({ x: 0.5, y: 1 });
    expect(toNormalized({ x: -50, y: 400 }, layout)).toEqual({ x: 0, y: 0.5 });
  });

  it('round-trips toScreen → toNormalized within 1px', () => {
    for (const p of [
      { x: 0.1, y: 0.2 },
      { x: 0.73, y: 0.41 },
      { x: 0.99, y: 0.01 },
    ]) {
      const back = toNormalized(toScreen(p, layout), layout);
      expect(back.x).toBeCloseTo(p.x, 5);
      expect(back.y).toBeCloseTo(p.y, 5);
    }
  });

  it('toNormalized returns the origin for an empty layout', () => {
    const empty = imageLayout(0, 0, 0, 0);
    expect(toNormalized({ x: 10, y: 10 }, empty)).toEqual({ x: 0, y: 0 });
  });
});
