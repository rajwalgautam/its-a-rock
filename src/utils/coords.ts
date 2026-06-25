// Map between normalized image coordinates (0..1) and on-screen positions,
// using the contain-fit rect from `imageLayout`. See `src/utils/imageLayout.ts`.

import type { ImageRect } from './imageLayout';

export interface Point {
  x: number;
  y: number;
}

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

/** Normalized (0..1) point → on-screen position within the container. */
export function toScreen(norm: Point, layout: ImageRect): Point {
  return {
    x: layout.offsetX + norm.x * layout.displayedW,
    y: layout.offsetY + norm.y * layout.displayedH,
  };
}

/**
 * On-screen position (e.g. a touch) → normalized (0..1) point, clamped to the
 * image bounds so taps in the letterbox margins still resolve to an edge hold.
 * Returns the origin when the layout has no rendered area.
 */
export function toNormalized(point: Point, layout: ImageRect): Point {
  if (layout.displayedW <= 0 || layout.displayedH <= 0) return { x: 0, y: 0 };
  return {
    x: clamp01((point.x - layout.offsetX) / layout.displayedW),
    y: clamp01((point.y - layout.offsetY) / layout.displayedH),
  };
}
